import { error } from '@sveltejs/kit';
import { getPublishedWeekendScores } from '$lib/server/db/weekend-scores';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	if (!locals.db) {
		error(500, 'Database not available.');
	}

	const requestedWeekend = url.searchParams.get('weekend');
	const scores = await getPublishedWeekendScores(locals.db, 4, requestedWeekend);

	if (requestedWeekend !== null && !scores.weekend) {
		error(404, 'Published weekend was not found.');
	}

	return scores;
}) satisfies PageServerLoad;
