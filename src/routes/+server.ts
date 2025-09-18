import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const prerender = true;
export const GET: RequestHandler = () => {
	return redirect(307, '/season-3/teams');
};
