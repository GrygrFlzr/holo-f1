const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

const AVATAR_CONTENT_TYPE = 'image/webp';
const AVATAR_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export type AvatarVariant = 'w128';

export interface AvatarImage {
	bytes: ArrayBuffer;
}

export interface AvatarSnapshotPutOptions {
	onlyIf: {
		etagDoesNotMatch: '*';
	};
	httpMetadata: {
		contentType: typeof AVATAR_CONTENT_TYPE;
		cacheControl: typeof AVATAR_CACHE_CONTROL;
	};
	sha256: ArrayBuffer;
}

export interface AvatarSnapshotBucket {
	put(key: string, value: ArrayBuffer, options: AvatarSnapshotPutOptions): Promise<unknown | null>;
}

export interface AvatarSnapshotStorageResult {
	sha256: string;
	sourceKey: string;
	variantKey: string;
	sourceWasCreated: boolean;
	variantWasCreated: boolean;
}

const DISCORD_AVATAR_SOURCE_SIZE = 512;
const DISCORD_AVATAR_VARIANT_SIZE = 128;

export const DISCORD_AVATAR_MAXIMUM_BYTES = 2 * 1024 * 1024;

type DiscordAvatarSize = typeof DISCORD_AVATAR_SOURCE_SIZE | typeof DISCORD_AVATAR_VARIANT_SIZE;

export type AvatarSnapshotFetch = (url: string) => Promise<Response>;

export interface CaptureDiscordAvatarSnapshotOptions {
	bucket: AvatarSnapshotBucket;
	discordId: string;
	avatarHash: string;
	fetchAvatar?: AvatarSnapshotFetch;
	maximumBytes?: number;
}

export interface ResolveDiscordAvatarSnapshotOptions {
	bucket: AvatarSnapshotBucket | undefined;
	discordId: string;
	avatarHash: string | null;
	previousAvatarHash: string | null;
	previousSnapshotSha256: string | null;
	fetchAvatar?: AvatarSnapshotFetch;
	maximumBytes?: number;
}

export interface DiscordAvatarSnapshotResolution {
	sha256: string | null;
	captureError: unknown | null;
}

function assertSha256Hex(sha256: string): void {
	if (!SHA256_HEX_PATTERN.test(sha256)) {
		throw new TypeError('Avatar snapshot digest must be 64-character lowercase hexadecimal text.');
	}
}

function assertMaximumBytes(maximumBytes: number): void {
	if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
		throw new RangeError('Avatar response byte limit must be a positive safe integer.');
	}
}

function assertNonEmptyImage(image: AvatarImage, name: string): void {
	if (image.bytes.byteLength === 0) {
		throw new RangeError(`${name} avatar image must not be empty.`);
	}
}

async function readBoundedBody(response: Response, maximumBytes: number): Promise<ArrayBuffer> {
	if (!response.body) {
		throw new Error('Avatar response has no body.');
	}

	const reader = response.body.getReader();
	const chunks: Uint8Array<ArrayBuffer>[] = [];
	let byteLength = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			byteLength += value.byteLength;

			if (byteLength > maximumBytes) {
				await reader.cancel().catch(() => undefined);

				throw new RangeError(`Avatar response exceeds the ${maximumBytes}-byte limit.`);
			}

			const chunk = new Uint8Array(value.byteLength);
			chunk.set(value);
			chunks.push(chunk);
		}
	} finally {
		reader.releaseLock();
	}

	if (byteLength === 0) {
		throw new RangeError('Avatar response body must not be empty.');
	}

	const bytes = new ArrayBuffer(byteLength);
	const output = new Uint8Array(bytes);
	let offset = 0;

	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.byteLength;
	}

	return bytes;
}

async function sha256(bytes: ArrayBuffer): Promise<ArrayBuffer> {
	return crypto.subtle.digest('SHA-256', bytes);
}

