import type { LayoutLoad } from './$types';
import { asset } from '$app/paths';

type Team = {
	name: string;
	color: string;
	repImage: string;
};

const sizes = ['3x', '2x', '1x'];
const baseToAsset = (name: string) =>
	sizes.map((size) => `${asset(`/profiles/${name}@${size}.webp`)} ${size}`).join(', ');

const indivPtsUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSGfxGO-A1LkFFlKSQ8JQRKIux7QJqDev2n5CP07d9MVAAAtUp9M2hvzL_jM260dHbVERd9Ku6SoDam/pub?gid=641322508&single=true&output=tsv`;
export const load: LayoutLoad = async ({ fetch }) => {
	const response = await fetch(indivPtsUrl);
	const sheetData = await response.text();
	const racesCompleted = 23;
	const teams: Team[] = [
		{
			name: 'Scuderia KFP',
			color: '#ff411c',
			repImage: baseToAsset('en_myth_kiara')
		},
		{
			name: "Amelia's Driver Bureau",
			color: '#f8db92',
			repImage: baseToAsset('en_myth_ame')
		},
		{
			name: "AMG Reine's [Reidacted]",
			color: '#0f53ba',
			repImage: baseToAsset('id2_reine')
		},
		{
			name: 'GULF Poyoyo Racing',
			color: 'hsl(353, 83.3%, 57.8%)',
			repImage: baseToAsset('jp2_ayame')
		},
		{
			name: "Lamy's Land of Lawnmowers",
			color: '#6abadf',
			repImage: baseToAsset('jp5_lamy')
		},
		{
			name: "IRyS' Stage Racing",
			color: '#ff0335',
			repImage: baseToAsset('en_promise_irys')
		},
		{
			name: "Shiranui Flare's Elfriend F1",
			color: '#fe3d1c',
			repImage: baseToAsset('jp3_flare')
		},
		{
			name: "Nerissa's Birdgarage",
			color: 'hsl(235.3, 96.4%, 55.9%)',
			repImage: baseToAsset('en_advent_nerissa')
		},
		{
			name: 'AZKi Pioneer Racing',
			color: '#fc3488',
			repImage: baseToAsset('jp0_azki')
		},
		{
			name: "Mumei's Sancturacing",
			color: 'hsl(25.7, 37.5%, 78%)',
			repImage: baseToAsset('en_promise_mumei')
		},
		{
			name: 'Alfa Roneo Racing',
			color: 'hsl(33, 100%, 68.2%)',
			repImage: baseToAsset('jp5_nene')
		},
		{
			name: 'Nun-Nun Speedstar Racing',
			color: '#266aff',
			repImage: baseToAsset('jp0_sora')
		},
		{
			name: 'Shiorin Aramco Racing',
			color: 'hsl(255.7, 21.9%, 58.8%)',
			repImage: baseToAsset('en_advent_shiori')
		},
		{
			name: 'Melfriend Formula 1 Team',
			color: 'hsl(43.6, 85.2%, 65.5%)',
			repImage: baseToAsset('id2_anya')
		},
		{
			name: 'HoloMoms Racing Supremacy',
			color: 'hsl(202.7, 100%, 76.7%)',
			repImage: baseToAsset('misc_pekomama')
		},
		{
			name: "Rindo Chihaya's Garage",
			color: 'hsl(180, 54.4%, 47.3%)',
			repImage: baseToAsset('devis_flowglow_chihaya')
		},
		{
			name: 'Operation V7',
			color: 'hsl(246, 7.7%, 74.5%)',
			repImage: baseToAsset('id3_zeta')
		}
	];

	return { sheetData, racesCompleted, teams };
};
