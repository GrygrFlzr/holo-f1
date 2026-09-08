import { describe, expect, it } from 'vitest';
import type { Driver } from './drivers';
import type { WeekendResult } from './results';
import {
	buildPublishedWeekendScoreDetails,
	type PublishedWeekend,
	type WeekendScoreSubmissionRow
} from './weekend-scores';

const TODO_TEST_DRIVER_IDS = {
	sprintPole: 9_000_000_000_000_001,
	sprintP1: 9_000_000_000_000_002,
	pole: 9_000_000_000_000_003,
	p1: 9_000_000_000_000_004,
	p2: 9_000_000_000_000_005,
	p3: 9_000_000_000_000_006,
	p10: 9_000_000_000_000_007,
	dotd: 9_000_000_000_000_008,
	other: 9_000_000_000_000_009
} as const;

const TODO_TEST_WEEKEND: PublishedWeekend = {
	id: 8_000_000_000_000_001,
	slug: 'TODO_TEST_WEEKEND',
	name: 'TODO_TEST_WEEKEND',
	lockTime: 'TODO_TEST_LOCK_TIME',
	isSprint: true
};

const TODO_TEST_DRIVERS: Driver[] = Object.entries(TODO_TEST_DRIVER_IDS).map(([key, id]) => ({
	id,
	code: `TODO_${key.toUpperCase()}`,
	name: `TODO_TEST_DRIVER_${key.toUpperCase()}`,
	category: 'TODO_TEST_CATEGORY'
}));

function createResult(overrides: Partial<WeekendResult> = {}): WeekendResult {
	return {
		weekend_id: TODO_TEST_WEEKEND.id,
		sprint_pole_driver_id: TODO_TEST_DRIVER_IDS.sprintPole,
		sprint_p1_driver_id: TODO_TEST_DRIVER_IDS.sprintP1,
		pole_driver_id: TODO_TEST_DRIVER_IDS.pole,
		p1_driver_id: TODO_TEST_DRIVER_IDS.p1,
		p2_driver_id: TODO_TEST_DRIVER_IDS.p2,
		p3_driver_id: TODO_TEST_DRIVER_IDS.p3,
		p10_driver_id: TODO_TEST_DRIVER_IDS.p10,
		dotd_driver_id: TODO_TEST_DRIVER_IDS.dotd,
		updated_at: 'TODO_TEST_TIMESTAMP',
		...overrides
	};
}

function createSubmission(
	overrides: Partial<WeekendScoreSubmissionRow> = {}
): WeekendScoreSubmissionRow {
	return {
		user_id: 'TODO_TEST_PUBLIC_ID',
		user_name: 'TODO_TEST_PARTICIPANT',
		user_avatar_snapshot_sha256: null,
		user_default_avatar_index: 5,
		sprint_pole_driver_id: TODO_TEST_DRIVER_IDS.sprintPole,
		sprint_p1_driver_id: TODO_TEST_DRIVER_IDS.sprintP1,
		pole_driver_id: TODO_TEST_DRIVER_IDS.pole,
		p1_driver_id: TODO_TEST_DRIVER_IDS.p1,
		p2_driver_id: TODO_TEST_DRIVER_IDS.p2,
		p3_driver_id: TODO_TEST_DRIVER_IDS.p3,
		p10_driver_id: TODO_TEST_DRIVER_IDS.other,
		dotd_driver_id: TODO_TEST_DRIVER_IDS.dotd,
		bold_prediction: 'TODO_TEST_BOLD_PREDICTION',
		team_id: 7_000_000_000_000_001,
		team_name: 'TODO_TEST_TEAM',
		team_color: null,
		bold_awarded: 1,
		...overrides
	};
}

describe('published weekend score details', () => {
	it('maps official answers and submission score items', () => {
		const details = buildPublishedWeekendScoreDetails(
			TODO_TEST_WEEKEND,
			createResult(),
			TODO_TEST_DRIVERS,
			[createSubmission()]
		);

		expect(details.officialResults.map(({ key }) => key)).toEqual([
			'sprint_pole',
			'sprint_p1',
			'pole',
			'p1',
			'p2',
			'p3',
			'p10',
			'dotd'
		]);

		expect(details.entries).toHaveLength(1);

		const entry = details.entries[0];

		expect(entry).toMatchObject({
			userId: 'TODO_TEST_PUBLIC_ID',
			userName: 'TODO_TEST_PARTICIPANT',
			defaultAvatarIndex: 5,
			boldPrediction: 'TODO_TEST_BOLD_PREDICTION',
			boldAwarded: true,
			score: {
				racePoints: 5,
				sprintPoints: 2,
				boldPoints: 1,
				totalPoints: 8
			}
		});

		expect(entry.score.items.find((item) => item.key === 'p10')).toMatchObject({
			predictedDriver: {
				id: TODO_TEST_DRIVER_IDS.other
			},
			resultDriver: {
				id: TODO_TEST_DRIVER_IDS.p10
			},
			correct: false,
			points: 0
		});
	});

	it('omits sprint questions from a regular weekend', () => {
		const weekend: PublishedWeekend = {
			...TODO_TEST_WEEKEND,
			isSprint: false
		};

		const details = buildPublishedWeekendScoreDetails(
			weekend,
			createResult({
				sprint_pole_driver_id: null,
				sprint_p1_driver_id: null
			}),
			TODO_TEST_DRIVERS,
			[
				createSubmission({
					sprint_pole_driver_id: null,
					sprint_p1_driver_id: null
				})
			]
		);

		expect(details.officialResults.map(({ key }) => key)).toEqual([
			'pole',
			'p1',
			'p2',
			'p3',
			'p10',
			'dotd'
		]);

		expect(details.entries[0].score.items.map(({ key }) => key)).toEqual([
			'pole',
			'p1',
			'p2',
			'p3',
			'p10',
			'dotd'
		]);

		expect(details.entries[0].score.sprintPoints).toBe(0);
	});
});
