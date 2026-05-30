/** Jest Mock for three/addons/controls/OrbitControls.js */

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
    this.target = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
  }
  update() {}
  dispose() {}
}

module.exports = { OrbitControls: MockOrbitControls };