import { describe, expect, it, vi } from 'vitest';
import {
	avatarSourceKey,
	avatarVariantKey,
	readDiscordAvatarResponse,
	storeAvatarSnapshot,
	type AvatarImage,
	type AvatarSnapshotBucket,
	type AvatarSnapshotPutOptions
} from './avatar-snapshots';

interface StoredObject {
	bytes: Uint8Array<ArrayBuffer>;
	options: AvatarSnapshotPutOptions;
}

function createImage(value: string): AvatarImage {
	const encoded = new TextEncoder().encode(value);
	const bytes = new ArrayBuffer(encoded.byteLength);

	new Uint8Array(bytes).set(encoded);

	return { bytes };
}

function createBucket(failWhen: (key: string) => boolean = () => false): {
	bucket: AvatarSnapshotBucket;
	objects: Record<string, StoredObject>;
	put: ReturnType<typeof vi.fn>;
} {
	const objects: Record<string, StoredObject> = Object.create(null);

	const put = vi.fn(
		async (
			key: string,
			value: ArrayBuffer,
			options: AvatarSnapshotPutOptions
		): Promise<unknown | null> => {
			if (failWhen(key)) {
				throw new Error('TEST_R2_WRITE_FAILURE');
			}

			if (Object.hasOwn(objects, key)) {
				return null;
			}

			const bytes = new Uint8Array(value.byteLength);
			bytes.set(new Uint8Array(value));

			objects[key] = {
				bytes,
				options
			};

			return { key };
		}
	);

	return {
		bucket: { put },
		objects,
		put
	};
}

async function digestHex(bytes: ArrayBuffer): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', bytes);

	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('avatar snapshot keys', () => {
	const digest = '0123456789abcdef'.repeat(4);

	it('builds deterministic source and variant keys', () => {
		expect(avatarSourceKey(digest)).toBe(`discord-avatars/sources/sha256/${digest}.webp`);

		expect(avatarVariantKey(digest, 'w128')).toBe(
			`discord-avatars/variants/v1/${digest}/w128.webp`
		);
	});

	it.each([
		['short', digest.slice(0, -1)],
		['long', `${digest}0`],
		['uppercase', digest.toUpperCase()],
		['non-hexadecimal', `${digest.slice(0, -1)}g`]
	])('rejects a %s digest', (_, invalidDigest) => {
		expect(() => avatarSourceKey(invalidDigest)).toThrow(
			'Avatar snapshot digest must be 64-character lowercase hexadecimal text.'
		);
	});
});

describe('readDiscordAvatarResponse', () => {
	it('accepts a bounded WebP response', async () => {
		const body = 'TEST_WEBP_BYTES';
		const maximumBytes = new TextEncoder().encode(body).byteLength;

		const image = await readDiscordAvatarResponse(
			new Response(body, {
				headers: {
					'Content-Type': 'image/webp; test=TEST_PARAMETER'
				}
			}),
			maximumBytes
		);

		expect(new TextDecoder().decode(image.bytes)).toBe(body);
	});

	it('rejects a non-successful response', async () => {
		await expect(
			readDiscordAvatarResponse(
				new Response(null, {
					status: 404,
					headers: {
						'Content-Type': 'image/webp'
					}
				}),
				1
			)
		).rejects.toThrow('Discord avatar request failed with HTTP 404.');
	});

	it('rejects an unexpected content type', async () => {
		const body = 'TEST_IMAGE_BYTES';
		const maximumBytes = new TextEncoder().encode(body).byteLength;

		await expect(
			readDiscordAvatarResponse(
				new Response(body, {
					headers: {
						'Content-Type': 'image/png'
					}
				}),
				maximumBytes
			)
		).rejects.toThrow('Discord avatar response must have Content-Type image/webp.');
	});

	it('rejects an oversized declared content length', async () => {
		const body = 'TEST_BODY';
		const bodyLength = new TextEncoder().encode(body).byteLength;

		await expect(
			readDiscordAvatarResponse(
				new Response(body, {
					headers: {
						'Content-Type': 'image/webp',
						'Content-Length': String(bodyLength + 1)
					}
				}),
				bodyLength
			)
		).rejects.toThrow(`Discord avatar response exceeds the ${bodyLength}-byte limit.`);
	});

	it('rejects an oversized streamed body without a content length', async () => {
		const acceptedBody = 'TEST_BODY';
		const oversizedBody = `${acceptedBody}_EXCESS`;
		const maximumBytes = new TextEncoder().encode(acceptedBody).byteLength;

		await expect(
			readDiscordAvatarResponse(
				new Response(oversizedBody, {
					headers: {
						'Content-Type': 'image/webp'
					}
				}),
				maximumBytes
			)
		).rejects.toThrow(`Avatar response exceeds the ${maximumBytes}-byte limit.`);
	});

	it('rejects an empty body', async () => {
		await expect(
			readDiscordAvatarResponse(
				new Response('', {
					headers: {
						'Content-Type': 'image/webp'
					}
				}),
				1
			)
		).rejects.toThrow('Avatar response body must not be empty.');
	});

	it.each([0, -1, Number.MAX_SAFE_INTEGER + 1])(
		'rejects the byte limit %s',
		async (maximumBytes) => {
			await expect(
				readDiscordAvatarResponse(
					new Response('TEST_BODY', {
						headers: {
							'Content-Type': 'image/webp'
						}
					}),
					maximumBytes
				)
			).rejects.toThrow('Avatar response byte limit must be a positive safe integer.');
		}
	);
});

