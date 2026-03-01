export interface Team {
	id: number;
	name: string;
	color: string;
	image_key: string;
	oshi_mark: string | null;
}

export async function getAllTeams(db: D1Database): Promise<Team[]> {
	const { results } = await db
		.prepare(
			`
			select
				id
				,name
				,color
				,image_key
				,oshi_mark
			from teams
			order by
				name asc
			`
		)
		.all<Team>();
	return results;
}

export async function validateTeamId(db: D1Database, id: number): Promise<boolean> {
	const row = await db
		.prepare(
			`
			select
				id
			from teams
			where
				id = ? and
				1 = 1
			`
		)
		.bind(id)
		.first();
	return row !== null;
}
