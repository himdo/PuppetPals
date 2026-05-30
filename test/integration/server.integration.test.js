/** Server Integration Tests
 * Tests real HTTP endpoints and Socket.io event flows against a live server instance.
 * These tests start a real PuppetPalsServer on a random port.
 */

import request from 'supertest';
import { io as ioc } from 'socket.io-client';
import { startTestServer, stopTestServer } from './test-server.js';

// Increase timeout for integration tests that start/stop servers
jest.setTimeout(15000);

/**
 * Helper: Connect a socket.io client and join with a nickname
 * @param {string} baseUrl - Server base URL
 * @param {string} nickname - Nickname to join with
 * @param {Array} clientsRef - Array to track clients for cleanup
 * @returns {Promise<{client, data, error}>}
 */
function connectClient(baseUrl, nickname, clientsRef = []) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
    const client = ioc(baseUrl, {
      transports: ['websocket'],
      reconnection: false,
    });

    client.on('connect', () => {
      client.emit('request-join', { nickname });
    });

    client.on('join-confirmed', (data) => {
      clearTimeout(timeout);
      resolve({ client, data });
    });

    client.on('nickname-taken', (data) => {
      clearTimeout(timeout);
      resolve({ client, data, error: 'nickname-taken' });
    });

    client.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (clientsRef) clientsRef.push(client);
  });
}

/**
 * Helper: Register a player in the game state by sending move-puppet
 */
function registerPuppet(client, nickname) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Register puppet timeout')), 5000);
    client.once('puppet-moved', (data) => {
      clearTimeout(timeout);
      resolve(data);
    });
    client.emit('move-puppet', {
      puppetId: `puppet-${nickname}`,
      location: 'center',
    });
  });
}

/**
 * Helper: Disconnect all tracked clients
 */
function disconnectAll(clients) {
  for (const c of clients) {
    try { c.disconnect(); } catch (_) { /* ignore */ }
  }
}

// A sample animation object matching the server's expected format
const SAMPLE_ANIMATION = {
  id: 'test-idle',
  name: 'Test Idle',
  duration: 1000,
  loop: true,
  keyframes: [],
};

// ---------------------------------------------------------------------------
// Layer 1: HTTP Endpoints
// ---------------------------------------------------------------------------
describe('Server Integration - HTTP Endpoints', () => {
  let testServer;

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer(testServer);
  });

  describe('GET /api/health', () => {
    it('should return 200 with ok status', async () => {
      const res = await request(testServer.server.getApp()).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('clientsConnected');
      expect(res.body).toHaveProperty('playersConnected');
      expect(res.body).toHaveProperty('maxPlayers');
    });

    it('should report maxPlayers from config', async () => {
      const res = await request(testServer.server.getApp()).get('/api/health');
      expect(res.body.maxPlayers).toBeGreaterThan(0);
    });
  });

  describe('GET /api/assets/manifest', () => {
    it('should return 200 with asset manifest', async () => {
      const res = await request(testServer.server.getApp()).get('/api/assets/manifest');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('puppets');
      expect(res.body).toHaveProperty('backgrounds');
    });
  });

  describe('GET /api/assets/puppets', () => {
    it('should return 200 with available puppets', async () => {
      const res = await request(testServer.server.getApp()).get('/api/assets/puppets');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/assets/search', () => {
    it('should return 200 with search results', async () => {
      const res = await request(testServer.server.getApp()).get('/api/assets/search?q=test');
      expect(res.status).toBe(200);
    });

    it('should return 200 with empty query', async () => {
      const res = await request(testServer.server.getApp()).get('/api/assets/search');
      expect(res.status).toBe(200);
    });
  });

  describe('Static File Serving', () => {
    it('should serve the client index.html', async () => {
      const res = await request(testServer.server.getApp()).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('PuppetPals');
      expect(res.text).toContain('join-screen');
    });

    it('should serve CSS files', async () => {
      const res = await request(testServer.server.getApp()).get('/css/main.css');
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/css');
    });

    it('should serve client JS files', async () => {
      const res = await request(testServer.server.getApp()).get('/js/main.js');
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('javascript');
    });
  });
});

