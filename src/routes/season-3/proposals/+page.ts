import type { PageLoad } from './$types';

export const prerender = true;
export const load: PageLoad = async ({ parent }) => {
	const sheetData = (await parent()).sheetData;
	const teams = (await parent()).teams;
	const racesCompleted = (await parent()).racesCompleted;

	const grandsPrix = [
		'Australian Grand Prix',
		'Chinese Grand Prix',
		'Japanese Grand Prix',
		'Bahrain Grand Prix',
		'Saudi Arabian Grand Prix',
		'Miami Grand Prix',
		'Emilia Romagna Grand Prix',
		'Monaco Grand Prix',
		'Spanish Grand Prix',
		'Canadian Grand Prix',
		'Austrian Grand Prix',
		'British Grand Prix',
		'Belgian Grand Prix',
		'Hungarian Grand Prix',
		'Dutch Grand Prix',
		'Italian Grand Prix',
		'Azerbaijan Grand Prix',
		'Singapore Grand Prix',
		'United States Grand Prix',
		'Mexico City Grand Prix',
		'São Paulo Grand Prix',
		'Las Vegas Grand Prix',
		'Qatar Grand Prix',
		'Abu Dhabi Grand Prix'
	];

	const scores = sheetData
		.split('\n')
		.slice(3) // remove headers
		.flatMap((row) => {
			const fields = row.split('\t');
			const name = fields[0];
			return Array.from({ length: racesCompleted }, (_, i) => ({
				name: name,
				round: i + 1,
				team: fields[i * 12 + 1],
				score: Number.parseInt(fields[i * 12 + 2]) || 0
			}));
		})
		.filter((score) => score.team !== '-');

	const individuals = sheetData
		.split('\n')
		.slice(3)
		.map((row) => row.split('\t')[0]);

	return {
		scores,
		teams,
		individuals,
		grandsPrix
	};
};
