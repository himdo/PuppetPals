/** Unit Tests for client/js/stage/location-system.js
 * Tests the LocationSystem class for slot-based stage positioning
 */

import LocationSystem from '../client/js/stage/location-system.js';

describe('LocationSystem construction', () => {
  it('should create an instance', () => {
    const ls = new LocationSystem();
    expect(ls).toBeTruthy();
  });

  it('should default onScreenCount to 5', () => {
    const ls = new LocationSystem();
    expect(ls.onScreenCount).toBe(5);
  });

  it('should have default stage dimensions', () => {
    const ls = new LocationSystem();
    expect(ls.stageWidth).toBe(16);
    expect(ls.stageHeight).toBe(9);
  });

  it('should have a locations array', () => {
    const ls = new LocationSystem();
    expect(Array.isArray(ls.locations)).toBe(true);
  });
});

describe('LocationSystem calculatePositions', () => {
  it('should calculate 7 total locations by default (2 off-screen + 5 on-screen)', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.locations.length).toBe(7);
  });

  it('should have correct location IDs', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const ids = ls.locations.map(l => l.id);
    expect(ids).toContain('offscreen-far-left');
    expect(ids).toContain('offscreen-left');
    expect(ids).toContain('slot-0');
    expect(ids).toContain('slot-1');
    expect(ids).toContain('slot-2');
    expect(ids).toContain('slot-3');
    expect(ids).toContain('slot-4');
  });

  it('should have offscreen-far-left at index 0', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.locations[0].id).toBe('offscreen-far-left');
  });

  it('should have offscreen-left at index 1', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.locations[1].id).toBe('offscreen-left');
  });

  it('should have on-screen slots at indices 2-6', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.locations[2].id).toBe('slot-0');
    expect(ls.locations[3].id).toBe('slot-1');
    expect(ls.locations[4].id).toBe('slot-2');
    expect(ls.locations[5].id).toBe('slot-3');
    expect(ls.locations[6].id).toBe('slot-4');
  });

  it('should mark off-screen locations as isOffScreen', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.locations[0].isOffScreen).toBe(true);
    expect(ls.locations[1].isOffScreen).toBe(true);
    expect(ls.locations[2].isOffScreen).toBe(false);
  });

  it('should have display labels for all locations', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    for (const loc of ls.locations) {
      expect(loc.label).toBeTruthy();
      expect(typeof loc.label).toBe('string');
    }
  });

  it('should have x, y, z properties for all locations', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    for (const loc of ls.locations) {
      expect(typeof loc.x).toBe('number');
      expect(typeof loc.y).toBe('number');
      expect(typeof loc.z).toBe('number');
    }
  });

  it('should evenly distribute on-screen slots across stage width', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const slotWidth = ls.stageWidth / ls.onScreenCount;
    for (let i = 0; i < ls.onScreenCount; i++) {
      const expectedX = -ls.stageWidth / 2 + slotWidth * (i + 0.5);
      expect(ls.locations[i + 2].x).toBeCloseTo(expectedX, 5);
    }
  });

  it('should position offscreen-left just beyond the left edge', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const offscreenLeft = ls.locations.find(l => l.id === 'offscreen-left');
    const expectedX = -ls.stageWidth / 2 - ls.puppetWidth * 0.5;
    expect(offscreenLeft.x).toBeCloseTo(expectedX, 5);
  });

  it('should position offscreen-far-left fully hidden', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const offscreenFarLeft = ls.locations.find(l => l.id === 'offscreen-far-left');
    const expectedX = -ls.stageWidth / 2 - ls.puppetWidth * 1.5;
    expect(offscreenFarLeft.x).toBeCloseTo(expectedX, 5);
  });

  it('should have all slots at the same Y position (stage floor level)', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const expectedY = -ls.stageHeight * 0.35;
    for (const loc of ls.locations) {
      expect(loc.y).toBeCloseTo(expectedY, 5);
    }
  });
});

describe('LocationSystem getLocation', () => {
  it('should return location by index', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const loc = ls.getLocation(0);
    expect(loc.id).toBe('offscreen-far-left');
  });

  it('should return null for out-of-range index', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.getLocation(-1)).toBeNull();
    expect(ls.getLocation(100)).toBeNull();
  });
});

