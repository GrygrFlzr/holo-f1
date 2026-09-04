import { error, redirect } from '@sveltejs/kit';
import { AUTH_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from '$app/env/private';
import { createSessionCookie, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '$lib/server/auth';
import { resolveDiscordAvatarSnapshot } from '$lib/server/avatar-snapshots';
import type { RequestHandler } from './$types';

interface TokenResponse {
	access_token: string;
}

interface DiscordUser {
	id: string;
	username: string;
	global_name: string | null;
	avatar: string | null;
}

interface StoredAvatarState {
	avatar_hash: string | null;
	avatar_snapshot_sha256: string | null;
}

export const GET = (async ({ url, locals, cookies, platform }) => {
	const db = locals.db;

	if (!db) {
		error(500, 'Database not available');
	}

	// verify state
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	if (!code || !state || state !== storedState) {
		error(400, 'Invalid OAuth callback');
	}
	cookies.delete('oauth_state', { path: '/' });

	// exchange code for token
	const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: DISCORD_CLIENT_ID,
			client_secret: DISCORD_CLIENT_SECRET,
			grant_type: 'authorization_code',
			code,
			redirect_uri: `${url.origin}/auth/callback`
		})
	});

	if (!tokenResponse.ok) {
		error(500, 'Token exchange failed');
	}

	const { access_token } = (await tokenResponse.json()) satisfies TokenResponse;

	// fetch profile
	const userProfileResponse = await fetch('https://discord.com/api/users/@me', {
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	});

	if (!userProfileResponse.ok) {
		error(500, 'Failed to fetch Discord profile');
	}

	const discordUser = (await userProfileResponse.json()) satisfies DiscordUser;

	// check avatar
	const storedAvatar = await db
		.prepare(
			`
			select
				avatar_hash,
				avatar_snapshot_sha256
			from users
			where discord_id = ?
			`
		)
		.bind(discordUser.id)
		.first<StoredAvatarState>();

	const avatarSnapshot = await resolveDiscordAvatarSnapshot({
		bucket: platform?.env.AVATAR_BUCKET,
		discordId: discordUser.id,
		avatarHash: discordUser.avatar,
		previousAvatarHash: storedAvatar?.avatar_hash ?? null,
		previousSnapshotSha256: storedAvatar?.avatar_snapshot_sha256 ?? null
	});

	if (avatarSnapshot.captureError !== null) {
		console.error('Failed to capture Discord avatar snapshot.', avatarSnapshot.captureError);
	}

	const discordName = discordUser.global_name ?? discordUser.username;
	await db
		.prepare(
			`
			insert into users (
				discord_id,
				discord_name,
				avatar_hash,
				avatar_snapshot_sha256
			)
			values (?, ?, ?, ?)
			on conflict (discord_id) do update set
				discord_name =
					excluded.discord_name,
				avatar_hash =
					excluded.avatar_hash,
				avatar_snapshot_sha256 =
					excluded.avatar_snapshot_sha256
			`
		)
		.bind(discordUser.id, discordName, discordUser.avatar, avatarSnapshot.sha256)
		.run();

	// read role and custom_name
	const row = await db
		.prepare(
			`
			select role, custom_name
			from users
			where discord_id = ?
			`
		)
		.bind(discordUser.id)
		.first<{
			role: string;
			custom_name: string | null;
		}>();

	// set cookie
	const session = await createSessionCookie(
		{
			sub: discordUser.id,
			name: row?.custom_name ?? discordName,
			avatar: discordUser.avatar,
			avatar_snapshot_sha256: avatarSnapshot.sha256,
			role: (row?.role ?? 'user') as 'user' | 'steward' | 'admin'
		},
		AUTH_SECRET
	);
	cookies.set(SESSION_COOKIE, session, {
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		path: '/',
		maxAge: SESSION_MAX_AGE_SECONDS
	});

	redirect(302, '/submit');
}) satisfies RequestHandler;
