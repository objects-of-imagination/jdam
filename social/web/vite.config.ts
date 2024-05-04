import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [ solid(), tsconfigPaths() ],
  clearScreen: false,
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3000',
      '/a': 'http://localhost:3000'
    }
  }
})
