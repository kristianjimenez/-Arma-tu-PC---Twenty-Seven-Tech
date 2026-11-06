import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  // Ruta relativa: funciona en localhost y en GitHub Pages (https://usuario.github.io/repo/)
  base: './',
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  // `npm run dev` no incluye la API: se reenvían las llamadas /api a la página ya desplegada
  // (que está conectada a PostgreSQL), así el login, los builds y los pedidos también funcionan en local.
  server: {
    proxy: {
      '/api': { target: 'https://arma-tu-pc-twenty-seven-tech.vercel.app', changeOrigin: true, secure: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
})
