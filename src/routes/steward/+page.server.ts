import { error, fail } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { getBoldReviewsForWeekend, upsertBoldReviews } from '$lib/server/db/bold-reviews';
import { getAllDrivers, validateDriverIds } from '$lib/server/db/drivers';
import {
	getWeekendResult,
	upsertWeekendResult,
	type WeekendResult,
	type WeekendResultInput
} from '$lib/server/db/results';
import { getSubmissionsForScoring, type StewardSubmission } from '$lib/server/db/submissions';
import {
	getFirstUnscoredWeekend,
	getLockedWeekends,
	getWeekendById,
	getWeekendForScoring,
	publishWeekend,
	type Weekend
} from '$lib/server/db/weekends';
import { scoreSubmission } from '$lib/server/scoring';
import { parseDateTime } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

const RACE_RESULT_FIELDS = [
	{ name: 'pole_driver_id', label: 'Race pole' },
	{ name: 'p1_driver_id', label: 'P1' },
	{ name: 'p2_driver_id', label: 'P2' },
	{ name: 'p3_driver_id', label: 'P3' },
	{ name: 'p10_driver_id', label: 'P10' },
	{ name: 'dotd_driver_id', label: 'Driver of the Day' }
] as const;

const SPRINT_RESULT_FIELDS = [
	{ name: 'sprint_pole_driver_id', label: 'Sprint pole' },
	{ name: 'sprint_p1_driver_id', label: 'Sprint P1' }
] as const;

type ResultFieldDefinition =
	(typeof RACE_RESULT_FIELDS)[number] | (typeof SPRINT_RESULT_FIELDS)[number];

type ResultFieldName = ResultFieldDefinition['name'];

type ParsedFields<T extends ResultFieldName> =
	| {
			ok: true;
			values: Record<T, number>;
	  }
	| {
			ok: false;
			message: string;
	  };

type ParsedResult =
	| {
			ok: true;
			data: WeekendResultInput;
	  }
	| {
			ok: false;
			message: string;
	  };

function parseWeekendId(formData: FormData): number | null {
	const value = formData.get('weekend_id');

	if (typeof value !== 'string') {
		return null;
	}

	const weekendId = Number(value);

	if (!Number.isInteger(weekendId) || weekendId <= 0) {
		return null;
	}

	return weekendId;
}

function parseDriverFields<const T extends readonly ResultFieldDefinition[]>(
	formData: FormData,
	fields: T
): ParsedFields<T[number]['name']> {
	const values: Record<string, number> = {};

	for (const field of fields) {
		const raw = formData.get(field.name);
		const value = typeof raw === 'string' ? Number(raw) : NaN;

		if (typeof raw !== 'string' || raw === '' || !Number.isInteger(value) || value <= 0) {
			return {
				ok: false,
				message: `Select a driver for ${field.label}.`
			};
		}

		values[field.name] = value;
	}

	return {
		ok: true,
		values: values as Record<T[number]['name'], number>
	};
}

function parseResultForm(formData: FormData, isSprint: boolean): ParsedResult {
	const race = parseDriverFields(formData, RACE_RESULT_FIELDS);

	if (!race.ok) {
		return race;
	}

	let sprintPoleDriverId: number | null = null;
	let sprintP1DriverId: number | null = null;

	if (isSprint) {
		const sprint = parseDriverFields(formData, SPRINT_RESULT_FIELDS);

		if (!sprint.ok) {
			return sprint;
		}

		sprintPoleDriverId = sprint.values.sprint_pole_driver_id;
		sprintP1DriverId = sprint.values.sprint_p1_driver_id;
	}

	const finishingPositions = [
		race.values.p1_driver_id,
		race.values.p2_driver_id,
		race.values.p3_driver_id,
		race.values.p10_driver_id
	];

	if (new Set(finishingPositions).size !== finishingPositions.length) {
		return {
			ok: false,
			message: 'P1, P2, P3, and P10 must be different drivers.'
		};
	}

	return {
		ok: true,
		data: {
			sprint_pole_driver_id: sprintPoleDriverId,
			sprint_p1_driver_id: sprintP1DriverId,
			pole_driver_id: race.values.pole_driver_id,
			p1_driver_id: race.values.p1_driver_id,
			p2_driver_id: race.values.p2_driver_id,
			p3_driver_id: race.values.p3_driver_id,
			p10_driver_id: race.values.p10_driver_id,
			dotd_driver_id: race.values.dotd_driver_id
		}
	};
}

function isWeekendLocked(weekend: Weekend): boolean {
	const parsedLockTime = parseDateTime(weekend.lock_time);

	if (!parsedLockTime) {
		return false;
	}

	const lockTime = parsedLockTime.getTime();

	return !Number.isNaN(lockTime) && lockTime <= Date.now();
}

function hasBoldPrediction(entry: Pick<StewardSubmission, 'bold_prediction'>): boolean {
	return typeof entry.bold_prediction === 'string' && entry.bold_prediction.trim().length > 0;
}

