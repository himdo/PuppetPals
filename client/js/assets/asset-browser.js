/** PuppetPals Client Asset Browser
 * Displays available assets, handles uploads, and syncs with server
 */

import SocketEvents from '../../../shared/protocols.js';

class AssetBrowser {
  /**
   * @param {object} options
   * @param {object} options.socket - Socket.io client instance with emit/on methods
   * @param {string} [options.assetBaseUrl='/assets'] - Base URL for serving assets
   * @param {HTMLElement} [options.container] - DOM container for the UI
   */
  constructor(options = {}) {
    this.socket = options.socket || null;
    this.assetBaseUrl = options.assetBaseUrl || '/assets';
    this.container = options.container || null;

    // Local cache of assets
    this.manifest = {
      puppets: [],
      backgrounds: [],
      animations: [],
    };

    // Callbacks
    this.onAssetUploaded = null;
    this.onAssetDeleted = null;
    this.onManifestReceived = null;

    // Build UI if container provided
    if (this.container) {
      this.buildUI();
    }

    // Listen for server events
    if (this.socket) {
      this.registerSocketListeners();
    }
  }

  /**
   * Register socket event listeners for asset events
   */
  registerSocketListeners() {
    if (!this.socket) return;

    this.socket.on(SocketEvents.ASSET_UPLOADED, (data) => {
      this.handleAssetUploaded(data);
      if (this.onAssetUploaded) this.onAssetUploaded(data);
    });

    this.socket.on(SocketEvents.ASSET_DELETED, (data) => {
      this.handleAssetDeleted(data);
      if (this.onAssetDeleted) this.onAssetDeleted(data);
    });

    this.socket.on('asset-manifest-response', (data) => {
      this.manifest = data;
      this.refreshUI();
      if (this.onManifestReceived) this.onManifestReceived(data);
    });

    this.socket.on('upload-error', (data) => {
      this.showNotification(data.message, 'error');
    });

    this.socket.on('delete-error', (data) => {
      this.showNotification(data.message, 'error');
    });
  }

  /**
   * Handle asset-uploaded broadcast from server
   * @param {object} data
   */
  handleAssetUploaded(data) {
    if (data.category && this.manifest[data.category]) {
      const assetInfo = {
        id: data.assetId,
        name: data.name,
        category: data.category,
        subGroup: data.subGroup || null,
        fileType: this.getFileType(data.name),
        size: data.size,
        path: data.path,
        uploadedAt: data.uploadedAt,
      };
      this.manifest[data.category].push(assetInfo);
      this.refreshUI();
    }
  }

  /**
   * Handle asset-deleted broadcast from server
   * @param {object} data
   */
  handleAssetDeleted(data) {
    if (data.category && this.manifest[data.category]) {
      this.manifest[data.category] = this.manifest[data.category].filter(
        (a) => a.id !== data.assetId
      );
      this.refreshUI();
    }
  }

  /**
   * Request the full asset manifest from the server
   */
  requestManifest() {
    if (!this.socket) return Promise.resolve(this.manifest);

    return new Promise((resolve) => {
      // Set up one-time listener for response
      const handler = (data) => {
        this.manifest = data;
        this.refreshUI();
        if (this.onManifestReceived) this.onManifestReceived(data);
        this.socket.off('asset-manifest-response', handler);
        resolve(data);
      };

      this.socket.on('asset-manifest-response', handler);
      this.socket.emit(SocketEvents.ASSET_MANIFEST, {});
    });
  }

