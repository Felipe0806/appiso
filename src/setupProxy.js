// src/setupProxy.js
require('dotenv').config()
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(
    '/api/generate-case',
    createProxyMiddleware({
      target: 'https://generativelanguage.googleapis.com',
      changeOrigin: true,
      secure: true,
      pathRewrite: {
        // /api/generate-case → 
        // /v1beta/models/gemini-2.0-flash:generateContent?key=TU_CLAVE
        '^/api/generate-case': `/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`
      },
    })
  )
}
