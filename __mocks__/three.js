/** Jest Mock for Three.js
 * Provides mock implementations of Three.js classes for Node.js test environment
 */

class MockVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
}

class MockEuler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }
  set(x, y, z, order) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order || this.order;
    return this;
  }
}

class MockObject3D {
  constructor() {
    this.children = [];
    this.position = new MockVector3();
    this.rotation = new MockEuler();
    this.scale = new MockVector3(1, 1, 1);
    this.visible = true;
    this.name = '';
  }
  add(child) {
    this.children.push(child);
  }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx > -1) this.children.splice(idx, 1);
  }
  getObjectByName(name) {
    return this.children.find(c => c.name === name) || null;
  }
}

class MockObject3DClass extends MockObject3D {}

class MockScene extends MockObject3D {}

class MockPerspectiveCamera extends MockObject3D {
  constructor(fov = 75, aspect = 1, near = 0.1, far = 1000) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }
  updateProjectionMatrix() {}
}

class MockOrthographicCamera extends MockObject3D {
  constructor(left = -1, right = 1, top = 1, bottom = -1, near = -100, far = 100) {
    super();
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.near = near;
    this.far = far;
  }
  updateProjectionMatrix() {
    this.projectionMatrixUpdated = true;
  }
  setZoom(zoom) {
    this.zoom = zoom;
  }
}

class MockWebGLRenderer {
  constructor(params = {}) {
    this.params = params;
    this.setSizeCalled = false;
    this.setSizeArgs = null;
    this.pixelRatio = 1;
    this.sortObjects = false;
  }
  setSize(width, height) {
    this.setSizeCalled = true;
    this.setSizeArgs = { width, height };
  }
  setClearColor(color, alpha) {
    this.clearColor = color;
    this.clearAlpha = alpha;
  }
  setPixelRatio(ratio) {
    this.pixelRatio = ratio || 1;
  }
  getPixelRatio() {
    return this.pixelRatio;
  }
  render(scene, camera) {}
  dispose() {}
  domElement = { addEventListener: () => {}, removeEventListener: () => {} };
}

class MockDirectionalLight {
  constructor(color, intensity) {
    this.color = { set: (c) => { this.colorValue = c; } };
    this.intensity = intensity;
    this.position = new MockVector3();
  }
}

class MockAmbientLight {
  constructor(color, intensity) {
    this.color = { set: (c) => { this.colorValue = c; } };
    this.intensity = intensity;
  }
}

class MockPointLight {
  constructor(color, intensity, distance) {
    this.color = { set: (c) => { this.colorValue = c; } };
    this.intensity = intensity;
    this.distance = distance;
    this.position = new MockVector3();
  }
}

class MockGridHelper {
  constructor(size, divisions, colorCenter, colorGrid) {
    this.size = size;
    this.divisions = divisions;
    this.colorCenter = colorCenter;
    this.colorGrid = colorGrid;
  }
}

class MockPlaneGeometry {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
}

class MockMeshBasicMaterial {
  constructor(params = {}) {
    Object.assign(this, params);
  }
}

class MockMeshLambertMaterial {
  constructor(params = {}) {
    Object.assign(this, params);
  }
}

class MockMesh extends MockObject3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
  }
}

class MockOrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.maxPolarAngle = Math.PI;
    this.minPolarAngle = 0;
    this.target = new MockVector3();
  }
  update() {}
  dispose() {}
}

const DoubleSide = 2;

const MockTHREE = {
  Scene: MockScene,
  PerspectiveCamera: MockPerspectiveCamera,
  OrthographicCamera: MockOrthographicCamera,
  WebGLRenderer: MockWebGLRenderer,
  DirectionalLight: MockDirectionalLight,
  AmbientLight: MockAmbientLight,
  PointLight: MockPointLight,
  GridHelper: MockGridHelper,
  PlaneGeometry: MockPlaneGeometry,
  MeshBasicMaterial: MockMeshBasicMaterial,
  MeshLambertMaterial: MockMeshLambertMaterial,
  Mesh: MockMesh,
  Object3D: MockObject3DClass,
  Vector3: MockVector3,
  Euler: MockEuler,
  OrbitControls: MockOrbitControls,
  Color: function(hex) { this.hex = hex; },
  DoubleSide,
};

module.exports = MockTHREE;
module.exports.default = MockTHREE;