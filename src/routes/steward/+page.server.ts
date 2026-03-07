import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { typedBatch } from '$lib/server/db/types';
import type { Weekend } from '$lib/server/db/weekends';
import type { PageServerLoad } from './$types';

interface StewardEntry {
	discord_id: string;
	discord_name: string;
	avatar_hash: string | null;
	pole_code: string;
	p1_code: string;
	p2_code: string;
	p3_code: string;
	p10_code: string;
	dotd_code: string;
	bold_prediction: string | null;
	team_name: string;
	team_color: string;
	updated_at: string;
}

export const load = (async ({ locals }) => {
	const { db } = locals;
	if (!db) error(500, 'Database not available');
	await requireRole(locals, 'steward');

	const [weekendResult, entriesResult] = await typedBatch<[Weekend, StewardEntry]>(db, [
		db.prepare(
			`
            select id, season, slug, name, lock_time, is_sprint, watchalong_host
			from weekends
			where scored = 0
			order by lock_time asc
			limit 1
            `
		),
		db.prepare(
			`
			select
                u.discord_id,
				u.discord_name, u.avatar_hash
				, pole.code as pole_code
				, p1.code as p1_code
				, p2.code as p2_code
				, p3.code as p3_code
				, p10.code as p10_code
				, dotd.code as dotd_code
				, s.bold_prediction
				, t.name as team_name
				, t.color as team_color
				, s.updated_at
			from submissions s
			join users u on s.user_id = u.discord_id
			join drivers pole on s.pole_driver_id = pole.id
			join drivers p1 on s.p1_driver_id = p1.id
			join drivers p2 on s.p2_driver_id = p2.id
			join drivers p3 on s.p3_driver_id = p3.id
			join drivers p10 on s.p10_driver_id = p10.id
			join drivers dotd on s.dotd_driver_id = dotd.id
			join teams t on s.team_id = t.id
			where s.weekend_id = (
				select id from weekends where scored = 0 order by lock_time asc limit 1
			)
			order by u.discord_name asc
            `
		)
	]);

	const weekend = weekendResult.results[0] ?? null;
	if (!weekend) {
		return { weekend: null as Weekend | null, locked: false, entries: [] as StewardEntry[] };
	}
	const locked = new Date(weekend.lock_time).getTime() <= new Date().getTime();

	return {
		weekend,
		locked,
		entries: entriesResult.results
	};
}) satisfies PageServerLoad;
