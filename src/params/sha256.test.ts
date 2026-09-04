import { describe, expect, it } from 'vitest';
import { match } from './sha256';

const VALID_DIGEST = '0123456789abcdef'.repeat(4);

describe('sha256 route matcher', () => {
	it('accepts a lowercase SHA-256 digest', () => {
		expect(match(VALID_DIGEST)).toBe(true);
	});

	it.each([
		VALID_DIGEST.slice(1),
		`${VALID_DIGEST}0`,
		VALID_DIGEST.toUpperCase(),
		`${'0'.repeat(63)}g`,
		'TEST_INVALID_DIGEST'
	])('rejects an invalid digest', (value) => {
		expect(match(value)).toBe(false);
	});
});
