import type { WeekendResult } from '$lib/server/db/results';
import type { Submission } from '$lib/server/db/submissions';

export const RACE_PREDICTIONS = [
	{ key: 'pole', field: 'pole_driver_id' },
	{ key: 'p1', field: 'p1_driver_id' },
	{ key: 'p2', field: 'p2_driver_id' },
	{ key: 'p3', field: 'p3_driver_id' },
	{ key: 'p10', field: 'p10_driver_id' },
	{ key: 'dotd', field: 'dotd_driver_id' }
] as const;

export const SPRINT_PREDICTIONS = [
	{ key: 'sprint_pole', field: 'sprint_pole_driver_id' },
	{ key: 'sprint_p1', field: 'sprint_p1_driver_id' }
] as const;

type RacePrediction = (typeof RACE_PREDICTIONS)[number];
type SprintPrediction = (typeof SPRINT_PREDICTIONS)[number];

export type PredictionKey = RacePrediction['key'] | SprintPrediction['key'];

type PredictionField = RacePrediction['field'] | SprintPrediction['field'];

type PredictionDefinition = {
	key: PredictionKey;
	field: PredictionField;
};

export interface PredictionScore {
	key: PredictionKey;
	predictedDriverId: number | null;
	resultDriverId: number;
	correct: boolean;
	points: 0 | 1;
}

export interface ScoreBreakdown {
	items: PredictionScore[];
	racePoints: number;
	sprintPoints: number;
	boldPoints: 0 | 1;
	totalPoints: number;
}

function scorePredictions(
	submission: Submission,
	result: WeekendResult,
	predictions: readonly PredictionDefinition[]
): PredictionScore[] {
	return predictions.flatMap(({ key, field }) => {
		const resultDriverId = result[field];

		if (resultDriverId === null) {
			return [];
		}

		const predictedDriverId = submission[field];
		const correct = predictedDriverId === resultDriverId;

		return [
			{
				key,
				predictedDriverId,
				resultDriverId,
				correct,
				points: correct ? 1 : 0
			}
		];
	});
}

export function scoreSubmission(
	submission: Submission,
	result: WeekendResult,
	boldAwarded: boolean
): ScoreBreakdown {
	const raceItems = scorePredictions(submission, result, RACE_PREDICTIONS);
	const sprintItems = scorePredictions(submission, result, SPRINT_PREDICTIONS);

	const racePoints = raceItems.reduce((total, item) => total + item.points, 0);
	const sprintPoints = sprintItems.reduce((total, item) => total + item.points, 0);
	const boldPoints: 0 | 1 = boldAwarded ? 1 : 0;

	return {
		items: [...sprintItems, ...raceItems],
		racePoints,
		sprintPoints,
		boldPoints,
		totalPoints: racePoints + sprintPoints + boldPoints
	};
}
