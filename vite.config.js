import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Default fallback to local backend port 8001 (or cloud dev-api if set)
  const backendUrl = env.VITE_API_URL || 'http://localhost:8001';

  return {
    plugins: [react()],
    server: {
      port: 3005,
      host: true, // Allows access from mobile and tablets on the local network (e.g. 192.168.x.x:3005)
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 3005,
      host: true,
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
    },
  };
});
