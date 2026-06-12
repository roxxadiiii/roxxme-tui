import { defineConfig } from 'vite';

export default defineConfig({
    // base: '/roxxme-tui/',  // uncomment if deploying to GitHub Pages subpath
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
