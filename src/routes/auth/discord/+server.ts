import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET = (({ url, cookies }) => {
	const state = crypto.randomUUID();
	cookies.set('oauth_state', state, {
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		path: '/',
		maxAge: 600
	});

	const params = new URLSearchParams({
		client_id: env.DISCORD_CLIENT_ID,
		redirect_uri: `${url.origin}/auth/callback`,
		response_type: 'code',
		scope: 'identify',
		state
	});

	redirect(302, `https://discord.com/api/oauth2/authorize?${params.toString()}`);
}) satisfies RequestHandler;
