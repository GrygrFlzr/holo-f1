import type { LayoutLoad } from './$types';
import { asset } from '$app/paths';

type Team = {
	name: string;
	color: string;
	repImage: string;
};

export const prerender = true;
const indivPtsUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSGfxGO-A1LkFFlKSQ8JQRKIux7QJqDev2n5CP07d9MVAAAtUp9M2hvzL_jM260dHbVERd9Ku6SoDam/pub?gid=641322508&single=true&output=tsv`;
export const load: LayoutLoad = async ({ fetch }) => {
	const response = await fetch(indivPtsUrl);
	const sheetData = await response.text();
	const racesCompleted = 21;
	const teams: Team[] = [
		{
			name: 'Scuderia KFP',
			color: '#ff411c',
			repImage: asset('/profiles/en_myth_kiara.webp')
		},
		{
			name: "Amelia's Driver Bureau",
			color: '#f8db92',
			repImage: asset('/profiles/en_myth_ame.webp')
		},
		{
			name: "AMG Reine's [Reidacted]",
			color: '#0f53ba',
			repImage: asset('/profiles/id2_reine.webp')
		},
		{
			name: 'GULF Poyoyo Racing',
			color: 'hsl(353, 83.3%, 57.8%)',
			repImage: asset('/profiles/jp2_ayame.webp')
		},
		{
			name: "Lamy's Land of Lawnmowers",
			color: '#6abadf',
			repImage: asset('/profiles/jp5_lamy.webp')
		},
		{
			name: "IRyS' Stage Racing",
			color: '#ff0335',
			repImage: asset('/profiles/en_promise_irys.webp')
		},
		{
			name: "Shiranui Flare's Elfriend F1",
			color: '#fe3d1c',
			repImage: asset('/profiles/jp3_flare.webp')
		},
		{
			name: "Nerissa's Birdgarage",
			color: 'hsl(235.3, 96.4%, 55.9%)',
			repImage: asset('/profiles/en_advent_nerissa.webp')
		},
		{
			name: 'AZKi Pioneer Racing',
			color: '#fc3488',
			repImage: asset('/profiles/jp0_azki.webp')
		},
		{
			name: "Mumei's Sancturacing",
			color: 'hsl(25.7, 37.5%, 78%)',
			repImage: asset('/profiles/en_promise_mumei.webp')
		},
		{
			name: 'Alfa Roneo Racing',
			color: 'hsl(33, 100%, 68.2%)',
			repImage: asset('/profiles/jp5_nene.webp')
		},
		{
			name: 'Nun-Nun Speedstar Racing',
			color: '#266aff',
			repImage: asset('/profiles/jp0_sora.webp')
		},
		{
			name: 'Shiorin Aramco Racing',
			color: 'hsl(255.7, 21.9%, 58.8%)',
			repImage: asset('/profiles/en_advent_shiori.webp')
		},
		{
			name: 'Melfriend Formula 1 Team',
			color: 'hsl(43.6, 85.2%, 65.5%)',
			repImage: asset('/profiles/id2_anya.webp')
		},
		{
			name: 'HoloMoms Racing Supremacy',
			color: 'hsl(202.7, 100%, 76.7%)',
			repImage: asset('/profiles/misc_pekomama.webp')
		},
		{
			name: "Rindo Chihaya's Garage",
			color: 'hsl(180, 54.4%, 47.3%)',
			repImage: asset('/profiles/devis_flowglow_chihaya.webp')
		},
		{
			name: 'Operation V7',
			color: 'hsl(246, 7.7%, 74.5%)',
			repImage: asset('/profiles/id3_zeta.webp')
		}
	];

	return { sheetData, racesCompleted, teams };
};
