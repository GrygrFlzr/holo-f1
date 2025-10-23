export const prerender = true;

const sheetUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSGfxGO-A1LkFFlKSQ8JQRKIux7QJqDev2n5CP07d9MVAAAtUp9M2hvzL_jM260dHbVERd9Ku6SoDam/pub?gid=641322508&single=true&output=tsv`;
export async function GET({ fetch, setHeaders }) {
	const response = await fetch(sheetUrl);
	const tsvData = await response.text();

	setHeaders({
		'Content-Type': 'text/tab-separated-values',
		'Cache-Control': 'public, max-age=60, must-revalidate'
	});

	return new Response(tsvData);
}
