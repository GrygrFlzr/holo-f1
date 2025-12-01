import type { PageLoad } from './$types';

export const csr = false;
export const prerender = true;
export const load: PageLoad = async ({ parent }) => {
	const { sheetData, teams, racesCompleted } = await parent();

	const individuals = sheetData
		.split('\n')
		.map((row) => {
			const fields = row.split('\t');
			return {
				name: fields[0],
				points: Array.from({ length: racesCompleted }, (_, i) => ({
					round: i + 1,
					team: fields[i * 12 + 1],
					roundScore: Number.parseInt(fields[i * 12 + 2]) || 0
				})).filter((ptsRecord) => ptsRecord.team !== '-')
			};
		})
		.slice(3)
		.filter((indiv) => indiv.name !== '');

	const annotatedIndividuals = individuals.map((person) => ({
		...person,
		cumulativePoints: person.points.map((pts) => pts.roundScore).reduce((a, b) => a + b, 0)
	}));

	const sortedIndividuals = annotatedIndividuals.sort(
		(a, b) => b.cumulativePoints - a.cumulativePoints
	);

	const sortedPts = sortedIndividuals.map((person) => person.cumulativePoints);

	return {
		teams,
		individuals: sortedIndividuals.map((person) => ({
			...person,
			rank: sortedPts.indexOf(person.cumulativePoints) + 1
		}))
	};
};
