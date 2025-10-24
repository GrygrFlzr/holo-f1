import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	const headers = new Headers(response.headers);
	headers.delete('content-encoding');
	headers.delete('content-length');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};
