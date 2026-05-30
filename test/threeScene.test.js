/** Unit Tests for Three.js 3D Scene Setup
 * Tests renderer, scene, camera, lighting, and stage modules
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

describe('Three.js Camera Module', () => {
  let canvas;

  beforeEach(() => {
    canvas = { id: 'stage-canvas' };
  });

  it('should create a camera instance', () => {
    const camera = new Camera(canvas);
    expect(camera).toBeTruthy();
    expect(camera.camera).toBeTruthy();
  });

  it('should set default camera position', () => {
    const camera = new Camera(canvas);
    expect(camera.camera.position.x).toBe(0);
    expect(camera.camera.position.y).toBe(5);
    expect(camera.camera.position.z).toBe(10);
  });

  it('should enable orbit controls damping', () => {
    const camera = new Camera(canvas);
    expect(camera.controls.enableDamping).toBe(true);
  });

  it('should set controls target to origin', () => {
    const camera = new Camera(canvas);
    expect(camera.controls.target.x).toBe(0);
    expect(camera.controls.target.y).toBe(0);
    expect(camera.controls.target.z).toBe(0);
  });

  it('should apply default preset', () => {
    const camera = new Camera(canvas);
    // Move camera away first
    camera.camera.position.set(100, 100, 100);
    const result = camera.setPreset('default');
    expect(result).toBe(true);
    expect(camera.camera.position.x).toBe(0);
    expect(camera.camera.position.y).toBe(5);
    expect(camera.camera.position.z).toBe(10);
  });

  it('should apply topDown preset', () => {
    const camera = new Camera(canvas);
    camera.setPreset('topDown');
    expect(camera.camera.position.x).toBe(0);
    expect(camera.camera.position.y).toBe(15);
    expect(camera.camera.position.z).toBe(0.01);
  });

  it('should apply side preset', () => {
    const camera = new Camera(canvas);
    camera.setPreset('side');
    expect(camera.camera.position.x).toBe(10);
    expect(camera.camera.position.y).toBe(3);
    expect(camera.camera.position.z).toBe(0);
  });

  it('should return false for invalid preset', () => {
    const camera = new Camera(canvas);
    const result = camera.setPreset('invalidPreset');
    expect(result).toBe(false);
  });

  it('should update aspect ratio on resize', () => {
    const camera = new Camera(canvas);
    camera.handleResize(1024, 768);
    expect(camera.camera.aspect).toBe(1024 / 768);
  });

  it('should update width and height on resize', () => {
    const camera = new Camera(canvas);
    camera.handleResize(1920, 1080);
    expect(camera.width).toBe(1920);
    expect(camera.height).toBe(1080);
  });

  it('should have update method for controls', () => {
    const camera = new Camera(canvas);
    expect(typeof camera.update).toBe('function');
    camera.update(); // should not throw
  });

  it('should have dispose method', () => {
    const camera = new Camera(canvas);
    expect(typeof camera.dispose).toBe('function');
    camera.dispose(); // should not throw
  });

  it('should have three presets defined', () => {
    const camera = new Camera(canvas);
    expect(Object.keys(camera.presets)).toEqual(expect.arrayContaining(['default', 'topDown', 'side']));
  });

  it('should provide getCamera method', () => {
    const camera = new Camera(canvas);
    expect(camera.getCamera()).toBe(camera.camera);
  });
});

describe('Three.js Lighting Module', () => {
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

  it('should setup basic lighting with ambient and directional', () => {
    const { ambient, directional } = lighting.setupBasicLighting();
    expect(ambient).toBeTruthy();
    expect(directional).toBeTruthy();
    expect(lighting.lightCount).toBe(2);
  });

  it('should add lights to the scene', () => {
    lighting.setupBasicLighting();
    expect(mockScene.add).toHaveBeenCalledTimes(2);
    expect(mockScene.children.length).toBe(2);
  });

  it('should add point light', () => {
    const point = lighting.addPointLight(1, 2, 3, 0xff0000, 0.5, 10);
    expect(point).toBeTruthy();
    expect(point.position.x).toBe(1);
    expect(point.position.y).toBe(2);
    expect(point.position.z).toBe(3);
    expect(lighting.lightCount).toBe(1);
  });

  it('should use default values for point light params', () => {
    const point = lighting.addPointLight(0, 0, 0);
    expect(point).toBeTruthy();
  });

  it('should remove all lights', () => {
    lighting.setupBasicLighting();
    lighting.addPointLight(0, 0, 0);
    expect(lighting.lightCount).toBe(3);
    lighting.removeAllLights();
    expect(lighting.lightCount).toBe(0);
  });

  it('should call scene.remove for each light on removeAllLights', () => {
    lighting.setupBasicLighting();
    lighting.removeAllLights();
    expect(mockScene.remove).toHaveBeenCalledTimes(2);
  });

  it('should set directional light position', () => {
    const { directional } = lighting.setupBasicLighting();
    expect(directional.position.x).toBe(5);
    expect(directional.position.y).toBe(10);
    expect(directional.position.z).toBe(7);
  });

  it('should return correct lightCount after multiple operations', () => {
    expect(lighting.lightCount).toBe(0);
    lighting.setupBasicLighting();
    expect(lighting.lightCount).toBe(2);
    lighting.addPointLight(0, 0, 0);
    expect(lighting.lightCount).toBe(3);
    lighting.addPointLight(1, 1, 1);
    expect(lighting.lightCount).toBe(4);
    lighting.removeAllLights();
    expect(lighting.lightCount).toBe(0);
  });
});

describe('Three.js Stage Module', () => {
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
    expect(stage.stageDepth).toBe(20);
  });

  it('should accept custom width and depth options', () => {
    const customStage = new Stage(mockScene, { width: 30, depth: 40 });
    expect(customStage.stageWidth).toBe(30);
    expect(customStage.stageDepth).toBe(40);
  });

  it('should start with zero stage objects', () => {
    expect(stage.stageObjectCount).toBe(0);
  });

  it('should create ground plane', () => {
    const ground = stage.createGroundPlane();
    expect(ground).toBeTruthy();
    expect(ground.name).toBe('groundPlane');
    expect(ground.rotation.x).toBe(-Math.PI / 2);
    expect(ground.position.y).toBe(-0.01);
  });

  it('should add ground plane to scene', () => {
    stage.createGroundPlane();
    expect(mockScene.add).toHaveBeenCalledTimes(1);
    expect(stage.stageObjectCount).toBe(1);
  });

  it('should create grid helper', () => {
    const grid = stage.createGridHelper();
    expect(grid).toBeTruthy();
    expect(grid.size).toBe(20);
    expect(grid.divisions).toBe(20);
  });

  it('should add grid helper to scene', () => {
    stage.createGridHelper();
    expect(stage.stageObjectCount).toBe(1);
  });

  it('should create 4 boundary markers', () => {
    const markers = stage.createBoundaryMarkers();
    expect(markers.length).toBe(4);
    expect(stage.stageObjectCount).toBe(4);
  });

  it('should position boundary markers at corners', () => {
    const markers = stage.createBoundaryMarkers();
    // Stage is 20x20, so half is 10
    expect(markers[0].position.x).toBe(-10);
    expect(markers[0].position.z).toBe(-10);
    expect(markers[1].position.x).toBe(10);
    expect(markers[1].position.z).toBe(-10);
    expect(markers[2].position.x).toBe(-10);
    expect(markers[2].position.z).toBe(10);
    expect(markers[3].position.x).toBe(10);
    expect(markers[3].position.z).toBe(10);
  });

  it('should name boundary markers sequentially', () => {
    const markers = stage.createBoundaryMarkers();
    expect(markers[0].name).toBe('boundaryMarker_0');
    expect(markers[1].name).toBe('boundaryMarker_1');
    expect(markers[2].name).toBe('boundaryMarker_2');
    expect(markers[3].name).toBe('boundaryMarker_3');
  });

  it('should create background plane', () => {
    const bg = stage.createBackgroundPlane();
    expect(bg).toBeTruthy();
    expect(bg.name).toBe('backgroundPlane');
    expect(bg.position.z).toBe(-10);
  });

  it('should position background plane at (0, 5, -10)', () => {
    const bg = stage.createBackgroundPlane();
    expect(bg.position.x).toBe(0);
    expect(bg.position.y).toBe(5);
    expect(bg.position.z).toBe(-10);
  });

  it('should setup full stage with all elements', () => {
    stage.setupStage();
    // 1 ground + 1 grid + 4 markers + 1 background = 7
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

  it('should set background texture', () => {
    stage.setupStage();
    const mockTexture = { url: 'test-bg.png' };
    stage.setBackgroundTexture(mockTexture);
    const bg = mockScene.getObjectByName('backgroundPlane');
    expect(bg.material.map).toBe(mockTexture);
    expect(bg.material.needsUpdate).toBe(true);
  });

  it('should handle setBackgroundTexture when background does not exist', () => {
    // Don't setup stage, so no background exists
    const mockTexture = { url: 'test-bg.png' };
    stage.setBackgroundTexture(mockTexture); // should not throw
  });

  it('should use custom stage dimensions for ground plane', () => {
    const customStage = new Stage(mockScene, { width: 30, depth: 40 });
    const ground = customStage.createGroundPlane();
    expect(ground.geometry.width).toBe(30);
    expect(ground.geometry.height).toBe(40);
  });

  it('should use custom stage dimensions for grid', () => {
    const customStage = new Stage(mockScene, { width: 30, depth: 40 });
    const grid = customStage.createGridHelper();
    expect(grid.size).toBe(30);
  });

  it('should position boundary markers based on custom dimensions', () => {
    const customStage = new Stage(mockScene, { width: 30, depth: 40 });
    const markers = customStage.createBoundaryMarkers();
    // halfWidth = 15, halfDepth = 20
    expect(markers[0].position.x).toBe(-15);
    expect(markers[0].position.z).toBe(-20);
    expect(markers[3].position.x).toBe(15);
    expect(markers[3].position.z).toBe(20);
  });
});

describe('Three.js Module Integration', () => {
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
    expect(lighting.lightCount).toBe(2);
    expect(stage.stageObjectCount).toBe(7);
    expect(camera.camera.position.y).toBe(5);
  });

  it('should verify camera preset constants', () => {
    const canvas = { id: 'stage-canvas' };
    const camera = new Camera(canvas);
    expect(Object.keys(camera.presets).length).toBe(3);
    expect(camera.presets.default).toBeTruthy();
    expect(camera.presets.topDown).toBeTruthy();
    expect(camera.presets.side).toBeTruthy();
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
    expect(stage.stageDepth).toBe(20);
  });
});

describe('Three.js Render Loop Simulation', () => {
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
    expect(camera.camera.aspect).toBe(newWidth / newHeight);
    expect(camera.width).toBe(newWidth);
    expect(camera.height).toBe(newHeight);

    // Simulate camera preset change
    camera.setPreset('topDown');
    expect(camera.camera.position.y).toBe(15);

    // Cleanup
    camera.dispose();
    renderer.dispose();
  });
});