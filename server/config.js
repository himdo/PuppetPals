/** PuppetPals Server Configuration
 * Centralized configuration for server settings
 */

const config = {
  /** Server port (can be overridden with PORT environment variable) */
  port: parseInt(process.env.PORT, 10) || 3000,

  /** Server hostname (0.0.0.0 to listen on all interfaces) */
  host: process.env.HOST || '0.0.0.0',

  /** Maximum number of connected players */
  maxPlayers: 10,

  /** Asset upload size limits (in bytes) */
  assetLimits: {
    /** Maximum size for a single PNG image (5 MB) */
    maxImageSize: 5 * 1024 * 1024,

    /** Maximum size for a single JSON config file (512 KB) */
    maxJsonSize: 512 * 1024,

    /** Maximum file size for any upload (10 MB) */
    maxFileSize: 10 * 1024 * 1024,
  },

  /** Allowed image file extensions */
  allowedImageExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],

  /** Allowed config file extensions */
  allowedConfigExtensions: ['.json'],

  /** Paths */
  paths: {
    /** Client static files directory */
    client: './client',

    /** Server-side asset storage */
    assets: './assets',

    /** Uploaded puppet assets */
    puppets: './assets/puppets',

    /** Uploaded background assets */
    backgrounds: './assets/backgrounds',

    /** Uploaded animation assets */
    animations: './assets/animations',
  },

  /** CORS settings */
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  },

  /** Socket.io settings */
  socket: {
    /** Maximum payload size in bytes (1 MB) */
    maxHttpBufferSize: 1 * 1024 * 1024,

    /** Connection timeout in milliseconds */
    pingTimeout: 60000,

    /** Connection interval in milliseconds */
    pingInterval: 25000,
  },
};

module.exports = config;