describe('storeAvatarSnapshot', () => {
	it('writes the source and variant as immutable objects', async () => {
		const source = createImage('TEST_SOURCE_WEBP');
		const variant = createImage('TEST_VARIANT_WEBP');
		const { bucket, objects, put } = createBucket();

		const result = await storeAvatarSnapshot(bucket, source, variant);

		const expectedDigest = await digestHex(source.bytes);

		expect(result).toEqual({
			sha256: expectedDigest,
			sourceKey: avatarSourceKey(expectedDigest),
			variantKey: avatarVariantKey(expectedDigest, 'w128'),
			sourceWasCreated: true,
			variantWasCreated: true
		});

		expect(put).toHaveBeenCalledTimes(2);

		expect(Array.from(objects[result.sourceKey].bytes)).toEqual(
			Array.from(new Uint8Array(source.bytes))
		);

		expect(Array.from(objects[result.variantKey].bytes)).toEqual(
			Array.from(new Uint8Array(variant.bytes))
		);

		for (const object of Object.values(objects)) {
			expect(object.options.onlyIf.get('If-None-Match')).toBe('*');

			expect(object.options.httpMetadata).toEqual({
				contentType: 'image/webp',
				cacheControl: 'public, max-age=31536000, immutable'
			});

			expect(new Uint8Array(object.options.sha256)).toHaveLength(32);
		}
	});

	it('reuses existing immutable objects without replacing them', async () => {
		const source = createImage('TEST_SOURCE_WEBP');
		const originalVariant = createImage('TEST_ORIGINAL_VARIANT_WEBP');
		const replacementVariant = createImage('TEST_REPLACEMENT_VARIANT_WEBP');
		const { bucket, objects } = createBucket();

		const first = await storeAvatarSnapshot(bucket, source, originalVariant);

		const originalBytes = Array.from(objects[first.variantKey].bytes);

		const second = await storeAvatarSnapshot(bucket, source, replacementVariant);

		expect(second).toMatchObject({
			sha256: first.sha256,
			sourceKey: first.sourceKey,
			variantKey: first.variantKey,
			sourceWasCreated: false,
			variantWasCreated: false
		});

		expect(Array.from(objects[first.variantKey].bytes)).toEqual(originalBytes);
	});

	it('rejects when a required object cannot be written', async () => {
		const source = createImage('TEST_SOURCE_WEBP');
		const variant = createImage('TEST_VARIANT_WEBP');

		const { bucket, objects } = createBucket((key) => key.startsWith('discord-avatars/variants/'));

		await expect(storeAvatarSnapshot(bucket, source, variant)).rejects.toThrow(
			'TEST_R2_WRITE_FAILURE'
		);

		expect(
			Object.keys(objects).filter((key) => key.startsWith('discord-avatars/sources/'))
		).toHaveLength(1);

		expect(
			Object.keys(objects).filter((key) => key.startsWith('discord-avatars/variants/'))
		).toHaveLength(0);
	});

	it('rejects empty source or variant input', async () => {
		const empty: AvatarImage = {
			bytes: new ArrayBuffer(0)
		};
		const image = createImage('TEST_WEBP');

		await expect(storeAvatarSnapshot(createBucket().bucket, empty, image)).rejects.toThrow(
			'Source avatar image must not be empty.'
		);

		await expect(storeAvatarSnapshot(createBucket().bucket, image, empty)).rejects.toThrow(
			'Variant avatar image must not be empty.'
		);
	});
});
