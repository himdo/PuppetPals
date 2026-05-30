/** Unit Tests for server/index.js
 * Tests server initialization, routes, and socket handling
 */

const assert = require('node:assert');
const { describe, it, beforeEach, afterEach } = require('node:test');
const http = require('http');

// We need to test the PuppetPalsServer class without it auto-starting
// Since server/index.js auto-starts, we'll test via HTTP requests

describe('Server HTTP Endpoints', () => {
  let server;
  let httpServer;

  beforeEach((ctx) => {
    // Set a unique port for testing to avoid conflicts
    const originalPort = process.env.PORT;
    process.env.PORT = '3099';

    // Clear module cache to reload config with new port
    delete require.cache[require.resolve('../server/config')];
    delete require.cache[require.resolve('../server/index.js')];

    // Import the server module - it will auto-start
    // We need to prevent the default start, so we test the health endpoint
    server = require('../server/index.js');

    // Give the server time to start
    ctx.setTimeout(5000);
  });

  afterEach(() => {
    // Stop the server after each test
    if (server && server.stop) {
      server.stop().catch(() => {});
    }

    // Clean up module cache
    delete require.cache[require.resolve('../server/config')];
    delete require.cache[require.resolve('../server/index.js')];
  });

  it('should respond to health check endpoint', async () => {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3099/api/health', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        });
      });
      req.on('error', reject);
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.status, 'ok');
    assert.ok(typeof response.data.clientsConnected === 'number');
    assert.ok(typeof response.data.maxPlayers === 'number');
  });

  it('should serve client index.html', async () => {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3099/', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data });
        });
      });
      req.on('error', reject);
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.includes('PuppetPals'));
    assert.ok(response.data.includes('loading-screen'));
  });

  it('should serve client CSS file', async () => {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3099/css/main.css', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data, contentType: res.headers['content-type'] });
        });
      });
      req.on('error', reject);
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.contentType.includes('text/css'));
    assert.ok(response.data.includes('loading-screen'));
  });

  it('should return 404 for non-existent routes', async () => {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3099/nonexistent', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data });
        });
      });
      req.on('error', reject);
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    assert.strictEqual(response.status, 404);
  });
});

describe('Server Configuration', () => {
  it('should export a server instance', () => {
    const server = require('../server/index.js');
    assert.ok(server);
    assert.ok(typeof server.getConnectedCount === 'function');
  });

  it('should have connectedClients map', () => {
    const server = require('../server/index.js');
    assert.ok(server.connectedClients instanceof Map);
  });
});