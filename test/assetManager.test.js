/** Unit Tests for server/asset-manager.js
 * Tests asset upload, storage, manifest generation, deletion, and validation
 */

// Mock fs module before importing AssetManager
jest.mock('fs', () => ({
  mkdirSync: jest.fn(() => {}),
  writeFileSync: jest.fn(() => {}),
  readFileSync: jest.fn(() => Buffer.from('mock file content')),
  existsSync: jest.fn(() => true),
  readdirSync: jest.fn(() => []),
  statSync: jest.fn(() => ({ size: 1024, isDirectory: () => false })),
  unlinkSync: jest.fn(() => {}),
  rmSync: jest.fn(() => {}),
}));

import AssetManager from '../server/asset-manager.js';
import config from '../server/config.js';
import fs from 'fs';

describe('AssetManager construction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
  });

  it('should create an instance with default base path', () => {
    const manager = new AssetManager();
    expect(manager).toBeTruthy();
  });

  it('should accept a custom base path', () => {
    const manager = new AssetManager('/custom/path');
    expect(manager).toBeTruthy();
  });

  it('should initialize asset categories', () => {
    const manager = new AssetManager();
    expect(manager.assets).toBeTruthy();
    expect(manager.assets.puppets).toBeTruthy();
    expect(manager.assets.backgrounds).toBeTruthy();
    expect(manager.assets.animations).toBeTruthy();
  });
});

describe('AssetManager validateFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept valid PNG file', () => {
    const manager = new AssetManager();
    const result = manager.validateFile('test.png', 1024, 'image');
    expect(result.valid).toBe(true);
  });

  it('should accept valid JSON file', () => {
    const manager = new AssetManager();
    const result = manager.validateFile('config.json', 1024, 'config');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid file extension', () => {
    const manager = new AssetManager();
    const result = manager.validateFile('test.exe', 1024, 'image');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should reject file that is too large', () => {
    const manager = new AssetManager();
    const result = manager.validateFile('test.png', 11 * 1024 * 1024, 'image');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('size');
  });

  it('should accept valid JPG file', () => {
    const manager = new AssetManager();
    const result = manager.validateFile('photo.jpg', 1024, 'image');
    expect(result.valid).toBe(true);
  });

  it('should accept valid webp file', () => {
    const manager = new AssetManager();
    const result = manager.validateFile('image.webp', 1024, 'image');
    expect(result.valid).toBe(true);
  });
});

describe('AssetManager addAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ size: 1024, isDirectory: () => false });
  });

  it('should add a puppet asset', () => {
    const manager = new AssetManager();
    const result = manager.addAsset('head.png', Buffer.from('fake png data'), 'puppets', 'basic-puppet');
    expect(result.success).toBe(true);
    expect(result.assetId).toBeTruthy();
  });

  it('should add a background asset', () => {
    const manager = new AssetManager();
    const result = manager.addAsset('stage-bg.png', Buffer.from('fake bg data'), 'backgrounds');
    expect(result.success).toBe(true);
    expect(result.assetId).toBeTruthy();
  });

  it('should add a JSON config asset', () => {
    const manager = new AssetManager();
    const result = manager.addAsset('skeleton.json', Buffer.from('{"bones":[]}'), 'puppets', 'basic-puppet');
    expect(result.success).toBe(true);
  });

  it('should reject invalid asset type', () => {
    const manager = new AssetManager();
    const result = manager.addAsset('test.png', Buffer.from('data'), 'invalid_category');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should return asset path on success', () => {
    const manager = new AssetManager();
    const result = manager.addAsset('torso.png', Buffer.from('data'), 'puppets', 'test-puppet');
    expect(result.success).toBe(true);
    expect(result.path).toBeTruthy();
  });
});

