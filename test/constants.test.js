/** Unit Tests for shared/constants.js
 * Tests shared constants structure and values
 */

const CONSTANTS = require('../shared/constants');

describe('Shared Constants', () => {
  it('should have MAX_PLAYERS set to 10', () => {
    expect(CONSTANTS.MAX_PLAYERS).toBe(10);
  });

  it('should have nickname length limits', () => {
    expect(CONSTANTS.NICKNAME_MIN_LENGTH).toBe(3);
    expect(CONSTANTS.NICKNAME_MAX_LENGTH).toBe(20);
  });

  it('should have player roles defined', () => {
    expect(CONSTANTS.ROLES.OWNER).toBe('owner');
    expect(CONSTANTS.ROLES.CLIENT).toBe('client');
  });

  it('should have stage locations defined', () => {
    expect(CONSTANTS.STAGE_LOCATIONS.CENTER).toBeTruthy();
    expect(CONSTANTS.STAGE_LOCATIONS.STAGE_LEFT).toBeTruthy();
    expect(CONSTANTS.STAGE_LOCATIONS.STAGE_RIGHT).toBeTruthy();
    expect(CONSTANTS.STAGE_LOCATIONS.UPSTAGE_LEFT).toBeTruthy();
    expect(CONSTANTS.STAGE_LOCATIONS.UPSTAGE_RIGHT).toBeTruthy();
    expect(CONSTANTS.STAGE_LOCATIONS.DOWNSTAGE_LEFT).toBeTruthy();
    expect(CONSTANTS.STAGE_LOCATIONS.DOWNSTAGE_RIGHT).toBeTruthy();
  });

  it('should have center stage at origin', () => {
    expect(CONSTANTS.STAGE_LOCATIONS.CENTER.x).toBe(0);
    expect(CONSTANTS.STAGE_LOCATIONS.CENTER.z).toBe(0);
  });

  it('should have animations array with expected types', () => {
    expect(Array.isArray(CONSTANTS.ANIMATIONS)).toBe(true);
    expect(CONSTANTS.ANIMATIONS).toContain('idle');
    expect(CONSTANTS.ANIMATIONS).toContain('walk');
    expect(CONSTANTS.ANIMATIONS).toContain('run');
    expect(CONSTANTS.ANIMATIONS).toContain('jump');
    expect(CONSTANTS.ANIMATIONS).toContain('wave');
    expect(CONSTANTS.ANIMATIONS).toContain('sit');
    expect(CONSTANTS.ANIMATIONS).toContain('dance');
    expect(CONSTANTS.ANIMATIONS).toContain('wave-hand');
  });

  it('should have 8 animation types', () => {
    expect(CONSTANTS.ANIMATIONS.length).toBe(8);
  });

  it('should have puppet bone names defined', () => {
    expect(Array.isArray(CONSTANTS.BONE_NAMES)).toBe(true);
    expect(CONSTANTS.BONE_NAMES).toContain('head');
    expect(CONSTANTS.BONE_NAMES).toContain('torso');
    expect(CONSTANTS.BONE_NAMES).toContain('upper-arm-l');
    expect(CONSTANTS.BONE_NAMES).toContain('lower-arm-l');
    expect(CONSTANTS.BONE_NAMES).toContain('upper-arm-r');
    expect(CONSTANTS.BONE_NAMES).toContain('lower-arm-r');
    expect(CONSTANTS.BONE_NAMES).toContain('upper-leg-l');
    expect(CONSTANTS.BONE_NAMES).toContain('lower-leg-l');
    expect(CONSTANTS.BONE_NAMES).toContain('upper-leg-r');
    expect(CONSTANTS.BONE_NAMES).toContain('lower-leg-r');
  });

  it('should have 10 bone names', () => {
    expect(CONSTANTS.BONE_NAMES.length).toBe(10);
  });
});