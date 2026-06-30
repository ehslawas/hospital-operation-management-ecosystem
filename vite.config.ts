import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 3000,
    open: true,
    watch: {
      // Exclude archived folders from file watcher — they are not used at runtime
      ignored: [
        '**/src/_archived_app/**',
        '**/src/_archived_features/**',
      ],
    },
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies eagerly so the browser doesn't stall on first load
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'framer-motion',
      'recharts',
      'jspdf',
      'xlsx',
      'date-fns',
      'zustand',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})

