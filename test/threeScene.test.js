/** Unit Tests for Three.js 3D Scene Setup
 * Tests renderer, scene, camera, lighting, and stage modules
 * Uses mocked Three.js for Node.js test environment via __mocks__/three.js
 * Updated for Request 15: Orthographic 2D Camera & Side-View Stage
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

describe('Three.js Renderer Module', () => {
  let canvas;

  beforeEach(() => {
    canvas = { id: 'stage-canvas' };
  });

  it('should create a renderer instance', () => {
    const renderer = new Renderer(canvas);
    expect(renderer).toBeTruthy();
    expect(renderer.renderer.constructor.name).toBe('MockWebGLRenderer');
  });

  it('should initialize renderer with correct size', () => {
    const renderer = new Renderer(canvas);
    renderer.init(800, 600);
    expect(renderer.renderer.setSizeCalled).toBe(true);
    expect(renderer.renderer.setSizeArgs).toEqual({ width: 800, height: 600 });
  });

  it('should set clear color correctly', () => {
    const renderer = new Renderer(canvas, { clearColor: 0xff0000 });
    expect(renderer.options.clearColor).toBe(0xff0000);
  });

  it('should use default clear color when not specified', () => {
    const renderer = new Renderer(canvas);
    expect(renderer.options.clearColor).toBe(0x1a1a2e);
  });

  it('should handle resize events', () => {
    const renderer = new Renderer(canvas);
    renderer.init(800, 600);
    renderer.handleResize(1024, 768);
    expect(renderer.renderer.setSizeArgs).toEqual({ width: 1024, height: 768 });
  });

  it('should support antialiasing option', () => {
    const renderer = new Renderer(canvas, { antialias: false });
    expect(renderer.options.antialias).toBe(false);
  });

  it('should have antialiasing enabled by default', () => {
    const renderer = new Renderer(canvas);
    expect(renderer.options.antialias).toBe(true);
  });

  it('should support alpha option', () => {
    const renderer = new Renderer(canvas, { alpha: true });
    expect(renderer.options.alpha).toBe(true);
  });

  it('should provide getRenderer method', () => {
    const renderer = new Renderer(canvas);
    const r = renderer.getRenderer();
    expect(r).toBe(renderer.renderer);
  });

  it('should call setSize on init', () => {
    const renderer = new Renderer(canvas);
    const result = renderer.init(1920, 1080);
    expect(renderer.renderer.setSizeArgs).toEqual({ width: 1920, height: 1080 });
    expect(result).toBe(renderer.renderer);
  });

  it('should set sortObjects to true on init for 2D rendering', () => {
    const renderer = new Renderer(canvas);
    renderer.init(800, 600);
    expect(renderer.renderer.sortObjects).toBe(true);
  });
});

describe('Three.js Scene Module', () => {
  let scene;

  beforeEach(() => {
    scene = new Scene();
  });

  it('should create a scene instance', () => {
    expect(scene).toBeTruthy();
    expect(scene.scene).toBeTruthy();
  });

  it('should return the internal scene via getScene', () => {
    expect(scene.getScene()).toBe(scene.scene);
  });

  it('should start with zero children', () => {
    expect(scene.childCount).toBe(0);
  });

  it('should add objects to the scene', () => {
    const obj = { name: 'testObject', children: [], position: {}, rotation: {}, visible: true };
    scene.add(obj);
    expect(scene.childCount).toBe(1);
  });

  it('should remove objects from the scene', () => {
    const obj = { name: 'testObject' };
    scene.add(obj);
    scene.remove(obj);
    expect(scene.childCount).toBe(0);
  });

  it('should clear all objects from the scene', () => {
    scene.add({ name: 'obj1' });
    scene.add({ name: 'obj2' });
    scene.add({ name: 'obj3' });
    expect(scene.childCount).toBe(3);
    scene.clear();
    expect(scene.childCount).toBe(0);
  });

  it('should find objects by name', () => {
    const obj = { name: 'myObject' };
    scene.add(obj);
    const found = scene.getObjectByName('myObject');
    expect(found).toBe(obj);
  });

  it('should return null for non-existent object name', () => {
    const found = scene.getObjectByName('nonExistent');
    expect(found).toBeNull();
  });
});

describe('Three.js Camera Module (Orthographic 2D)', () => {
  let canvas;

  beforeEach(() => {
    canvas = { id: 'stage-canvas' };
  });

  it('should create a camera instance', () => {
    const camera = new Camera(canvas);
    expect(camera).toBeTruthy();
    expect(camera.camera).toBeTruthy();
  });

  it('should use OrthographicCamera', () => {
    const camera = new Camera(canvas);
    expect(camera.camera.constructor.name).toBe('MockOrthographicCamera');
  });

  it('should set camera position at (0, 0, 10) for side view', () => {
    const camera = new Camera(canvas);
    expect(camera.camera.position.x).toBe(0);
    expect(camera.camera.position.y).toBe(0);
    expect(camera.camera.position.z).toBe(10);
  });

  it('should not have orbit controls (fixed 2D camera)', () => {
    const camera = new Camera(canvas);
    expect(camera.controls).toBeNull();
  });

  it('should configure frustum based on viewport', () => {
    const camera = new Camera(canvas);
    expect(camera.camera.left).toBe(-400);
    expect(camera.camera.right).toBe(400);
    expect(camera.camera.top).toBe(300);
    expect(camera.camera.bottom).toBe(-300);
  });

  it('should update frustum on resize', () => {
    const camera = new Camera(canvas);
    camera.handleResize(1920, 1080);
    expect(camera.width).toBe(1920);
    expect(camera.height).toBe(1080);
    expect(camera.camera.left).toBe(-960);
    expect(camera.camera.right).toBe(960);
  });

  it('should have update method (no-op for fixed camera)', () => {
    const camera = new Camera(canvas);
    expect(typeof camera.update).toBe('function');
    camera.update(); // should not throw
  });

  it('should have dispose method', () => {
    const camera = new Camera(canvas);
    expect(typeof camera.dispose).toBe('function');
    camera.dispose(); // should not throw
  });

  it('should provide getCamera method', () => {
    const camera = new Camera(canvas);
    expect(camera.getCamera()).toBe(camera.camera);
  });

  it('should support zoomIn', () => {
    const camera = new Camera(canvas);
    const initialWidth = camera.camera.right - camera.camera.left;
    camera.zoomIn();
    const zoomedWidth = camera.camera.right - camera.camera.left;
    expect(zoomedWidth).toBeLessThan(initialWidth);
  });

  it('should support zoomOut', () => {
    const camera = new Camera(canvas);
    const initialWidth = camera.camera.right - camera.camera.left;
    camera.zoomOut();
    const zoomedWidth = camera.camera.right - camera.camera.left;
    expect(zoomedWidth).toBeGreaterThan(initialWidth);
  });
});

describe('Three.js Lighting Module (2D Simplified)', () => {
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

  it('should create a lighting instance', () => {
    expect(lighting).toBeTruthy();
    expect(lighting.lightCount).toBe(0);
  });

  it('should setup 2D lighting with only ambient light', () => {
    const ambient = lighting.setupBasicLighting();
    expect(ambient).toBeTruthy();
    expect(ambient.constructor.name).toBe('MockAmbientLight');
    expect(ambient.intensity).toBe(1.0);
    expect(lighting.lightCount).toBe(1);
  });

  it('should add light to the scene', () => {
    lighting.setupBasicLighting();
    expect(mockScene.add).toHaveBeenCalledTimes(1);
    expect(mockScene.children.length).toBe(1);
  });

  it('should remove all lights', () => {
    lighting.setupBasicLighting();
    expect(lighting.lightCount).toBe(1);
    lighting.removeAllLights();
    expect(lighting.lightCount).toBe(0);
  });

  it('should call scene.remove for each light on removeAllLights', () => {
    lighting.setupBasicLighting();
    lighting.removeAllLights();
    expect(mockScene.remove).toHaveBeenCalledTimes(1);
  });

  it('should return correct lightCount after operations', () => {
    expect(lighting.lightCount).toBe(0);
    lighting.setupBasicLighting();
    expect(lighting.lightCount).toBe(1);
    lighting.removeAllLights();
    expect(lighting.lightCount).toBe(0);
  });
});

describe('Three.js Stage Module (2D Theater)', () => {
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

  it('should create a stage instance', () => {
    expect(stage).toBeTruthy();
    expect(stage.stageWidth).toBe(20);
  });

  it('should accept custom width options', () => {
    const customStage = new Stage(mockScene, { width: 30 });
    expect(customStage.stageWidth).toBe(30);
  });

  it('should start with zero stage objects', () => {
    expect(stage.stageObjectCount).toBe(0);
  });

  it('should create stage floor', () => {
    const floor = stage.createStageFloor();
    expect(floor).toBeTruthy();
    expect(floor.name).toBe('stageFloor');
    expect(floor.position.y).toBe(-4.5);
  });

  it('should add stage floor to scene', () => {
    stage.createStageFloor();
    expect(mockScene.add).toHaveBeenCalledTimes(1);
    expect(stage.stageObjectCount).toBe(1);
  });

  it('should create backdrop at z: -1', () => {
    const backdrop = stage.createBackdrop();
    expect(backdrop).toBeTruthy();
    expect(backdrop.name).toBe('stageBackdrop');
    expect(backdrop.position.z).toBe(-1);
  });

  it('should add backdrop to scene', () => {
    stage.createBackdrop();
    expect(stage.stageObjectCount).toBe(1);
  });

  it('should create 5 slot markers by default', () => {
    const markers = stage.createSlotMarkers();
    expect(markers.length).toBe(5);
    expect(stage.stageObjectCount).toBe(5);
  });

  it('should position slot markers across stage width', () => {
    const markers = stage.createSlotMarkers();
    // Stage is 20, 5 slots = 4 units per slot
    // Positions: -8, -4, 0, 4, 8
    expect(markers[0].position.x).toBe(-8);
    expect(markers[1].position.x).toBe(-4);
    expect(markers[2].position.x).toBe(0);
    expect(markers[3].position.x).toBe(4);
    expect(markers[4].position.x).toBe(8);
  });

  it('should name slot markers sequentially', () => {
    const markers = stage.createSlotMarkers();
    expect(markers[0].name).toBe('slotMarker_0');
    expect(markers[1].name).toBe('slotMarker_1');
    expect(markers[2].name).toBe('slotMarker_2');
    expect(markers[3].name).toBe('slotMarker_3');
    expect(markers[4].name).toBe('slotMarker_4');
  });

  it('should setup full 2D stage with all elements', () => {
    stage.setupStage();
    // 1 floor + 1 backdrop + 5 slot markers = 7
    expect(stage.stageObjectCount).toBe(7);
  });

  it('should clear stage elements', () => {
    stage.setupStage();
    expect(stage.stageObjectCount).toBe(7);
    stage.clearStage();
    expect(stage.stageObjectCount).toBe(0);
  });

  it('should call scene.remove for each object on clearStage', () => {
    stage.setupStage();
    stage.clearStage();
    expect(mockScene.remove).toHaveBeenCalledTimes(7);
  });

  it('should set backdrop texture', () => {
    stage.setupStage();
    const mockTexture = { url: 'test-bg.png' };
    stage.setBackgroundTexture(mockTexture);
    const backdrop = mockScene.getObjectByName('stageBackdrop');
    expect(backdrop.material.map).toBe(mockTexture);
    expect(backdrop.material.needsUpdate).toBe(true);
  });

  it('should handle setBackgroundTexture when backdrop does not exist', () => {
    // Don't setup stage, so no backdrop exists
    const mockTexture = { url: 'test-bg.png' };
    stage.setBackgroundTexture(mockTexture); // should not throw
  });

  it('should use custom stage dimensions for floor', () => {
    const customStage = new Stage(mockScene, { width: 30 });
    const floor = customStage.createStageFloor();
    expect(floor.geometry.width).toBe(30);
  });

  it('should use custom onScreenSlotCount', () => {
    const customStage = new Stage(mockScene, { onScreenSlotCount: 3 });
    const markers = customStage.createSlotMarkers();
    expect(markers.length).toBe(3);
  });

  it('should position markers based on custom dimensions', () => {
    const customStage = new Stage(mockScene, { width: 30, onScreenSlotCount: 6 });
    const markers = customStage.createSlotMarkers();
    // 6 slots across width 30: each slot is 5 units wide
    // Positions at center of each slot: -12.5, -7.5, -2.5, 2.5, 7.5, 12.5
    expect(markers[0].position.x).toBe(-12.5);
    expect(markers[5].position.x).toBe(12.5);
  });
});

describe('Three.js Module Integration (2D)', () => {
  it('should verify all modules can work together', () => {
    // Simulate the init flow from main.js
    const canvas = { id: 'stage-canvas' };

    const scene = new Scene();
    const renderer = new Renderer(canvas);
    const camera = new Camera(canvas);
    const lighting = new Lighting(scene.getScene());
    const stage = new Stage(scene.getScene());

    renderer.init(800, 600);
    lighting.setupBasicLighting();
    stage.setupStage();

    expect(renderer.renderer.setSizeCalled).toBe(true);
    expect(renderer.renderer.sortObjects).toBe(true);
    expect(lighting.lightCount).toBe(1);
    expect(stage.stageObjectCount).toBe(7);
    expect(camera.camera.position.z).toBe(10);
    expect(camera.controls).toBeNull();
  });

  it('should verify camera is orthographic', () => {
    const canvas = { id: 'stage-canvas' };
    const camera = new Camera(canvas);
    expect(camera.camera.constructor.name).toBe('MockOrthographicCamera');
    expect(camera.camera.near).toBe(-100);
    expect(camera.camera.far).toBe(100);
  });

  it('should verify stage dimensions constants', () => {
    const mockScene = {
      children: [],
      add: jest.fn(),
      remove: jest.fn(),
      getObjectByName: jest.fn(() => null),
    };
    const stage = new Stage(mockScene);
    expect(stage.stageWidth).toBe(20);
    expect(stage.onScreenSlotCount).toBe(5);
  });
});

describe('Three.js Render Loop Simulation (2D)', () => {
  it('should simulate a render loop structure', () => {
    let frameCount = 0;
    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;
      frameCount++;
      if (frameCount < 3) {
        setTimeout(renderLoop, 0);
      }
    };

    renderLoop();
    expect(frameCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle cleanup on stop', () => {
    let isRunning = true;
    let stopped = false;

    const stop = () => {
      isRunning = false;
      stopped = true;
    };

    stop();
    expect(isRunning).toBe(false);
    expect(stopped).toBe(true);
  });

  it('should simulate full init and render cycle', () => {
    const canvas = { id: 'stage-canvas' };
    const mockScene = {
      children: [],
      add: jest.fn(),
      remove: jest.fn(),
      getObjectByName: jest.fn(() => null),
    };

    // Simulate main.js initThreeJS flow
    const scene = new Scene();
    const renderer = new Renderer(canvas);
    const camera = new Camera(canvas);
    const lighting = new Lighting(scene.getScene());
    const stage = new Stage(scene.getScene());

    // Init
    renderer.init(800, 600);
    lighting.setupBasicLighting();
    stage.setupStage();

    // Simulate resize
    const newWidth = 1920;
    const newHeight = 1080;
    renderer.handleResize(newWidth, newHeight);
    camera.handleResize(newWidth, newHeight);

    // Verify resize was handled
    expect(renderer.renderer.setSizeArgs).toEqual({ width: newWidth, height: newHeight });
    expect(camera.camera.left).toBe(-newWidth / 2);
    expect(camera.camera.right).toBe(newWidth / 2);
    expect(camera.width).toBe(newWidth);
    expect(camera.height).toBe(newHeight);

    // Cleanup
    camera.dispose();
    renderer.dispose();
  });
});