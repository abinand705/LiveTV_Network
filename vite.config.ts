import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.FORMCONNECT_API_KEY': JSON.stringify(
        env.VITE_FORMCONNECT_API_KEY || env.FORMCONNECT_API_KEY || 'fc_live_eb39235f9e0abdc47e5e372e14765187'
      ),
      'process.env.FORMCONNECT_API_URL': JSON.stringify(
        env.VITE_FORMCONNECT_API_URL || env.FORMCONNECT_API_URL || 'https://formconnect.onrender.com'
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
