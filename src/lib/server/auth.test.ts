import { describe, expect, it } from 'vitest';
import { createSessionCookie, SESSION_SCHEMA_VERSION, verifySessionCookie } from './auth';

const encoder = new TextEncoder();

const TEST_SECRET = 'TODO_TEST_ONLY_SESSION_SECRET';
const TEST_DIGEST = '0123456789abcdef'.repeat(4);

function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replaceAll(/\+/g, '-')
		.replaceAll(/\//g, '_')
		.replaceAll(/=/g, '');
}

async function signPayload(payload: unknown, secret = TEST_SECRET): Promise<string> {
	const data = encoder.encode(JSON.stringify(payload));
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{
			name: 'HMAC',
			hash: 'SHA-256'
		},
		false,
		['sign']
	);
	const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));

	return toBase64Url(data) + '.' + toBase64Url(signature);
}

function futureExpiration(): number {
	return Math.floor(Date.now() / 1_000) + 3_600;
}

describe('session cookies', () => {
	it('creates and verifies a version 2 session', async () => {
		const expiresAt = futureExpiration();
		const cookie = await createSessionCookie(
			{
				sub: 'TODO_TEST_DISCORD_ID',
				name: 'TODO_TEST_DISPLAY_NAME',
				avatar: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TEST_DIGEST,
				role: 'user'
			},
			TEST_SECRET,
			expiresAt
		);

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toEqual({
			schemaVersion: SESSION_SCHEMA_VERSION,
			expiresAt,
			user: {
				discord_id: 'TODO_TEST_DISCORD_ID',
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TEST_DIGEST,
				role: 'user'
			}
		});
	});

	it('preserves an explicit null snapshot in version 2', async () => {
		const expiresAt = futureExpiration();
		const cookie = await createSessionCookie(
			{
				sub: 'TODO_TEST_DISCORD_ID',
				name: 'TODO_TEST_DISPLAY_NAME',
				avatar: null,
				avatar_snapshot_sha256: null,
				role: 'steward'
			},
			TEST_SECRET,
			expiresAt
		);

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toEqual({
			schemaVersion: 2,
			expiresAt,
			user: {
				discord_id: 'TODO_TEST_DISCORD_ID',
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: null,
				avatar_snapshot_sha256: null,
				role: 'steward'
			}
		});
	});

	it('recognizes an unversioned payload as version 1', async () => {
		const expiresAt = futureExpiration();
		const cookie = await signPayload({
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: 'TODO_TEST_AVATAR_HASH',
			role: 'user',
			exp: expiresAt
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toEqual({
			schemaVersion: 1,
			expiresAt,
			user: {
				discord_id: 'TODO_TEST_DISCORD_ID',
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: null,
				role: 'user'
			}
		});
	});

	it('rejects version 2 without a snapshot field', async () => {
		const cookie = await signPayload({
			sv: 2,
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			role: 'user',
			exp: futureExpiration()
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toBeNull();
	});

	it('rejects an unsupported schema version', async () => {
		const cookie = await signPayload({
			sv: 3,
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: null,
			role: 'user',
			exp: futureExpiration()
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toBeNull();
	});

	it('rejects an invalid snapshot digest', async () => {
		const cookie = await signPayload({
			sv: 2,
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: 'TODO_INVALID_DIGEST',
			role: 'user',
			exp: futureExpiration()
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toBeNull();
	});

	it('rejects an expired session', async () => {
		const cookie = await signPayload({
			sv: 2,
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: null,
			role: 'user',
			exp: Math.floor(Date.now() / 1_000) - 1
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toBeNull();
	});
});
