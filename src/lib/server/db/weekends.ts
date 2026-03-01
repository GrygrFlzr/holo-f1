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

export async function getOpenWeekend(db: D1Database): Promise<Weekend | null> {
	return db
		.prepare(
			`
			select
				id
				,season
				,slug
				,name
				,lock_time
				,is_sprint
				,watchalong_host
			from weekends
			where
				lock_time > datetime('now') and
				scored = 0 and
				1 = 1
			order by
				lock_time asc
				,name asc
			limit 1
			`
		)
		.first<Weekend>();
}
