/** Unit Tests for server/index.js
 * Tests server initialization, routes, and socket handling
 */

import http from 'http';

jest.setTimeout(10000);

describe('Server HTTP Endpoints', () => {
  let server;

  beforeAll(async () => {
    // Set a unique port for testing to avoid conflicts
    const originalPort = process.env.PORT;
    process.env.PORT = '3099';

    // Import the server module - it will auto-start
    server = await import('../server/index.js');

    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    // Stop the server after all tests
    if (server && server.default && server.default.stop) {
      await server.default.stop().catch(() => {});
    }
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
  it('should export a server instance', async () => {
    const serverModule = await import('../server/index.js');
    const server = serverModule.default;
    expect(server).toBeTruthy();
    expect(typeof server.getConnectedCount).toBe('function');
  });

  it('should have connectedClients map', async () => {
    const serverModule = await import('../server/index.js');
    const server = serverModule.default;
    expect(server.connectedClients).toBeInstanceOf(Map);
  });
});