import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const prerender = true;
export const GET: RequestHandler = () => {
	redirect(307, '/season-3/teams');
};
