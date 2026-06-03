// vite.config.ts – configure Vite with React plugin
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mui/icons-material')) return 'vendor-mui-icons';
          if (id.includes('@mui/material') || id.includes('@emotion')) return 'vendor-mui';
          if (id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('@supabase')) return 'vendor-supabase';
        },
      },
    },
  },
});
