/** MeshLoader - Loads PNG images as Three.js meshes for puppet parts
 * Handles PNG to mesh conversion, UV mapping, transparent backgrounds,
 * and scaling meshes to fit bone dimensions
 */

import * as THREE from 'three';

class MeshLoader {
  constructor() {
    // Cache of loaded meshes keyed by bone id
    this.loadedMeshes = {};
  }

  /**
   * Create a sprite-style mesh from a texture
   * @param {Object} texture - The Three.js texture
   * @param {number} width - Display width
   * @param {number} height - Display height
   * @param {string} name - Optional mesh name
   * @returns {THREE.Mesh} The created mesh
   */
  createSpriteMesh(texture, width, height, name = '') {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    return mesh;
  }

  /**
   * Create a plane mesh from a texture with specified dimensions
   * Uses MeshBasicMaterial with transparent: true and depthWrite: false
   * for proper 2D sprite overlap rendering
   * @param {Object} texture - The Three.js texture
   * @param {number} width - Plane width
   * @param {number} height - Plane height
   * @param {string} name - Optional mesh name
   * @returns {THREE.Mesh} The created mesh
   */
  createPlaneMesh(texture, width, height, name = '') {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    return mesh;
  }

  /**
   * Load and assign a mesh to a bone
   * @param {Object} bone - The bone object with id and scale
   * @param {Object} texture - The Three.js texture for the bone's asset
   * @param {string} type - Mesh type: 'plane' (default) or 'sprite'
   */
  loadBoneMesh(bone, texture, type = 'plane') {
    const scaleX = bone.scale ? bone.scale.x : 1;
    const scaleY = bone.scale ? bone.scale.y : 1;

    let mesh;
    if (type === 'sprite') {
      mesh = this.createSpriteMesh(texture, scaleX, scaleY, bone.id);
    } else {
      mesh = this.createPlaneMesh(texture, scaleX, scaleY, bone.id);
    }

    bone.mesh = mesh;
    this.loadedMeshes[bone.id] = mesh;
  }

  /**
   * Load meshes for all bones in a skeleton that have assets defined
   * @param {Object} skeleton - Skeleton object with bones map
   * @param {Object} textureMap - Map of asset filename to texture
   */
  loadSkeletonMeshes(skeleton, textureMap) {
    for (const bone of Object.values(skeleton.bones)) {
      // Skip bones without an asset
      if (!bone.asset) continue;

      // Skip if texture not available
      const texture = textureMap[bone.asset];
      if (!texture) continue;

      this.loadBoneMesh(bone, texture, 'plane');
    }
  }

  /**
   * Create a colored placeholder mesh (for development/debugging)
   * @param {number} width - Mesh width
   * @param {number} height - Mesh height
   * @param {string} name - Mesh name
   * @returns {THREE.Mesh} The placeholder mesh
   */
  createPlaceholderMesh(width, height, name = '') {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    return mesh;
  }

  /**
   * Dispose of a single mesh and remove it from cache
   * @param {string} boneId - The bone ID whose mesh to dispose
   */
  disposeMesh(boneId) {
    const mesh = this.loadedMeshes[boneId];
    if (mesh) {
      if (mesh.geometry && mesh.geometry.dispose) {
        mesh.geometry.dispose();
      }
      if (mesh.material && mesh.material.dispose) {
        mesh.material.dispose();
      }
      delete this.loadedMeshes[boneId];
    }
  }

  /**
   * Dispose of all loaded meshes and clear cache
   */
  disposeAll() {
    for (const boneId of Object.keys(this.loadedMeshes)) {
      this.disposeMesh(boneId);
    }
    this.loadedMeshes = {};
  }
}

export default MeshLoader;