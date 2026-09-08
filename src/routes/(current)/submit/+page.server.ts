import { error, fail } from '@sveltejs/kit';
import { getCached, setCache } from '$lib/server/db/cache';
import type { Driver } from '$lib/server/db/drivers';
import { allDriversStatement, validateDriverIds } from '$lib/server/db/drivers';
import type { Submission } from '$lib/server/db/submissions';
import { deleteSubmission, upsertSubmission } from '$lib/server/db/submissions';
import type { Team } from '$lib/server/db/teams';
import { allTeamsStatement, validateTeamId } from '$lib/server/db/teams';
import { typedBatch } from '$lib/server/db/types';
import type { Weekend } from '$lib/server/db/weekends';
import { getOpenWeekendById, openWeekendStatement } from '$lib/server/db/weekends';
import { parseSubmissionForm } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const db = locals.db;
	if (!db) error(500, 'Database not available');

	const cached = getCached();
	const weekendStatement = openWeekendStatement(db);
	const driversStatement = allDriversStatement(db);
	const teamsStatement = allTeamsStatement(db);
	const unboundSubmissionStatement = db.prepare(
		`
		select
			s.pole_driver_id, s.p1_driver_id, s.p2_driver_id
			, s.p3_driver_id, s.p10_driver_id, s.dotd_driver_id
			, s.bold_prediction, s.team_id
			, s.sprint_pole_driver_id, s.sprint_p1_driver_id
		from submissions s
		join weekends w on s.weekend_id = w.id
		where s.user_id = ?
			and w.lock_time > datetime('now', '-3 days')
			and w.scored = 0
		order by w.lock_time asc
		limit 1
		`
	);

	let weekend: Weekend | null;
	let drivers: Driver[];
	let teams: Team[];
	let submission: Submission | null;

	if (locals.user) {
		// logged in branch
		const submissionStatement = unboundSubmissionStatement.bind(locals.user.discord_id);
		if (cached) {
			const [weekendResult, submissionResult] = await typedBatch<[Weekend, Submission]>(db, [
				weekendStatement,
				submissionStatement
			]);
			weekend = weekendResult.results[0] ?? null;
			drivers = cached.drivers;
			teams = cached.teams;
			submission = submissionResult.results[0] ?? null;
		} else {
			const [weekendResult, driversResult, teamsResult, submissionResult] = await typedBatch<
				[Weekend, Driver, Team, Submission]
			>(db, [weekendStatement, driversStatement, teamsStatement, submissionStatement]);
			setCache(driversResult.results, teamsResult.results);
			weekend = weekendResult.results[0] ?? null;
			drivers = driversResult.results;
			teams = teamsResult.results;
			submission = submissionResult.results[0] ?? null;
		}
	} else {
		// logged out branch
		if (cached) {
			const [weekendResult] = await typedBatch<[Weekend]>(db, [weekendStatement]);
			weekend = weekendResult.results[0] ?? null;
			drivers = cached.drivers;
			teams = cached.teams;
			submission = null;
		} else {
			const [weekendResult, driversResult, teamsResult] = await typedBatch<[Weekend, Driver, Team]>(
				db,
				[weekendStatement, driversStatement, teamsStatement]
			);
			setCache(driversResult.results, teamsResult.results);
			weekend = weekendResult.results[0] ?? null;
			drivers = driversResult.results;
			teams = teamsResult.results;
			submission = null;
		}
	}

	return { weekend, drivers, teams, submission };
}) satisfies PageServerLoad;

export const actions = {
	save: async ({ request, locals }) => {
		if (!locals.user) error(401, 'Not authenticated');
		const formData = await request.formData();
		const rawWeekendId = formData.get('weekend_id');
		if (typeof rawWeekendId !== 'string' || rawWeekendId === '') {
			return fail(400, { error: 'Missing weekend ID.' });
		}
		const weekendId = Number(rawWeekendId);
		if (!Number.isInteger(weekendId) || weekendId <= 0) {
			return fail(400, { error: 'Invalid weekend.' });
		}

		const db = locals.db;
		if (!db) error(500, 'Database not available');

		const weekend = await getOpenWeekendById(db, weekendId);
		if (!weekend) return fail(400, { error: 'Weekend is locked or does not exist.' });

		const parsed = parseSubmissionForm(formData, !!weekend.is_sprint);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		const { drivers, teamId, boldPrediction } = parsed.data;
		const { sprint_pole_driver_id, sprint_p1_driver_id, ...restOfDrivers } = drivers;
		const raceDriverIds = Object.values(restOfDrivers);
		if (weekend.is_sprint) {
			if (sprint_pole_driver_id === null || sprint_p1_driver_id === null) {
				return fail(400, { error: 'Sprint predictions are required for sprint weekends.' });
			}
			raceDriverIds.push(sprint_pole_driver_id, sprint_p1_driver_id);
		}
		const [driversValid, teamValid] = await Promise.all([
			validateDriverIds(db, raceDriverIds),
			validateTeamId(db, teamId)
		]);

		if (!driversValid) return fail(400, { error: 'One or more selected drivers do not exist.' });
		if (!teamValid) return fail(400, { error: 'Selected team does not exist.' });

		await upsertSubmission(db, locals.user.discord_id, weekend.id, {
			...drivers,
			bold_prediction: boldPrediction,
			team_id: teamId
		});

		return { success: true };
	},

	clear: async ({ request, locals }) => {
		if (!locals.user) error(401, 'Not authenticated');
		const formData = await request.formData();
		const rawWeekendId = formData.get('weekend_id');
		if (typeof rawWeekendId !== 'string' || rawWeekendId === '') {
			return fail(400, { error: 'Missing weekend ID.' });
		}
		const weekendId = Number(rawWeekendId);
		if (!Number.isInteger(weekendId) || weekendId <= 0) {
			return fail(400, { error: 'Invalid weekend.' });
		}

		const db = locals.db;
		if (!db) error(500, 'Database not available');

		const weekend = await getOpenWeekendById(db, weekendId);
		if (!weekend) return fail(400, { error: 'Weekend is locked or does not exist.' });

		await deleteSubmission(db, locals.user.discord_id, weekend.id);
		return { cleared: true };
	}
} satisfies Actions;
