import { error } from '@sveltejs/kit';
import {
	AVATAR_CACHE_CONTROL,
	AVATAR_CONTENT_TYPE,
	avatarVariantKey,
	isAvatarSnapshotSha256
} from '$lib/server/avatar-snapshots';
import type { RequestHandler } from './$types';

export const GET = (async ({ params, platform }) => {
	if (!isAvatarSnapshotSha256(params.sha256)) {
		error(404, 'Avatar snapshot not found.');
	}

	const bucket = platform?.env.AVATAR_BUCKET;

	if (!bucket) {
		error(503, 'Avatar snapshot storage is unavailable.');
	}

	const object = await bucket.get(avatarVariantKey(params.sha256, 'w128'));

	if (!object) {
		error(404, 'Avatar snapshot not found.');
	}

	const headers = new Headers({
		'Cache-Control': AVATAR_CACHE_CONTROL,
		'Content-Type': AVATAR_CONTENT_TYPE,
		'Content-Length': String(object.size),
		ETag: object.httpEtag,
		'X-Content-Type-Options': 'nosniff'
	});

	return new Response(object.body, {
		status: 200,
		headers
	});
}) satisfies RequestHandler;
