import type { D1Queryable } from '$lib/server/db/types';

export interface Weekend {
	id: number;
	season: number;
	slug: string;
	name: string;
	lock_time: string;
	is_sprint: number;
	watchalong_host: string | null;
	scored: number;
}

const WEEKEND_COLUMNS = `
	id,
	season,
	slug,
	name,
	lock_time,
	is_sprint,
	watchalong_host,
	scored
`;

export function openWeekendStatement(db: D1Queryable): D1PreparedStatement {
	return db.prepare(
		`
		select ${WEEKEND_COLUMNS}
		from weekends
		where
			lock_time > datetime('now', '-3 days')
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
			select ${WEEKEND_COLUMNS}
			from weekends
			where
				id = ?
				and lock_time > datetime('now')
				and scored = 0
			`
		)
		.bind(id)
		.first<Weekend>();
}

export async function getWeekendById(db: D1Queryable, id: number): Promise<Weekend | null> {
	return db
		.prepare(
			`
			select ${WEEKEND_COLUMNS}
			from weekends
			where id = ?
			`
		)
		.bind(id)
		.first<Weekend>();
}

export async function getFirstUnscoredWeekend(db: D1Queryable): Promise<Weekend | null> {
	return db
		.prepare(
			`
			select ${WEEKEND_COLUMNS}
			from weekends
			where scored = 0
			order by lock_time asc
			limit 1
			`
		)
		.first<Weekend>();
}

export async function getWeekendForScoring(db: D1Queryable, id: number): Promise<Weekend | null> {
	return db
		.prepare(
			`
			select ${WEEKEND_COLUMNS}
			from weekends
			where id = ? and scored = 0
			`
		)
		.bind(id)
		.first<Weekend>();
}

export async function getLockedWeekends(db: D1Queryable): Promise<Weekend[]> {
	const { results } = await db
		.prepare(
			`
			select ${WEEKEND_COLUMNS}
			from weekends
			where lock_time <= datetime('now')
			order by lock_time desc
			`
		)
		.all<Weekend>();

	return results;
}

export async function publishWeekend(db: D1Queryable, id: number): Promise<boolean> {
	const result = await db
		.prepare(
			`
			update weekends
			set scored = 1
			where id = ? and scored = 0
			`
		)
		.bind(id)
		.run();

	return result.meta.changes === 1;
}
