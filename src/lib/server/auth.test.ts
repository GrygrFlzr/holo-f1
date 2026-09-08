import { describe, expect, it } from 'vitest';
import {
	createSessionCookie,
	resolveLegacySessionUserV1,
	resolveLegacySessionUserV2,
	resolvePublicIdSessionUser,
	SESSION_SCHEMA_VERSION,
	verifySessionCookie
} from './auth';
import type { VerifiedSessionUserV1, VerifiedSessionUserV2, VerifiedSessionUserV3 } from './auth';
import type { D1Queryable } from './db/types';

const encoder = new TextEncoder();

const TODO_TEST_SECRET = 'TODO_TEST_ONLY_SESSION_SECRET';
const TODO_TEST_DIGEST = '0123456789abcdef'.repeat(4);
const TODO_TEST_OTHER_DIGEST = 'fedcba9876543210'.repeat(4);
const TODO_TEST_PUBLIC_ID = '00000000-0000-4000-8000-000000000000';

const TODO_TEST_VERSION_1_USER: VerifiedSessionUserV1 = {
	discord_id: 'TODO_TEST_DISCORD_ID',
	display_name: 'TODO_TEST_DISPLAY_NAME',
	avatar_hash: 'TODO_TEST_AVATAR_HASH',
	role: 'user'
};

const TODO_TEST_VERSION_2_USER: VerifiedSessionUserV2 = {
	discord_id: 'TODO_TEST_DISCORD_ID',
	display_name: 'TODO_TEST_DISPLAY_NAME',
	avatar_hash: 'TODO_TEST_AVATAR_HASH',
	avatar_snapshot_sha256: TODO_TEST_DIGEST,
	role: 'steward'
};

const TODO_TEST_VERSION_3_USER: VerifiedSessionUserV3 = {
	public_id: TODO_TEST_PUBLIC_ID,
	display_name: 'TODO_TEST_DISPLAY_NAME',
	avatar_hash: 'TODO_TEST_AVATAR_HASH',
	avatar_snapshot_sha256: TODO_TEST_DIGEST,
	role: 'user'
};

function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replaceAll(/\+/g, '-')
		.replaceAll(/\//g, '_')
		.replaceAll(/=/g, '');
}

