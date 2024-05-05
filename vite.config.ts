import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import createVitePlugins from './vite/plugins'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const { VITE_APP_ENV } = env

  return {
    base: VITE_APP_ENV === 'production' ? '/' : '/',
    publicDir: 'public',
    plugins: createVitePlugins(),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          javascriptEnabled: true,
          additionalData: `@use "@/assets/styles/element/index.scss" as *;`
        }
      }
    },
    server: {
      host: true,
      open: true,
      proxy: {
        '/dev-api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dev-api/, '')
        }
      }
    },
    preview: {
      host: true,
      open: true,
      proxy: {
        '/prod-api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/prod-api/, '')
        }
      }
    },
    optimizeDeps: {
      include: [
        'element-plus/es/components/**/style/index',
        'lodash-es',
        'dayjs',
        'shiki',
        'markdown-it',
        '@shikijs/markdown-it/core'
      ],
      force: true
    },
    esbuild: {
      drop: VITE_APP_ENV === 'production' ? ['console', 'debugger'] : undefined
    },
    build: {
      assetsInlineLimit: 4096,
      sourcemap: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          manualChunks: {
            vueuse: ['vue', 'vue-router', 'pinia'],
            elementplus: ['element-plus']
          },
          experimentalMinChunkSize: 10000
        }
      }
    }
  }
})
