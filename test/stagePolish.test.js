/** Unit Tests for Request 22: 2D Stage Polish & Visual Feedback
 * Tests stage slot indicators, movement trails, location labels,
 * theater aesthetic, and puppet panel updates
 * Uses mocked Three.js for Node.js test environment via __mocks__/three.js
 */

// Mock window globals needed by Camera module
const mockWindow = {
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.window = mockWindow;

// Mock document for canvas texture creation in stage labels
const mockCanvas = {
  width: 64,
  height: 64,
  getContext: () => ({
    fillStyle: '',
    fillRect: jest.fn(),
    font: '',
    textAlign: '',
    textBaseline: '',
    fillText: jest.fn(),
  }),
};

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return mockCanvas;
    return { style: {}, addEventListener: () => {} };
  },
};

// Import actual modules (Three.js is mocked via jest.config.js moduleNameMapper)
import Stage from '../client/js/three/stage.js';
import Puppet from '../client/js/puppet/puppet.js';
import PuppetPanel from '../client/js/ui/puppet-panel.js';

// Re-import THREE from mock for test assertions
import * as THREE from 'three';

// ============================================================
// Helper: create mock DOM
// ============================================================
function createMockDOM() {
  const elements = {};
  return {
    elements,
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = {
          id, className: '', innerHTML: '', children: [],
          style: {}, value: '', checked: false,
          appendChild: function(child) { this.children.push(child); },
          querySelector: () => null,
          querySelectorAll: () => [],
        };
      }
      return elements[id];
    },
    createElement: (tag) => {
      return {
        tagName: tag.toUpperCase(), id: '', className: '',
        innerHTML: '', children: [], style: {}, attributes: {},
        appendChild: function(child) { this.children.push(child); },
       setAttribute: function(key, value) { this.attributes[key] = value; },
          getAttribute: function(key) { return this.attributes[key]; },
        addEventListener: () => {},
      };
    },
  };
}

// ============================================================
// Stage Slot Indicators (Request 22)
// ============================================================
describe('Stage - Slot Indicators (Request 22)', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it('should create numbered slot labels when createSlotLabels is called', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createSlotLabels();
    expect(stage.slotLabels).toBeDefined();
    expect(stage.slotLabels.length).toBe(5);
  });

  it('should create labels with correct slot numbers', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    const labels = stage.createSlotLabels();
    expect(labels[0].name).toBe('slotLabel_0');
    expect(labels[1].name).toBe('slotLabel_1');
    expect(labels[2].name).toBe('slotLabel_2');
    expect(labels[3].name).toBe('slotLabel_3');
    expect(labels[4].name).toBe('slotLabel_4');
  });

  it('should hide slot labels when hideSlotLabels is called', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createSlotLabels();
    expect(stage.slotLabels[0].visible).toBe(true);
    stage.hideSlotLabels();
    expect(stage.slotLabels[0].visible).toBe(false);
  });

  it('should show slot labels when showSlotLabels is called', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createSlotLabels();
    stage.hideSlotLabels();
    expect(stage.slotLabels[0].visible).toBe(false);
    stage.showSlotLabels();
    expect(stage.slotLabels[0].visible).toBe(true);
  });

  it('should set occupancy color on slot marker', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createSlotMarkers();
    stage.setSlotOccupancy(0, '#ff0000');
    expect(stage.slotMarkers[0].material.color).toBe('#ff0000');
  });

  it('should clear occupancy color on slot marker', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createSlotMarkers();
    stage.setSlotOccupancy(0, '#ff0000');
    stage.clearSlotOccupancy(0);
    expect(stage.slotMarkers[0].material.color).toBe(0x44aaff);
  });

  it('should update slot count and recalculate positions', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createSlotMarkers();
    stage.createSlotLabels();
    expect(stage.slotMarkers.length).toBe(5);
    expect(stage.slotLabels.length).toBe(5);
    stage.updateSlotCount(3);
    expect(stage.slotMarkers.length).toBe(3);
    expect(stage.slotLabels.length).toBe(3);
  });
});

