import { SESSION_COOKIE, verifySessionCookie } from '$lib/server/auth';
import { createSession, persistBookmark } from '$lib/server/db/session';
import type { Handle } from '@sveltejs/kit';

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

	const response = await resolve(event);
	if (dbSession) {
		persistBookmark(dbSession, event.cookies);
	}
	return response;
}) satisfies Handle;
