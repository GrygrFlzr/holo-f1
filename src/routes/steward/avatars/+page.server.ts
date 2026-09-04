import { error, fail } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { backfillDiscordAvatarSnapshots } from '$lib/server/avatar-backfill';
import {
	getAvatarSnapshotBackfillCandidates,
	getAvatarSnapshotBackfillStatus,
	linkAvatarSnapshotIfCurrent
} from '$lib/server/db/avatar-snapshot-backfill';
import type { Actions, PageServerLoad } from './$types';

const BACKFILL_BATCH_SIZE = 10;

export const load = (async ({ locals }) => {
	const db = locals.db;

	if (!db) {
		error(500, 'Database not available.');
	}

	await requireRole(locals, 'admin');

	return {
		status: await getAvatarSnapshotBackfillStatus(db),
		batchSize: BACKFILL_BATCH_SIZE
	};
}) satisfies PageServerLoad;

export const actions = {
	backfill: async ({ locals, platform, request }) => {
		const db = locals.db;

		if (!db) {
			error(500, 'Database not available.');
		}

		await requireRole(locals, 'admin');

		const bucket = platform?.env.AVATAR_BUCKET;

		if (!bucket) {
			return fail(503, {
				message: 'Avatar snapshot bucket is not available.',
				result: null
			});
		}

		const formData = await request.formData();
		const rawAfterDiscordId = formData.get('after_discord_id');

		if (rawAfterDiscordId !== null && typeof rawAfterDiscordId !== 'string') {
			return fail(400, {
				message: 'Backfill cursor is invalid.',
				result: null
			});
		}

		const afterDiscordId =
			rawAfterDiscordId === null || rawAfterDiscordId === '' ? null : rawAfterDiscordId;

		if (afterDiscordId !== null && !/^\d{1,20}$/.test(afterDiscordId)) {
			return fail(400, {
				message: 'Backfill cursor is invalid.',
				result: null
			});
		}

		let candidates = await getAvatarSnapshotBackfillCandidates(
			db,
			BACKFILL_BATCH_SIZE,
			afterDiscordId
		);

		if (candidates.length === 0 && afterDiscordId !== null) {
			candidates = await getAvatarSnapshotBackfillCandidates(db, BACKFILL_BATCH_SIZE, null);
		}

		const result = await backfillDiscordAvatarSnapshots({
			bucket,
			candidates,
			linkSnapshot: (candidate, sha256) => linkAvatarSnapshotIfCurrent(db, candidate, sha256),
			onError: (candidate, cause) => {
				console.error('Failed to backfill Discord avatar snapshot.', {
					discordId: candidate.discordId,
					cause
				});
			}
		});

		return {
			message: null,
			result: {
				...result,
				nextAfterDiscordId: candidates.at(-1)?.discordId ?? null
			}
		};
	}
} satisfies Actions;