// ============================================================
// Movement Trail Effect (Request 22)
// ============================================================
describe('Puppet - Movement Trail Effect (Request 22)', () => {
  it('should enable trail effect when setTrailEnabled is called', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    puppet.setTrailEnabled(true);
    expect(puppet.trailEnabled).toBe(true);
  });

  it('should disable trail effect by default', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    expect(puppet.trailEnabled).toBe(false);
  });

  it('should create trail sprites during transition when trail enabled', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    puppet.setTrailEnabled(true);
    puppet.isMoving = true;
    puppet.group = { position: { x: 0, y: 0, z: 0 }, children: [], add: jest.fn() };
    puppet._trailTimer = 0.05; // Pre-set timer to trigger trail creation
    puppet._updateTrail(0);
    expect(puppet.trailSprites).toBeDefined();
    expect(puppet.trailSprites.length).toBeGreaterThan(0);
  });

  it('should not create trail sprites when trail disabled', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    puppet.group = { position: { x: 0, y: 0, z: 0 }, children: [], add: jest.fn() };
    puppet._updateTrail(0);
    expect(puppet.trailSprites).toHaveLength(0);
  });

  it('should clear trail sprites when transition ends', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    puppet.setTrailEnabled(true);
    puppet.group = { position: { x: 0, y: 0, z: 0 }, children: [], remove: jest.fn() };
    puppet.clearTrail();
    expect(puppet.trailSprites).toHaveLength(0);
  });
});

// ============================================================
// Location Label Display (Request 22)
// ============================================================
describe('Puppet - Location Labels (Request 22)', () => {
  it('should show location label when enabled', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    puppet.setLocationLabelVisible(true);
    expect(puppet.locationLabelVisible).toBe(true);
    expect(puppet.locationLabel.visible).toBe(true);
  });

  it('should hide location label by default', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    expect(puppet.locationLabelVisible).toBe(false);
    expect(puppet.locationLabel.visible).toBe(false);
  });

  it('should update location label text with slot info', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    puppet.updateLocationLabel('Slot 3');
    expect(puppet.locationLabel.name).toBe('Slot 3');
  });

  it('should update location label for off-screen', () => {
    const puppet = new Puppet('p1', 'owner1', 'Test Puppet');
    puppet.updateLocationLabel('Off-Screen');
    expect(puppet.locationLabel.name).toBe('Off-Screen');
  });
});

// ============================================================
// 2D Theater Aesthetic (Request 22)
// ============================================================
describe('Stage - 2D Theater Aesthetic (Request 22)', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it('should create curtain pillars when createTheaterElements is called', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createTheaterElements();
    expect(stage.theaterElements).toBeDefined();
    expect(stage.theaterElements.length).toBeGreaterThan(0);
  });

  it('should create left and right pillars', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createTheaterElements();
    const leftPillar = stage.scene.getObjectByName('leftPillar');
    const rightPillar = stage.scene.getObjectByName('rightPillar');
    expect(leftPillar).toBeTruthy();
    expect(rightPillar).toBeTruthy();
  });

  it('should create proscenium arch', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.createTheaterElements();
    const arch = stage.scene.getObjectByName('prosceniumArch');
    expect(arch).toBeTruthy();
  });

  it('should enable theater aesthetic toggle', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    expect(stage.theaterEnabled).toBe(false);
    stage.enableTheaterAesthetic();
    expect(stage.theaterEnabled).toBe(true);
  });

  it('should disable theater aesthetic toggle', () => {
    const stage = new Stage(scene, { width: 20, onScreenSlotCount: 5 });
    stage.enableTheaterAesthetic();
    stage.disableTheaterAesthetic();
    expect(stage.theaterEnabled).toBe(false);
  });
});

// ============================================================
// Puppet Panel 2D Preview (Request 22)
// ============================================================
describe('PuppetPanel - 2D Preview Update (Request 22)', () => {
  let mockDOM;

  beforeEach(() => {
    mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should have previewView property defaulting to 2d', () => {
    const panel = new PuppetPanel({});
    expect(panel.previewView).toBe('2d');
  });

  it('should set preview view to 2d', () => {
    const panel = new PuppetPanel({});
    panel.setPreviewView('2d');
    expect(panel.previewView).toBe('2d');
  });

  it('should render puppet preview with 2d class', () => {
    const panel = new PuppetPanel({});
    panel.availablePuppets = [{ id: 'p1', name: 'Test Puppet' }];
    panel._renderPuppetList();
    const listEl = document.getElementById('puppet-list');
    // The puppet items are appended as children; check first child's className
    expect(listEl.children.length).toBeGreaterThan(0);
    expect(listEl.children[0].innerHTML).toContain('puppet-preview-2d');
  });
});
