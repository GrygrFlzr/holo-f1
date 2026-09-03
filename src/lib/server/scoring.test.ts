import { describe, expect, it } from 'vitest';
import type { WeekendResult } from './db/results';
import type { Submission } from './db/submissions';
import { scoreSubmission } from './scoring';

const TEST_DRIVER_IDS = {
	sprintPole: 10_001,
	sprintWinner: 10_002,
	pole: 10_003,
	p1: 10_004,
	p2: 10_005,
	p3: 10_006,
	p10: 10_007,
	dotd: 10_008
} as const;

const TEST_OTHER_DRIVER_ID = 99_999;

const RACE_CASES = [
	['pole_driver_id', 'pole'],
	['p1_driver_id', 'p1'],
	['p2_driver_id', 'p2'],
	['p3_driver_id', 'p3'],
	['p10_driver_id', 'p10'],
	['dotd_driver_id', 'dotd']
] as const;

const SPRINT_CASES = [
	['sprint_pole_driver_id', 'sprint_pole'],
	['sprint_p1_driver_id', 'sprint_p1']
] as const;

function createResult(overrides: Partial<WeekendResult> = {}): WeekendResult {
	return {
		weekend_id: 90_001,
		sprint_pole_driver_id: TEST_DRIVER_IDS.sprintPole,
		sprint_p1_driver_id: TEST_DRIVER_IDS.sprintWinner,
		pole_driver_id: TEST_DRIVER_IDS.pole,
		p1_driver_id: TEST_DRIVER_IDS.p1,
		p2_driver_id: TEST_DRIVER_IDS.p2,
		p3_driver_id: TEST_DRIVER_IDS.p3,
		p10_driver_id: TEST_DRIVER_IDS.p10,
		dotd_driver_id: TEST_DRIVER_IDS.dotd,
		updated_at: 'TEST_TIMESTAMP',
		...overrides
	};
}

function createSubmission(overrides: Partial<Submission> = {}): Submission {
	return {
		sprint_pole_driver_id: TEST_DRIVER_IDS.sprintPole,
		sprint_p1_driver_id: TEST_DRIVER_IDS.sprintWinner,
		pole_driver_id: TEST_DRIVER_IDS.pole,
		p1_driver_id: TEST_DRIVER_IDS.p1,
		p2_driver_id: TEST_DRIVER_IDS.p2,
		p3_driver_id: TEST_DRIVER_IDS.p3,
		p10_driver_id: TEST_DRIVER_IDS.p10,
		dotd_driver_id: TEST_DRIVER_IDS.dotd,
		bold_prediction: 'TEST_BOLD_PREDICTION',
		team_id: 80_001,
		...overrides
	};
}

function createIncorrectSubmission(): Submission {
	return createSubmission({
		sprint_pole_driver_id: TEST_OTHER_DRIVER_ID,
		sprint_p1_driver_id: TEST_OTHER_DRIVER_ID,
		pole_driver_id: TEST_OTHER_DRIVER_ID,
		p1_driver_id: TEST_OTHER_DRIVER_ID,
		p2_driver_id: TEST_OTHER_DRIVER_ID,
		p3_driver_id: TEST_OTHER_DRIVER_ID,
		p10_driver_id: TEST_OTHER_DRIVER_ID,
		dotd_driver_id: TEST_OTHER_DRIVER_ID
	});
}

describe('scoreSubmission', () => {
	it.each(RACE_CASES)('scores a matching %s independently', (field, key) => {
		const result = createResult({
			sprint_pole_driver_id: null,
			sprint_p1_driver_id: null
		});
		const submission = createIncorrectSubmission();

		submission[field] = result[field];

		const score = scoreSubmission(submission, result, false);

		expect(score.racePoints).toBe(1);
		expect(score.sprintPoints).toBe(0);
		expect(score.boldPoints).toBe(0);
		expect(score.totalPoints).toBe(1);
		expect(score.items.filter((item) => item.correct)).toHaveLength(1);
		expect(score.items.find((item) => item.key === key)).toMatchObject({
			correct: true,
			points: 1
		});
	});

	it.each(SPRINT_CASES)('scores a matching %s independently', (field, key) => {
		const result = createResult();
		const submission = createIncorrectSubmission();

		submission[field] = result[field];

		const score = scoreSubmission(submission, result, false);

		expect(score.racePoints).toBe(0);
		expect(score.sprintPoints).toBe(1);
		expect(score.boldPoints).toBe(0);
		expect(score.totalPoints).toBe(1);
		expect(score.items.filter((item) => item.correct)).toHaveLength(1);
		expect(score.items.find((item) => item.key === key)).toMatchObject({
			correct: true,
			points: 1
		});
	});

	it('has a regular-weekend maximum of seven points', () => {
		const result = createResult({
			sprint_pole_driver_id: null,
			sprint_p1_driver_id: null
		});

		const score = scoreSubmission(createSubmission(), result, true);

		expect(score.items).toHaveLength(6);
		expect(score.items.every((item) => item.correct)).toBe(true);
		expect(score.racePoints).toBe(6);
		expect(score.sprintPoints).toBe(0);
		expect(score.boldPoints).toBe(1);
		expect(score.totalPoints).toBe(7);
	});

	it('has a sprint-weekend maximum of nine points', () => {
		const score = scoreSubmission(createSubmission(), createResult(), true);

		const predictionPoints = score.items.reduce((total, item) => total + item.points, 0);

		expect(score.items).toHaveLength(8);
		expect(score.items.every((item) => item.correct)).toBe(true);
		expect(predictionPoints).toBe(8);
		expect(score.racePoints).toBe(6);
		expect(score.sprintPoints).toBe(2);
		expect(score.boldPoints).toBe(1);
		expect(score.totalPoints).toBe(9);
	});

	it('does not create sprint items without official sprint results', () => {
		const score = scoreSubmission(
			createSubmission(),
			createResult({
				sprint_pole_driver_id: null,
				sprint_p1_driver_id: null
			}),
			false
		);

		expect(score.items.map((item) => item.key)).toEqual(['pole', 'p1', 'p2', 'p3', 'p10', 'dotd']);
		expect(score.sprintPoints).toBe(0);
	});

	it('scores null predictions as incorrect', () => {
		const score = scoreSubmission(
			createSubmission({
				sprint_pole_driver_id: null,
				sprint_p1_driver_id: null,
				pole_driver_id: null,
				p1_driver_id: null,
				p2_driver_id: null,
				p3_driver_id: null,
				p10_driver_id: null,
				dotd_driver_id: null
			}),
			createResult(),
			false
		);

		expect(score.items).toHaveLength(8);
		expect(
			score.items.every(
				(item) => item.predictedDriverId === null && !item.correct && item.points === 0
			)
		).toBe(true);
		expect(score.racePoints).toBe(0);
		expect(score.sprintPoints).toBe(0);
		expect(score.totalPoints).toBe(0);
	});

	it('changes only bold and total points when a review changes', () => {
		const submission = createIncorrectSubmission();
		const result = createResult({
			sprint_pole_driver_id: null,
			sprint_p1_driver_id: null
		});

		const unawarded = scoreSubmission(submission, result, false);
		const awarded = scoreSubmission(submission, result, true);

		expect(awarded.items).toEqual(unawarded.items);
		expect(awarded.racePoints).toBe(unawarded.racePoints);
		expect(awarded.sprintPoints).toBe(unawarded.sprintPoints);
		expect(unawarded.boldPoints).toBe(0);
		expect(awarded.boldPoints).toBe(1);
		expect(awarded.totalPoints).toBe(unawarded.totalPoints + 1);
	});
});
