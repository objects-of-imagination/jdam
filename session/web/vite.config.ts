import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [ solid(), tsconfigPaths() ],
  clearScreen: false,
  server: {
    host: '0.0.0.0',
    port: 3003,
    proxy: {
      '/api/v1/ws': { 
        target: 'ws://localhost:3002',
        ws: true
      },
      '/api': 'http://localhost:3002'
    }
  }
})