function hexadecimal(bytes: ArrayBuffer): string {
	return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function putImmutable(
	bucket: AvatarSnapshotBucket,
	key: string,
	bytes: ArrayBuffer,
	checksum: ArrayBuffer
): Promise<boolean> {
	const result = await bucket.put(key, bytes, {
		onlyIf: {
			etagDoesNotMatch: '*'
		},
		httpMetadata: {
			contentType: AVATAR_CONTENT_TYPE,
			cacheControl: AVATAR_CACHE_CONTROL
		},
		sha256: checksum
	});

	return result !== null;
}

export function avatarSourceKey(sha256Digest: string): string {
	assertSha256Hex(sha256Digest);

	return `discord-avatars/sources/sha256/${sha256Digest}.webp`;
}

export function avatarVariantKey(sha256Digest: string, variant: AvatarVariant): string {
	assertSha256Hex(sha256Digest);

	return `discord-avatars/variants/v1/${sha256Digest}/${variant}.webp`;
}

export async function readDiscordAvatarResponse(
	response: Response,
	maximumBytes: number
): Promise<AvatarImage> {
	assertMaximumBytes(maximumBytes);

	if (!response.ok) {
		throw new Error(`Discord avatar request failed with HTTP ${response.status}.`);
	}

	const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();

	if (contentType !== AVATAR_CONTENT_TYPE) {
		throw new TypeError(`Discord avatar response must have Content-Type ${AVATAR_CONTENT_TYPE}.`);
	}

	const contentLengthHeader = response.headers.get('content-length')?.trim();

	if (contentLengthHeader !== undefined) {
		if (!/^\d+$/.test(contentLengthHeader)) {
			throw new TypeError('Discord avatar response has an invalid Content-Length.');
		}

		const contentLength = Number(contentLengthHeader);

		if (!Number.isSafeInteger(contentLength)) {
			throw new RangeError(
				'Discord avatar response Content-Length exceeds the safe integer range.'
			);
		}

		if (contentLength > maximumBytes) {
			throw new RangeError(`Discord avatar response exceeds the ${maximumBytes}-byte limit.`);
		}
	}

	return {
		bytes: await readBoundedBody(response, maximumBytes)
	};
}

export async function storeAvatarSnapshot(
	bucket: AvatarSnapshotBucket,
	source: AvatarImage,
	variant: AvatarImage
): Promise<AvatarSnapshotStorageResult> {
	assertNonEmptyImage(source, 'Source');
	assertNonEmptyImage(variant, 'Variant');

	const [sourceChecksum, variantChecksum] = await Promise.all([
		sha256(source.bytes),
		sha256(variant.bytes)
	]);

	const sha256Digest = hexadecimal(sourceChecksum);
	const sourceKey = avatarSourceKey(sha256Digest);
	const variantKey = avatarVariantKey(sha256Digest, 'w128');

	const [sourceWasCreated, variantWasCreated] = await Promise.all([
		putImmutable(bucket, sourceKey, source.bytes, sourceChecksum),
		putImmutable(bucket, variantKey, variant.bytes, variantChecksum)
	]);

	return {
		sha256: sha256Digest,
		sourceKey,
		variantKey,
		sourceWasCreated,
		variantWasCreated
	};
}

function discordAvatarUrl(discordId: string, avatarHash: string, size: DiscordAvatarSize): string {
	const url = new URL(
		`https://cdn.discordapp.com/avatars/${encodeURIComponent(
			discordId
		)}/${encodeURIComponent(avatarHash)}.webp`
	);

	url.searchParams.set('size', String(size));

	return url.toString();
}

export async function captureDiscordAvatarSnapshot(
	options: CaptureDiscordAvatarSnapshotOptions
): Promise<AvatarSnapshotStorageResult> {
	const fetchAvatar = options.fetchAvatar ?? fetch;
	const maximumBytes = options.maximumBytes ?? DISCORD_AVATAR_MAXIMUM_BYTES;

	const [sourceResponse, variantResponse] = await Promise.all([
		fetchAvatar(
			discordAvatarUrl(options.discordId, options.avatarHash, DISCORD_AVATAR_SOURCE_SIZE)
		),
		fetchAvatar(
			discordAvatarUrl(options.discordId, options.avatarHash, DISCORD_AVATAR_VARIANT_SIZE)
		)
	]);

	const [source, variant] = await Promise.all([
		readDiscordAvatarResponse(sourceResponse, maximumBytes),
		readDiscordAvatarResponse(variantResponse, maximumBytes)
	]);

	return storeAvatarSnapshot(options.bucket, source, variant);
}

export async function resolveDiscordAvatarSnapshot(
	options: ResolveDiscordAvatarSnapshotOptions
): Promise<DiscordAvatarSnapshotResolution> {
	if (options.avatarHash === null) {
		return {
			sha256: null,
			captureError: null
		};
	}

	if (
		options.avatarHash === options.previousAvatarHash &&
		options.previousSnapshotSha256 !== null
	) {
		return {
			sha256: options.previousSnapshotSha256,
			captureError: null
		};
	}

	if (!options.bucket) {
		return {
			sha256: null,
			captureError: new Error('Avatar snapshot bucket is not available.')
		};
	}

	try {
		const snapshot = await captureDiscordAvatarSnapshot({
			bucket: options.bucket,
			discordId: options.discordId,
			avatarHash: options.avatarHash,
			fetchAvatar: options.fetchAvatar,
			maximumBytes: options.maximumBytes
		});

		return {
			sha256: snapshot.sha256,
			captureError: null
		};
	} catch (captureError) {
		return {
			sha256: null,
			captureError
		};
	}
}
