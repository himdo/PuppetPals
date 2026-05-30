/** Unit Tests for server/config.js
 * Tests server configuration defaults and structure
 */

const assert = require('node:assert');
const { describe, it } = require('node:test');

const config = require('../server/config');

describe('Server Configuration', () => {
  it('should have default port of 3000', () => {
    assert.strictEqual(config.port, 3000);
  });

  it('should have default host of 0.0.0.0', () => {
    assert.strictEqual(config.host, '0.0.0.0');
  });

  it('should have maxPlayers of 10', () => {
    assert.strictEqual(config.maxPlayers, 10);
  });

  it('should have asset size limits defined', () => {
    assert.ok(config.assetLimits);
    assert.strictEqual(config.assetLimits.maxImageSize, 5 * 1024 * 1024);
    assert.strictEqual(config.assetLimits.maxJsonSize, 512 * 1024);
    assert.strictEqual(config.assetLimits.maxFileSize, 10 * 1024 * 1024);
  });

  it('should have allowed image extensions', () => {
    assert.ok(Array.isArray(config.allowedImageExtensions));
    assert.ok(config.allowedImageExtensions.includes('.png'));
    assert.ok(config.allowedImageExtensions.includes('.jpg'));
  });

  it('should have allowed config extensions', () => {
    assert.ok(Array.isArray(config.allowedConfigExtensions));
    assert.ok(config.allowedConfigExtensions.includes('.json'));
  });

  it('should have paths defined', () => {
    assert.ok(config.paths);
    assert.strictEqual(config.paths.client, './client');
    assert.strictEqual(config.paths.assets, './assets');
    assert.strictEqual(config.paths.puppets, './assets/puppets');
    assert.strictEqual(config.paths.backgrounds, './assets/backgrounds');
    assert.strictEqual(config.paths.animations, './assets/animations');
  });

  it('should have cors settings', () => {
    assert.ok(config.cors);
    assert.strictEqual(config.cors.origin, '*');
    assert.ok(Array.isArray(config.cors.methods));
  });

  it('should have socket.io settings', () => {
    assert.ok(config.socket);
    assert.strictEqual(config.socket.maxHttpBufferSize, 1 * 1024 * 1024);
    assert.strictEqual(config.socket.pingTimeout, 60000);
    assert.strictEqual(config.socket.pingInterval, 25000);
  });

  it('should support PORT environment variable', () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '8080';

    // Reload the module to pick up the new env var
    delete require.cache[require.resolve('../server/config')];
    const dynamicConfig = require('../server/config');
    assert.strictEqual(dynamicConfig.port, 8080);

    // Restore
    process.env.PORT = originalPort;
    delete require.cache[require.resolve('../server/config')];
  });
});