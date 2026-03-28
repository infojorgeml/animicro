import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isAdmin = mode === 'admin';

  return {
    plugins: isAdmin ? [react()] : [],
    base: isAdmin ? '/' : './',
    build: {
      outDir: isAdmin ? 'admin/dist' : 'frontend/dist',
      emptyOutDir: true,
      manifest: true,
      rollupOptions: {
        input: isAdmin
          ? { 'admin/src/main': resolve(__dirname, 'admin/src/main.tsx') }
          : { 'frontend/src/main': resolve(__dirname, 'frontend/src/main.js') },
      },
      sourcemap: false,
      minify: 'esbuild',
    },
  };
});
