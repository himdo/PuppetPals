/** Unit Tests for server/config.js
 * Tests configuration values and environment variable overrides
 */

import config from '../server/config.js';

describe('Config', () => {
  describe('default values', () => {
    it('should have port 3000 by default', () => {
      expect(config.port).toBe(3000);
    });

    it('should have host 0.0.0.0 by default', () => {
      expect(config.host).toBe('0.0.0.0');
    });

    it('should have maxPlayers of 10', () => {
      expect(config.maxPlayers).toBe(10);
    });
  });

  describe('assetLimits', () => {
    it('should have maxImageSize of 5MB', () => {
      expect(config.assetLimits.maxImageSize).toBe(5 * 1024 * 1024);
    });

    it('should have maxJsonSize of 512KB', () => {
      expect(config.assetLimits.maxJsonSize).toBe(512 * 1024);
    });

    it('should have maxFileSize of 10MB', () => {
      expect(config.assetLimits.maxFileSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('allowedImageExtensions', () => {
    it('should include common image extensions', () => {
      expect(config.allowedImageExtensions).toContain('.png');
      expect(config.allowedImageExtensions).toContain('.jpg');
      expect(config.allowedImageExtensions).toContain('.jpeg');
      expect(config.allowedImageExtensions).toContain('.gif');
      expect(config.allowedImageExtensions).toContain('.webp');
    });
  });

  describe('allowedConfigExtensions', () => {
    it('should include json extension', () => {
      expect(config.allowedConfigExtensions).toContain('.json');
    });
  });

  describe('paths', () => {
    it('should have client path', () => {
      expect(config.paths.client).toBe('./client');
    });

    it('should have assets path', () => {
      expect(config.paths.assets).toBe('./assets');
    });

    it('should have puppets path', () => {
      expect(config.paths.puppets).toBe('./assets/puppets');
    });

    it('should have backgrounds path', () => {
      expect(config.paths.backgrounds).toBe('./assets/backgrounds');
    });

    it('should have animations path', () => {
      expect(config.paths.animations).toBe('./assets/animations');
    });
  });

  describe('cors', () => {
    it('should allow all origins by default', () => {
      expect(config.cors.origin).toBe('*');
    });

    it('should include GET and POST methods', () => {
      expect(config.cors.methods).toContain('GET');
      expect(config.cors.methods).toContain('POST');
    });
  });

  describe('socket', () => {
    it('should have maxHttpBufferSize of 1MB', () => {
      expect(config.socket.maxHttpBufferSize).toBe(1 * 1024 * 1024);
    });

    it('should have pingTimeout of 60000ms', () => {
      expect(config.socket.pingTimeout).toBe(60000);
    });

    it('should have pingInterval of 25000ms', () => {
      expect(config.socket.pingInterval).toBe(25000);
    });
  });
});