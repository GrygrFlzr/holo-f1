import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['localhost', '.cybeast.dev']
	},
	build: {
		rollupOptions: {
			plugins: [
				terser({
					ecma: 2020,
					compress: {
						ecma: 2020,
						drop_console: true
					},
					format: {
						ecma: 2020,
						comments: false
					}
				})
			]
		}
	}
});
