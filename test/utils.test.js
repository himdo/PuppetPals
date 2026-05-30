/** Unit Tests for shared/utils.js
 * Tests shared utility functions
 */

const assert = require('node:assert');
const { describe, it } = require('node:test');

const {
  hashString,
  clamp,
  lerp,
  lerpVector,
  distance2D,
  validateNickname,
  formatTime,
} = require('../shared/utils');

describe('hashString', () => {
  it('should return a string', () => {
    assert.ok(typeof hashString('test') === 'string');
  });

  it('should return consistent results for the same input', () => {
    assert.strictEqual(hashString('hello'), hashString('hello'));
  });

  it('should return different results for different inputs', () => {
    assert.notStrictEqual(hashString('hello'), hashString('world'));
  });

  it('should handle empty string', () => {
    assert.ok(typeof hashString('') === 'string');
  });
});

describe('clamp', () => {
  it('should return value if within range', () => {
    assert.strictEqual(clamp(5, 0, 10), 5);
  });

  it('should return min if value is below range', () => {
    assert.strictEqual(clamp(-5, 0, 10), 0);
  });

  it('should return max if value is above range', () => {
    assert.strictEqual(clamp(15, 0, 10), 10);
  });

  it('should return min if value equals min', () => {
    assert.strictEqual(clamp(0, 0, 10), 0);
  });

  it('should return max if value equals max', () => {
    assert.strictEqual(clamp(10, 0, 10), 10);
  });
});

describe('lerp', () => {
  it('should return start value when t is 0', () => {
    assert.strictEqual(lerp(0, 10, 0), 0);
  });

  it('should return end value when t is 1', () => {
    assert.strictEqual(lerp(0, 10, 1), 10);
  });

  it('should return midpoint when t is 0.5', () => {
    assert.strictEqual(lerp(0, 10, 0.5), 5);
  });

  it('should handle negative values', () => {
    assert.strictEqual(lerp(-10, 10, 0.5), 0);
  });
});

describe('lerpVector', () => {
  it('should interpolate all components', () => {
    const result = lerpVector({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 }, 0.5);
    assert.deepStrictEqual(result, { x: 5, y: 10, z: 15 });
  });

  it('should return start vector when t is 0', () => {
    const result = lerpVector({ x: 1, y: 2, z: 3 }, { x: 10, y: 20, z: 30 }, 0);
    assert.deepStrictEqual(result, { x: 1, y: 2, z: 3 });
  });

  it('should return end vector when t is 1', () => {
    const result = lerpVector({ x: 1, y: 2, z: 3 }, { x: 10, y: 20, z: 30 }, 1);
    assert.deepStrictEqual(result, { x: 10, y: 20, z: 30 });
  });
});

describe('distance2D', () => {
  it('should return 0 for same point', () => {
    assert.strictEqual(distance2D(0, 0, 0, 0), 0);
  });

  it('should return correct distance for horizontal line', () => {
    assert.strictEqual(distance2D(0, 0, 5, 0), 5);
  });

  it('should return correct distance for vertical line', () => {
    assert.strictEqual(distance2D(0, 0, 0, 5), 5);
  });

  it('should return correct distance for diagonal', () => {
    const dist = distance2D(0, 0, 3, 4);
    assert.strictEqual(dist, 5); // 3-4-5 triangle
  });
});

describe('validateNickname', () => {
  it('should reject empty nickname', () => {
    const result = validateNickname('');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error);
  });

  it('should reject null nickname', () => {
    const result = validateNickname(null);
    assert.strictEqual(result.valid, false);
  });

  it('should reject nickname too short', () => {
    const result = validateNickname('ab');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('3 characters'));
  });

  it('should reject nickname too long', () => {
    const result = validateNickname('a'.repeat(21));
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('20 characters'));
  });

  it('should reject nickname with invalid characters', () => {
    const result = validateNickname('hello world');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('letters, numbers'));
  });

  it('should accept valid nickname with minimum length', () => {
    const result = validateNickname('abc');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.error, null);
  });

  it('should accept valid nickname with maximum length', () => {
    const result = validateNickname('a'.repeat(20));
    assert.strictEqual(result.valid, true);
  });

  it('should accept nickname with underscores and hyphens', () => {
    const result = validateNickname('player_1-test');
    assert.strictEqual(result.valid, true);
  });

  it('should trim whitespace before validation', () => {
    const result = validateNickname('  abc  ');
    assert.strictEqual(result.valid, true);
  });
});

describe('formatTime', () => {
  it('should return a string', () => {
    assert.ok(typeof formatTime(Date.now()) === 'string');
  });

  it('should return consistent format for same timestamp', () => {
    const ts = Date.now();
    assert.strictEqual(formatTime(ts), formatTime(ts));
  });
});