// ---------------------------------------------------------------------------
// Layer 1: Socket.io Connection & Join Flow
// ---------------------------------------------------------------------------
describe('Server Integration - Socket.io Connection', () => {
  let testServer;
  let clients = [];

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    disconnectAll(clients);
    clients = [];
    await stopTestServer(testServer);
  });

  describe('Client Connection & Join Flow', () => {
    it('should allow first client to join and become owner', async () => {
      const { data, error } = await connectClient(testServer.baseUrl, 'TestOwner', clients);
      expect(error).toBeUndefined();
      expect(data.role).toBe('owner');
      expect(data.nickname).toBe('TestOwner');
      expect(Array.isArray(data.players)).toBe(true);
    });

    it('should allow second client to join as client role', async () => {
      const { data, error } = await connectClient(testServer.baseUrl, 'TestClient1', clients);
      expect(error).toBeUndefined();
      expect(data.role).toBe('client');
      expect(data.nickname).toBe('TestClient1');
    });

    it('should reject duplicate nickname', async () => {
      const { data, error } = await connectClient(testServer.baseUrl, 'TestClient1', clients);
      expect(error).toBe('nickname-taken');
      expect(data).toHaveProperty('message');
    });
  });

  describe('Multi-Client Communication', () => {
    let clientA, clientB;

    beforeAll(async () => {
      const r1 = await connectClient(testServer.baseUrl, 'MultiA', clients);
      const r2 = await connectClient(testServer.baseUrl, 'MultiB', clients);
      clientA = r1.client;
      clientB = r2.client;
    });

    afterAll(() => {
      if (clientA) clientA.disconnect();
      if (clientB) clientB.disconnect();
    });

    it('should broadcast player-disconnected when a client disconnects', async () => {
      const { client: clientC } = await connectClient(testServer.baseUrl, 'MultiC', clients);

      const disconnectPromise = new Promise((resolve) => {
        clientA.once('player-disconnected', (data) => resolve(data));
      });

      clientC.disconnect();

      const data = await Promise.race([
        disconnectPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for disconnect')), 5000)),
      ]);

      expect(data).toBeDefined();
    });

    it('should have both clients connected with valid socket IDs', () => {
      expect(clientA.connected).toBe(true);
      expect(clientB.connected).toBe(true);
      expect(clientA.id).not.toBe(clientB.id);
    });
  });

  describe('Server Capacity', () => {
    it('should track connected player count correctly via health endpoint', async () => {
      const res = await request(testServer.server.getApp()).get('/api/health');
      expect(res.body.playersConnected).toBeGreaterThan(0);
      expect(res.body.clientsConnected).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Layer 2: Animation Events
// ---------------------------------------------------------------------------
describe('Server Integration - Animation Events', () => {
  let testServer;
  let clients = [];

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    disconnectAll(clients);
    clients = [];
    await stopTestServer(testServer);
  });

  it('should broadcast animation-started when authenticated user starts animation', async () => {
    const r1 = await connectClient(testServer.baseUrl, 'AnimOwner', clients);
    const r2 = await connectClient(testServer.baseUrl, 'AnimWatcher', clients);

    const ownerClient = r1.client;
    const watcherClient = r2.client;

    // Watcher listens for animation-started
    const animationStartedPromise = new Promise((resolve) => {
      watcherClient.once('animation-started', (data) => resolve(data));
    });

    // Owner starts an animation with correct payload: { puppetId, animation }
    ownerClient.emit('start-animation', {
      puppetId: 'puppet-test',
      animation: SAMPLE_ANIMATION,
    });

    const data = await Promise.race([
      animationStartedPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for animation-started')), 5000)),
    ]);

    expect(data).toBeDefined();
    expect(data.puppetId).toBe('puppet-test');
    expect(data.animation.id).toBe('test-idle');
  });

  it('should reject start-animation from unauthenticated socket', async () => {
    // Connect without joining
    const rawClient = ioc(testServer.baseUrl, {
      transports: ['websocket'],
      reconnection: false,
    });
    clients.push(rawClient);

    const errorPromise = new Promise((resolve) => {
      rawClient.once('animation-error', (data) => resolve(data));
    });

    rawClient.emit('start-animation', {
      puppetId: 'puppet-test',
      animation: SAMPLE_ANIMATION,
    });

    const data = await Promise.race([
      errorPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for animation-error')), 5000)),
    ]);

    expect(data).toBeDefined();
    expect(data.message).toContain('authenticated');
    rawClient.disconnect();
  });

  it('should handle stop-animation event', async () => {
    const r1 = await connectClient(testServer.baseUrl, 'StopOwner', clients);

    const ownerClient = r1.client;

    // Owner starts then stops
    ownerClient.emit('start-animation', { puppetId: 'puppet-test', animation: SAMPLE_ANIMATION });
    await new Promise((r) => setTimeout(r, 300));
    ownerClient.emit('stop-animation', { puppetId: 'puppet-test' });

    await new Promise((r) => setTimeout(r, 500));

    // Verify client is still connected
    expect(ownerClient.connected).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Layer 2: Admin Events (single owner shared across tests)
// ---------------------------------------------------------------------------
describe('Server Integration - Admin Events', () => {
  let testServer;
  let clients = [];
  let ownerClient;
  let ownerSessionId;

  beforeAll(async () => {
    testServer = await startTestServer();
    // Connect owner first so this socket is the owner
    const r = await connectClient(testServer.baseUrl, 'AdminOwner', clients);
    ownerClient = r.client;
    ownerSessionId = r.data.sessionId;
  });

  afterAll(async () => {
    disconnectAll(clients);
    clients = [];
    await stopTestServer(testServer);
  });

  it('should allow owner to lock a puppet', async () => {
    const r2 = await connectClient(testServer.baseUrl, 'LockTarget', clients);
    const targetClient = r2.client;

    // Register target in game state by moving puppet
    await registerPuppet(targetClient, 'LockTarget');
    await new Promise((r) => setTimeout(r, 300));

    // Get target's sessionId from the player list
    const targetSessionId = r2.data.players.find(p => p.nickname === 'LockTarget')?.sessionId;

    // Target listens for state-update (the lock event broadcast)
    const lockPromise = new Promise((resolve) => {
      targetClient.once('state-update', (data) => {
        if (data.isLocked === true) resolve(data);
      });
    });

    // Owner locks target puppet
    ownerClient.emit('admin-lock-puppet', {
      playerId: targetSessionId,
      lock: true,
    });

    const data = await Promise.race([
      lockPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for lock state-update')), 5000)),
    ]);

    expect(data).toBeDefined();
    expect(data.isLocked).toBe(true);
  });

  it('should allow owner to change background', async () => {
    const r2 = await connectClient(testServer.baseUrl, 'BgWatcher', clients);
    const watcherClient = r2.client;

    // Watcher listens for background-changed
    const bgPromise = new Promise((resolve) => {
      watcherClient.once('background-changed', (data) => resolve(data));
    });

    // Owner changes background
    ownerClient.emit('admin-change-background', {
      background: 'test-bg.png',
    });

    const data = await Promise.race([
      bgPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for background-changed')), 5000)),
    ]);

    expect(data).toBeDefined();
    expect(data.background).toBe('test-bg.png');
  });
});

// ---------------------------------------------------------------------------
// Layer 2: Admin Non-Owner Rejection
// ---------------------------------------------------------------------------
describe('Server Integration - Admin Non-Owner Rejection', () => {
  let testServer;
  let clients = [];

  beforeAll(async () => {
    testServer = await startTestServer();
    // Connect a dummy owner first
    await connectClient(testServer.baseUrl, 'DummyOwnerForAdmin', clients);
  });

  afterAll(async () => {
    disconnectAll(clients);
    clients = [];
    await stopTestServer(testServer);
  });

  it('should reject admin actions from non-owner', async () => {
    const r = await connectClient(testServer.baseUrl, 'FakeAdmin', clients);
    const fakeAdmin = r.client;

    const errorPromise = new Promise((resolve) => {
      fakeAdmin.once('admin-error', (data) => resolve(data));
    });

    fakeAdmin.emit('admin-eject-player', { playerId: 'some-player' });

    const data = await Promise.race([
      errorPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for admin-error')), 5000)),
    ]);

    expect(data).toBeDefined();
    expect(data.message).toContain('owner');
  });
});

// ---------------------------------------------------------------------------
// Layer 2: Puppet Movement
// ---------------------------------------------------------------------------
describe('Server Integration - Puppet Movement', () => {
  let testServer;
  let clients = [];

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    disconnectAll(clients);
    clients = [];
    await stopTestServer(testServer);
  });

  it('should broadcast puppet-moved when authenticated user moves puppet', async () => {
    const r1 = await connectClient(testServer.baseUrl, 'MoveOwner', clients);
    const r2 = await connectClient(testServer.baseUrl, 'MoveWatcher', clients);

    const ownerClient = r1.client;
    const watcherClient = r2.client;

    // Watcher listens for puppet-moved
    const movedPromise = new Promise((resolve) => {
      watcherClient.once('puppet-moved', (data) => resolve(data));
    });

    // Owner moves puppet
    ownerClient.emit('move-puppet', {
      puppetId: 'puppet-moveowner',
      location: 'center',
    });

    const data = await Promise.race([
      movedPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for puppet-moved')), 5000)),
    ]);

    expect(data).toBeDefined();
    expect(data).toHaveProperty('position');
  });

  it('should reject move-puppet from unauthenticated socket', async () => {
    const rawClient = ioc(testServer.baseUrl, {
      transports: ['websocket'],
      reconnection: false,
    });
    clients.push(rawClient);

    const errorPromise = new Promise((resolve) => {
      rawClient.once('movement-error', (data) => resolve(data));
    });

    rawClient.emit('move-puppet', { puppetId: 'test', location: 'center' });

    const data = await Promise.race([
      errorPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for movement-error')), 5000)),
    ]);

    expect(data).toBeDefined();
    expect(data.message).toContain('authenticated');
    rawClient.disconnect();
  });
});

// ---------------------------------------------------------------------------
// Layer 2: State Sync on Connect
// ---------------------------------------------------------------------------
describe('Server Integration - State Sync', () => {
  let testServer;
  let clients = [];

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    disconnectAll(clients);
    clients = [];
    await stopTestServer(testServer);
  });

  it('should receive player list with existing players on new connection', async () => {
    // First, connect two players
    await connectClient(testServer.baseUrl, 'StatePlayer1', clients);
    await connectClient(testServer.baseUrl, 'StatePlayer2', clients);
    await new Promise((r) => setTimeout(r, 500)); // Let state settle

    // Connect a third player and check join-confirmed includes player list
    const { data } = await connectClient(testServer.baseUrl, 'StatePlayer3', clients);

    expect(data).toBeDefined();
    expect(Array.isArray(data.players)).toBe(true);
    expect(data.players.length).toBeGreaterThanOrEqual(2);
  });
});