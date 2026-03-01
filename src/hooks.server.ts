import { verifySessionCookie } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const session = event.cookies.get('session');
	if (!session) return resolve(event);

	let authSecret: string | undefined;
	try {
		authSecret = event.platform?.env?.AUTH_SECRET;
	} catch {
		// prerenderable routes cannot access platform.env
		return resolve(event);
	}
	if (!authSecret) return resolve(event);

	const user = await verifySessionCookie(session, authSecret);
	if (user) {
		event.locals.user = user;
	}

	return resolve(event);
};
