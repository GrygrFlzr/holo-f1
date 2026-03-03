import type { D1Queryable } from '$lib/server/db/types';

export interface Submission {
	pole_driver_id: number | null;
	p1_driver_id: number | null;
	p2_driver_id: number | null;
	p3_driver_id: number | null;
	p10_driver_id: number | null;
	dotd_driver_id: number | null;
	bold_prediction: string | null;
	team_id: number | null;
}

export async function getSubmission(
	db: D1Queryable,
	userId: string,
	weekendId: number
): Promise<Submission | null> {
	return db
		.prepare(
			`
			select
				pole_driver_id, p1_driver_id, p2_driver_id, p3_driver_id, p10_driver_id
				, dotd_driver_id, bold_prediction, team_id
			from submissions
			where user_id = ?1
				and weekend_id = ?2
			`
		)
		.bind(userId, weekendId)
		.first<Submission>();
}

export interface SubmissionInput {
	pole_driver_id: number;
	p1_driver_id: number;
	p2_driver_id: number;
	p3_driver_id: number;
	p10_driver_id: number;
	dotd_driver_id: number;
	bold_prediction: string | null;
	team_id: number;
}

export async function upsertSubmission(
	db: D1Queryable,
	userId: string,
	weekendId: number,
	input: SubmissionInput
): Promise<void> {
	console.log(input);
	await db
		.prepare(
			`
			insert into submissions (
				user_id, weekend_id, pole_driver_id, p1_driver_id, p2_driver_id, p3_driver_id
				, p10_driver_id, dotd_driver_id, bold_prediction, team_id
			) values (
				?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10
			) on conflict (
				user_id, weekend_id
			) do update set
				pole_driver_id = excluded.pole_driver_id,
				p1_driver_id = excluded.p1_driver_id,
				p2_driver_id = excluded.p2_driver_id,
				p3_driver_id = excluded.p3_driver_id,
				p10_driver_id = excluded.p10_driver_id,
				dotd_driver_id = excluded.dotd_driver_id,
				bold_prediction = excluded.bold_prediction,
				team_id = excluded.team_id,
				updated_at = datetime('now')
			`
		)
		.bind(
			userId,
			weekendId,
			input.pole_driver_id,
			input.p1_driver_id,
			input.p2_driver_id,
			input.p3_driver_id,
			input.p10_driver_id,
			input.dotd_driver_id,
			input.bold_prediction,
			input.team_id
		)
		.run();
}

export async function deleteSubmission(
	db: D1Queryable,
	userId: string,
	weekendId: number
): Promise<void> {
	await db
		.prepare(
			`
			delete from submissions
			where user_id = ?1
				and weekend_id = ?2
			`
		)
		.bind(userId, weekendId)
		.run();
}
