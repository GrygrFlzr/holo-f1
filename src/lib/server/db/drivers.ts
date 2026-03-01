/**
 * direct representation of drivers SQLite row
 */
export interface Driver {
	id: number;
	code: string;
	name: string;
	category: string;
}

export async function getAllDrivers(db: D1Database): Promise<Driver[]> {
	const { results } = await db
		.prepare(
			`
			select
				id
				,code
				,name
				,category
			from drivers
			order by
				category asc
				,name asc
			`
		)
		.all<Driver>();
	return results;
}

export async function validateDriverIds(db: D1Database, ids: number[]): Promise<boolean> {
	const unique = [...new Set(ids)];
	const placeholders = unique.map(() => '?').join(',');
	const { results } = await db
		.prepare(
			`
			select
				id
			from drivers
			where
				id in (${placeholders}) and
				1 = 1
			`
		)
		.bind(...unique)
		.all<{ id: number }>();
	return results.length === unique.length;
}
