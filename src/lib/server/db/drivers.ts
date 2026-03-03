import type { D1Queryable } from '$lib/server/db/types';

/**
 * direct representation of drivers SQLite row
 */
export interface Driver {
	id: number;
	code: string;
	name: string;
	category: string;
}

export async function getAllDrivers(db: D1Queryable): Promise<Driver[]> {
	const { results } = await db
		.prepare(
			`
			select id, code, name, category
			from drivers
			order by category asc, name asc
			`
		)
		.all<Driver>();
	return results;
}

export async function validateDriverIds(db: D1Queryable, ids: number[]): Promise<boolean> {
	const unique = [...new Set(ids)];
	const { results } = await db
		.prepare(
			`
			select id
			from drivers
			where id in ( select value from json_each(?) )
			`
		)
		.bind(JSON.stringify(unique))
		.all<{ id: number }>();
	return results.length === unique.length;
}
