import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { createPublicId } from '$lib/server/public-id';
import type { Actions, PageServerLoad } from './$types';

const BACKFILL_BATCH_SIZE = 25;

type Database = NonNullable<App.Locals['db']>;

type MissingPublicId = {
	discord_id: string;
};

type MissingCount = {
	remaining: number;
};

function getDatabase(locals: App.Locals): Database {
	const db = locals.db;

	if (!db) {
		error(500, 'Database not available');
	}

	return db;
}

async function countMissingPublicIds(db: Database): Promise<number> {
	const row = await db
		.prepare(
			`
			select count(*) as remaining
			from users
			where public_id is null
		`
		)
		.first<MissingCount>();

	if (!row) {
		error(500, 'Public ID count unavailable');
	}

	return row.remaining;
}

export const load = (async ({ locals }) => {
	await requireRole(locals, 'admin');

	return {
		remaining: await countMissingPublicIds(getDatabase(locals))
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ locals }) => {
		await requireRole(locals, 'admin');

		const db = getDatabase(locals);
		const candidates = await db
			.prepare(
				`
				select discord_id
				from users
				where public_id is null
				order by created_at, discord_id
				limit ?
			`
			)
			.bind(BACKFILL_BATCH_SIZE)
			.all<MissingPublicId>();

		let assigned = 0;

		for (const candidate of candidates.results) {
			const result = await db
				.prepare(
					`
					update users
					set public_id = ?
					where discord_id = ?
						and public_id is null
				`
				)
				.bind(createPublicId(), candidate.discord_id)
				.run();

			assigned += result.meta.changes;
		}

		return { assigned };
	}
} satisfies Actions;