async function signPayload(payload: unknown, secret = TODO_TEST_SECRET): Promise<string> {
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

interface StatementRecord {
	sql: string;
	bindings: unknown[];
}

function createDatabase(row: Record<string, unknown> | null): {
	db: D1Queryable;
	statement: StatementRecord;
} {
	const record: StatementRecord = {
		sql: '',
		bindings: []
	};

	const statement = {
		bind(...bindings: unknown[]) {
			record.bindings = bindings;
			return statement;
		},

		async first() {
			return row;
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
	it('creates and verifies a version 3 session', async () => {
		expect(SESSION_SCHEMA_VERSION).toBe(3);

		const expiresAt = futureExpiration();
		const cookie = await createSessionCookie(
			{
				public_id: TODO_TEST_PUBLIC_ID,
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TODO_TEST_DIGEST,
				role: 'user'
			},
			TODO_TEST_SECRET,
			expiresAt
		);

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toEqual({
			schemaVersion: 3,
			expiresAt,
			user: {
				public_id: TODO_TEST_PUBLIC_ID,
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TODO_TEST_DIGEST,
				role: 'user'
			}
		});
	});

	it('preserves an explicit null snapshot in version 3', async () => {
		const expiresAt = futureExpiration();
		const cookie = await createSessionCookie(
			{
				public_id: TODO_TEST_PUBLIC_ID,
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: null,
				avatar_snapshot_sha256: null,
				role: 'steward'
			},
			TODO_TEST_SECRET,
			expiresAt
		);

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toEqual({
			schemaVersion: 3,
			expiresAt,
			user: {
				public_id: TODO_TEST_PUBLIC_ID,
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: null,
				avatar_snapshot_sha256: null,
				role: 'steward'
			}
		});
	});

	it('rejects an invalid public ID when creating a session', async () => {
		await expect(
			createSessionCookie(
				{
					public_id: 'TODO_INVALID_PUBLIC_ID',
					display_name: 'TODO_TEST_DISPLAY_NAME',
					avatar_hash: null,
					avatar_snapshot_sha256: null,
					role: 'user'
				},
				TODO_TEST_SECRET,
				futureExpiration()
			)
		).rejects.toThrow('Public ID must be a canonical lowercase UUIDv4.');
	});

	it('rejects an invalid snapshot when creating a session', async () => {
		await expect(
			createSessionCookie(
				{
					public_id: TODO_TEST_PUBLIC_ID,
					display_name: 'TODO_TEST_DISPLAY_NAME',
					avatar_hash: null,
					avatar_snapshot_sha256: 'TODO_INVALID_DIGEST',
					role: 'user'
				},
				TODO_TEST_SECRET,
				futureExpiration()
			)
		).rejects.toThrow('Avatar snapshot digest must be 64-character lowercase hexadecimal text.');
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

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toEqual({
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

	it('recognizes a version 2 payload', async () => {
		const expiresAt = futureExpiration();
		const cookie = await signPayload({
			sv: 2,
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: 'TODO_TEST_AVATAR_HASH',
			avatar_snapshot_sha256: TODO_TEST_DIGEST,
			role: 'admin',
			exp: expiresAt
		});

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toEqual({
			schemaVersion: 2,
			expiresAt,
			user: {
				discord_id: 'TODO_TEST_DISCORD_ID',
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TODO_TEST_DIGEST,
				role: 'admin'
			}
		});
	});

	it('preserves an explicit null snapshot in version 2', async () => {
		const expiresAt = futureExpiration();
		const cookie = await signPayload({
			sv: 2,
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: null,
			role: 'steward',
			exp: expiresAt
		});

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toEqual({
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

	it('rejects version 2 without a snapshot field', async () => {
		const cookie = await signPayload({
			sv: 2,
			sub: 'TODO_TEST_DISCORD_ID',
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			role: 'user',
			exp: futureExpiration()
		});

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toBeNull();
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

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toBeNull();
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

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toBeNull();
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

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toBeNull();
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

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toBeNull();
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

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toBeNull();
	});

	it('rejects an expired session', async () => {
		const cookie = await signPayload({
			sv: 3,
			sub: TODO_TEST_PUBLIC_ID,
			name: 'TODO_TEST_DISPLAY_NAME',
			avatar: null,
			avatar_snapshot_sha256: null,
			role: 'user',
			exp: Math.floor(Date.now() / 1_000) - 1
		});

		await expect(verifySessionCookie(cookie, TODO_TEST_SECRET)).resolves.toBeNull();
	});
});

describe('version 1 session user resolution', () => {
	it('resolves the public ID and obtains the snapshot from the database', async () => {
		const { db, statement } = createDatabase({
			public_id: TODO_TEST_PUBLIC_ID,
			avatar_snapshot_sha256: TODO_TEST_OTHER_DIGEST
		});

		await expect(resolveLegacySessionUserV1(db, TODO_TEST_VERSION_1_USER)).resolves.toEqual({
			public_id: TODO_TEST_PUBLIC_ID,
			user: {
				discord_id: 'TODO_TEST_DISCORD_ID',
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TODO_TEST_OTHER_DIGEST,
				role: 'user'
			}
		});

		expect(statement.sql).toContain('select public_id, avatar_snapshot_sha256');
		expect(statement.sql).toContain('where discord_id = ?');
		expect(statement.bindings).toEqual(['TODO_TEST_DISCORD_ID']);
	});

	it('preserves a null snapshot obtained from the database', async () => {
		const { db } = createDatabase({
			public_id: TODO_TEST_PUBLIC_ID,
			avatar_snapshot_sha256: null
		});

		await expect(resolveLegacySessionUserV1(db, TODO_TEST_VERSION_1_USER)).resolves.toEqual({
			public_id: TODO_TEST_PUBLIC_ID,
			user: {
				discord_id: 'TODO_TEST_DISCORD_ID',
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: null,
				role: 'user'
			}
		});
	});

	it('returns null when the user does not exist', async () => {
		const { db } = createDatabase(null);

		await expect(resolveLegacySessionUserV1(db, TODO_TEST_VERSION_1_USER)).resolves.toBeNull();
	});

	it('returns null when the database public ID is invalid', async () => {
		const { db } = createDatabase({
			public_id: 'TODO_INVALID_PUBLIC_ID',
			avatar_snapshot_sha256: null
		});

		await expect(resolveLegacySessionUserV1(db, TODO_TEST_VERSION_1_USER)).resolves.toBeNull();
	});

	it('returns null when the database snapshot is invalid', async () => {
		const { db } = createDatabase({
			public_id: TODO_TEST_PUBLIC_ID,
			avatar_snapshot_sha256: 'TODO_INVALID_DIGEST'
		});

		await expect(resolveLegacySessionUserV1(db, TODO_TEST_VERSION_1_USER)).resolves.toBeNull();
	});
});

describe('version 2 session user resolution', () => {
	it('resolves the public ID and preserves the signed snapshot', async () => {
		const { db, statement } = createDatabase({
			public_id: TODO_TEST_PUBLIC_ID
		});

		await expect(resolveLegacySessionUserV2(db, TODO_TEST_VERSION_2_USER)).resolves.toEqual({
			public_id: TODO_TEST_PUBLIC_ID,
			user: {
				discord_id: 'TODO_TEST_DISCORD_ID',
				display_name: 'TODO_TEST_DISPLAY_NAME',
				avatar_hash: 'TODO_TEST_AVATAR_HASH',
				avatar_snapshot_sha256: TODO_TEST_DIGEST,
				role: 'steward'
			}
		});

		expect(statement.sql).toContain('select public_id');
		expect(statement.sql).not.toContain('avatar_snapshot_sha256');
		expect(statement.sql).toContain('where discord_id = ?');
		expect(statement.bindings).toEqual(['TODO_TEST_DISCORD_ID']);
	});

	it('returns null when the user does not exist', async () => {
		const { db } = createDatabase(null);

		await expect(resolveLegacySessionUserV2(db, TODO_TEST_VERSION_2_USER)).resolves.toBeNull();
	});

	it('returns null when the database public ID is invalid', async () => {
		const { db } = createDatabase({
			public_id: 'TODO_INVALID_PUBLIC_ID'
		});

		await expect(resolveLegacySessionUserV2(db, TODO_TEST_VERSION_2_USER)).resolves.toBeNull();
	});
});

describe('version 3 session user resolution', () => {
	it('resolves a public ID to the private Discord ID', async () => {
		const { db, statement } = createDatabase({
			discord_id: 'TODO_TEST_DISCORD_ID'
		});

		await expect(resolvePublicIdSessionUser(db, TODO_TEST_VERSION_3_USER)).resolves.toEqual({
			discord_id: 'TODO_TEST_DISCORD_ID',
			display_name: 'TODO_TEST_DISPLAY_NAME',
			avatar_hash: 'TODO_TEST_AVATAR_HASH',
			avatar_snapshot_sha256: TODO_TEST_DIGEST,
			role: 'user'
		});

		expect(statement.sql).toContain('where public_id = ?');
		expect(statement.bindings).toEqual([TODO_TEST_PUBLIC_ID]);
	});

	it('returns null when the public ID has no user', async () => {
		const { db } = createDatabase(null);

		await expect(resolvePublicIdSessionUser(db, TODO_TEST_VERSION_3_USER)).resolves.toBeNull();
	});
});
