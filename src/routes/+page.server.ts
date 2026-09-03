import { error } from '@sveltejs/kit';
import { getSeasonStandings } from '$lib/server/db/standings';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	if (!locals.db) {
		error(500, 'Database not available.');
	}

	return {
		standings: await getSeasonStandings(locals.db, 4)
	};
}) satisfies PageServerLoad;
