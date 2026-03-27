import { execSync } from 'node:child_process';
import { relative, sep } from 'node:path';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		modernAst: true,
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');
			const isKitErrorPagePath = pathSegments
				.join('/')
				.endsWith('@sveltejs/kit/src/runtime/components/svelte-5/error.svelte');

			if (isKitErrorPagePath) {
				return true;
			} else if (isExternalLibrary) {
				return undefined;
			}
			// user code
			return true;
		}
	},
	kit: {
		adapter: adapter({
			platformProxy: {
				configPath: 'wrangler.jsonc',
				persist: {
					path: '.wrangler/state/v3'
				}
			}
		}),
		prerender: {
			origin: 'https://f1.kfp.yt'
		},
		version: {
			name: execSync('git rev-parse HEAD').toString().trim(),
			pollInterval: 0 // TODO: Implement UI for refreshing on update
		}
	}
};

export default config;
