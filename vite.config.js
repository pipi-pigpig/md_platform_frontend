import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    },
    define: {
        'process.env': {},
        'process.browser': true,
        'global': 'globalThis'
    },
    resolve: {
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
        fallback: {
            'url': false,
            'stream': false,
            'http': false,
            'https': false,
            'zlib': false,
            'util': false
        }
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
})