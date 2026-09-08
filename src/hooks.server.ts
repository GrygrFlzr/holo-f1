import type { Handle, ResolveOptions } from '@sveltejs/kit';
import {
	createSessionCookie,
	resolvePublicIdSessionUser,
	SESSION_COOKIE,
	verifySessionCookie
} from '$lib/server/auth';
import { createSession } from '$lib/server/db/session';

interface AvatarSnapshotRow {
	avatar_snapshot_sha256: string | null;
}

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
						event.locals.user = user;
					}
				} catch (cause) {
					console.error('Failed to resolve session user.', cause);
				}
			} else if (session?.schemaVersion === 2) {
				event.locals.user = session.user;
			} else if (session?.schemaVersion === 1) {
				try {
					const row = await dbSession
						.prepare(
							`
							select avatar_snapshot_sha256
							from users
							where discord_id = ?
							`
						)
						.bind(session.user.discord_id)
						.first<AvatarSnapshotRow>();

					if (!row) {
						event.cookies.delete(SESSION_COOKIE, {
							path: '/'
						});
					} else {
						const user: NonNullable<App.Locals['user']> = {
							discord_id: session.user.discord_id,
							display_name: session.user.display_name,
							avatar_hash: session.user.avatar_hash,
							avatar_snapshot_sha256: row.avatar_snapshot_sha256,
							role: session.user.role
						};

						const replacement = await createSessionCookie(
							{
								sub: user.discord_id,
								name: user.display_name,
								avatar: user.avatar_hash,
								avatar_snapshot_sha256: user.avatar_snapshot_sha256,
								role: user.role
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

						event.locals.user = user;
					}
				} catch (cause) {
					console.error('Failed to upgrade session cookie.', cause);

					event.locals.user = {
						discord_id: session.user.discord_id,
						display_name: session.user.display_name,
						avatar_hash: session.user.avatar_hash,
						avatar_snapshot_sha256: null,
						role: session.user.role
					};
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
