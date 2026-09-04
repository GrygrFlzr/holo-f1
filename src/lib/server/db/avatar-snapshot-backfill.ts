import type { AvatarSnapshotBackfillCandidate } from '$lib/server/avatar-backfill';
import type { D1Queryable } from '$lib/server/db/types';

export interface AvatarSnapshotBackfillStatus {
	customAvatars: number;
	linkedSnapshots: number;
	pendingSnapshots: number;
}

interface AvatarSnapshotBackfillStatusRow {
	custom_avatars: number;
	linked_snapshots: number;
	pending_snapshots: number;
}

interface AvatarSnapshotBackfillCandidateRow {
	discord_id: string;
	avatar_hash: string;
}

export async function getAvatarSnapshotBackfillStatus(
	db: D1Queryable
): Promise<AvatarSnapshotBackfillStatus> {
	const row = await db
		.prepare(
			`
			select
				count(
					case
						when avatar_hash is not null
						then 1
					end
				) as custom_avatars,
				count(
					case
						when
							avatar_hash is not null
							and avatar_snapshot_sha256 is not null
						then 1
					end
				) as linked_snapshots,
				count(
					case
						when
							avatar_hash is not null
							and avatar_snapshot_sha256 is null
						then 1
					end
				) as pending_snapshots
			from users
			`
		)
		.first<AvatarSnapshotBackfillStatusRow>();

	return {
		customAvatars: row?.custom_avatars ?? 0,
		linkedSnapshots: row?.linked_snapshots ?? 0,
		pendingSnapshots: row?.pending_snapshots ?? 0
	};
}

export async function getAvatarSnapshotBackfillCandidates(
	db: D1Queryable,
	limit: number,
	afterDiscordId: string | null
): Promise<AvatarSnapshotBackfillCandidate[]> {
	if (!Number.isSafeInteger(limit) || limit < 1) {
		throw new RangeError('Avatar snapshot backfill limit must be a positive safe integer.');
	}

	const { results } = await db
		.prepare(
			`
			select
				discord_id,
				avatar_hash
			from users
			where
				avatar_hash is not null
				and avatar_snapshot_sha256 is null
				and (
					?2 is null
					or length(discord_id) > length(?2)
					or (
						length(discord_id) = length(?2)
						and discord_id > ?2
					)
				)
			order by
				length(discord_id) asc,
				discord_id asc
			limit ?1
			`
		)
		.bind(limit, afterDiscordId)
		.all<AvatarSnapshotBackfillCandidateRow>();

	return results.map((row) => ({
		discordId: row.discord_id,
		avatarHash: row.avatar_hash
	}));
}

export async function linkAvatarSnapshotIfCurrent(
	db: D1Queryable,
	candidate: AvatarSnapshotBackfillCandidate,
	sha256: string
): Promise<boolean> {
	const result = await db
		.prepare(
			`
			update users
			set avatar_snapshot_sha256 = ?1
			where
				discord_id = ?2
				and avatar_hash = ?3
				and avatar_snapshot_sha256 is null
			`
		)
		.bind(sha256, candidate.discordId, candidate.avatarHash)
		.run();

	return result.meta.changes === 1;
}
