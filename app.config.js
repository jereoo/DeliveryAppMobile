/**
 * Dynamic Expo config - uses Heroku URL for production (Vercel),
 * falls back to app.json extra or local defaults for development.
 */
const baseConfig = require('./app.json');

const PRODUCTION_API = 'https://truck-buddy-f14f250ae8b3.herokuapp.com/api';

module.exports = () => ({
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    extra: {
      ...baseConfig.expo.extra,
      // Vercel sets VERCEL=1; use Heroku API for production builds
      BACKEND_URL: process.env.VERCEL ? PRODUCTION_API : (process.env.EXPO_PUBLIC_BACKEND_URL || baseConfig.expo.extra.BACKEND_URL),
    },
  },
});