function resultDriverIds(result: WeekendResult): number[] {
	return [
		result.sprint_pole_driver_id,
		result.sprint_p1_driver_id,
		result.pole_driver_id,
		result.p1_driver_id,
		result.p2_driver_id,
		result.p3_driver_id,
		result.p10_driver_id,
		result.dotd_driver_id
	].filter((id): id is number => id !== null);
}

function isResultComplete(result: WeekendResult, isSprint: boolean): boolean {
	const raceComplete = RACE_RESULT_FIELDS.every(({ name }) => {
		const value = result[name];

		return Number.isInteger(value) && value > 0;
	});

	if (!raceComplete) {
		return false;
	}

	const sprintComplete =
		result.sprint_pole_driver_id !== null && result.sprint_p1_driver_id !== null;

	const sprintEmpty = result.sprint_pole_driver_id === null && result.sprint_p1_driver_id === null;

	return isSprint ? sprintComplete : sprintEmpty;
}

function hasDistinctFinishingPositions(result: WeekendResult): boolean {
	const positions = [
		result.p1_driver_id,
		result.p2_driver_id,
		result.p3_driver_id,
		result.p10_driver_id
	];

	return new Set(positions).size === positions.length;
}

export const load = (async ({ locals, url }) => {
	const { db } = locals;

	if (!db) {
		error(500, 'Database not available.');
	}

	await requireRole(locals, 'steward');

	const [defaultWeekend, lockedWeekends] = await Promise.all([
		getFirstUnscoredWeekend(db),
		getLockedWeekends(db)
	]);

	const selectedValue = url.searchParams.get('weekend');
	let weekend = defaultWeekend;

	if (selectedValue !== null) {
		const selectedWeekendId = Number(selectedValue);

		if (!Number.isInteger(selectedWeekendId) || selectedWeekendId <= 0) {
			error(400, 'Weekend is invalid.');
		}

		weekend = await getWeekendById(db, selectedWeekendId);

		if (!weekend) {
			error(404, 'Weekend was not found.');
		}
	}

	const weekends =
		defaultWeekend && !lockedWeekends.some((option) => option.id === defaultWeekend.id)
			? [defaultWeekend, ...lockedWeekends]
			: lockedWeekends;

	if (!weekend) {
		return {
			weekends,
			weekend: null,
			locked: false,
			drivers: [],
			result: null,
			entries: [],
			missingBoldReviewCount: 0,
			canPublish: false
		};
	}

	const drivers = await getAllDrivers(db);
	const entries = await getSubmissionsForScoring(db, weekend.id);
	const result = await getWeekendResult(db, weekend.id);
	const reviews = await getBoldReviewsForWeekend(db, weekend.id);

	const reviewsByUserId = new Map(reviews.map((review) => [review.user_id, review]));

	const entriesWithScores = entries.map((entry) => {
		const boldReview = reviewsByUserId.get(entry.discord_id) ?? null;

		return {
			...entry,
			boldReview,
			scorePreview: result ? scoreSubmission(entry, result, boldReview?.awarded === 1) : null
		};
	});

	const missingBoldReviewCount = entries.filter(
		(entry) => hasBoldPrediction(entry) && !reviewsByUserId.has(entry.discord_id)
	).length;

	const driverIds = new Set(drivers.map((driver) => driver.id));

	const resultIsValid =
		result !== null &&
		isResultComplete(result, weekend.is_sprint === 1) &&
		hasDistinctFinishingPositions(result) &&
		resultDriverIds(result).every((id) => driverIds.has(id));

	const locked = isWeekendLocked(weekend);

	return {
		weekends,
		weekend,
		locked,
		drivers,
		result,
		entries: entriesWithScores,
		missingBoldReviewCount,
		canPublish: weekend.scored === 0 && locked && resultIsValid && missingBoldReviewCount === 0
	};
}) satisfies PageServerLoad;

