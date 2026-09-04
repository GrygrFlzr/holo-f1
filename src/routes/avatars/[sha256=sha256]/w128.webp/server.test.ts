import { AVATAR_CACHE_CONTROL, avatarVariantKey } from '$lib/server/avatar-snapshots';
import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

const TEST_DIGEST = '0123456789abcdef'.repeat(4);
const TEST_BODY = 'TEST_WEBP_BYTES';

type HandlerEvent = Parameters<typeof GET>[0];

function createObject(): R2ObjectBody {
	const size = new TextEncoder().encode(TEST_BODY).byteLength;

	return {
		body: new Response(TEST_BODY).body,
		size,
		httpEtag: '"TEST_ETAG"',
		writeHttpMetadata(headers: Headers): void {
			headers.set('Content-Type', 'image/webp');
		}
	} as unknown as R2ObjectBody;
}

function createBucket(object: R2ObjectBody | null) {
	const get = vi.fn(async () => object);

	return {
		bucket: { get } as unknown as R2Bucket,
		get
	};
}

function createEvent(sha256: string, bucket?: R2Bucket): HandlerEvent {
	return {
		params: { sha256 },
		platform:
			bucket === undefined
				? undefined
				: {
						env: {
							AVATAR_BUCKET: bucket
						}
					}
	} as unknown as HandlerEvent;
}

describe('stored avatar route', () => {
	it('serves the stored w128 variant', async () => {
		const { bucket, get } = createBucket(createObject());

		const response = await GET(createEvent(TEST_DIGEST, bucket));

		expect(get).toHaveBeenCalledWith(avatarVariantKey(TEST_DIGEST, 'w128'));
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/webp');
		expect(response.headers.get('Cache-Control')).toBe(AVATAR_CACHE_CONTROL);
		expect(response.headers.get('ETag')).toBe('"TEST_ETAG"');
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(await response.text()).toBe(TEST_BODY);
	});

	it('returns 404 when the variant is absent', async () => {
		const { bucket } = createBucket(null);

		await expect(GET(createEvent(TEST_DIGEST, bucket))).rejects.toMatchObject({
			status: 404
		});
	});

	it('rejects an invalid digest without reading R2', async () => {
		const { bucket, get } = createBucket(createObject());

		await expect(GET(createEvent('TEST_INVALID_DIGEST', bucket))).rejects.toMatchObject({
			status: 404
		});

		expect(get).not.toHaveBeenCalled();
	});

	it('returns 503 when the bucket binding is absent', async () => {
		await expect(GET(createEvent(TEST_DIGEST))).rejects.toMatchObject({
			status: 503
		});
	});
});
