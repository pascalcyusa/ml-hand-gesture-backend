import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy is no longer needed as we use VITE_API_URL for direct backend calls
    // Ensure your backend has CORS configured to allow the frontend origin
    port: 5173,
  },
  build: {
    sourcemap: true
  }
})
