import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine if we're in development mode
  const isDev = mode === 'development';
  
  // Get the base URL from environment variables or use default
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:3002';
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: isDev ? {
        // In development, proxy API requests to the backend
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      } : undefined,
    },
    define: {
      'process.env': {},
      // Make environment variables available to the app
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || '/api')
    },
    build: {
      outDir: 'dist',
      sourcemap: isDev,
    },
  };
});
