/** Unit Tests for shared/utils.js
 * Tests shared utility functions
 */

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
    expect(typeof hashString('test')).toBe('string');
  });

  it('should return consistent results for the same input', () => {
    expect(hashString('hello')).toBe(hashString('hello'));
  });

  it('should return different results for different inputs', () => {
    expect(hashString('hello')).not.toBe(hashString('world'));
  });

  it('should handle empty string', () => {
    expect(typeof hashString('')).toBe('string');
  });
});

describe('clamp', () => {
  it('should return value if within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should return min if value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should return max if value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should return min if value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('should return max if value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('should return start value when t is 0', () => {
    expect(lerp(0, 10, 0)).toBe(0);
  });

  it('should return end value when t is 1', () => {
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('should return midpoint when t is 0.5', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('should handle negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });
});

describe('lerpVector', () => {
  it('should interpolate all components', () => {
    const result = lerpVector({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 }, 0.5);
    expect(result).toEqual({ x: 5, y: 10, z: 15 });
  });

  it('should return start vector when t is 0', () => {
    const result = lerpVector({ x: 1, y: 2, z: 3 }, { x: 10, y: 20, z: 30 }, 0);
    expect(result).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('should return end vector when t is 1', () => {
    const result = lerpVector({ x: 1, y: 2, z: 3 }, { x: 10, y: 20, z: 30 }, 1);
    expect(result).toEqual({ x: 10, y: 20, z: 30 });
  });
});

describe('distance2D', () => {
  it('should return 0 for same point', () => {
    expect(distance2D(0, 0, 0, 0)).toBe(0);
  });

  it('should return correct distance for horizontal line', () => {
    expect(distance2D(0, 0, 5, 0)).toBe(5);
  });

  it('should return correct distance for vertical line', () => {
    expect(distance2D(0, 0, 0, 5)).toBe(5);
  });

  it('should return correct distance for diagonal', () => {
    const dist = distance2D(0, 0, 3, 4);
    expect(dist).toBe(5); // 3-4-5 triangle
  });
});

describe('validateNickname', () => {
  it('should reject empty nickname', () => {
    const result = validateNickname('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should reject null nickname', () => {
    const result = validateNickname(null);
    expect(result.valid).toBe(false);
  });

  it('should reject nickname too short', () => {
    const result = validateNickname('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('3 characters');
  });

  it('should reject nickname too long', () => {
    const result = validateNickname('a'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20 characters');
  });

  it('should reject nickname with invalid characters', () => {
    const result = validateNickname('hello world');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('letters, numbers');
  });

  it('should accept valid nickname with minimum length', () => {
    const result = validateNickname('abc');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should accept valid nickname with maximum length', () => {
    const result = validateNickname('a'.repeat(20));
    expect(result.valid).toBe(true);
  });

  it('should accept nickname with underscores and hyphens', () => {
    const result = validateNickname('player_1-test');
    expect(result.valid).toBe(true);
  });

  it('should trim whitespace before validation', () => {
    const result = validateNickname('  abc  ');
    expect(result.valid).toBe(true);
  });
});

describe('formatTime', () => {
  it('should return a string', () => {
    expect(typeof formatTime(Date.now())).toBe('string');
  });

  it('should return consistent format for same timestamp', () => {
    const ts = Date.now();
    expect(formatTime(ts)).toBe(formatTime(ts));
  });
});