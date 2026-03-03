import type { Cookies } from '@sveltejs/kit';

const BOOKMARK_COOKIE = 'd1-bookmark' as const;

export function createSession(db: D1Database, cookies: Cookies): D1DatabaseSession {
	const bookmark = cookies.get(BOOKMARK_COOKIE);
	return bookmark ? db.withSession(bookmark) : db.withSession();
}

export function persistBookmark(session: D1DatabaseSession, cookies: Cookies) {
	const bookmark = session.getBookmark();
	if (bookmark) {
		cookies.set(BOOKMARK_COOKIE, bookmark, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 300
		});
	}
}
