import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the client calls /api on its own address and Vite forwards it to the Express server,
// so no CORS setup is needed locally. In production the client calls VITE_API_URL directly (see src/api.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.DEV_API_TARGET || 'http://localhost:5000' },
  },
});
