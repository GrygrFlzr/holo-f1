import tsvRawContents from './_data.tsv?raw';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const mimeType = 'text/tab-separated-values';
	const headers = new Headers({
		'Content-Type': mimeType
	});

	return new Response(tsvRawContents, { headers });
};
