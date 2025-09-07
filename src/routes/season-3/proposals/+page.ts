import type { PageLoad } from './$types';
import pekomama from '$lib/assets/pekomama.jpg?no-inline';

export const load: PageLoad = async ({ parent }) => {
	const sheetData = (await parent()).sheetData;

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

	type Team = {
		name: string;
		color: string;
		repImage: string;
	};
	const teams: Team[] = [
		{
			name: 'Scuderia KFP',
			color: '#ff411c',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Takanashi-Kiara_list_thumb.png'
		},
		{
			name: "Amelia's Driver Bureau",
			color: '#f8db92',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Watson-Amelia_list_thumb.png'
		},
		{
			name: "AMG Reine's [Reidacted]",
			color: '#0f53ba',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Pavolia-Reine_list_thumb.png'
		},
		{
			name: 'GULF Poyoyo Racing',
			color: 'hsl(353, 83.3%, 57.8%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Nakiri-Ayame_list_thumb.png'
		},
		{
			name: "Lamy's Land of Lawnmowers",
			color: '#6abadf',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Yukihana-Lamy_list_thumb.png'
		},
		{
			name: "IRyS' Stage Racing",
			color: '#ff0335',
			repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/IRyS_list_thumb.png'
		},
		{
			name: "Shiranui Flare's Elfriend F1",
			color: '#fe3d1c',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Shiranui-Flare_list_thumb.png'
		},
		{
			name: "Nerissa's Birdgarage",
			color: 'hsl(235.3, 96.4%, 55.9%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2021/07/Nerissa-Ravencroft_list_thumb.png'
		},
		{
			name: 'AZKi Pioneer Racing',
			color: '#fc3488',
			repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/AZKi_list_thumb.png'
		},
		{
			name: "Mumei's Sancturacing",
			color: 'hsl(25.7, 37.5%, 78%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Nanashi-Mumei_list_thumb.png'
		},
		{
			name: 'Alfa Roneo Racing',
			color: 'hsl(33, 100%, 68.2%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Momosuzu-Nene_list_thumb.png'
		},
		{
			name: 'Nun-Nun Speedstar Racing',
			color: '#266aff',
			repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2021/05/tokino_sora_thumb.png'
		},
		{
			name: 'Shiorin Aramco Racing',
			color: 'hsl(255.7, 21.9%, 58.8%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2021/07/Shiori-Novella_list_thumb.png'
		},
		{
			name: 'Melfriend Formula 1 Team',
			color: 'hsl(43.6, 85.2%, 65.5%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Anya-Melfissa_list_thumb.png'
		},
		{
			name: 'HoloMoms Racing Supremacy',
			color: 'hsl(202.7, 100%, 76.7%)',
			repImage: pekomama
		},
		{
			name: "Rindo Chihaya's Garage",
			color: 'hsl(180, 54.4%, 47.3%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2023/09/Rindo-Chihaya_list_thumb.png'
		},
		{
			name: 'Operation V7',
			color: 'hsl(246, 7.7%, 74.5%)',
			repImage:
				'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Vestia-Zeta_list_thumb.png'
		}
	];

	const scores = sheetData
		.split('\n')
		.slice(3) // remove headers
		.flatMap((row) => {
			const fields = row.split('\t');
			const name = fields[0];
			return Array.from({ length: 16 }, (_, i) => ({
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
