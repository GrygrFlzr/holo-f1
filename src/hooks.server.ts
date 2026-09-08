import type { Handle, ResolveOptions } from '@sveltejs/kit';
import {
	createSessionCookie,
	resolveLegacySessionUserV1,
	resolveLegacySessionUserV2,
	resolvePublicIdSessionUser,
	SESSION_COOKIE,
	verifySessionCookie
} from '$lib/server/auth';
import { createSession } from '$lib/server/db/session';

const preload = ((input) => {
	switch (input.type) {
		case 'font':
			// only preload default weight woff2
			return input.path.includes('titillium-web-latin-400-normal') && input.path.endsWith('.woff2');
		case 'css':
		case 'js':
			return true;
		case 'asset':
		default:
			return false;
	}
}) satisfies ResolveOptions['preload'];

export const handle = (async ({ event, resolve }) => {
	let dbSession: D1DatabaseSession | undefined;

	let env: Env | undefined;
	try {
		const maybeEnv = event.platform!.env;
		void maybeEnv.DB; // should throw if unavailable
		env = maybeEnv;
	} catch {
		// bindings unavailable
	}

	event.locals.user = null;
	if (env) {
		dbSession = createSession(env.DB, event.cookies);
		event.locals.db = dbSession;

		const cookie = event.cookies.get(SESSION_COOKIE);
		if (cookie) {
			const session = await verifySessionCookie(cookie, env.AUTH_SECRET);

			if (session?.schemaVersion === 3) {
				try {
					const user = await resolvePublicIdSessionUser(dbSession, session.user);

					if (!user) {
						event.cookies.delete(SESSION_COOKIE, {
							path: '/'
						});
					} else {
						event.locals.user = {
							...user,
							public_id: session.user.public_id
						};
					}
				} catch (cause) {
					console.error('Failed to resolve session user.', cause);
				}
			} else if (session?.schemaVersion === 2) {
				try {
					const resolved = await resolveLegacySessionUserV2(dbSession, session.user);

					if (!resolved) {
						event.cookies.delete(SESSION_COOKIE, {
							path: '/'
						});
					} else {
						const replacement = await createSessionCookie(
							{
								public_id: resolved.public_id,
								display_name: resolved.user.display_name,
								avatar_hash: resolved.user.avatar_hash,
								avatar_snapshot_sha256: resolved.user.avatar_snapshot_sha256,
								role: resolved.user.role
							},
							env.AUTH_SECRET,
							session.expiresAt
						);

						const remainingLifetime = session.expiresAt - Math.floor(Date.now() / 1_000);

						event.cookies.set(SESSION_COOKIE, replacement, {
							httpOnly: true,
							secure: event.url.protocol === 'https:',
							sameSite: 'lax',
							path: '/',
							maxAge: remainingLifetime
						});

						event.locals.user = {
							...resolved.user,
							public_id: resolved.public_id
						};
					}
				} catch (cause) {
					console.error('Failed to upgrade version 2 session cookie.', cause);
				}
			} else if (session?.schemaVersion === 1) {
				try {
					const resolved = await resolveLegacySessionUserV1(dbSession, session.user);

					if (!resolved) {
						event.cookies.delete(SESSION_COOKIE, {
							path: '/'
						});
					} else {
						const replacement = await createSessionCookie(
							{
								public_id: resolved.public_id,
								display_name: resolved.user.display_name,
								avatar_hash: resolved.user.avatar_hash,
								avatar_snapshot_sha256: resolved.user.avatar_snapshot_sha256,
								role: resolved.user.role
							},
							env.AUTH_SECRET,
							session.expiresAt
						);

						const remainingLifetime = session.expiresAt - Math.floor(Date.now() / 1_000);

						event.cookies.set(SESSION_COOKIE, replacement, {
							httpOnly: true,
							secure: event.url.protocol === 'https:',
							sameSite: 'lax',
							path: '/',
							maxAge: remainingLifetime
						});

						event.locals.user = {
							...resolved.user,
							public_id: resolved.public_id
						};
					}
				} catch (cause) {
					console.error('Failed to upgrade version 1 session cookie.', cause);
				}
			}
		}
	}

	const response = await resolve(event, { preload });
	if (dbSession) {
		const bookmark = dbSession.getBookmark();
		if (bookmark) {
			const secure = event.url.protocol === 'https:' ? ' Secure;' : '';
			response.headers.append(
				'Set-Cookie',
				`d1-bookmark=${bookmark}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=300`
			);
		}
	}
	return response;
}) satisfies Handle;
