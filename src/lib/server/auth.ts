import { error } from '@sveltejs/kit';
import { isAvatarSnapshotSha256 } from '$lib/server/avatar-snapshots';
import { isPublicId } from '$lib/server/public-id';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const ROLE_LEVEL: Record<string, number> = {
	user: 0,
	steward: 1,
	admin: 2
} as const;

export const SESSION_COOKIE = 'session' as const;
export const SESSION_SCHEMA_VERSION = 2 as const;
const PUBLIC_ID_SESSION_SCHEMA_VERSION = 3 as const;
export const SESSION_MAX_AGE_SECONDS = 2_592_000 as const;

export type SessionRole = 'user' | 'steward' | 'admin';

interface SessionPayloadFields {
	sub: string;
	name: string;
	avatar: string | null;
	role: SessionRole;
	exp: number;
}

type SessionPayloadV1 = SessionPayloadFields;

interface SessionPayloadV2 extends SessionPayloadFields {
	sv: typeof SESSION_SCHEMA_VERSION;
	avatar_snapshot_sha256: string | null;
}

interface SessionPayloadV3 extends SessionPayloadFields {
	sv: typeof PUBLIC_ID_SESSION_SCHEMA_VERSION;
	avatar_snapshot_sha256: string | null;
}

export interface SessionCookieUserV2 {
	sub: string;
	name: string;
	avatar: string | null;
	avatar_snapshot_sha256: string | null;
	role: SessionRole;
}

export interface VerifiedSessionUserV1 {
	discord_id: string;
	display_name: string;
	avatar_hash: string | null;
	role: SessionRole;
}

export interface VerifiedSessionUserV2 {
	discord_id: string;
	display_name: string;
	avatar_hash: string | null;
	avatar_snapshot_sha256: string | null;
	role: SessionRole;
}

export interface VerifiedSessionUserV3 {
	public_id: string;
	display_name: string;
	avatar_hash: string | null;
	avatar_snapshot_sha256: string | null;
	role: SessionRole;
}

type AuthenticatedUser = NonNullable<App.Locals['user']>;

export type VerifiedSession =
	| {
			schemaVersion: 1;
			expiresAt: number;
			user: VerifiedSessionUserV1;
	  }
	| {
			schemaVersion: 2;
			expiresAt: number;
			user: VerifiedSessionUserV2;
	  }
	| {
			schemaVersion: 3;
			expiresAt: number;
			user: VerifiedSessionUserV3;
	  };

type DecodedSessionPayload =
	| {
			schemaVersion: 1;
			payload: SessionPayloadV1;
	  }
	| {
			schemaVersion: 2;
			payload: SessionPayloadV2;
	  }
	| {
			schemaVersion: 3;
			payload: SessionPayloadV3;
	  };

/**
 * Re-derived per session.
 */
async function getKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{
			name: 'HMAC',
			hash: 'SHA-256'
		},
		false,
		['sign', 'verify']
	);
}

function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replaceAll(/\+/g, '-')
		.replaceAll(/\//g, '_')
		.replaceAll(/=/g, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
	const normalized = value.replaceAll(/-/g, '+').replaceAll(/_/g, '/');
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(new ArrayBuffer(binary.length));

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSessionRole(value: unknown): value is SessionRole {
	return value === 'user' || value === 'steward' || value === 'admin';
}

function hasSessionPayloadFields(
	value: Record<string, unknown>
): value is Record<string, unknown> & SessionPayloadFields {
	return (
		typeof value.sub === 'string' &&
		value.sub.length > 0 &&
		typeof value.name === 'string' &&
		(value.avatar === null || typeof value.avatar === 'string') &&
		isSessionRole(value.role) &&
		Number.isSafeInteger(value.exp)
	);
}

function decodeSessionPayload(value: unknown): DecodedSessionPayload | null {
	if (!isRecord(value) || !hasSessionPayloadFields(value)) {
		return null;
	}

	if (!Object.hasOwn(value, 'sv')) {
		if (Object.hasOwn(value, 'avatar_snapshot_sha256')) {
			return null;
		}

		return {
			schemaVersion: 1,
			payload: {
				sub: value.sub,
				name: value.name,
				avatar: value.avatar,
				role: value.role,
				exp: value.exp
			}
		};
	}

	if (value.sv === SESSION_SCHEMA_VERSION) {
		if (!Object.hasOwn(value, 'avatar_snapshot_sha256')) {
			return null;
		}

		const snapshot = value.avatar_snapshot_sha256;

		if (snapshot !== null && (typeof snapshot !== 'string' || !isAvatarSnapshotSha256(snapshot))) {
			return null;
		}

		return {
			schemaVersion: 2,
			payload: {
				sv: SESSION_SCHEMA_VERSION,
				sub: value.sub,
				name: value.name,
				avatar: value.avatar,
				avatar_snapshot_sha256: snapshot,
				role: value.role,
				exp: value.exp
			}
		};
	}

	if (value.sv === PUBLIC_ID_SESSION_SCHEMA_VERSION) {
		if (!isPublicId(value.sub) || !Object.hasOwn(value, 'avatar_snapshot_sha256')) {
			return null;
		}

		const snapshot = value.avatar_snapshot_sha256;

		if (snapshot !== null && (typeof snapshot !== 'string' || !isAvatarSnapshotSha256(snapshot))) {
			return null;
		}

		return {
			schemaVersion: 3,
			payload: {
				sv: PUBLIC_ID_SESSION_SCHEMA_VERSION,
				sub: value.sub,
				name: value.name,
				avatar: value.avatar,
				avatar_snapshot_sha256: snapshot,
				role: value.role,
				exp: value.exp
			}
		};
	}

	return null;
}

export async function createSessionCookie(
	user: SessionCookieUserV2,
	secret: string,
	expiresAt: number = Math.floor(Date.now() / 1_000) + SESSION_MAX_AGE_SECONDS
): Promise<string> {
	if (!Number.isSafeInteger(expiresAt)) {
		throw new TypeError('Session expiration must be a safe integer.');
	}

	if (
		user.avatar_snapshot_sha256 !== null &&
		!isAvatarSnapshotSha256(user.avatar_snapshot_sha256)
	) {
		throw new TypeError('Avatar snapshot digest must be 64-character lowercase hexadecimal text.');
	}

	const payload: SessionPayloadV2 = {
		sv: SESSION_SCHEMA_VERSION,
		...user,
		exp: expiresAt
	};

	const key = await getKey(secret);
	const data = encoder.encode(JSON.stringify(payload));
	const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));

	return toBase64Url(data) + '.' + toBase64Url(signature);
}

