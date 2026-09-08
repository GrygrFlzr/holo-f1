import type { D1Queryable } from '$lib/server/db/types';
import { getDiscordDefaultAvatarIndex } from '$lib/server/discord';
import { isPublicId } from '$lib/server/public-id';

export interface Submission {
	sprint_pole_driver_id: number | null;
	sprint_p1_driver_id: number | null;
	pole_driver_id: number | null;
	p1_driver_id: number | null;
	p2_driver_id: number | null;
	p3_driver_id: number | null;
	p10_driver_id: number | null;
	dotd_driver_id: number | null;
	bold_prediction: string | null;
	team_id: number | null;
}

export interface SubmissionInput {
	sprint_pole_driver_id: number | null;
	sprint_p1_driver_id: number | null;
	pole_driver_id: number;
	p1_driver_id: number;
	p2_driver_id: number;
	p3_driver_id: number;
	p10_driver_id: number;
	dotd_driver_id: number;
	bold_prediction: string | null;
	team_id: number;
}

export interface StewardSubmission extends Submission {
	discord_id: string;
	public_id: string;
	discord_name: string;
	avatar_snapshot_sha256: string | null;
	default_avatar_index: number;
	sprint_pole_code: string | null;
	sprint_p1_code: string | null;
	pole_code: string;
	p1_code: string;
	p2_code: string;
	p3_code: string;
	p10_code: string;
	dotd_code: string;
	team_id: number;
	team_name: string;
	team_color: string;
	updated_at: string;
}

interface StewardSubmissionRow extends Omit<
	StewardSubmission,
	'public_id' | 'default_avatar_index'
> {
	public_id: string | null;
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
				pole_driver_id,
				p1_driver_id,
				p2_driver_id,
				p3_driver_id,
				p10_driver_id,
				dotd_driver_id,
				bold_prediction,
				team_id,
				sprint_pole_driver_id,
				sprint_p1_driver_id
			from submissions
			where user_id = ?1 and weekend_id = ?2
			`
		)
		.bind(userId, weekendId)
		.first<Submission>();
}

export async function getSubmissionsForScoring(
	db: D1Queryable,
	weekendId: number
): Promise<StewardSubmission[]> {
	const { results: rows } = await db
		.prepare(
			`
			select
				u.discord_id,
				u.public_id,
				u.discord_name,
				u.avatar_snapshot_sha256,

				s.sprint_pole_driver_id,
				s.sprint_p1_driver_id,
				s.pole_driver_id,
				s.p1_driver_id,
				s.p2_driver_id,
				s.p3_driver_id,
				s.p10_driver_id,
				s.dotd_driver_id,

				sprint_pole.code as sprint_pole_code,
				sprint_p1.code as sprint_p1_code,
				pole.code as pole_code,
				p1.code as p1_code,
				p2.code as p2_code,
				p3.code as p3_code,
				p10.code as p10_code,
				dotd.code as dotd_code,

				s.bold_prediction,
				s.team_id,
				t.name as team_name,
				t.color as team_color,
				s.updated_at
			from submissions s
			join users u
				on u.discord_id = s.user_id
			left join drivers sprint_pole
				on sprint_pole.id =
					s.sprint_pole_driver_id
			left join drivers sprint_p1
				on sprint_p1.id =
					s.sprint_p1_driver_id
			join drivers pole
				on pole.id = s.pole_driver_id
			join drivers p1
				on p1.id = s.p1_driver_id
			join drivers p2
				on p2.id = s.p2_driver_id
			join drivers p3
				on p3.id = s.p3_driver_id
			join drivers p10
				on p10.id = s.p10_driver_id
			join drivers dotd
				on dotd.id = s.dotd_driver_id
			join teams t
				on t.id = s.team_id
			where s.weekend_id = ?
			order by s.updated_at asc
			`
		)
		.bind(weekendId)
		.all<StewardSubmissionRow>();

	return rows.map((row): StewardSubmission => {
		if (!isPublicId(row.public_id)) {
			throw new Error('A steward submission user has no valid public ID.');
		}

		return {
			...row,
			public_id: row.public_id,
			default_avatar_index: getDiscordDefaultAvatarIndex(row.discord_id)
		};
	});
}

export async function upsertSubmission(
	db: D1Queryable,
	userId: string,
	weekendId: number,
	input: SubmissionInput
): Promise<void> {
	await db
		.prepare(
			`
			insert into submissions (
				user_id,
				weekend_id,
				pole_driver_id,
				p1_driver_id,
				p2_driver_id,
				p3_driver_id,
				p10_driver_id,
				dotd_driver_id,
				bold_prediction,
				team_id,
				sprint_pole_driver_id,
				sprint_p1_driver_id
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
				?9,
				?10,
				?11,
				?12
			)
			on conflict (user_id, weekend_id)
			do update set
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
				bold_prediction =
					excluded.bold_prediction,
				team_id =
					excluded.team_id,
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
			input.team_id,
			input.sprint_pole_driver_id,
			input.sprint_p1_driver_id
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
			where user_id = ?1 and weekend_id = ?2
			`
		)
		.bind(userId, weekendId)
		.run();
}
