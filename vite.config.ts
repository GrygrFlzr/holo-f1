import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['localhost', '.cybeast.dev']
	},
	build: {
		sourcemap: false,
		modulePreload: {
			polyfill: false
		},
		minify: 'terser',
		cssMinify: 'lightningcss',
		terserOptions: {
			ecma: 2020,
			sourceMap: false,
			module: true,
			format: {
				semicolons: false
			}
		}
	}
});