  /**
   * Upload a file to the server
   * @param {File} file - The File object from an input element
   * @param {string} category - 'puppets', 'backgrounds', or 'animations'
   * @param {string} [subGroup] - Optional sub-group (e.g., puppet name)
   * @returns {Promise<object>}
   */
  uploadFile(file, category, subGroup = null) {
    if (!this.socket) {
      return Promise.reject(new Error('Socket connection not available'));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64Data = reader.result.split(',')[1];

        const successHandler = (data) => {
          this.socket.off('upload-error', errorHandler);
          this.socket.off(SocketEvents.ASSET_UPLOADED, successHandler);
          resolve(data);
        };

        const errorHandler = (data) => {
          this.socket.off(SocketEvents.ASSET_UPLOADED, successHandler);
          this.socket.off('upload-error', errorHandler);
          reject(new Error(data.message));
        };

        this.socket.on(SocketEvents.ASSET_UPLOADED, successHandler);
        this.socket.on('upload-error', errorHandler);

        this.socket.emit(SocketEvents.UPLOAD_ASSET, {
          fileName: file.name,
          data: base64Data,
          category,
          subGroup,
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete an asset from the server
   * @param {string} assetId
   * @param {string} category
   * @returns {Promise<object>}
   */
  deleteAsset(assetId, category) {
    if (!this.socket) {
      return Promise.reject(new Error('Socket connection not available'));
    }

    return new Promise((resolve, reject) => {
      const successHandler = (data) => {
        this.socket.off('delete-error', errorHandler);
        this.socket.off('delete-result', successHandler);
        resolve(data);
      };

      const errorHandler = (data) => {
        this.socket.off('delete-result', successHandler);
        this.socket.off('delete-error', errorHandler);
        reject(new Error(data.message));
      };

      this.socket.on('delete-result', successHandler);
      this.socket.on('delete-error', errorHandler);

      this.socket.emit(SocketEvents.DELETE_ASSET, { assetId, category });
    });
  }

  /**
   * Get the URL for an asset
   * @param {string} assetPath - Relative path from manifest
   * @returns {string}
   */
  getAssetUrl(assetPath) {
    // assetPath is like "puppets/basic-puppet/head.png"
    return `${this.assetBaseUrl}/${assetPath}`;
  }

  /**
   * Get assets by category
   * @param {string} category
   * @returns {Array}
   */
  getAssetsByCategory(category) {
    return this.manifest[category] || [];
  }

  /**
   * Get all puppet names available
   * @returns {string[]}
   */
  getAvailablePuppets() {
    const puppetMap = new Map();
    for (const asset of this.manifest.puppets) {
      if (asset.subGroup && !puppetMap.has(asset.subGroup)) {
        puppetMap.set(asset.subGroup, []);
      }
      if (asset.subGroup) {
        puppetMap.get(asset.subGroup).push(asset);
      }
    }
    return Array.from(puppetMap.keys());
  }

  /**
   * Get all assets for a specific puppet
   * @param {string} puppetName
   * @returns {Array}
   */
  getPuppetAssets(puppetName) {
    return this.manifest.puppets.filter((a) => a.subGroup === puppetName);
  }

  /**
   * Determine file type from name
   * @param {string} fileName
   * @returns {string}
   */
  getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    if (imageExts.includes(ext)) return 'image';
    if (ext === 'json') return 'config';
    return 'unknown';
  }

  /**
   * Build the asset browser UI panel
   */
  buildUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="asset-browser">
        <h3>Asset Browser</h3>
        <div class="asset-tabs">
          <button class="asset-tab active" data-category="puppets">Puppets</button>
          <button class="asset-tab" data-category="backgrounds">Backgrounds</button>
          <button class="asset-tab" data-category="animations">Animations</button>
        </div>
        <div class="asset-upload-section">
          <input type="file" id="asset-file-input" accept=".png,.jpg,.jpeg,.gif,.webp,.json" style="display:none" />
          <button id="asset-upload-btn">Upload Asset</button>
          <select id="asset-category-select">
            <option value="puppets">Puppets</option>
            <option value="backgrounds">Backgrounds</option>
            <option value="animations">Animations</option>
          </select>
          <input type="text" id="asset-subgroup-input" placeholder="Puppet name (optional)" />
        </div>
        <div class="asset-list" id="asset-list">
          <p class="asset-empty">No assets loaded. Request manifest to begin.</p>
        </div>
        <div class="asset-actions">
          <button id="asset-refresh-btn">Refresh Manifest</button>
        </div>
      </div>
    `;

    // Bind events
    const uploadBtn = this.container.querySelector('#asset-upload-btn');
    const fileInput = this.container.querySelector('#asset-file-input');
    const refreshBtn = this.container.querySelector('#asset-refresh-btn');
    const tabs = this.container.querySelectorAll('.asset-tab');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const category = this.container.querySelector('#asset-category-select').value;
      const subGroup = this.container.querySelector('#asset-subgroup-input').value.trim() || null;

      try {
        await this.uploadFile(file, category, subGroup);
        this.showNotification('Asset uploaded successfully!', 'success');
      } catch (err) {
        this.showNotification(err.message, 'error');
      }

      fileInput.value = '';
    });

    refreshBtn.addEventListener('click', () => {
      this.requestManifest();
    });

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.refreshUI(tab.dataset.category);
      });
    });
  }

  /**
   * Refresh the asset list UI
   * @param {string} [category] - Category to display
   */
  refreshUI(category = null) {
    const listEl = this.container?.querySelector('#asset-list');
    if (!listEl) return;

    // Determine active category
    if (!category) {
      const activeTab = this.container.querySelector('.asset-tab.active');
      category = activeTab ? activeTab.dataset.category : 'puppets';
    }

    const assets = this.manifest[category] || [];

    if (assets.length === 0) {
      listEl.innerHTML = `<p class="asset-empty">No ${category} assets available.</p>`;
      return;
    }

    listEl.innerHTML = assets
      .map((asset) => {
        const url = this.getAssetUrl(asset.path);
        const isImage = asset.fileType === 'image';
        const preview = isImage
          ? `<img src="${url}" alt="${asset.name}" class="asset-thumbnail" />`
          : `<span class="asset-icon">{}</span>`;

        return `
          <div class="asset-item" data-id="${asset.id}" data-category="${asset.category}">
            ${preview}
            <div class="asset-info">
              <span class="asset-name">${asset.name}</span>
              <span class="asset-size">${this.formatFileSize(asset.size)}</span>
              ${asset.subGroup ? `<span class="asset-subgroup">${asset.subGroup}</span>` : ''}
            </div>
            <button class="asset-delete-btn" data-id="${asset.id}" data-category="${asset.category}">Delete</button>
          </div>
        `;
      })
      .join('');

    // Bind delete buttons
    listEl.querySelectorAll('.asset-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const cat = btn.dataset.category;

        if (!confirm('Are you sure you want to delete this asset?')) return;

        try {
          await this.deleteAsset(id, cat);
          this.showNotification('Asset deleted successfully!', 'success');
        } catch (err) {
          this.showNotification(err.message, 'error');
        }
      });
    });
  }

  /**
   * Format file size to human-readable string
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Show a notification message
   * @param {string} message
   * @param {string} type - 'success' | 'error' | 'info'
   */
  showNotification(message, type = 'info') {
    if (!this.container) return;

    const existing = this.container.querySelector('.asset-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `asset-notification asset-notification-${type}`;
    notif.textContent = message;
    this.container.appendChild(notif);

    setTimeout(() => {
      if (notif.parentNode) notif.remove();
    }, 3000);
  }

  /**
   * Destroy the asset browser, clean up listeners
   */
  destroy() {
    if (this.socket) {
      this.socket.off(SocketEvents.ASSET_UPLOADED);
      this.socket.off(SocketEvents.ASSET_DELETED);
      this.socket.off('asset-manifest-response');
      this.socket.off('upload-error');
      this.socket.off('delete-error');
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default AssetBrowser;
