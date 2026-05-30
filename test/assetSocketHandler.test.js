/** Unit Tests for Asset Socket Events in socket-handler.js
 * Tests upload-asset, asset-uploaded, asset-manifest, delete-asset events
 */

import SocketHandler from '../server/socket-handler.js';
import AuthManager from '../server/auth-manager.js';
import SocketEvents from '../shared/protocols.js';

// Mock AssetManager
function createMockAssetManager() {
  const assets = new Map();
  return {
    addAsset: jest.fn((fileName, data, category, subGroup) => {
      // Reject invalid categories
      const validCategories = ['puppets', 'backgrounds', 'animations'];
      if (!validCategories.includes(category)) {
        return { success: false, error: 'Invalid asset category' };
      }
      const id = 'asset-' + Date.now();
      assets.set(id, { id, name: fileName, category, subGroup, size: data.length, path: `${category}/${fileName}` });
      return { success: true, assetId: id, path: `${category}/${fileName}`, name: fileName, size: data.length, uploadedAt: Date.now() };
    }),
    deleteAsset: jest.fn((assetId, category) => {
      if (assets.has(assetId)) {
        assets.delete(assetId);
        return { success: true };
      }
      // Also allow deletion by test IDs for owner tests
      if (assetId === 'test-asset-id' || assetId === 'test-id') {
        return { success: true };
      }
      return { success: false, error: 'Asset not found' };
    }),
    getAssetManifest: jest.fn(() => ({
      puppets: [],
      backgrounds: [],
      animations: [],
    })),
    getAllAssets: jest.fn(() => Array.from(assets.values())),
    getAsset: jest.fn((id) => assets.get(id) || null),
  };
}

// Mock socket object for testing
function createMockSocket(id) {
  const emitted = {};
  const handlers = {};
  return {
    id,
    emit(event, data) {
      emitted[event] = data;
      emitted._lastEvent = event;
    },
    getEmitted(event) {
      return emitted[event] || null;
    },
    getLastEvent() {
      return emitted._lastEvent || null;
    },
    on(event, handler) {
      handlers[event] = handler;
    },
    getHandler(event) {
      return handlers[event] || null;
    },
    to: function () { return this; },
  };
}

// Mock io object for testing
function createMockIO() {
  const sockets = new Map();
  const broadcastLogs = [];
  return {
    sockets: {
      fetchSockets: async () => [],
    },
    to: (room) => ({
      emit: (event, data) => {
        broadcastLogs.push({ event, data, room });
      },
    }),
    emit(event, data) {
      broadcastLogs.push({ event, data, broadcast: true });
    },
    on: function (event, handler) {
      this['_' + event] = handler;
    },
    getSockets() {
      return sockets;
    },
    getBroadcastLogs() {
      return broadcastLogs;
    },
    clearBroadcastLogs() {
      broadcastLogs.length = 0;
    },
  };
}