describe('AssetManager getAssetManifest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
  });

  it('should return a manifest object with categories', () => {
    const manager = new AssetManager();
    const manifest = manager.getAssetManifest();
    expect(manifest).toBeTruthy();
    expect(manifest.puppets).toBeTruthy();
    expect(manifest.backgrounds).toBeTruthy();
    expect(manifest.animations).toBeTruthy();
  });

  it('should return empty arrays when no assets added', () => {
    const manager = new AssetManager();
    const manifest = manager.getAssetManifest();
    expect(Array.isArray(manifest.puppets)).toBe(true);
    expect(Array.isArray(manifest.backgrounds)).toBe(true);
    expect(Array.isArray(manifest.animations)).toBe(true);
  });

  it('should include added assets in manifest', () => {
    const manager = new AssetManager();
    manager.addAsset('head.png', Buffer.from('data'), 'puppets', 'test-puppet');
    const manifest = manager.getAssetManifest();
    expect(manifest.puppets.length).toBeGreaterThan(0);
  });
});

describe('AssetManager deleteAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
  });

  it('should delete an existing asset', () => {
    const manager = new AssetManager();
    const addResult = manager.addAsset('head.png', Buffer.from('data'), 'puppets', 'test-puppet');
    const deleteResult = manager.deleteAsset(addResult.assetId, 'puppets');
    expect(deleteResult.success).toBe(true);
  });

  it('should fail to delete non-existent asset', () => {
    const manager = new AssetManager();
    const result = manager.deleteAsset('non-existent-id', 'puppets');
    expect(result.success).toBe(false);
  });

  it('should remove asset from internal tracking', () => {
    const manager = new AssetManager();
    const addResult = manager.addAsset('test.png', Buffer.from('data'), 'backgrounds');
    manager.deleteAsset(addResult.assetId, 'backgrounds');
    const manifest = manager.getAssetManifest();
    const found = manifest.backgrounds.find(a => a.id === addResult.assetId);
    expect(found).toBeUndefined();
  });
});

describe('AssetManager getAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
  });

  it('should retrieve an existing asset by id', () => {
    const manager = new AssetManager();
    const addResult = manager.addAsset('head.png', Buffer.from('data'), 'puppets', 'test-puppet');
    const asset = manager.getAsset(addResult.assetId);
    expect(asset).toBeTruthy();
    expect(asset.id).toBe(addResult.assetId);
    expect(asset.name).toBe('head.png');
  });

  it('should return null for non-existent asset', () => {
    const manager = new AssetManager();
    const asset = manager.getAsset('non-existent');
    expect(asset).toBeNull();
  });
});

describe('AssetManager searchAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
  });

  it('should find assets by name pattern', () => {
    const manager = new AssetManager();
    manager.addAsset('head.png', Buffer.from('data'), 'puppets', 'test');
    manager.addAsset('torso.png', Buffer.from('data'), 'puppets', 'test');
    const results = manager.searchAssets('head');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('head.png');
  });

  it('should return empty array when no matches', () => {
    const manager = new AssetManager();
    manager.addAsset('head.png', Buffer.from('data'), 'puppets', 'test');
    const results = manager.searchAssets('nonexistent');
    expect(results.length).toBe(0);
  });

  it('should filter by category', () => {
    const manager = new AssetManager();
    manager.addAsset('head.png', Buffer.from('data'), 'puppets', 'test');
    manager.addAsset('bg.png', Buffer.from('data'), 'backgrounds');
    const results = manager.searchAssets('', 'backgrounds');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('bg.png');
  });
});

describe('AssetManager getAllAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all assets across all categories', () => {
    const manager = new AssetManager();
    manager.addAsset('head.png', Buffer.from('data'), 'puppets', 'test');
    manager.addAsset('bg.png', Buffer.from('data'), 'backgrounds');
    const all = manager.getAllAssets();
    expect(all.length).toBe(2);
  });

  it('should return empty array when no assets', () => {
    const manager = new AssetManager();
    const all = manager.getAllAssets();
    expect(all).toEqual([]);
  });
});

describe('AssetManager upload metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow upload and return success', () => {
    const manager = new AssetManager();
    const result = manager.addAsset('test.png', Buffer.from('data'), 'backgrounds');
    expect(result.success).toBe(true);
  });

  it('should record upload metadata', () => {
    const manager = new AssetManager();
    const result = manager.addAsset('test.png', Buffer.from('data'), 'backgrounds');
    expect(result.uploadedAt).toBeTruthy();
    expect(result.size).toBe(4);
  });
});