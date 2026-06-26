import { execSync } from 'node:child_process';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
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
			},
			experimental: {
				explicitEnvironmentVariables: true
			},
			compilerOptions: {
				modernAst: true,
				runes: true
			}
		})
	],
	oxc: {
		// we don't use JSX, so skip
		jsx: 'preserve'
	},
	worker: {
		format: 'es'
	},
	build: {
		target: [
			// firefox140 is currently supported oldest Firefox ESR
			// so we use Baseline 2024 which specifies versions before it
			// as Baseline 2025 specifies newer than in-support ESR
			'chrome130',
			'edge130',
			'firefox132',
			'safari18.2'
		],
		reportCompressedSize: false,
		sourcemap: false,
		modulePreload: {
			polyfill: false
		},
		rolldownOptions: {
			output: {
				comments: false,
				minify: true
			}
		}
	}
});
