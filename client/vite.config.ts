import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // El cliente llama a /api y Vite lo reenvía a la API de Express.
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
});
