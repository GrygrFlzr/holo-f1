import { error } from '@sveltejs/kit';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ROLE_LEVEL: Record<string, number> = { user: 0, steward: 1, admin: 2 };

/**
 * re-derived per-session
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

function toBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
	return btoa(String.fromCharCode(...bytes))
		.replaceAll(/\+/g, '-')
		.replaceAll(/\//g, '_')
		.replaceAll(/=/g, '');
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
	const binary = atob(str.replaceAll(/-/g, '+').replaceAll(/_/g, '/'));
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

interface SessionPayload {
	sub: string;
	name: string;
	avatar: string | null;
	role: 'user' | 'steward' | 'admin';
	exp: number;
}

type SessionUser = Omit<SessionPayload, 'exp'>;

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export async function createSessionCookie(user: SessionUser, secret: string): Promise<string> {
	const payload: SessionPayload = {
		...user,
		exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
	};
	const key = await getKey(secret);
	const data = encoder.encode(JSON.stringify(payload));
	const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
	return toBase64Url(data) + '.' + toBase64Url(sig);
}

export async function verifySessionCookie(
	cookie: string,
	secret: string
): Promise<App.Locals['user']> {
	try {
		const dot = cookie.indexOf('.');
		if (dot === -1) return null;

		const data = fromBase64Url(cookie.substring(0, dot));
		const sig = fromBase64Url(cookie.substring(dot + 1));

		const key = await getKey(secret);
		const valid = await crypto.subtle.verify('HMAC', key, sig, data);
		if (!valid) return null;

		const { exp, sub, name, avatar, role } = JSON.parse(decoder.decode(data)) as SessionPayload;

		if (exp < Math.floor(Date.now() / 1000)) return null;

		return {
			discord_id: sub,
			display_name: name,
			avatar_hash: avatar,
			role
		};
	} catch {
		return null;
	}
}

export async function requireRole(
	locals: App.Locals,
	db: D1Database,
	minRole: 'steward' | 'admin'
): Promise<App.Locals['user'] & {}> {
	const user = locals.user;
	if (!user) error(401, 'Not authenticated');

	const row = await db
		.prepare('select role from users where discord_id = ?')
		.bind(user.discord_id)
		.first<{ role: string }>();

	if (!row) error(401, 'User not found');

	const userLevel = ROLE_LEVEL[row.role] ?? 0;
	const requiredLevel = ROLE_LEVEL[minRole] ?? 99;
	if (userLevel < requiredLevel) error(403, 'Insufficient permissions');

	// return user with annotated role
	return { ...user, role: row.role as 'user' | 'steward' | 'admin' };
}
