import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-firebase': ['firebase', '@firebase/firestore', '@firebase/auth', '@firebase/storage'],
                    'vendor-leaflet': ['leaflet', 'react-leaflet', 'leaflet.markercluster'],
                    'vendor-charts': ['recharts'],
                    'vendor-effect': ['effect'],
                }
            }
        },
        chunkSizeWarningLimit: 600,
    }
})
