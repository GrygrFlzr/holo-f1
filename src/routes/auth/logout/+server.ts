import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (({ cookies }) => {
	cookies.delete('session', { path: '/' });
	redirect(302, '/'); // 307 will attempt to redirect as POST
}) satisfies RequestHandler;
