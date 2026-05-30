/** PuppetPals Asset Manager
 * Handles server-side asset storage, upload, streaming, and manifest generation
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from './config.js';

class AssetManager {
  /**
   * @param {string} basePath - Root directory for asset storage
   */
  constructor(basePath = null) {
    this.basePath = basePath || config.paths.assets;

    // In-memory asset registry: Map<assetId, assetMetadata>
    this.assetRegistry = new Map();

    // Categorized asset lists
    this.assets = {
      puppets: [],
      backgrounds: [],
      animations: [],
    };

    // Ensure directories exist
    this.initDirectories();
  }

  /**
   * Create the required asset directories
   */
  initDirectories() {
    const dirs = [
      this.basePath,
      config.paths.puppets,
      config.paths.backgrounds,
      config.paths.animations,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Validate a file based on its extension, size, and type
   * @param {string} fileName - The name of the file
   * @param {number} fileSize - Size in bytes
   * @param {string} fileType - 'image' or 'config'
   * @returns {{ valid: boolean, error: string | null }}
   */
  validateFile(fileName, fileSize, fileType) {
    const ext = path.extname(fileName).toLowerCase();

    // Validate extension
    if (fileType === 'image') {
      if (!config.allowedImageExtensions.includes(ext)) {
        return {
          valid: false,
          error: `Invalid file extension. Allowed: ${config.allowedImageExtensions.join(', ')}`,
        };
      }
      if (fileSize > config.assetLimits.maxImageSize) {
        return {
          valid: false,
          error: `File size exceeds maximum image size limit (${config.assetLimits.maxImageSize} bytes)`,
        };
      }
    } else if (fileType === 'config') {
      if (!config.allowedConfigExtensions.includes(ext)) {
        return {
          valid: false,
          error: `Invalid config file extension. Allowed: ${config.allowedConfigExtensions.join(', ')}`,
        };
      }
      if (fileSize > config.assetLimits.maxJsonSize) {
        return {
          valid: false,
          error: `File size exceeds maximum JSON size limit (${config.assetLimits.maxJsonSize} bytes)`,
        };
      }
    } else {
      return { valid: false, error: 'Invalid file type. Must be "image" or "config".' };
    }

    // General size check
    if (fileSize > config.assetLimits.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum file size limit (${config.assetLimits.maxFileSize} bytes)`,
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Determine file type from extension
   * @param {string} fileName
   * @returns {'image' | 'config' | 'unknown'}
   */
  getFileType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    if (config.allowedImageExtensions.includes(ext)) return 'image';
    if (config.allowedConfigExtensions.includes(ext)) return 'config';
    return 'unknown';
  }

  /**
   * Add an asset to storage
   * @param {string} fileName - Original file name
   * @param {Buffer} data - File data
   * @param {string} category - 'puppets', 'backgrounds', or 'animations'
   * @param {string} [subGroup] - Optional sub-group (e.g., puppet name)
   * @returns {{ success: boolean, assetId?: string, path?: string, error?: string, name?: string, size?: number, uploadedAt?: number }}
   */
  addAsset(fileName, data, category, subGroup = null) {
    // Validate category
    if (!this.assets.hasOwnProperty(category)) {
      return {
        success: false,
        error: `Invalid asset category. Must be one of: ${Object.keys(this.assets).join(', ')}`,
      };
    }

    // Determine and validate file type
    const fileType = this.getFileType(fileName);
    if (fileType === 'unknown') {
      return {
        success: false,
        error: `Unsupported file extension for "${fileName}"`,
      };
    }

    const validation = this.validateFile(fileName, data.length, fileType);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique asset ID
    const assetId = uuidv4();
    const timestamp = Date.now();

    // Build storage path
    let storageDir;
    let relativePath;

    if (category === 'puppets' && subGroup) {
      storageDir = path.join(config.paths.puppets, subGroup);
      relativePath = `puppets/${subGroup}/${fileName}`;
    } else {
      storageDir = path.join(this.basePath, category);
      relativePath = `${category}/${fileName}`;
    }

    // Ensure directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Write file to disk
    const fullPath = path.join(storageDir, fileName);
    fs.writeFileSync(fullPath, data);

    // Create asset metadata
    const assetMetadata = {
      id: assetId,
      name: fileName,
      category,
      subGroup,
      fileType,
      size: data.length,
      path: relativePath,
      fullPath,
      uploadedAt: timestamp,
    };

    // Register asset
    this.assetRegistry.set(assetId, assetMetadata);
    this.assets[category].push(assetMetadata);

    return {
      success: true,
      assetId,
      path: relativePath,
      name: fileName,
      size: data.length,
      uploadedAt: timestamp,
    };
  }

  /**
   * Get an asset by its ID
   * @param {string} assetId
   * @returns {object|null}
   */
  getAsset(assetId) {
    const asset = this.assetRegistry.get(assetId);
    if (!asset) return null;

    return {
      id: asset.id,
      name: asset.name,
      category: asset.category,
      subGroup: asset.subGroup,
      fileType: asset.fileType,
      size: asset.size,
      path: asset.path,
      uploadedAt: asset.uploadedAt,
    };
  }

  /**
   * Delete an asset by ID
   * @param {string} assetId
   * @param {string} category
   * @returns {{ success: boolean, error?: string }}
   */
  deleteAsset(assetId, category) {
    const asset = this.assetRegistry.get(assetId);
    if (!asset) {
      return { success: false, error: 'Asset not found' };
    }

    // Remove from file system
    try {
      if (fs.existsSync(asset.fullPath)) {
        fs.unlinkSync(asset.fullPath);
      }
    } catch (err) {
      // File may already be deleted
    }

    // Remove from registry
    this.assetRegistry.delete(assetId);

    // Remove from category list
    const index = this.assets[category].indexOf(asset);
    if (index > -1) {
      this.assets[category].splice(index, 1);
    }

    return { success: true };
  }

  /**
   * Get the full asset manifest for a category
   * @returns {{ puppets: Array, backgrounds: Array, animations: Array }}
   */
  getAssetManifest() {
    const manifest = {};

    for (const category of Object.keys(this.assets)) {
      manifest[category] = this.assets[category].map((asset) => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        subGroup: asset.subGroup,
        fileType: asset.fileType,
        size: asset.size,
        path: asset.path,
        uploadedAt: asset.uploadedAt,
      }));
    }

    return manifest;
  }

  /**
   * Search assets by name pattern, optionally filtered by category
   * @param {string} query - Search query (case-insensitive substring match)
   * @param {string} [category] - Optional category filter
   * @returns {Array}
   */
  searchAssets(query, category = null) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    const categories = category ? [category] : Object.keys(this.assets);

    for (const cat of categories) {
      for (const asset of this.assets[cat]) {
        if (asset.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: asset.id,
            name: asset.name,
            category: asset.category,
            subGroup: asset.subGroup,
            fileType: asset.fileType,
            size: asset.size,
            path: asset.path,
            uploadedAt: asset.uploadedAt,
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all assets across all categories
   * @returns {Array}
   */
  getAllAssets() {
    const all = [];
    for (const category of Object.keys(this.assets)) {
      for (const asset of this.assets[category]) {
        all.push({
          id: asset.id,
          name: asset.name,
          category: asset.category,
          subGroup: asset.subGroup,
          fileType: asset.fileType,
          size: asset.size,
          path: asset.path,
          uploadedAt: asset.uploadedAt,
        });
      }
    }
    return all;
  }

  /**
   * Get assets for a specific puppet (subGroup)
   * @param {string} puppetName
   * @returns {Array}
   */
  getPuppetAssets(puppetName) {
    return this.assets.puppets
      .filter((a) => a.subGroup === puppetName)
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        fileType: asset.fileType,
        size: asset.size,
        path: asset.path,
        uploadedAt: asset.uploadedAt,
      }));
  }

  /**
   * Get list of available puppet names (subGroups)
   * @returns {string[]}
   */
  getAvailablePuppets() {
    const puppetMap = new Map();
    for (const asset of this.assets.puppets) {
      if (asset.subGroup && !puppetMap.has(asset.subGroup)) {
        puppetMap.set(asset.subGroup, []);
      }
      if (asset.subGroup) {
        puppetMap.get(asset.subGroup).push(asset.name);
      }
    }
    return Array.from(puppetMap.keys());
  }

  /**
   * Read asset file data from disk
   * @param {string} assetId
   * @returns {Buffer|null}
   */
  readAssetData(assetId) {
    const asset = this.assetRegistry.get(assetId);
    if (!asset || !fs.existsSync(asset.fullPath)) {
      return null;
    }
    return fs.readFileSync(asset.fullPath);
  }
}

export default AssetManager;
