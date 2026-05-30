/** Unit Tests for server/config.js
 * Tests server configuration defaults and structure
 */

const config = require('../server/config');

describe('Server Configuration', () => {
  it('should have default port of 3000', () => {
    expect(config.port).toBe(3000);
  });

  it('should have default host of 0.0.0.0', () => {
    expect(config.host).toBe('0.0.0.0');
  });

  it('should have maxPlayers of 10', () => {
    expect(config.maxPlayers).toBe(10);
  });

  it('should have asset size limits defined', () => {
    expect(config.assetLimits).toBeTruthy();
    expect(config.assetLimits.maxImageSize).toBe(5 * 1024 * 1024);
    expect(config.assetLimits.maxJsonSize).toBe(512 * 1024);
    expect(config.assetLimits.maxFileSize).toBe(10 * 1024 * 1024);
  });

  it('should have allowed image extensions', () => {
    expect(Array.isArray(config.allowedImageExtensions)).toBe(true);
    expect(config.allowedImageExtensions).toContain('.png');
    expect(config.allowedImageExtensions).toContain('.jpg');
  });

  it('should have allowed config extensions', () => {
    expect(Array.isArray(config.allowedConfigExtensions)).toBe(true);
    expect(config.allowedConfigExtensions).toContain('.json');
  });

  it('should have paths defined', () => {
    expect(config.paths).toBeTruthy();
    expect(config.paths.client).toBe('./client');
    expect(config.paths.assets).toBe('./assets');
    expect(config.paths.puppets).toBe('./assets/puppets');
    expect(config.paths.backgrounds).toBe('./assets/backgrounds');
    expect(config.paths.animations).toBe('./assets/animations');
  });

  it('should have cors settings', () => {
    expect(config.cors).toBeTruthy();
    expect(config.cors.origin).toBe('*');
    expect(Array.isArray(config.cors.methods)).toBe(true);
  });

  it('should have socket.io settings', () => {
    expect(config.socket).toBeTruthy();
    expect(config.socket.maxHttpBufferSize).toBe(1 * 1024 * 1024);
    expect(config.socket.pingTimeout).toBe(60000);
    expect(config.socket.pingInterval).toBe(25000);
  });

  it('should support PORT environment variable', () => {
    const originalPort = process.env.PORT;
    process.env.PORT = '8080';

    // Reload the module to pick up the new env var
    delete require.cache[require.resolve('../server/config')];
    const dynamicConfig = require('../server/config');
    expect(dynamicConfig.port).toBe(8080);

    // Restore
    process.env.PORT = originalPort;
    delete require.cache[require.resolve('../server/config')];
  });
});