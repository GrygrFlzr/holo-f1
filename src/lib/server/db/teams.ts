import type { D1Queryable } from '$lib/server/db/types';

export interface Team {
	id: number;
	name: string;
	color: string;
	image_key: string;
	oshi_mark: string | null;
}

export function allTeamsStatement(db: D1Queryable): D1PreparedStatement {
	return db.prepare(
		`
		select id, name, color, image_key, oshi_mark
		from teams
		order by name asc
		`
	);
}

export async function getAllTeams(db: D1Queryable): Promise<Team[]> {
	const { results } = await allTeamsStatement(db).all<Team>();
	return results;
}

export async function validateTeamId(db: D1Queryable, id: number): Promise<boolean> {
	const row = await db
		.prepare(
			`
			select id
			from teams
			where id = ?
			`
		)
		.bind(id)
		.first<{ id: number }>();
	return row !== null;
}
