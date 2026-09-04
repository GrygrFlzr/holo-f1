import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param) => /^[0-9a-f]{64}$/.test(param)) satisfies ParamMatcher;
