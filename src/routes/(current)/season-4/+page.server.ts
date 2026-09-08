import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';

export const load = (() => {
	redirect(307, resolve('/season-4/individuals'));
}) satisfies PageServerLoad;
