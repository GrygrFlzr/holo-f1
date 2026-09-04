import { describe, expect, it, vi } from 'vitest';
import {
	backfillDiscordAvatarSnapshots,
	type AvatarSnapshotBackfillCandidate,
	type CaptureAvatarSnapshot
} from './avatar-backfill';
import type { AvatarSnapshotBucket, AvatarSnapshotStorageResult } from './avatar-snapshots';

const TEST_DIGEST = '0123456789abcdef'.repeat(4);

const bucket: AvatarSnapshotBucket = {
	put: async () => null
};

function createSnapshot(sha256 = TEST_DIGEST): AvatarSnapshotStorageResult {
	return {
		sha256,
		sourceKey: 'TEST_SOURCE_KEY',
		variantKey: 'TEST_VARIANT_KEY',
		sourceWasCreated: true,
		variantWasCreated: true
	};
}

const candidates: AvatarSnapshotBackfillCandidate[] = [
	{
		discordId: 'TEST_DISCORD_ID_1',
		avatarHash: 'TEST_AVATAR_HASH_1'
	},
	{
		discordId: 'TEST_DISCORD_ID_2',
		avatarHash: 'TEST_AVATAR_HASH_2'
	}
];

describe('backfillDiscordAvatarSnapshots', () => {
	it('captures and links every candidate', async () => {
		const captureSnapshot = vi.fn<CaptureAvatarSnapshot>(async () => createSnapshot());
		const linkSnapshot = vi.fn(async () => true);

		const result = await backfillDiscordAvatarSnapshots({
			bucket,
			candidates,
			captureSnapshot,
			linkSnapshot
		});

		expect(result).toEqual({
			attempted: 2,
			linked: 2,
			skipped: 0,
			failed: 0
		});

		expect(captureSnapshot).toHaveBeenNthCalledWith(1, {
			bucket,
			discordId: 'TEST_DISCORD_ID_1',
			avatarHash: 'TEST_AVATAR_HASH_1'
		});
		expect(captureSnapshot).toHaveBeenNthCalledWith(2, {
			bucket,
			discordId: 'TEST_DISCORD_ID_2',
			avatarHash: 'TEST_AVATAR_HASH_2'
		});

		expect(linkSnapshot).toHaveBeenCalledTimes(2);
		expect(linkSnapshot).toHaveBeenNthCalledWith(1, candidates[0], TEST_DIGEST);
		expect(linkSnapshot).toHaveBeenNthCalledWith(2, candidates[1], TEST_DIGEST);
	});

	it('continues after one candidate fails', async () => {
		const captureError = new Error('TEST_CAPTURE_FAILURE');
		const captureSnapshot = vi.fn<CaptureAvatarSnapshot>(async ({ discordId }) => {
			if (discordId === 'TEST_DISCORD_ID_1') {
				throw captureError;
			}

			return createSnapshot();
		});
		const linkSnapshot = vi.fn(async () => true);
		const onError = vi.fn();

		const result = await backfillDiscordAvatarSnapshots({
			bucket,
			candidates,
			captureSnapshot,
			linkSnapshot,
			onError
		});

		expect(result).toEqual({
			attempted: 2,
			linked: 1,
			skipped: 0,
			failed: 1
		});

		expect(captureSnapshot).toHaveBeenCalledTimes(2);
		expect(linkSnapshot).toHaveBeenCalledTimes(1);
		expect(linkSnapshot).toHaveBeenCalledWith(candidates[1], TEST_DIGEST);
		expect(onError).toHaveBeenCalledWith(candidates[0], captureError);
	});

	it('skips a candidate that no longer matches its database row', async () => {
		const captureSnapshot = vi.fn<CaptureAvatarSnapshot>(async () => createSnapshot());
		const linkSnapshot = vi.fn(async () => false);

		const result = await backfillDiscordAvatarSnapshots({
			bucket,
			candidates: [candidates[0]],
			captureSnapshot,
			linkSnapshot
		});

		expect(result).toEqual({
			attempted: 1,
			linked: 0,
			skipped: 1,
			failed: 0
		});
	});

	it('does not capture anything for an empty batch', async () => {
		const captureSnapshot = vi.fn<CaptureAvatarSnapshot>(async () => createSnapshot());
		const linkSnapshot = vi.fn(async () => true);

		const result = await backfillDiscordAvatarSnapshots({
			bucket,
			candidates: [],
			captureSnapshot,
			linkSnapshot
		});

		expect(result).toEqual({
			attempted: 0,
			linked: 0,
			skipped: 0,
			failed: 0
		});

		expect(captureSnapshot).not.toHaveBeenCalled();
		expect(linkSnapshot).not.toHaveBeenCalled();
	});
});
