import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			strict: false,
			pages: 'build',
			assets: 'build',
			fallback: 'index.html'  // or 'index.html' for SPA fallback
		}),
	},
	vite: {
		server: {
			hmr: {
				preserveLocalState: true
			}
		},
		build: {
			minify: 'esbuild', // Ensure minification
			target: 'es2018', // Set target if needed
		}
	}
};

export default config;
