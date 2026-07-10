import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function vercelApiCompat() {
  return {
    name: 'alohandote-vercel-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/rates', async (req, res) => {
        try {
          const mod = await import('./api/rates.js?ts=' + Date.now())
          const compatRes = {
            statusCode: 200,
            headers: {},
            setHeader(name, value) { res.setHeader(name, value) },
            status(code) { this.statusCode = code; res.statusCode = code; return this },
            json(payload) {
              res.statusCode = this.statusCode || 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify(payload))
            },
            end(payload = '') {
              res.statusCode = this.statusCode || 200
              res.end(payload)
            },
          }
          await mod.default(req, compatRes)
        } catch (error) {
          console.error('[dev:/api/rates]', error)
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ success: false, message: error.message || 'No se pudo consultar tasa BCV en desarrollo local' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), vercelApiCompat()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
