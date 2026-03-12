import { execSync } from 'node:child_process';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		modernAst: true
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
