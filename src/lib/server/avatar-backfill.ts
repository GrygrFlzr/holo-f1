import {
	captureDiscordAvatarSnapshot,
	type AvatarSnapshotBucket
} from '$lib/server/avatar-snapshots';

export interface AvatarSnapshotBackfillCandidate {
	discordId: string;
	avatarHash: string;
}

export interface AvatarSnapshotBackfillResult {
	attempted: number;
	linked: number;
	skipped: number;
	failed: number;
}

export type CaptureAvatarSnapshot = typeof captureDiscordAvatarSnapshot;

interface AvatarSnapshotBackfillOptions {
	bucket: AvatarSnapshotBucket;
	candidates: readonly AvatarSnapshotBackfillCandidate[];
	linkSnapshot: (candidate: AvatarSnapshotBackfillCandidate, sha256: string) => Promise<boolean>;
	captureSnapshot?: CaptureAvatarSnapshot;
	onError?: (candidate: AvatarSnapshotBackfillCandidate, error: unknown) => void;
}

export async function backfillDiscordAvatarSnapshots(
	options: AvatarSnapshotBackfillOptions
): Promise<AvatarSnapshotBackfillResult> {
	const captureSnapshot = options.captureSnapshot ?? captureDiscordAvatarSnapshot;

	let linked = 0;
	let skipped = 0;
	let failed = 0;

	for (const candidate of options.candidates) {
		try {
			const snapshot = await captureSnapshot({
				bucket: options.bucket,
				discordId: candidate.discordId,
				avatarHash: candidate.avatarHash
			});

			const wasLinked = await options.linkSnapshot(candidate, snapshot.sha256);

			if (wasLinked) {
				linked += 1;
			} else {
				skipped += 1;
			}
		} catch (error) {
			failed += 1;
			options.onError?.(candidate, error);
		}
	}

	return {
		attempted: options.candidates.length,
		linked,
		skipped,
		failed
	};
}