export const actions = {
	saveResults: async ({ locals, request }) => {
		const { db } = locals;

		if (!db) {
			error(500, 'Database not available.');
		}

		await requireRole(locals, 'steward');

		const formData = await request.formData();
		const weekendId = parseWeekendId(formData);

		if (weekendId === null) {
			return fail(400, {
				ok: false,
				action: 'saveResults',
				message: 'Weekend is invalid.'
			});
		}

		const weekend = await getWeekendForScoring(db, weekendId);

		if (!weekend) {
			return fail(404, {
				ok: false,
				action: 'saveResults',
				message: 'Unscored weekend was not found.'
			});
		}

		if (!isWeekendLocked(weekend)) {
			return fail(409, {
				ok: false,
				action: 'saveResults',
				message: 'Weekend is still open.'
			});
		}

		const parsed = parseResultForm(formData, weekend.is_sprint === 1);

		if (!parsed.ok) {
			return fail(400, {
				ok: false,
				action: 'saveResults',
				message: parsed.message
			});
		}

		const ids = [
			parsed.data.sprint_pole_driver_id,
			parsed.data.sprint_p1_driver_id,
			parsed.data.pole_driver_id,
			parsed.data.p1_driver_id,
			parsed.data.p2_driver_id,
			parsed.data.p3_driver_id,
			parsed.data.p10_driver_id,
			parsed.data.dotd_driver_id
		].filter((id): id is number => id !== null);

		if (!(await validateDriverIds(db, ids))) {
			return fail(400, {
				ok: false,
				action: 'saveResults',
				message: 'One or more selected drivers do not exist.'
			});
		}

		await upsertWeekendResult(db, weekend.id, parsed.data);

		return {
			ok: true,
			action: 'saveResults',
			message: 'Official results saved.'
		};
	},

	saveBoldReviews: async ({ locals, request }) => {
		const { db } = locals;

		if (!db) {
			error(500, 'Database not available.');
		}

		await requireRole(locals, 'steward');

		const formData = await request.formData();
		const weekendId = parseWeekendId(formData);

		if (weekendId === null) {
			return fail(400, {
				ok: false,
				action: 'saveBoldReviews',
				message: 'Weekend is invalid.'
			});
		}

		const weekend = await getWeekendById(db, weekendId);

		if (!weekend) {
			return fail(404, {
				ok: false,
				action: 'saveBoldReviews',
				message: 'Weekend was not found.'
			});
		}

		if (!isWeekendLocked(weekend)) {
			return fail(409, {
				ok: false,
				action: 'saveBoldReviews',
				message: 'Weekend is still open.'
			});
		}

		const entries = await getSubmissionsForScoring(db, weekend.id);
		const requiredUserIds = entries.filter(hasBoldPrediction).map((entry) => entry.discord_id);

		const rawReviewedUserIds = formData.getAll('reviewed_user_id');
		const rawAwardedUserIds = formData.getAll('awarded_user_id');

		if (
			rawReviewedUserIds.some((value) => typeof value !== 'string') ||
			rawAwardedUserIds.some((value) => typeof value !== 'string')
		) {
			return fail(400, {
				ok: false,
				action: 'saveBoldReviews',
				message: 'Bold review form is invalid.'
			});
		}

		const reviewedUserIds = new Set(rawReviewedUserIds as string[]);
		const awardedUserIds = new Set(rawAwardedUserIds as string[]);

		if (
			reviewedUserIds.size !== requiredUserIds.length ||
			requiredUserIds.some((userId) => !reviewedUserIds.has(userId))
		) {
			return fail(400, {
				ok: false,
				action: 'saveBoldReviews',
				message: 'Every bold prediction requires a review.'
			});
		}

		if ([...awardedUserIds].some((userId) => !reviewedUserIds.has(userId))) {
			return fail(400, {
				ok: false,
				action: 'saveBoldReviews',
				message: 'Bold review form is invalid.'
			});
		}

		await upsertBoldReviews(
			db,
			weekend.id,
			requiredUserIds.map((userId) => ({
				user_id: userId,
				awarded: awardedUserIds.has(userId) ? 1 : 0
			}))
		);

		return {
			ok: true,
			action: 'saveBoldReviews',
			message: 'Bold reviews saved.'
		};
	},

	publish: async ({ locals, request }) => {
		const { db } = locals;

		if (!db) {
			error(500, 'Database not available.');
		}

		await requireRole(locals, 'steward');

		const formData = await request.formData();
		const weekendId = parseWeekendId(formData);

		if (weekendId === null) {
			return fail(400, {
				ok: false,
				action: 'publish',
				message: 'Weekend is invalid.'
			});
		}

		const weekend = await getWeekendForScoring(db, weekendId);

		if (!weekend) {
			return fail(404, {
				ok: false,
				action: 'publish',
				message: 'Unscored weekend was not found.'
			});
		}

		if (!isWeekendLocked(weekend)) {
			return fail(409, {
				ok: false,
				action: 'publish',
				message: 'Weekend is still open.'
			});
		}

		const result = await getWeekendResult(db, weekend.id);

		if (
			!result ||
			!isResultComplete(result, weekend.is_sprint === 1) ||
			!hasDistinctFinishingPositions(result) ||
			!(await validateDriverIds(db, resultDriverIds(result)))
		) {
			return fail(409, {
				ok: false,
				action: 'publish',
				message: 'Official results are incomplete or invalid.'
			});
		}

		const entries = await getSubmissionsForScoring(db, weekend.id);
		const reviews = await getBoldReviewsForWeekend(db, weekend.id);
		const reviewedUserIds = new Set(reviews.map((review) => review.user_id));

		const missingReviews = entries.filter(
			(entry) => hasBoldPrediction(entry) && !reviewedUserIds.has(entry.discord_id)
		);

		if (missingReviews.length > 0) {
			return fail(409, {
				ok: false,
				action: 'publish',
				message: 'One or more bold predictions have not been reviewed.'
			});
		}

		const published = await publishWeekend(db, weekend.id);

		if (!published) {
			return fail(409, {
				ok: false,
				action: 'publish',
				message: 'Weekend was not published.'
			});
		}

		return {
			ok: true,
			action: 'publish',
			message: 'Weekend published.'
		};
	}
} satisfies Actions;
