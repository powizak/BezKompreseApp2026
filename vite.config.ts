import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
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