export async function verifySessionCookie(
	cookie: string,
	secret: string
): Promise<VerifiedSession | null> {
	try {
		const separator = cookie.indexOf('.');

		if (
			separator <= 0 ||
			separator === cookie.length - 1 ||
			cookie.indexOf('.', separator + 1) !== -1
		) {
			return null;
		}

		const data = fromBase64Url(cookie.substring(0, separator));
		const signature = fromBase64Url(cookie.substring(separator + 1));

		const key = await getKey(secret);
		const valid = await crypto.subtle.verify('HMAC', key, signature, data);

		if (!valid) {
			return null;
		}

		const decoded = decodeSessionPayload(JSON.parse(decoder.decode(data)));

		if (!decoded) {
			return null;
		}

		const now = Math.floor(Date.now() / 1_000);

		if (decoded.payload.exp <= now) {
			return null;
		}

		if (decoded.schemaVersion === 1) {
			return {
				schemaVersion: 1,
				expiresAt: decoded.payload.exp,
				user: {
					discord_id: decoded.payload.sub,
					display_name: decoded.payload.name,
					avatar_hash: decoded.payload.avatar,
					role: decoded.payload.role
				}
			};
		}

		if (decoded.schemaVersion === 2) {
			return {
				schemaVersion: 2,
				expiresAt: decoded.payload.exp,
				user: {
					discord_id: decoded.payload.sub,
					display_name: decoded.payload.name,
					avatar_hash: decoded.payload.avatar,
					avatar_snapshot_sha256: decoded.payload.avatar_snapshot_sha256,
					role: decoded.payload.role
				}
			};
		}

		return {
			schemaVersion: 3,
			expiresAt: decoded.payload.exp,
			user: {
				public_id: decoded.payload.sub,
				display_name: decoded.payload.name,
				avatar_hash: decoded.payload.avatar,
				avatar_snapshot_sha256: decoded.payload.avatar_snapshot_sha256,
				role: decoded.payload.role
			}
		};
	} catch {
		return null;
	}
}

interface PublicIdUserRow {
	discord_id: string;
}

export async function resolvePublicIdSessionUser(
	db: NonNullable<App.Locals['db']>,
	user: VerifiedSessionUserV3
): Promise<AuthenticatedUser | null> {
	const row = await db
		.prepare(
			`
			select discord_id
			from users
			where public_id = ?
			`
		)
		.bind(user.public_id)
		.first<PublicIdUserRow>();

	if (!row) {
		return null;
	}

	return {
		discord_id: row.discord_id,
		display_name: user.display_name,
		avatar_hash: user.avatar_hash,
		avatar_snapshot_sha256: user.avatar_snapshot_sha256,
		role: user.role
	};
}

export async function requireRole(
	locals: App.Locals,
	minRole: 'steward' | 'admin'
): Promise<AuthenticatedUser> {
	const user = locals.user;

	if (!user) {
		error(401, 'Not authenticated');
	}

	const db = locals.db;

	if (!db) {
		error(500, 'Database not available');
	}

	const row = await db
		.prepare('select role from users where discord_id = ?')
		.bind(user.discord_id)
		.first<{ role: string }>();

	if (!row) {
		error(401, 'User not found');
	}

	const userLevel = ROLE_LEVEL[row.role] ?? 0;
	const requiredLevel = ROLE_LEVEL[minRole] ?? 99;

	if (userLevel < requiredLevel) {
		error(403, 'Insufficient permissions');
	}

	return {
		...user,
		role: row.role as SessionRole
	};
}
