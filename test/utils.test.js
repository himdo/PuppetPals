/** Unit Tests for shared/utils.js
 * Tests shared utility functions
 */

import {
  validateNickname,
  hashString,
  clamp,
  lerp,
  lerpVector,
  distance2D,
  formatTime,
} from '../shared/utils.js';

describe('validateNickname', () => {
  it('should accept valid nicknames', () => {
    expect(validateNickname('Player1').valid).toBe(true);
    expect(validateNickname('abc').valid).toBe(true);
    expect(validateNickname('ABC123').valid).toBe(true);
    expect(validateNickname('a'.repeat(20)).valid).toBe(true);
  });

  it('should reject empty nicknames', () => {
    const result = validateNickname('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject nicknames that are too short', () => {
    const result = validateNickname('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('3');
  });

  it('should reject nicknames that are too long', () => {
    const result = validateNickname('a'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20');
  });

  it('should reject nicknames with spaces', () => {
    const result = validateNickname('Player One');
    expect(result.valid).toBe(false);
  });

  it('should reject nicknames with special characters', () => {
    const result = validateNickname('Player@1');
    expect(result.valid).toBe(false);
  });

  it('should trim whitespace', () => {
    const result = validateNickname('  Player1  ');
    expect(result.valid).toBe(true);
  });

  it('should reject null nicknames', () => {
    const result = validateNickname(null);
    expect(result.valid).toBe(false);
  });
});

describe('hashString', () => {
  it('should return a string', () => {
    const hash = hashString('hello');
    expect(typeof hash).toBe('string');
  });

  it('should return consistent hashes', () => {
    expect(hashString('hello')).toBe(hashString('hello'));
  });

  it('should return different hashes for different strings', () => {
    expect(hashString('hello')).not.toBe(hashString('world'));
  });
});

describe('clamp', () => {
  it('should clamp value to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should clamp value to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should return value if in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('lerp', () => {
  it('should interpolate correctly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('should return start when t is 0', () => {
    expect(lerp(0, 10, 0)).toBe(0);
  });

  it('should return end when t is 1', () => {
    expect(lerp(0, 10, 1)).toBe(10);
  });
});

describe('lerpVector', () => {
  it('should interpolate vectors', () => {
    const result = lerpVector({ x: 0, y: 0, z: 0 }, { x: 10, y: 10, z: 10 }, 0.5);
    expect(result).toEqual({ x: 5, y: 5, z: 5 });
  });
});

describe('distance2D', () => {
  it('should calculate distance correctly', () => {
    expect(distance2D(0, 0, 3, 4)).toBe(5);
  });

  it('should return 0 for same point', () => {
    expect(distance2D(0, 0, 0, 0)).toBe(0);
  });
});

describe('formatTime', () => {
  it('should return a string', () => {
    const result = formatTime(Date.now());
    expect(typeof result).toBe('string');
  });
});