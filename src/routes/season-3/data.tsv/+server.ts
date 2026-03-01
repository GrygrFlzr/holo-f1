import tsvRawContents from './_data.tsv?raw';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = ({ setHeaders }) => {
	const mimeType = 'text/tab-separated-values';
	setHeaders({
		'Content-Type': mimeType
	});

	return new Response(tsvRawContents);
};
