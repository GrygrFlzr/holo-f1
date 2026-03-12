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
