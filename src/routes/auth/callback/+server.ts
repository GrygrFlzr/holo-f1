import { error, redirect } from '@sveltejs/kit';
import { createSessionCookie } from '$lib/server/auth';
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

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const env = platform?.env;
	if (!env) error(500, 'Platform not available');

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
	const { access_token } = (await tokenResponse.json()) as TokenResponse;

	// fetch profile
	const userProfileResponse = await fetch('https://discord.com/api/users/@me', {
		headers: { Authorization: `Bearer ${access_token}` }
	});
	if (!userProfileResponse.ok) error(500, 'Failed to fetch Discord profile');
	const discordUser = (await userProfileResponse.json()) as DiscordUser;

	// upsert user but retain role
	const displayName = discordUser.global_name ?? discordUser.username;
	await env.DB.prepare(
		`insert into users (discord_id, display_name, avatar_hash)
        values (?, ?, ?)
        on conflict (discord_id) do update set
            display_name = excluded.display_name,
            avatar_hash = excluded.avatar_hash`
	)
		.bind(discordUser.id, displayName, discordUser.avatar)
		.run();

	// set cookie
	const session = await createSessionCookie(
		{
			sub: discordUser.id,
			name: displayName,
			avatar: discordUser.avatar,
			role: 'user'
		},
		env.AUTH_SECRET
	);
	cookies.set('session', session, {
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		path: '/',
		maxAge: 30 * 24 * 60 * 60
	});

	redirect(307, '/');
};
