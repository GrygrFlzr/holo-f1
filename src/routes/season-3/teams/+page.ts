import type { PageLoad } from './$types';

export const prerender = true;
export const load: PageLoad = async ({ parent }) => {
	const sheetData = (await parent()).sheetData;
	const teams = (await parent()).teams;
	const racesCompleted = (await parent()).racesCompleted;

	const individuals = sheetData.split('\n').map((row) => {
		const fields = row.split('\t');
		return {
			name: fields[0],
			points: Array.from({ length: racesCompleted }, (_, i) => ({
				round: i + 1,
				team: fields[i * 12 + 1],
				roundScore: Number.parseInt(fields[i * 12 + 2]) || 0
			}))
		};
	});
	individuals.shift();
	individuals.shift();
	individuals.shift();

	const annotatedTeams = teams
		.map((team) => ({
			...team,
			scorers: individuals
				.map((indiv) => ({
					...indiv,
					points: indiv.points.filter((roundRecord) => roundRecord.team === team.name)
				}))
				.filter((indiv) => indiv.points.length > 0)
				.map((indiv) => ({
					name: indiv.name,
					cumulativePts: indiv.points.map((pts) => pts.roundScore).reduce((a, b) => a + b, 0)
				}))
				.sort((a, b) => b.cumulativePts - a.cumulativePts)
		}))
		.map((team) => ({
			...team,
			points: team.scorers.map((member) => member.cumulativePts).reduce((a, b) => a + b, 0)
		}))
		.sort((a, b) => {
			if (b.points === a.points) {
				return b.scorers.length - a.scorers.length;
			}
			return b.points - a.points;
		});

	const sortedPts = annotatedTeams.map((team) => team.points);

	return {
		teams: annotatedTeams.map((team) => ({
			rank: sortedPts.indexOf(team.points) + 1,
			...team
		})),
		individuals
	};
};
