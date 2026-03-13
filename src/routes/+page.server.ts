import { error } from '@sveltejs/kit';
import { typedBatch } from '$lib/server/db/types';
// import { parseDateTime } from '$lib/time';
import type { PageServerLoad } from './$types';

type RawSubmission = {
	user_id: string;
	weekend_id: number;
	pole_driver_id: number;
	p1_driver_id: number;
	p2_driver_id: number;
	p3_driver_id: number;
	p10_driver_id: number;
	dotd_driver_id: number;
	bold_prediction: string | null;
	team_id: number;
	submitted_at: string;
	updated_at: string;
	sprint_pole_driver_id: number | null;
	sprint_p1_driver_id: number | null;
};
type RawDriver = {
	id: number;
	code: string;
	name: string;
	category: 'permanent' | 'reserve';
};
type RawTeam = {
	id: number;
	name: string;
	color: string;
	image_key: string;
	oshi_mark: string;
};
type RawUser = {
	discord_id: string;
	discord_name: string;
	custom_name: string | null;
};

export const load = (async ({ locals }) => {
	const { db } = locals;
	if (!db) error(500, 'Database not available');
	const [rawSubmissions, rawDrivers, rawTeams, rawUsers] = await typedBatch<
		[RawSubmission, RawDriver, RawTeam, RawUser]
	>(db, [
		db.prepare(
			`select "user_id","weekend_id","pole_driver_id","p1_driver_id","p2_driver_id","p3_driver_id","p10_driver_id","dotd_driver_id","bold_prediction","team_id","submitted_at","updated_at","sprint_pole_driver_id","sprint_p1_driver_id" from submissions where weekend_id = 1;`
		),
		db.prepare(`select "id","code","name","category" from drivers;`),
		db.prepare(`select "id","name","color","image_key","oshi_mark" from teams;`),
		db.prepare(`select "discord_id","discord_name","custom_name" from users;`)
	]);

	if (!rawSubmissions.success || !rawDrivers.success || !rawTeams.success || !rawUsers.success)
		error(500, 'Unable to pull data');

	const weekend = {
		id: 1,
		season: 4,
		slug: 'australia',
		name: 'Australian GP',
		lockTime: '2026-03-07 05:00:00',
		isSprint: false,
		scored: false,
		watchalongHost: 'KFP'
	} as const;

	return {
		weekend,
		submissions: rawSubmissions.results.map((row) => {
			const user = rawUsers.results.find(({ discord_id }) => discord_id === row.user_id)!;
			const username = user.custom_name ?? user.discord_name;

			return {
				username,
				pole: row.pole_driver_id,
				p1: row.p1_driver_id,
				p2: row.p2_driver_id,
				p3: row.p3_driver_id,
				p10: row.p10_driver_id,
				dotd: row.dotd_driver_id,
				boldPrediction: row.bold_prediction
					? {
							text: row.bold_prediction,
							score: null
						}
					: null,
				team: row.team_id,
				updatedAt: row.updated_at
			};
		}),
		drivers: rawDrivers.results,
		teams: rawTeams.results
	};
}) satisfies PageServerLoad;
