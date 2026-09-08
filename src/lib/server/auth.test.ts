import { describe, expect, it } from 'vitest';
import {
	createSessionCookie,
	resolvePublicIdSessionUser,
	SESSION_SCHEMA_VERSION,
	verifySessionCookie
} from './auth';
import type { VerifiedSessionUserV3 } from './auth';
import type { D1Queryable } from './db/types';

const encoder = new TextEncoder();

const TEST_SECRET = 'TODO_TEST_ONLY_SESSION_SECRET';
const TEST_DIGEST = '0123456789abcdef'.repeat(4);
const TODO_TEST_PUBLIC_ID = '00000000-0000-4000-8000-000000000000';

const TODO_TEST_VERSION_3_USER: VerifiedSessionUserV3 = {
	public_id: TODO_TEST_PUBLIC_ID,
	display_name: 'TODO_TEST_DISPLAY_NAME',
	avatar_hash: 'TODO_TEST_AVATAR_HASH',
	avatar_snapshot_sha256: TEST_DIGEST,
	role: 'user'
};

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
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));

	return toBase64Url(data) + '.' + toBase64Url(signature);
}

function futureExpiration(): number {
	return Math.floor(Date.now() / 1_000) + 3_600;
}

interface PublicIdStatementRecord {
	sql: string;
	bindings: unknown[];
}

function createPublicIdDatabase(discordId: string | null): {
	db: D1Queryable;
	statement: PublicIdStatementRecord;
} {
	const record: PublicIdStatementRecord = {
		sql: '',
		bindings: []
	};

	const statement = {
		bind(...bindings: unknown[]) {
			record.bindings = bindings;
			return statement;
		},

		async first() {
			return discordId === null
				? null
				: {
						discord_id: discordId
					};
		}
	};

	const db = {
		prepare(sql: string) {
			record.sql = sql.replaceAll(/\s+/g, ' ').trim();
			return statement;
		},

		batch() {
			throw new Error('TODO_TEST_UNEXPECTED_BATCH');
		}
	} as unknown as D1Queryable;

	return {
		db,
		statement: record
	};
}

describe('session cookies', () => {
	it('creates and verifies a version 2 session', async () => {
		expect(SESSION_SCHEMA_VERSION).toBe(2);

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
			schemaVersion: 2,
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

	it('recognizes a version 3 payload', async () => {
		const expiresAt = futureExpiration();
		const cookie = await signPayload({
			sv: 3,
			sub: TODO_TEST_PUBLIC_ID,
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: 'TODO_TEST_AVATAR_HASH',
			avatar_snapshot_sha256: TEST_DIGEST,
			role: 'admin',
			exp: expiresAt
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toEqual({
			schemaVersion: 3,
			expiresAt,
			user: {
				public_id: TODO_TEST_PUBLIC_ID,
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TEST_DIGEST,
				role: 'admin'
			}
		});
	});

	it('preserves an explicit null snapshot in version 3', async () => {
		const expiresAt = futureExpiration();
		const cookie = await signPayload({
			sv: 3,
			sub: TODO_TEST_PUBLIC_ID,
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: null,
			role: 'user',
			exp: expiresAt
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toEqual({
			schemaVersion: 3,
			expiresAt,
			user: {
				public_id: TODO_TEST_PUBLIC_ID,
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: null,
				avatar_snapshot_sha256: null,
				role: 'user'
			}
		});
	});

	it('rejects version 3 without a snapshot field', async () => {
		const cookie = await signPayload({
			sv: 3,
			sub: TODO_TEST_PUBLIC_ID,
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			role: 'user',
			exp: futureExpiration()
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toBeNull();
	});

	it.each([
		['non-UUID text', 'TODO_INVALID_PUBLIC_ID'],
		['uppercase hexadecimal', '00000000-0000-4000-8000-00000000000A'],
		['a different UUID version', '00000000-0000-3000-8000-000000000000'],
		['a different UUID variant', '00000000-0000-4000-7000-000000000000'],
		['missing separators', '00000000000040008000000000000000']
	])('rejects version 3 with %s', async (_description, sub) => {
		const cookie = await signPayload({
			sv: 3,
			sub,
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: null,
			role: 'user',
			exp: futureExpiration()
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toBeNull();
	});

	it('rejects an unsupported schema version', async () => {
		const cookie = await signPayload({
			sv: 4,
			sub: TODO_TEST_PUBLIC_ID,
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: null,
			role: 'user',
			exp: futureExpiration()
		});

		await expect(verifySessionCookie(cookie, TEST_SECRET)).resolves.toBeNull();
	});

	it('rejects an invalid version 2 snapshot digest', async () => {
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

	it('rejects an invalid version 3 snapshot digest', async () => {
		const cookie = await signPayload({
			sv: 3,
			sub: TODO_TEST_PUBLIC_ID,
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

describe('version 3 session user resolution', () => {
	it('resolves a public ID to the private Discord ID', async () => {
		const { db, statement } = createPublicIdDatabase('TODO_TEST_DISCORD_ID');

		await expect(resolvePublicIdSessionUser(db, TODO_TEST_VERSION_3_USER)).resolves.toEqual({
			discord_id: 'TODO_TEST_DISCORD_ID',
			display_name: 'TODO_TEST_DISPLAY_NAME',
			avatar_hash: 'TODO_TEST_AVATAR_HASH',
			avatar_snapshot_sha256: TEST_DIGEST,
			role: 'user'
		});

		expect(statement.sql).toContain('where public_id = ?');
		expect(statement.bindings).toEqual([TODO_TEST_PUBLIC_ID]);
	});

	it('returns null when the public ID has no user', async () => {
		const { db } = createPublicIdDatabase(null);

		await expect(resolvePublicIdSessionUser(db, TODO_TEST_VERSION_3_USER)).resolves.toBeNull();
	});
});
