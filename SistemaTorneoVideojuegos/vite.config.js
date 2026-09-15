import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Coincide con FRONTEND_ORIGIN de la API; no cambiar de puerto silenciosamente.
  server: { host: 'localhost', port: 5173, strictPort: true },
})
