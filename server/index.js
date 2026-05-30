/** PuppetPals Server Entry Point
 * Express + Socket.io server for real-time puppet control
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const config = require('./config');

class PuppetPalsServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.connectedClients = new Map();
  }

  /**
   * Initialize middleware
   */
  initMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json({ limit: config.assetLimits.maxFileSize }));

    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));

    // CORS support
    this.app.use(cors(config.cors));

    // Serve client static files
    this.app.use(express.static(path.resolve(config.paths.client)));

    // Serve uploaded assets
    this.app.use('/assets', express.static(path.resolve(config.paths.assets)));
  }

  /**
   * Initialize Socket.io with CORS and configuration
   */
  initSocketIO() {
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: config.cors.methods,
      },
      maxHttpBufferSize: config.socket.maxHttpBufferSize,
      pingTimeout: config.socket.pingTimeout,
      pingInterval: config.socket.pingInterval,
    });

    this.io.on('connection', (socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, {
        connectedAt: Date.now(),
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  /**
   * Initialize HTTP routes
   */
  initRoutes() {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        clientsConnected: this.connectedClients.size,
        maxPlayers: config.maxPlayers,
      });
    });
  }

  /**
   * Start the server
   */
  start() {
    // Initialize middleware and routes
    this.initMiddleware();
    this.initRoutes();

    // Create HTTP server
    this.server = http.createServer(this.app);

    // Initialize Socket.io
    this.initSocketIO();

    // Start listening
    this.server.listen(config.port, config.host, () => {
      console.log(`[PuppetPals] Server running on http://${config.host}:${config.port}`);
      console.log(`[PuppetPals] Max players: ${config.maxPlayers}`);
    });

    return this;
  }

  /**
   * Stop the server gracefully
   */
  stop() {
    return new Promise((resolve) => {
      if (this.io) {
        this.io.close();
      }
      if (this.server) {
        this.server.close(() => {
          console.log('[PuppetPals] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the number of connected clients
   */
  getConnectedCount() {
    return this.connectedClients.size;
  }
}

// Create and start server if running directly
const server = new PuppetPalsServer();
server.start();

module.exports = server;