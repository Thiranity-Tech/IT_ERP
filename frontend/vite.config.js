import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Android loads the built app from the APK's local assets directory. Relative
  // asset URLs work there as well as when the web app is hosted normally.
  base: './',
  plugins: [react()],
})
