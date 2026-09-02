import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // necesario para que Electron cargue build/index.html con rutas relativas
  build: {
    outDir: 'build',
  },
  server: {
    port: 5173,
  },
});
