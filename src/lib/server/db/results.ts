import type { D1Queryable } from '$lib/server/db/types';

export interface WeekendResult {
	weekend_id: number;
	sprint_pole_driver_id: number | null;
	sprint_p1_driver_id: number | null;
	pole_driver_id: number;
	p1_driver_id: number;
	p2_driver_id: number;
	p3_driver_id: number;
	p10_driver_id: number;
	dotd_driver_id: number;
	updated_at: string;
}

export interface WeekendResultInput {
	sprint_pole_driver_id: number | null;
	sprint_p1_driver_id: number | null;
	pole_driver_id: number;
	p1_driver_id: number;
	p2_driver_id: number;
	p3_driver_id: number;
	p10_driver_id: number;
	dotd_driver_id: number;
}

export async function getWeekendResult(
	db: D1Queryable,
	weekendId: number
): Promise<WeekendResult | null> {
	return db
		.prepare(
			`
			select
				weekend_id,
				sprint_pole_driver_id,
				sprint_p1_driver_id,
				pole_driver_id,
				p1_driver_id,
				p2_driver_id,
				p3_driver_id,
				p10_driver_id,
				dotd_driver_id,
				updated_at
			from weekend_results
			where weekend_id = ?
			`
		)
		.bind(weekendId)
		.first<WeekendResult>();
}

export async function upsertWeekendResult(
	db: D1Queryable,
	weekendId: number,
	input: WeekendResultInput
): Promise<void> {
	await db
		.prepare(
			`
			insert into weekend_results (
				weekend_id,
				sprint_pole_driver_id,
				sprint_p1_driver_id,
				pole_driver_id,
				p1_driver_id,
				p2_driver_id,
				p3_driver_id,
				p10_driver_id,
				dotd_driver_id
			)
			values (
				?1,
				?2,
				?3,
				?4,
				?5,
				?6,
				?7,
				?8,
				?9
			)
			on conflict (weekend_id) do update set
				sprint_pole_driver_id =
					excluded.sprint_pole_driver_id,
				sprint_p1_driver_id =
					excluded.sprint_p1_driver_id,
				pole_driver_id =
					excluded.pole_driver_id,
				p1_driver_id =
					excluded.p1_driver_id,
				p2_driver_id =
					excluded.p2_driver_id,
				p3_driver_id =
					excluded.p3_driver_id,
				p10_driver_id =
					excluded.p10_driver_id,
				dotd_driver_id =
					excluded.dotd_driver_id,
				updated_at = datetime('now')
			`
		)
		.bind(
			weekendId,
			input.sprint_pole_driver_id,
			input.sprint_p1_driver_id,
			input.pole_driver_id,
			input.p1_driver_id,
			input.p2_driver_id,
			input.p3_driver_id,
			input.p10_driver_id,
			input.dotd_driver_id
		)
		.run();
}
