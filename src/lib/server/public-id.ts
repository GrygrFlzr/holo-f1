const PUBLIC_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function createPublicId(): string {
	return crypto.randomUUID();
}

export function isPublicId(value: unknown): value is string {
	return typeof value === 'string' && PUBLIC_ID_PATTERN.test(value);
}
