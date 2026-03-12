import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
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