describe('SocketHandler Asset Events', () => {
  let io, auth, handler, assetManager;

  beforeEach(() => {
    io = createMockIO();
    auth = new AuthManager(10);
    assetManager = createMockAssetManager();
    handler = new SocketHandler(io, auth);
    handler.assetManager = assetManager;
    handler.registerEvents();
  });

  describe('upload-asset event', () => {
    it('should require authentication before uploading', () => {
      const mockSocket = createMockSocket('upload-sock');
      io.getSockets().set('upload-sock', mockSocket);
      io._connection(mockSocket);

      const uploadHandler = mockSocket.getHandler(SocketEvents.UPLOAD_ASSET);
      expect(uploadHandler).toBeTruthy();

      // Try to upload without joining
      uploadHandler({ fileName: 'test.png', data: 'base64data', category: 'backgrounds' });

      const errorEmitted = mockSocket.getEmitted(SocketEvents.UPLOAD_ERROR);
      expect(errorEmitted).toBeTruthy();
      expect(errorEmitted.message).toContain('authenticated');
    });

    it('should only allow owner to upload assets', () => {
      const mockSocket = createMockSocket('client-sock');
      io.getSockets().set('client-sock', mockSocket);
      io._connection(mockSocket);

      // Join as second player (client role)
      auth.addPlayer('owner-sock', 'OwnerUser');
      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'ClientUser' });

      const uploadHandler = mockSocket.getHandler(SocketEvents.UPLOAD_ASSET);
      uploadHandler({ fileName: 'test.png', data: 'base64data', category: 'backgrounds' });

      const errorEmitted = mockSocket.getEmitted(SocketEvents.UPLOAD_ERROR);
      expect(errorEmitted).toBeTruthy();
      expect(errorEmitted.message).toContain('owner');
    });

    it('should successfully upload asset when owner', () => {
      const mockSocket = createMockSocket('owner-sock');
      io.getSockets().set('owner-sock', mockSocket);
      io._connection(mockSocket);

      // Join as owner
      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'OwnerUser' });

      const uploadHandler = mockSocket.getHandler(SocketEvents.UPLOAD_ASSET);
      uploadHandler({
        fileName: 'test.png',
        data: 'base64data',
        category: 'backgrounds',
      });

      // Server broadcasts via io.emit, so check broadcast logs
      const logs = io.getBroadcastLogs();
      const broadcast = logs.find(l => l.event === SocketEvents.ASSET_UPLOADED);
      expect(broadcast).toBeTruthy();
      expect(broadcast.data.success).toBe(true);
    });

    it('should broadcast asset-uploaded to all clients', () => {
      const mockSocket = createMockSocket('owner-sock');
      io.getSockets().set('owner-sock', mockSocket);
      io._connection(mockSocket);

      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'OwnerUser' });

      const uploadHandler = mockSocket.getHandler(SocketEvents.UPLOAD_ASSET);
      uploadHandler({
        fileName: 'new-bg.png',
        data: 'base64data',
        category: 'backgrounds',
      });

      const logs = io.getBroadcastLogs();
      const broadcast = logs.find(l => l.event === SocketEvents.ASSET_UPLOADED);
      expect(broadcast).toBeTruthy();
    });

    it('should reject invalid category', () => {
      const mockSocket = createMockSocket('owner-sock');
      io.getSockets().set('owner-sock', mockSocket);
      io._connection(mockSocket);

      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'OwnerUser' });

      const uploadHandler = mockSocket.getHandler(SocketEvents.UPLOAD_ASSET);
      uploadHandler({
        fileName: 'test.png',
        data: 'base64data',
        category: 'invalid_category',
      });

      const errorEmitted = mockSocket.getEmitted(SocketEvents.UPLOAD_ERROR);
      expect(errorEmitted).toBeTruthy();
    });
  });

  describe('asset-manifest event', () => {
    it('should return asset manifest on request', () => {
      const mockSocket = createMockSocket('manifest-sock');
      io.getSockets().set('manifest-sock', mockSocket);
      io._connection(mockSocket);

      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'TestUser' });

      const manifestHandler = mockSocket.getHandler(SocketEvents.ASSET_MANIFEST);
      expect(manifestHandler).toBeTruthy();

      manifestHandler({});

      const manifestEmitted = mockSocket.getEmitted(SocketEvents.ASSET_MANIFEST_RESPONSE);
      expect(manifestEmitted).toBeTruthy();
      expect(manifestEmitted.puppets).toBeTruthy();
      expect(manifestEmitted.backgrounds).toBeTruthy();
      expect(manifestEmitted.animations).toBeTruthy();
    });
  });

  describe('delete-asset event', () => {
    it('should only allow owner to delete assets', () => {
      const mockSocket = createMockSocket('client-del-sock');
      io.getSockets().set('client-del-sock', mockSocket);
      io._connection(mockSocket);

      auth.addPlayer('owner-sock', 'OwnerUser');
      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'ClientUser' });

      const deleteHandler = mockSocket.getHandler(SocketEvents.DELETE_ASSET);
      deleteHandler({ assetId: 'some-id', category: 'backgrounds' });

      const errorEmitted = mockSocket.getEmitted(SocketEvents.DELETE_ERROR);
      expect(errorEmitted).toBeTruthy();
      expect(errorEmitted.message).toContain('owner');
    });

    it('should successfully delete asset when owner', () => {
      const mockSocket = createMockSocket('owner-del-sock');
      io.getSockets().set('owner-del-sock', mockSocket);
      io._connection(mockSocket);

      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'OwnerUser' });

      const deleteHandler = mockSocket.getHandler(SocketEvents.DELETE_ASSET);
      deleteHandler({ assetId: 'test-asset-id', category: 'backgrounds' });

      const resultEmitted = mockSocket.getEmitted(SocketEvents.DELETE_RESULT);
      expect(resultEmitted).toBeTruthy();
      expect(resultEmitted.success).toBe(true);
    });

    it('should broadcast deletion to all clients', () => {
      const mockSocket = createMockSocket('owner-del-sock2');
      io.getSockets().set('owner-del-sock2', mockSocket);
      io._connection(mockSocket);

      mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'OwnerUser' });

      const deleteHandler = mockSocket.getHandler(SocketEvents.DELETE_ASSET);
      deleteHandler({ assetId: 'test-id', category: 'puppets' });

      const logs = io.getBroadcastLogs();
      const broadcast = logs.find(l => l.event === SocketEvents.ASSET_DELETED);
      expect(broadcast).toBeTruthy();
    });
  });
});