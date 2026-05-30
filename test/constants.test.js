/** Unit Tests for shared/constants.js
 * Tests the shared constants module
 */

import CONSTANTS from '../shared/constants.js';

describe('Constants', () => {
  it('should export an object', () => {
    expect(typeof CONSTANTS).toBe('object');
  });

  it('should have MAX_PLAYERS', () => {
    expect(CONSTANTS).toHaveProperty('MAX_PLAYERS');
    expect(CONSTANTS.MAX_PLAYERS).toBe(10);
  });

  it('should have NICKNAME_MIN_LENGTH', () => {
    expect(CONSTANTS.NICKNAME_MIN_LENGTH).toBe(3);
  });

  it('should have NICKNAME_MAX_LENGTH', () => {
    expect(CONSTANTS.NICKNAME_MAX_LENGTH).toBe(20);
  });

  it('should have ROLES', () => {
    expect(CONSTANTS.ROLES.OWNER).toBe('owner');
    expect(CONSTANTS.ROLES.CLIENT).toBe('client');
  });

  it('should have STAGE_LOCATIONS', () => {
    expect(CONSTANTS).toHaveProperty('STAGE_LOCATIONS');
    expect(CONSTANTS.STAGE_LOCATIONS.CENTER).toEqual({ x: 0, z: 0 });
  });

  it('should have ANIMATIONS array', () => {
    expect(Array.isArray(CONSTANTS.ANIMATIONS)).toBe(true);
    expect(CONSTANTS.ANIMATIONS).toContain('idle');
  });

  it('should have BONE_NAMES array', () => {
    expect(Array.isArray(CONSTANTS.BONE_NAMES)).toBe(true);
    expect(CONSTANTS.BONE_NAMES).toContain('head');
  });
});