describe('LocationSystem getNextLocation', () => {
  beforeEach(() => {
    const ls = new LocationSystem();
    ls.calculatePositions();
  });

  it('should move right from index 0 to index 1', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const next = ls.getNextLocation(0, 'right');
    expect(next.index).toBe(1);
  });

  it('should move left from index 1 to index 0', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const next = ls.getNextLocation(1, 'left');
    expect(next.index).toBe(0);
  });

  it('should wrap right from last index to first index', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const next = ls.getNextLocation(6, 'right');
    expect(next.index).toBe(0);
  });

  it('should wrap left from first index to last index', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const next = ls.getNextLocation(0, 'left');
    expect(next.index).toBe(6);
  });

  it('should return null for invalid direction', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.getNextLocation(0, 'up')).toBeNull();
    expect(ls.getNextLocation(0, 'down')).toBeNull();
  });

  it('should return null for invalid index', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.getNextLocation(-1, 'right')).toBeNull();
    expect(ls.getNextLocation(100, 'left')).toBeNull();
  });
});

describe('LocationSystem setOnScreenCount', () => {
  it('should update on-screen count and recalculate positions', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.setOnScreenCount(3);
    expect(ls.onScreenCount).toBe(3);
    expect(ls.locations.length).toBe(5); // 2 off-screen + 3 on-screen
  });

  it('should clamp on-screen count to minimum of 2', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.setOnScreenCount(1);
    expect(ls.onScreenCount).toBe(2);
  });

  it('should clamp on-screen count to maximum of 10', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.setOnScreenCount(15);
    expect(ls.onScreenCount).toBe(10);
  });

  it('should recalculate slot positions after changing count', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.setOnScreenCount(4);
    const slotWidth = ls.stageWidth / 4;
    for (let i = 0; i < 4; i++) {
      const expectedX = -ls.stageWidth / 2 + slotWidth * (i + 0.5);
      expect(ls.locations[i + 2].x).toBeCloseTo(expectedX, 5);
    }
  });

  it('should have correct slot IDs after changing count', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.setOnScreenCount(3);
    const ids = ls.locations.map(l => l.id);
    expect(ids).toContain('slot-0');
    expect(ids).toContain('slot-1');
    expect(ids).toContain('slot-2');
    expect(ids).not.toContain('slot-3');
    expect(ids).not.toContain('slot-4');
  });
});

describe('LocationSystem getLocationByPuppetId', () => {
  it('should return null when no puppet assignments exist', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    expect(ls.getLocationByPuppetId('puppet-1')).toBeNull();
  });

  it('should return the location for an assigned puppet', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.assignPuppetToSlot('puppet-1', 3);
    const loc = ls.getLocationByPuppetId('puppet-1');
    expect(loc).toBeTruthy();
    expect(loc.index).toBe(3);
    expect(loc.location.id).toBe('slot-1');
  });

  it('should return updated location after puppet moves', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.assignPuppetToSlot('puppet-1', 0);
    ls.assignPuppetToSlot('puppet-1', 4);
    const loc = ls.getLocationByPuppetId('puppet-1');
    expect(loc.index).toBe(4);
  });

  it('should allow multiple puppets on the same slot', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    ls.assignPuppetToSlot('puppet-1', 2);
    ls.assignPuppetToSlot('puppet-2', 2);
    expect(ls.getLocationByPuppetId('puppet-1').index).toBe(2);
    expect(ls.getLocationByPuppetId('puppet-2').index).toBe(2);
  });
});

describe('LocationSystem getAllLocations', () => {
  it('should return all locations', () => {
    const ls = new LocationSystem();
    ls.calculatePositions();
    const all = ls.getAllLocations();
    expect(all.length).toBe(7);
    expect(all).toBe(ls.locations);
  });
});

describe('LocationSystem with custom stage dimensions', () => {
  it('should accept custom stage width and height', () => {
    const ls = new LocationSystem(20, 12);
    expect(ls.stageWidth).toBe(20);
    expect(ls.stageHeight).toBe(12);
  });

  it('should recalculate positions based on custom dimensions', () => {
    const ls = new LocationSystem(20, 12);
    ls.calculatePositions();
    const slotWidth = 20 / 5;
    for (let i = 0; i < 5; i++) {
      const expectedX = -10 + slotWidth * (i + 0.5);
      expect(ls.locations[i + 2].x).toBeCloseTo(expectedX, 5);
    }
  });
});
