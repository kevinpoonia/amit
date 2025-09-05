const { createProxyMiddleware } = require('http-proxy-middleware');

// This proxy is only used in development
// In production, Netlify redirects /api/* to https://my-fullstack-app-backend-2omq.onrender.com/api/*

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
};