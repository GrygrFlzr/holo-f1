import type { Handle, ResolveOptions } from '@sveltejs/kit';
import { SESSION_COOKIE, verifySessionCookie } from '$lib/server/auth';
import { createSession } from '$lib/server/db/session';

export type MaybePromise<T> = T | Promise<T>;
const preload = ((input) => {
	switch (input.type) {
		case 'font':
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
		const cookie = event.cookies.get(SESSION_COOKIE);
		if (cookie) {
			const user = await verifySessionCookie(cookie, env.AUTH_SECRET);
			if (user) {
				event.locals.user = user;
			}
		}
		dbSession = createSession(env.DB, event.cookies);
		event.locals.db = dbSession;
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
