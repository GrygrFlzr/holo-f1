import type { Driver } from '$lib/server/db/drivers';
import { getAllDrivers } from '$lib/server/db/drivers';
import type { WeekendResult } from '$lib/server/db/results';
import { getWeekendResult } from '$lib/server/db/results';
import type { Submission } from '$lib/server/db/submissions';
import type { D1Queryable } from '$lib/server/db/types';
import {
	RACE_PREDICTIONS,
	scoreSubmission,
	SPRINT_PREDICTIONS,
	type PredictionKey
} from '$lib/server/scoring';

interface PublishedWeekendRow {
	id: number;
	slug: string;
	name: string;
	lock_time: string;
	is_sprint: number;
}

export interface PublishedWeekend {
	id: number;
	slug: string;
	name: string;
	lockTime: string;
	isSprint: boolean;
}

export interface WeekendScoreDriver {
	id: number;
	code: string;
	name: string;
}

export interface WeekendOfficialResult {
	key: PredictionKey;
	driver: WeekendScoreDriver;
}

export interface WeekendPredictionScore {
	key: PredictionKey;
	predictedDriver: WeekendScoreDriver | null;
	resultDriver: WeekendScoreDriver;
	correct: boolean;
	points: 0 | 1;
}

export interface WeekendScoreBreakdown {
	items: WeekendPredictionScore[];
	racePoints: number;
	sprintPoints: number;
	boldPoints: 0 | 1;
	totalPoints: number;
}

export interface WeekendScoreSubmissionRow extends Submission {
	user_id: string;
	user_name: string;
	user_avatar_snapshot_sha256: string | null;
	team_id: number;
	team_name: string;
	team_color: string | null;
	bold_awarded: number;
}

export interface PublishedWeekendScoreEntry {
	userId: string;
	userName: string;
	userAvatarSnapshotSha256: string | null;
	team: {
		id: number;
		name: string;
		color: string | null;
	};
	boldPrediction: string | null;
	boldAwarded: boolean;
	score: WeekendScoreBreakdown;
}

export interface PublishedWeekendScoreDetails {
	officialResults: WeekendOfficialResult[];
	entries: PublishedWeekendScoreEntry[];
}

export interface PublishedWeekendScores extends PublishedWeekendScoreDetails {
	weekends: PublishedWeekend[];
	weekend: PublishedWeekend | null;
}

function toScoreDriver(driver: Driver): WeekendScoreDriver {
	return {
		id: driver.id,
		code: driver.code,
		name: driver.name
	};
}

function requireDriver(
	driversById: ReadonlyMap<number, WeekendScoreDriver>,
	driverId: number
): WeekendScoreDriver {
	const driver = driversById.get(driverId);

	if (!driver) {
		throw new Error('A referenced driver was not loaded.');
	}

	return driver;
}

function assertSprintResultShape(weekend: PublishedWeekend, result: WeekendResult): void {
	const hasSprintResults =
		result.sprint_pole_driver_id !== null && result.sprint_p1_driver_id !== null;
	const hasNoSprintResults =
		result.sprint_pole_driver_id === null && result.sprint_p1_driver_id === null;

	if ((weekend.isSprint && !hasSprintResults) || (!weekend.isSprint && !hasNoSprintResults)) {
		throw new Error('Published sprint results do not match the weekend type.');
	}
}

