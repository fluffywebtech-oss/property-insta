import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Respect the port assigned by the harness (autoPort) via the PORT env var;
    // fall back to Vite's default 5173 for a normal local run. strictPort:false
    // lets Vite auto-increment if the chosen port is busy.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
})
