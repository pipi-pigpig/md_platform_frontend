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
    // 告诉打包工具这是浏览器环境
    define: {
        'process.env': {},
        'process.browser': true,
        'global': {}
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
            platform: 'neutral'
        }
    }
})