export function buildPublishedWeekendScoreDetails(
	weekend: PublishedWeekend,
	result: WeekendResult,
	drivers: readonly Driver[],
	rows: readonly WeekendScoreSubmissionRow[]
): PublishedWeekendScoreDetails {
	assertSprintResultShape(weekend, result);

	const driversById = new Map(drivers.map((driver) => [driver.id, toScoreDriver(driver)]));

	const predictionDefinitions = weekend.isSprint
		? [...SPRINT_PREDICTIONS, ...RACE_PREDICTIONS]
		: [...RACE_PREDICTIONS];

	const officialResults = predictionDefinitions.map((definition): WeekendOfficialResult => {
		const driverId = result[definition.field];

		if (driverId === null) {
			throw new Error('A published official result is missing.');
		}

		return {
			key: definition.key,
			driver: requireDriver(driversById, driverId)
		};
	});

	const entries = rows
		.map((row): PublishedWeekendScoreEntry => {
			const score = scoreSubmission(row, result, row.bold_awarded === 1);

			return {
				userId: row.user_id,
				userName: row.user_name,
				userAvatarSnapshotSha256: row.user_avatar_snapshot_sha256,
				team: {
					id: row.team_id,
					name: row.team_name,
					color: row.team_color
				},
				boldPrediction: row.bold_prediction,
				boldAwarded: score.boldPoints === 1,
				score: {
					items: score.items.map((item) => ({
						key: item.key,
						predictedDriver:
							item.predictedDriverId === null
								? null
								: requireDriver(driversById, item.predictedDriverId),
						resultDriver: requireDriver(driversById, item.resultDriverId),
						correct: item.correct,
						points: item.points
					})),
					racePoints: score.racePoints,
					sprintPoints: score.sprintPoints,
					boldPoints: score.boldPoints,
					totalPoints: score.totalPoints
				}
			};
		})
		.sort((left, right) => {
			const points = right.score.totalPoints - left.score.totalPoints;

			if (points !== 0) {
				return points;
			}

			const name = left.userName.localeCompare(right.userName, 'en');

			if (name !== 0) {
				return name;
			}

			return left.userId.localeCompare(right.userId, 'en');
		});

	return {
		officialResults,
		entries
	};
}

export async function getPublishedWeekendScores(
	db: D1Queryable,
	season: number,
	requestedSlug: string | null
): Promise<PublishedWeekendScores> {
	const { results: weekendRows } = await db
		.prepare(
			`
			select
				id,
				slug,
				name,
				lock_time,
				is_sprint
			from weekends
			where
				season = ?
				and scored = 1
			order by
				lock_time desc,
				id desc
			`
		)
		.bind(season)
		.all<PublishedWeekendRow>();

	const weekends = weekendRows.map((row): PublishedWeekend => ({
		id: row.id,
		slug: row.slug,
		name: row.name,
		lockTime: row.lock_time,
		isSprint: row.is_sprint === 1
	}));

	const weekend =
		requestedSlug === null
			? (weekends[0] ?? null)
			: (weekends.find((candidate) => candidate.slug === requestedSlug) ?? null);

	if (!weekend) {
		return {
			weekends,
			weekend: null,
			officialResults: [],
			entries: []
		};
	}

	const result = await getWeekendResult(db, weekend.id);

	if (!result) {
		throw new Error('A published weekend has no official result.');
	}

	const drivers = await getAllDrivers(db);

	const { results: submissionRows } = await db
		.prepare(
			`
			select
				s.user_id,
				u.discord_name as user_name,
				u.avatar_snapshot_sha256
					as user_avatar_snapshot_sha256,

				s.sprint_pole_driver_id,
				s.sprint_p1_driver_id,
				s.pole_driver_id,
				s.p1_driver_id,
				s.p2_driver_id,
				s.p3_driver_id,
				s.p10_driver_id,
				s.dotd_driver_id,
				s.bold_prediction,

				s.team_id,
				t.name as team_name,
				t.color as team_color,

				coalesce(br.awarded, 0)
					as bold_awarded
			from submissions s
			join weekends w
				on w.id = s.weekend_id
			join users u
				on u.discord_id = s.user_id
			join teams t
				on t.id = s.team_id
			left join bold_reviews br
				on br.user_id = s.user_id
				and br.weekend_id = s.weekend_id
			where
				w.season = ?1
				and w.scored = 1
				and w.id = ?2
			order by
				u.discord_name asc,
				s.user_id asc
			`
		)
		.bind(season, weekend.id)
		.all<WeekendScoreSubmissionRow>();

	const details = buildPublishedWeekendScoreDetails(weekend, result, drivers, submissionRows);

	return {
		weekends,
		weekend,
		...details
	};
}
