import { error, redirect } from '@sveltejs/kit';
import { createSessionCookie, SESSION_COOKIE } from '$lib/server/auth';
import { env } from '$env/dynamic/private';
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

export const GET = (async ({ url, locals, cookies }) => {
	const db = locals.db;
	if (!db) error(500, 'Database not available');

	// verify state
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	if (!code || !state || state !== storedState) {
		error(400, 'Invalid OAuth callback');
	}
	cookies.delete('oauth_state', { path: '/' });

	// exchange code for token
	const tokenResponse = await fetch(`https://discord.com/api/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: env.DISCORD_CLIENT_ID,
			client_secret: env.DISCORD_CLIENT_SECRET,
			grant_type: 'authorization_code',
			code,
			redirect_uri: `${url.origin}/auth/callback`
		})
	});
	if (!tokenResponse.ok) error(500, 'Token exchange failed');
	const { access_token } = (await tokenResponse.json()) satisfies TokenResponse;

	// fetch profile
	const userProfileResponse = await fetch('https://discord.com/api/users/@me', {
		headers: { Authorization: `Bearer ${access_token}` }
	});
	if (!userProfileResponse.ok) error(500, 'Failed to fetch Discord profile');
	const discordUser = (await userProfileResponse.json()) satisfies DiscordUser;

	// upsert user - updated discord_name and avatar
	// retain custom_name and role
	const discordName = discordUser.global_name ?? discordUser.username;
	await db
		.prepare(
			`
			insert into users (discord_id, discord_name, avatar_hash)
			values (?, ?, ?)
			on conflict (discord_id) do update set
			discord_name = excluded.discord_name,
			avatar_hash = excluded.avatar_hash
			`
		)
		.bind(discordUser.id, discordName, discordUser.avatar)
		.run();

	// read role and custom_name
	const row = await db
		.prepare('select role, custom_name from users where discord_id = ?')
		.bind(discordUser.id)
		.first<{ role: string; custom_name: string | null }>();

	// set cookie
	const session = await createSessionCookie(
		{
			sub: discordUser.id,
			name: row?.custom_name ?? discordName,
			avatar: discordUser.avatar,
			role: (row?.role ?? 'user') as 'user' | 'steward' | 'admin'
		},
		env.AUTH_SECRET
	);
	cookies.set(SESSION_COOKIE, session, {
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		path: '/',
		maxAge: 30 * 24 * 60 * 60
	});

	redirect(302, '/');
}) satisfies RequestHandler;
