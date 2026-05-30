/** Unit Tests for Request 15: Orthographic 2D Camera & Side-View Stage
 * Tests the conversion from 3D perspective to 2D orthographic rendering
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

// Import actual modules (Three.js is mocked via jest.config.js moduleNameMapper)
import Renderer from '../client/js/three/renderer.js';
import Scene from '../client/js/three/scene.js';
import Camera from '../client/js/three/camera.js';
import Lighting from '../client/js/three/lighting.js';
import Stage from '../client/js/three/stage.js';

// Re-import THREE from mock for test assertions
import * as THREE from 'three';

describe('Request 15: Orthographic 2D Camera', () => {
  let canvas;

  beforeEach(() => {
    canvas = { id: 'stage-canvas' };
  });

  it('should create an OrthographicCamera instead of PerspectiveCamera', () => {
    const camera = new Camera(canvas);
    expect(camera.camera.constructor.name).toBe('MockOrthographicCamera');
  });

  it('should position camera at (0, 0, 10) for side view', () => {
    const camera = new Camera(canvas);
    expect(camera.camera.position.x).toBe(0);
    expect(camera.camera.position.y).toBe(0);
    expect(camera.camera.position.z).toBe(10);
  });

  it('should configure frustum based on viewport dimensions', () => {
    // 800x600 viewport
    const camera = new Camera(canvas);
    expect(camera.camera.left).toBe(-400);
    expect(camera.camera.right).toBe(400);
    expect(camera.camera.top).toBe(300);
    expect(camera.camera.bottom).toBe(-300);
  });

  it('should set near and far planes to -100 and 100', () => {
    const camera = new Camera(canvas);
    expect(camera.camera.near).toBe(-100);
    expect(camera.camera.far).toBe(100);
  });

  it('should not have orbit controls (camera is fixed)', () => {
    const camera = new Camera(canvas);
    expect(camera.controls).toBeNull();
  });

  it('should not have presets (removed for 2D view)', () => {
    const camera = new Camera(canvas);
    expect(camera.presets).toBeUndefined();
  });

  it('should update frustum on resize to maintain aspect ratio', () => {
    const camera = new Camera(canvas);
    camera.handleResize(1920, 1080);
    expect(camera.width).toBe(1920);
    expect(camera.height).toBe(1080);
    expect(camera.camera.left).toBe(-960);
    expect(camera.camera.right).toBe(960);
    expect(camera.camera.top).toBe(540);
    expect(camera.camera.bottom).toBe(-540);
    expect(camera.camera.projectionMatrixUpdated).toBe(true);
  });

  it('should support zoomIn that reduces frustum', () => {
    const camera = new Camera(canvas);
    const originalLeft = camera.camera.left;
    camera.zoomIn();
    expect(camera.camera.left).toBeGreaterThan(originalLeft);
    expect(camera.camera.right).toBeLessThan(originalLeft * -1);
  });

  it('should support zoomOut that expands frustum', () => {
    const camera = new Camera(canvas);
    const originalLeft = camera.camera.left;
    camera.zoomOut();
    expect(camera.camera.left).toBeLessThan(originalLeft);
  });

  it('should clamp zoom to minimum frustum size', () => {
    const camera = new Camera(canvas);
    // Zoom in many times
    for (let i = 0; i < 100; i++) camera.zoomIn();
    // Should not go below 1 unit
    expect(camera.camera.right - camera.camera.left).toBeGreaterThanOrEqual(1);
  });

  it('should clamp zoom to maximum frustum size', () => {
    const camera = new Camera(canvas);
    // Zoom out many times
    for (let i = 0; i < 100; i++) camera.zoomOut();
    // Should not exceed 4000 units
    expect(camera.camera.right - camera.camera.left).toBeLessThanOrEqual(8000);
  });

  it('should have update method that does nothing (no orbit controls)', () => {
    const camera = new Camera(canvas);
    expect(typeof camera.update).toBe('function');
    camera.update(); // should not throw
  });

  it('should have dispose method that handles null controls', () => {
    const camera = new Camera(canvas);
    expect(typeof camera.dispose).toBe('function');
    camera.dispose(); // should not throw
  });

  it('should provide getCamera method', () => {
    const camera = new Camera(canvas);
    expect(camera.getCamera()).toBe(camera.camera);
  });
});

describe('Request 15: Renderer 2D Configuration', () => {
  let canvas;

  beforeEach(() => {
    canvas = { id: 'stage-canvas' };
  });

  it('should set sortObjects to true for Z-order rendering', () => {
    const renderer = new Renderer(canvas);
    renderer.init(800, 600);
    expect(renderer.renderer.sortObjects).toBe(true);
  });

  it('should use default dark theater backdrop clear color', () => {
    const renderer = new Renderer(canvas);
    expect(renderer.options.clearColor).toBe(0x1a1a2e);
  });

  it('should initialize sortObjects on init', () => {
    const renderer = new Renderer(canvas);
    renderer.init(800, 600);
    expect(renderer.renderer.sortObjects).toBe(true);
  });
});

describe('Request 15: 2D Stage', () => {
  let mockScene;
  let stage;

  beforeEach(() => {
    mockScene = {
      children: [],
      add: jest.fn((obj) => mockScene.children.push(obj)),
      remove: jest.fn((obj) => {
        const idx = mockScene.children.indexOf(obj);
        if (idx > -1) mockScene.children.splice(idx, 1);
      }),
      getObjectByName: jest.fn((name) => mockScene.children.find(c => c.name === name) || null),
    };
    stage = new Stage(mockScene);
  });

  it('should create a 2D stage floor (horizontal bar)', () => {
    const floor = stage.createStageFloor();
    expect(floor).toBeTruthy();
    expect(floor.name).toBe('stageFloor');
    // Floor should be at the bottom of the stage
    expect(floor.position.y).toBe(-4.5);
  });

  it('should create a backdrop plane at z: -1', () => {
    const backdrop = stage.createBackdrop();
    expect(backdrop).toBeTruthy();
    expect(backdrop.name).toBe('stageBackdrop');
    expect(backdrop.position.z).toBe(-1);
  });

  it('should not create a grid helper (removed for 2D)', () => {
    // setupStage should not call createGridHelper
    stage.setupStage();
    const gridObjects = mockScene.children.filter(c => c.name === 'gridHelper');
    expect(gridObjects.length).toBe(0);
  });

  it('should create location slot markers for 7 positions', () => {
    stage.setupStage();
    const markerObjects = mockScene.children.filter(c => c.name && c.name.startsWith('slotMarker_'));
    // Default 5 on-screen slots + 2 off-screen = 7, but only on-screen rendered
    expect(markerObjects.length).toBe(5);
  });

  it('should position slot markers evenly across stage width', () => {
    stage.setupStage();
    const markers = mockScene.children.filter(c => c.name && c.name.startsWith('slotMarker_'));
    // Markers should be spread across the stage
    expect(markers[0].position.x).toBeLessThan(markers[1].position.x);
    expect(markers[1].position.x).toBeLessThan(markers[2].position.x);
    expect(markers[2].position.x).toBeLessThan(markers[3].position.x);
    expect(markers[3].position.x).toBeLessThan(markers[4].position.x);
  });

  it('should center the middle slot marker at x: 0', () => {
    stage.setupStage();
    const markers = mockScene.children.filter(c => c.name && c.name.startsWith('slotMarker_'));
    // Center slot (index 2 of 5) should be at x: 0
    expect(markers[2].position.x).toBe(0);
  });

  it('should not create boundary markers (replaced by slot markers)', () => {
    stage.setupStage();
    const boundaryObjects = mockScene.children.filter(c => c.name && c.name.startsWith('boundaryMarker_'));
    expect(boundaryObjects.length).toBe(0);
  });

  it('should setup 2D stage with floor, backdrop, and slot markers', () => {
    stage.setupStage();
    // 1 floor + 1 backdrop + 5 slot markers = 7 (no grid, no boundary markers)
    expect(stage.stageObjectCount).toBe(7);
  });

  it('should clear stage elements', () => {
    stage.setupStage();
    expect(stage.stageObjectCount).toBe(7);
    stage.clearStage();
    expect(stage.stageObjectCount).toBe(0);
  });

  it('should set backdrop texture', () => {
    stage.setupStage();
    const mockTexture = { url: 'test-bg.png' };
    stage.setBackgroundTexture(mockTexture);
    const backdrop = mockScene.getObjectByName('stageBackdrop');
    expect(backdrop.material.map).toBe(mockTexture);
    expect(backdrop.material.needsUpdate).toBe(true);
  });

  it('should use custom onScreenSlotCount for slot markers', () => {
    const customStage = new Stage(mockScene, { onScreenSlotCount: 3 });
    customStage.setupStage();
    const markers = mockScene.children.filter(c => c.name && c.name.startsWith('slotMarker_'));
    expect(markers.length).toBe(3);
  });

  it('should position slot markers based on stage width', () => {
    const customStage = new Stage(mockScene, { width: 20, onScreenSlotCount: 4 });
    customStage.setupStage();
    const markers = mockScene.children.filter(c => c.name && c.name.startsWith('slotMarker_'));
    // 4 slots across width 20: each slot is 5 units wide
    // Positions should be at -7.5, -2.5, 2.5, 7.5
    expect(markers[0].position.x).toBeCloseTo(-7.5);
    expect(markers[1].position.x).toBeCloseTo(-2.5);
    expect(markers[2].position.x).toBeCloseTo(2.5);
    expect(markers[3].position.x).toBeCloseTo(7.5);
  });
});

describe('Request 15: Simplified 2D Lighting', () => {
  let mockScene;
  let lighting;

  beforeEach(() => {
    mockScene = {
      children: [],
      add: jest.fn((obj) => mockScene.children.push(obj)),
      remove: jest.fn((obj) => {
        const idx = mockScene.children.indexOf(obj);
        if (idx > -1) mockScene.children.splice(idx, 1);
      }),
    };
    lighting = new Lighting(mockScene);
  });

  it('should setup 2D lighting with only ambient light at intensity 1.0', () => {
    const ambient = lighting.setupBasicLighting();
    expect(ambient).toBeTruthy();
    expect(ambient.intensity).toBe(1.0);
    expect(lighting.lightCount).toBe(1);
  });

  it('should not create directional light for 2D', () => {
    lighting.setupBasicLighting();
    const directionalLights = mockScene.children.filter(
      c => c.constructor.name === 'MockDirectionalLight'
    );
    expect(directionalLights.length).toBe(0);
  });

  it('should only add one ambient light to scene', () => {
    lighting.setupBasicLighting();
    expect(mockScene.add).toHaveBeenCalledTimes(1);
    expect(mockScene.children.length).toBe(1);
  });

  it('should return only ambient from setupBasicLighting', () => {
    const result = lighting.setupBasicLighting();
    expect(result).toBeTruthy();
    expect(result.constructor.name).toBe('MockAmbientLight');
    // Should not have directional property
    expect(result.intensity).toBe(1.0);
  });
});

describe('Request 15: 2D Module Integration', () => {
  it('should verify all 2D modules work together', () => {
    const canvas = { id: 'stage-canvas' };

    const scene = new Scene();
    const renderer = new Renderer(canvas);
    const camera = new Camera(canvas);
    const lighting = new Lighting(scene.getScene());
    const stage = new Stage(scene.getScene());

    renderer.init(800, 600);
    lighting.setupBasicLighting();
    stage.setupStage();

    // Verify 2D renderer config
    expect(renderer.renderer.sortObjects).toBe(true);

    // Verify 2D lighting (ambient only)
    expect(lighting.lightCount).toBe(1);

    // Verify 2D stage (floor + backdrop + 5 slot markers)
    expect(stage.stageObjectCount).toBe(7);

    // Verify orthographic camera
    expect(camera.camera.constructor.name).toBe('MockOrthographicCamera');
    expect(camera.camera.position.z).toBe(10);
    expect(camera.controls).toBeNull();
  });

  it('should handle resize for 2D orthographic camera', () => {
    const canvas = { id: 'stage-canvas' };
    const camera = new Camera(canvas);
    const renderer = new Renderer(canvas);

    renderer.init(800, 600);
    camera.handleResize(1920, 1080);

    expect(camera.width).toBe(1920);
    expect(camera.height).toBe(1080);
    expect(camera.camera.left).toBe(-960);
    expect(camera.camera.right).toBe(960);
    expect(camera.camera.top).toBe(540);
    expect(camera.camera.bottom).toBe(-540);
  });

  it('should support zoom in/out for 2D camera', () => {
    const canvas = { id: 'stage-canvas' };
    const camera = new Camera(canvas);

    const initialWidth = camera.camera.right - camera.camera.left;

    camera.zoomIn();
    const zoomedInWidth = camera.camera.right - camera.camera.left;
    expect(zoomedInWidth).toBeLessThan(initialWidth);

    camera.zoomOut();
    const zoomedOutWidth = camera.camera.right - camera.camera.left;
    expect(zoomedOutWidth).toBeCloseTo(initialWidth);
  });

  it('should cleanup without errors', () => {
    const canvas = { id: 'stage-canvas' };
    const mockScene = {
      children: [],
      add: jest.fn(),
      remove: jest.fn(),
      getObjectByName: jest.fn(() => null),
    };

    const scene = new Scene();
    const renderer = new Renderer(canvas);
    const camera = new Camera(canvas);
    const lighting = new Lighting(scene.getScene());
    const stage = new Stage(scene.getScene());

    renderer.init(800, 600);
    lighting.setupBasicLighting();
    stage.setupStage();

    // Cleanup should not throw
    camera.dispose();
    renderer.dispose();
  });
});