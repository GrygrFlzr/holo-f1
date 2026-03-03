import type { D1Queryable } from '$lib/server/db/types';

/**
 * direct representation of weekends SQLite row
 */
export interface Weekend {
	id: number;
	season: number;
	slug: string;
	name: string;
	/** ISO time string */
	lock_time: string;
	/** boolean */
	is_sprint: number;
	watchalong_host: string | null;
}

export function openWeekendStatement(db: D1Queryable): D1PreparedStatement {
	return db.prepare(
		`
		select id, season, slug, name, lock_time, is_sprint, watchalong_host
		from weekends
		where lock_time > datetime('now')
			and scored = 0
		order by lock_time asc
		limit 1
		`
	);
}

export async function getOpenWeekend(db: D1Queryable): Promise<Weekend | null> {
	return openWeekendStatement(db).first<Weekend>();
}

export async function getOpenWeekendById(db: D1Queryable, id: number): Promise<Weekend | null> {
	return db
		.prepare(
			`
			select id, season, slug, name, lock_time, is_sprint, watchalong_host
			from weekends
			where id = ?
				and lock_time > datetime('now')
				and scored = 0
			`
		)
		.bind(id)
		.first<Weekend>();
}
