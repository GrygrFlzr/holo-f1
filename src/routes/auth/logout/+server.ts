import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_COOKIE } from '$lib/server/auth';

export const POST = (({ cookies }) => {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	redirect(302, '/'); // 307 will attempt to redirect as POST
}) satisfies RequestHandler;
