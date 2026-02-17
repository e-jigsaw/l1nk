import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tiptap': ['@tiptap/react', '@tiptap/pm', '@tiptap/starter-kit', '@tiptap/core'],
          'yjs': ['yjs', 'y-protocols', 'lib0'],
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
