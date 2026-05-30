/** Unit Tests for shared/constants.js
 * Tests shared constants structure and values
 */

const assert = require('node:assert');
const { describe, it } = require('node:test');

const CONSTANTS = require('../shared/constants');

describe('Shared Constants', () => {
  it('should have MAX_PLAYERS set to 10', () => {
    assert.strictEqual(CONSTANTS.MAX_PLAYERS, 10);
  });

  it('should have nickname length limits', () => {
    assert.strictEqual(CONSTANTS.NICKNAME_MIN_LENGTH, 3);
    assert.strictEqual(CONSTANTS.NICKNAME_MAX_LENGTH, 20);
  });

  it('should have player roles defined', () => {
    assert.strictEqual(CONSTANTS.ROLES.OWNER, 'owner');
    assert.strictEqual(CONSTANTS.ROLES.CLIENT, 'client');
  });

  it('should have stage locations defined', () => {
    assert.ok(CONSTANTS.STAGE_LOCATIONS.CENTER);
    assert.ok(CONSTANTS.STAGE_LOCATIONS.STAGE_LEFT);
    assert.ok(CONSTANTS.STAGE_LOCATIONS.STAGE_RIGHT);
    assert.ok(CONSTANTS.STAGE_LOCATIONS.UPSTAGE_LEFT);
    assert.ok(CONSTANTS.STAGE_LOCATIONS.UPSTAGE_RIGHT);
    assert.ok(CONSTANTS.STAGE_LOCATIONS.DOWNSTAGE_LEFT);
    assert.ok(CONSTANTS.STAGE_LOCATIONS.DOWNSTAGE_RIGHT);
  });

  it('should have center stage at origin', () => {
    assert.strictEqual(CONSTANTS.STAGE_LOCATIONS.CENTER.x, 0);
    assert.strictEqual(CONSTANTS.STAGE_LOCATIONS.CENTER.z, 0);
  });

  it('should have animations array with expected types', () => {
    assert.ok(Array.isArray(CONSTANTS.ANIMATIONS));
    assert.ok(CONSTANTS.ANIMATIONS.includes('idle'));
    assert.ok(CONSTANTS.ANIMATIONS.includes('walk'));
    assert.ok(CONSTANTS.ANIMATIONS.includes('run'));
    assert.ok(CONSTANTS.ANIMATIONS.includes('jump'));
    assert.ok(CONSTANTS.ANIMATIONS.includes('wave'));
    assert.ok(CONSTANTS.ANIMATIONS.includes('sit'));
    assert.ok(CONSTANTS.ANIMATIONS.includes('dance'));
    assert.ok(CONSTANTS.ANIMATIONS.includes('wave-hand'));
  });

  it('should have 8 animation types', () => {
    assert.strictEqual(CONSTANTS.ANIMATIONS.length, 8);
  });

  it('should have puppet bone names defined', () => {
    assert.ok(Array.isArray(CONSTANTS.BONE_NAMES));
    assert.ok(CONSTANTS.BONE_NAMES.includes('head'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('torso'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('upper-arm-l'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('lower-arm-l'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('upper-arm-r'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('lower-arm-r'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('upper-leg-l'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('lower-leg-l'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('upper-leg-r'));
    assert.ok(CONSTANTS.BONE_NAMES.includes('lower-leg-r'));
  });

  it('should have 10 bone names', () => {
    assert.strictEqual(CONSTANTS.BONE_NAMES.length, 10);
  });
});