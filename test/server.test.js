/** Unit Tests for server/index.js
 * Tests server initialization, routes, and socket handling
 */

const http = require('http');

jest.setTimeout(10000);

describe('Server HTTP Endpoints', () => {
  let server;

  beforeAll(async () => {
    // Set a unique port for testing to avoid conflicts
    const originalPort = process.env.PORT;
    process.env.PORT = '3099';

    // Clear module cache to reload config with new port
    delete require.cache[require.resolve('../server/config')];
    delete require.cache[require.resolve('../server/index.js')];

    // Import the server module - it will auto-start
    server = require('../server/index.js');

    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    // Stop the server after all tests
    if (server && server.stop) {
      await server.stop().catch(() => {});
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

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
    expect(typeof response.data.clientsConnected).toBe('number');
    expect(typeof response.data.maxPlayers).toBe('number');
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

    expect(response.status).toBe(200);
    expect(response.data).toContain('PuppetPals');
    expect(response.data).toContain('join-screen');
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

    expect(response.status).toBe(200);
    expect(response.contentType).toContain('text/css');
    expect(response.data).toContain('loading-screen');
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

    expect(response.status).toBe(404);
  });
});

describe('Server Configuration', () => {
  it('should export a server instance', () => {
    const server = require('../server/index.js');
    expect(server).toBeTruthy();
    expect(typeof server.getConnectedCount).toBe('function');
  });

  it('should have connectedClients map', () => {
    const server = require('../server/index.js');
    expect(server.connectedClients).toBeInstanceOf(Map);
  });
});