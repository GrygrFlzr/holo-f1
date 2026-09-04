import type { WeekendResult } from '$lib/server/db/results';
import type { D1Queryable } from '$lib/server/db/types';
import { scoreSubmission } from '$lib/server/scoring';
import {
	buildSeasonStandings,
	type ScoredStandingEntry,
	type SeasonStandings,
	type StandingWeekend
} from '$lib/standings';

interface WeekendRow {
	id: number;
	name: string;
	lock_time: string;
	is_sprint: number;
}

interface StandingRow {
	user_id: string;
	user_name: string;
	user_avatar_snapshot_sha256: string | null;
	weekend_id: number;

	team_id: number;
	team_name: string;
	team_color: string | null;

	sprint_pole_driver_id: number | null;
	sprint_p1_driver_id: number | null;
	pole_driver_id: number | null;
	p1_driver_id: number | null;
	p2_driver_id: number | null;
	p3_driver_id: number | null;
	p10_driver_id: number | null;
	dotd_driver_id: number | null;
	bold_prediction: string | null;

	bold_awarded: number;

	result_sprint_pole_driver_id: number | null;
	result_sprint_p1_driver_id: number | null;
	result_pole_driver_id: number;
	result_p1_driver_id: number;
	result_p2_driver_id: number;
	result_p3_driver_id: number;
	result_p10_driver_id: number;
	result_dotd_driver_id: number;
	result_updated_at: string;
}

function resultFromRow(row: StandingRow): WeekendResult {
	return {
		weekend_id: row.weekend_id,
		sprint_pole_driver_id: row.result_sprint_pole_driver_id,
		sprint_p1_driver_id: row.result_sprint_p1_driver_id,
		pole_driver_id: row.result_pole_driver_id,
		p1_driver_id: row.result_p1_driver_id,
		p2_driver_id: row.result_p2_driver_id,
		p3_driver_id: row.result_p3_driver_id,
		p10_driver_id: row.result_p10_driver_id,
		dotd_driver_id: row.result_dotd_driver_id,
		updated_at: row.result_updated_at
	};
}

export async function getSeasonStandings(
	db: D1Queryable,
	season: number
): Promise<SeasonStandings> {
	const { results: weekendRows } = await db
		.prepare(
			`
			select
				id,
				name,
				lock_time,
				is_sprint
			from weekends
			where
				season = ?
				and scored = 1
			order by
				lock_time asc,
				id asc
			`
		)
		.bind(season)
		.all<WeekendRow>();

	const weekends: StandingWeekend[] = weekendRows.map((weekend) => ({
		id: weekend.id,
		name: weekend.name,
		lockTime: weekend.lock_time,
		isSprint: weekend.is_sprint === 1
	}));

	if (weekends.length === 0) {
		return buildSeasonStandings(season, weekends, []);
	}

	const { results: rows } = await db
		.prepare(
			`
			select
				s.user_id,
				u.discord_name as user_name,
				u.avatar_snapshot_sha256 as user_avatar_snapshot_sha256,
				s.weekend_id,

				s.team_id,
				t.name as team_name,
				t.color as team_color,

				s.sprint_pole_driver_id,
				s.sprint_p1_driver_id,
				s.pole_driver_id,
				s.p1_driver_id,
				s.p2_driver_id,
				s.p3_driver_id,
				s.p10_driver_id,
				s.dotd_driver_id,
				s.bold_prediction,

				coalesce(br.awarded, 0) as bold_awarded,

				r.sprint_pole_driver_id
					as result_sprint_pole_driver_id,
				r.sprint_p1_driver_id
					as result_sprint_p1_driver_id,
				r.pole_driver_id
					as result_pole_driver_id,
				r.p1_driver_id
					as result_p1_driver_id,
				r.p2_driver_id
					as result_p2_driver_id,
				r.p3_driver_id
					as result_p3_driver_id,
				r.p10_driver_id
					as result_p10_driver_id,
				r.dotd_driver_id
					as result_dotd_driver_id,
				r.updated_at
					as result_updated_at
			from submissions s
			join weekends w
				on w.id = s.weekend_id
			join weekend_results r
				on r.weekend_id = s.weekend_id
			join users u
				on u.discord_id = s.user_id
			join teams t
				on t.id = s.team_id
			left join bold_reviews br
				on br.user_id = s.user_id
				and br.weekend_id = s.weekend_id
			where
				w.season = ?
				and w.scored = 1
			order by
				w.lock_time asc,
				w.id asc,
				u.discord_name asc,
				s.user_id asc
			`
		)
		.bind(season)
		.all<StandingRow>();

	const entries: ScoredStandingEntry[] = rows.map((row) => {
		const score = scoreSubmission(row, resultFromRow(row), row.bold_awarded === 1);

		return {
			weekendId: row.weekend_id,
			userId: row.user_id,
			userName: row.user_name,
			userAvatarSnapshotSha256: row.user_avatar_snapshot_sha256,
			teamId: row.team_id,
			teamName: row.team_name,
			teamColor: row.team_color,
			racePoints: score.racePoints,
			sprintPoints: score.sprintPoints,
			boldPoints: score.boldPoints,
			totalPoints: score.totalPoints
		};
	});

	return buildSeasonStandings(season, weekends, entries);
}
