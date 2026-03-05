import { requireRole } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const user = await requireRole(locals, 'steward');
	return { user };
}) satisfies LayoutServerLoad;
