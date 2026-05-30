/** Shared Utility Functions
 * Common utilities used by both server and client
 */

/**
 * Generate a simple hash for strings
 * @param {string} str - Input string
 * @returns {string} Hash string
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Clamp a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two vectors
 * @param {Object} a - Start vector {x, y, z}
 * @param {Object} b - End vector {x, y, z}
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated vector
 */
function lerpVector(a, b, t) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

/**
 * Calculate distance between two 2D points
 * @param {number} x1 - First point x
 * @param {number} z1 - First point z
 * @param {number} x2 - Second point x
 * @param {number} z2 - Second point z
 * @returns {number} Distance
 */
function distance2D(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Validate a nickname
 * @param {string} nickname - The nickname to validate
 * @returns {Object} Validation result { valid: boolean, error: string | null }
 */
function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    return { valid: false, error: 'Nickname is required' };
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Nickname must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Nickname must be at most 20 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Nickname can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true, error: null };
}

/**
 * Format a timestamp to readable string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

module.exports = {
  hashString,
  clamp,
  lerp,
  lerpVector,
  distance2D,
  validateNickname,
  formatTime,
};