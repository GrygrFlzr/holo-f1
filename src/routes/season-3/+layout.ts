import type { LayoutLoad } from './$types';

const indivPtsUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSGfxGO-A1LkFFlKSQ8JQRKIux7QJqDev2n5CP07d9MVAAAtUp9M2hvzL_jM260dHbVERd9Ku6SoDam/pub?gid=641322508&single=true&output=tsv`;
export const load: LayoutLoad = async ({ fetch }) => {
	const response = await fetch(indivPtsUrl);
    const sheetData = await response.text();

    return { sheetData };
};