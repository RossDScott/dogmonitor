import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    server: {
        port: 4001,
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/*.svg'],
            manifest: {
                name: 'DogMonitor',
                short_name: 'DogMonitor',
                description: 'Monitor your dog in the car',
                theme_color: '#1a1a2e',
                background_color: '#1a1a2e',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.blob\.core\.windows\.net\/.*/i,
                        handler: 'NetworkOnly',
                    },
                ],
            },
        }),
    ],
})
