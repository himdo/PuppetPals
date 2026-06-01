/** VisualEditor - Drag-and-drop visual puppet builder
 * Provides a canvas-based editor where users can:
 * - Drag puppet parts from a palette onto a canvas
 * - Place pins (bone sockets) on parts
 * - Flip rotation of parts
 * - Toggle between static (accessories) and dynamic (moving) parts
 * - Connect parts into a hierarchy
 */

class VisualEditor {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - DOM container for the editor
   * @param {Object} [options.socket] - Socket.io instance for server sync
   * @param {Object} [options.assetBrowser] - AssetBrowser instance for asset lookup
   */
  constructor(options = {}) {
    this.container = options.container || null;
    this.socket = options.socket || null;
    this.assetBrowser = options.assetBrowser || null;

    // Editor state
    this.parts = []; // Array of placed parts on canvas
    this.selectedPartId = null;
    this.nextPartId = 1;

    // Canvas dimensions
    this.canvasWidth = 600;
    this.canvasHeight = 500;

    // Drag state
    this._dragState = null; // { partId, offsetX, offsetY }

    // Pin placement mode
    this.pinMode = false;

    // Build UI
    if (this.container) {
      this.buildUI();
    }
  }

  /**
   * Build the visual editor UI
   */
  buildUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="visual-editor">
        <!-- Toolbar -->
        <div class="visual-editor-toolbar">
          <button type="button" class="btn btn-small" id="ve-add-demo-parts" title="Add demo placeholder parts">+ Demo Parts</button>
          <span class="ve-separator"></span>
          <button type="button" class="btn btn-small" id="ve-toggle-pin-mode" title="Toggle pin placement mode">📌 Pin Mode</button>
          <button type="button" class="btn btn-small" id="ve-flip-h" title="Flip horizontal">↔ Flip H</button>
          <button type="button" class="btn btn-small" id="ve-flip-v" title="Flip vertical">↕ Flip V</button>
          <button type="button" class="btn btn-small" id="ve-toggle-part-type" title="Toggle static/dynamic">🔒 Static</button>
          <button type="button" class="btn btn-small" id="ve-delete-part" title="Delete selected part">🗑 Delete</button>
          <span class="ve-separator"></span>
          <button type="button" class="btn btn-small" id="ve-clear-canvas" title="Clear all parts">Clear All</button>
          <button type="button" class="btn btn-primary btn-small" id="ve-export-puppet" title="Export as puppet config">Export Puppet</button>
        </div>

        <!-- Main area: palette + canvas -->
        <div class="visual-editor-body">
          <!-- Asset palette (left) -->
          <div class="visual-editor-palette">
            <h3>Parts</h3>
            <div class="visual-editor-palette-search">
              <input type="text" id="ve-palette-search" placeholder="Search assets..." />
            </div>
            <div class="visual-editor-palette-list" id="ve-palette-list">
              <div class="palette-empty">No assets loaded. Upload puppet images via the Assets panel first.</div>
            </div>
          </div>

          <!-- Canvas (center) -->
          <div class="visual-editor-canvas-wrapper">
            <canvas id="ve-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
            <div class="visual-editor-canvas-info" id="ve-canvas-info">
              Drag parts from the palette onto the canvas
            </div>
          </div>

          <!-- Part properties (right) -->
          <div class="visual-editor-properties">
            <h3>Properties</h3>
            <div id="ve-properties-content">
              <div class="ve-no-selection">Select a part to edit</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cache DOM elements
    this.canvas = this.container.querySelector('#ve-canvas');
    this.canvasInfo = this.container.querySelector('#ve-canvas-info');
    this.paletteList = this.container.querySelector('#ve-palette-list');
    this.paletteSearch = this.container.querySelector('#ve-palette-search');
    this.propertiesContent = this.container.querySelector('#ve-properties-content');

    // Bind toolbar buttons
    this.container.querySelector('#ve-add-demo-parts').addEventListener('click', () => this.addDemoParts());
    this.container.querySelector('#ve-toggle-pin-mode').addEventListener('click', () => this.togglePinMode());
    this.container.querySelector('#ve-flip-h').addEventListener('click', () => this.flipSelectedPart('horizontal'));
    this.container.querySelector('#ve-flip-v').addEventListener('click', () => this.flipSelectedPart('vertical'));
    this.container.querySelector('#ve-toggle-part-type').addEventListener('click', () => this.toggleSelectedPartType());
    this.container.querySelector('#ve-delete-part').addEventListener('click', () => this.deleteSelectedPart());
    this.container.querySelector('#ve-clear-canvas').addEventListener('click', () => this.clearCanvas());
    this.container.querySelector('#ve-export-puppet').addEventListener('click', () => this.exportPuppet());

    // Palette search
    this.paletteSearch.addEventListener('input', (e) => this.filterPalette(e.target.value));

    // Canvas events
    this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleCanvasMouseLeave(e));

    // Palette drag start
    this.paletteList.addEventListener('dragstart', (e) => this.handlePaletteDragStart(e));

    // Canvas drop
    this.canvas.addEventListener('dragover', (e) => e.preventDefault());
    this.canvas.addEventListener('drop', (e) => this.handleCanvasDrop(e));

    // Load palette assets
    this.refreshPalette();
  }

  /**
   * Refresh the asset palette from the asset browser
   */
  refreshPalette() {
    if (!this.assetBrowser) return;

    const assets = this.assetBrowser.getAssetsByCategory('puppets') || [];
    const imageAssets = assets.filter(a => a.fileType === 'image');

    if (imageAssets.length === 0) {
      this.paletteList.innerHTML = '<div class="palette-empty">No puppet assets. Upload assets first.</div>';
      return;
    }

    this._allPaletteAssets = imageAssets;
    this._renderPaletteList(imageAssets);
  }

  /**
   * Render the palette list
   * @param {Array} assets
   */
  _renderPaletteList(assets) {
    this.paletteList.innerHTML = '';

    assets.forEach(asset => {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.draggable = true;
      item.dataset.assetName = asset.name || asset.path;
      item.dataset.assetPath = asset.path;
      item.title = asset.name || asset.path;

      // Thumbnail
      const thumb = document.createElement('img');
      thumb.className = 'palette-item-thumb';
      thumb.src = this.assetBrowser.getAssetUrl(asset.path);
      thumb.alt = asset.name || asset.path;
      thumb.onerror = () => { thumb.style.display = 'none'; };

      const label = document.createElement('span');
      label.className = 'palette-item-label';
      label.textContent = asset.name || asset.path;

      item.appendChild(thumb);
      item.appendChild(label);
      this.paletteList.appendChild(item);
    });
  }

  /**
   * Filter palette by search term
   * @param {string} term
   */
  filterPalette(term) {
    if (!this._allPaletteAssets) return;
    const filtered = this._allPaletteAssets.filter(a =>
      (a.name || a.path).toLowerCase().includes(term.toLowerCase())
    );
    this._renderPaletteList(filtered);
  }

  /**
   * Handle drag start from palette
   * @param {DragEvent} e
   */
  handlePaletteDragStart(e) {
    const item = e.target.closest('.palette-item');
    if (!item) return;

    e.dataTransfer.setData('text/plain', JSON.stringify({
      assetName: item.dataset.assetName,
      assetPath: item.dataset.assetPath,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }

  /**
   * Handle drop on canvas
   * @param {DragEvent} e
   */
  handleCanvasDrop(e) {
    e.preventDefault();

    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.addPart({
      assetName: data.assetName,
      assetPath: data.assetPath,
      x,
      y,
    });
  }

  /**
   * Add a part to the canvas
   * @param {Object} options
   */
  addPart(options) {
    const part = {
      id: `part-${this.nextPartId++}`,
      assetName: options.assetName || '',
      assetPath: options.assetPath || '',
      x: options.x || 100,
      y: options.y || 100,
      width: 80,
      height: 80,
      rotation: 0,
      flipH: false,
      flipV: false,
      partType: 'dynamic', // 'static' | 'dynamic'
      parentId: null, // Bone parent ID (null = root)
      pins: [], // Array of {x, y} relative to part top-left
      image: null, // Loaded Image object
    };

    // Load the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      part.width = img.naturalWidth;
      part.height = img.naturalHeight;
      // Scale down if too large
      if (part.width > 150) {
        const scale = 150 / part.width;
        part.width = 150;
        part.height = part.height * scale;
      }
      part.image = img;
      this.render();
    };
    img.onerror = () => {
      part.image = null;
      this.render();
    };

    if (this.assetBrowser) {
      img.src = this.assetBrowser.getAssetUrl(options.assetPath);
    }

    this.parts.push(part);
    this.selectPart(part.id);
    this.render();
    this.updateCanvasInfo();
  }

  /**
   * Select a part by ID
   * @param {string} partId
   */
  selectPart(partId) {
    this.selectedPartId = partId;
    this.render();
    this.renderProperties();
  }

  /**
   * Get the selected part
   * @returns {Object|null}
   */
  getSelectedPart() {
    return this.parts.find(p => p.id === this.selectedPartId) || null;
  }

  /**
   * Toggle pin placement mode
   */
  togglePinMode() {
    this.pinMode = !this.pinMode;
    const btn = this.container.querySelector('#ve-toggle-pin-mode');
    btn.classList.toggle('active', this.pinMode);
    btn.title = this.pinMode ? 'Pin mode ON - click on a part to place a pin' : 'Toggle pin placement mode';
    this.canvas.style.cursor = this.pinMode ? 'crosshair' : 'default';
  }

  /**
   * Flip the selected part
   * @param {'horizontal'|'vertical'} direction
   */
  flipSelectedPart(direction) {
    const part = this.getSelectedPart();
    if (!part) return;

    if (direction === 'horizontal') {
      part.flipH = !part.flipH;
    } else {
      part.flipV = !part.flipV;
    }

    this.render();
    this.renderProperties();
  }

  /**
   * Toggle the selected part between static and dynamic
   */
  toggleSelectedPartType() {
    const part = this.getSelectedPart();
    if (!part) return;

    part.partType = part.partType === 'static' ? 'dynamic' : 'static';

    const btn = this.container.querySelector('#ve-toggle-part-type');
    btn.textContent = part.partType === 'static' ? '🔒 Static' : '🔓 Dynamic';

    this.render();
    this.renderProperties();
  }

  /**
   * Delete the selected part
   */
  deleteSelectedPart() {
    if (!this.selectedPartId) return;

    // Also remove children references
    this.parts.forEach(p => {
      if (p.parentId === this.selectedPartId) {
        p.parentId = null;
      }
    });

    this.parts = this.parts.filter(p => p.id !== this.selectedPartId);
    this.selectedPartId = null;
    this.render();
    this.renderProperties();
    this.updateCanvasInfo();
  }

  /**
   * Clear all parts from the canvas
   */
  clearCanvas() {
    this.parts = [];
    this.selectedPartId = null;
    this.nextPartId = 1;
    this.render();
    this.renderProperties();
    this.updateCanvasInfo();
  }

  /**
   * Handle canvas mouse down
   * @param {MouseEvent} e
   */
  handleCanvasMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Pin mode: place pin on selected part
    if (this.pinMode) {
      const part = this.getSelectedPart();
      if (part) {
        const relX = x - part.x;
        const relY = y - part.y;
        part.pins.push({ x: relX, y: relY });
        this.render();
        this.renderProperties();
      }
      return;
    }

    // Find clicked part (reverse order for top-most)
    const part = this._hitTest(x, y);
    if (part) {
      this.selectPart(part.id);
      this._dragState = {
        partId: part.id,
        offsetX: x - part.x,
        offsetY: y - part.y,
      };
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.selectedPartId = null;
      this.render();
      this.renderProperties();
    }
  }

  /**
   * Handle canvas mouse move
   * @param {MouseEvent} e
   */
  handleCanvasMouseMove(e) {
    if (!this._dragState) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const part = this.parts.find(p => p.id === this._dragState.partId);
    if (part) {
      part.x = x - this._dragState.offsetX;
      part.y = y - this._dragState.offsetY;
      this.render();
    }
  }

  /**
   * Handle canvas mouse up
   * @param {MouseEvent} e
   */
  handleCanvasMouseUp(e) {
    this._dragState = null;
    this.canvas.style.cursor = this.pinMode ? 'crosshair' : 'default';
  }

  /**
   * Handle canvas mouse leave
   */
  handleCanvasMouseLeave() {
    this._dragState = null;
    this.canvas.style.cursor = this.pinMode ? 'crosshair' : 'default';
  }

  /**
   * Hit test: find the top-most part at (x, y)
   * @param {number} x
   * @param {number} y
   * @returns {Object|null}
   */
  _hitTest(x, y) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      if (x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height) {
        return p;
      }
    }
    return null;
  }

  /**
   * Render the canvas
   */
  render() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw grid
    this._drawGrid(ctx);

    // Draw parts
    this.parts.forEach(part => {
      this._drawPart(ctx, part);
    });

    // Draw selection highlight
    const selected = this.getSelectedPart();
    if (selected) {
      this._drawSelection(ctx, selected);
    }
  }

  /**
   * Draw grid background
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawGrid(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let x = 0; x < this.canvasWidth; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }

    for (let y = 0; y < this.canvasHeight; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    }
  }

  /**
   * Draw a part on the canvas
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} part
   */
  _drawPart(ctx, part) {
    ctx.save();

    // Translate to part center for rotation
    const cx = part.x + part.width / 2;
    const cy = part.y + part.height / 2;
    ctx.translate(cx, cy);

    // Rotation
    if (part.rotation) {
      ctx.rotate((part.rotation * Math.PI) / 180);
    }

    // Flip
    const scaleX = part.flipH ? -1 : 1;
    const scaleY = part.flipV ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    // Draw image or placeholder
    if (part.image) {
      ctx.drawImage(part.image, -part.width / 2, -part.height / 2, part.width, part.height);
    } else if (part._demoColor) {
      // Demo part with color
      ctx.fillStyle = part._demoColor + '40'; // Add transparency
      ctx.fillRect(-part.width / 2, -part.height / 2, part.width, part.height);
      ctx.strokeStyle = part._demoColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-part.width / 2, -part.height / 2, part.width, part.height);

      ctx.fillStyle = part._demoColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(part.assetName || 'Part', 0, 0);
    } else {
      ctx.fillStyle = 'rgba(203, 166, 247, 0.3)';
      ctx.fillRect(-part.width / 2, -part.height / 2, part.width, part.height);
      ctx.strokeStyle = '#cba6f7';
      ctx.lineWidth = 1;
      ctx.strokeRect(-part.width / 2, -part.height / 2, part.width, part.height);

      ctx.fillStyle = '#cba6f7';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(part.assetName || 'Part', 0, 4);
    }

    ctx.restore();

    // Draw pins (not affected by flip/rotation)
    part.pins.forEach(pin => {
      this._drawPin(ctx, part.x + pin.x, part.y + pin.y);
    });

    // Draw type indicator
    if (part.partType === 'static') {
      ctx.fillStyle = '#a6e3a1';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔒', part.x + 2, part.y + 12);
    } else {
      ctx.fillStyle = '#f9e2af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔓', part.x + 2, part.y + 12);
    }
  }

  /**
   * Draw a pin (bone socket) on the canvas
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   */
  _drawPin(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#f38ba8';
    ctx.strokeStyle = '#1e1e2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner dot
    ctx.fillStyle = '#1e1e2e';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw selection highlight
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} part
   */
  _drawSelection(ctx, part) {
    ctx.save();
    ctx.strokeStyle = '#cba6f7';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(part.x - 2, part.y - 2, part.width + 4, part.height + 4);
    ctx.restore();
  }

  /**
   * Render the properties panel for the selected part
   */
  renderProperties() {
    const part = this.getSelectedPart();
    if (!part) {
      this.propertiesContent.innerHTML = '<div class="ve-no-selection">Select a part to edit</div>';
      return;
    }

    this.propertiesContent.innerHTML = `
      <div class="ve-property-group">
        <div class="ve-property-label">Name</div>
        <input type="text" class="ve-property-input" id="ve-prop-name" value="${part.assetName || ''}" />
      </div>

      <div class="ve-property-group">
        <div class="ve-property-label">Type</div>
        <select class="ve-property-select" id="ve-prop-type">
          <option value="dynamic" ${part.partType === 'dynamic' ? 'selected' : ''}>Dynamic (moving)</option>
          <option value="static" ${part.partType === 'static' ? 'selected' : ''}>Static (accessory)</option>
        </select>
      </div>

      <div class="ve-property-group">
        <div class="ve-property-label">Position X</div>
        <input type="number" class="ve-property-input" id="ve-prop-x" value="${Math.round(part.x)}" />
      </div>

      <div class="ve-property-group">
        <div class="ve-property-label">Position Y</div>
        <input type="number" class="ve-property-input" id="ve-prop-y" value="${Math.round(part.y)}" />
      </div>

      <div class="ve-property-group">
        <div class="ve-property-label">Rotation (°)</div>
        <input type="number" class="ve-property-input" id="ve-prop-rotation" value="${part.rotation}" />
      </div>

      <div class="ve-property-group">
        <div class="ve-property-label">Flip</div>
        <div class="ve-property-row">
          <label><input type="checkbox" id="ve-prop-flip-h" ${part.flipH ? 'checked' : ''} /> Horizontal</label>
          <label><input type="checkbox" id="ve-prop-flip-v" ${part.flipV ? 'checked' : ''} /> Vertical</label>
        </div>
      </div>

      <div class="ve-property-group">
        <div class="ve-property-label">Pins (bone sockets)</div>
        <div id="ve-prop-pins">
          ${part.pins.length === 0 ? '<div class="ve-no-pins">No pins placed. Use Pin Mode to add.</div>' : ''}
          ${part.pins.map((pin, i) => `
            <div class="ve-pin-item">
              <span>Pin ${i + 1}: (${Math.round(pin.x)}, ${Math.round(pin.y)})</span>
              <button type="button" class="btn btn-small ve-remove-pin" data-pin-index="${i}">✕</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="ve-property-group">
        <div class="ve-property-label">Parent Bone</div>
        <select class="ve-property-select" id="ve-prop-parent">
          <option value="" ${!part.parentId ? 'selected' : ''}>Root (no parent)</option>
          ${this.parts
            .filter(p => p.id !== part.id)
            .map(p => `<option value="${p.id}" ${part.parentId === p.id ? 'selected' : ''}>${p.assetName || p.id}</option>`)
            .join('')}
        </select>
      </div>
    `;

    // Bind events
    const bind = (id, callback) => {
      const el = this.propertiesContent.querySelector(`#${id}`);
      if (el) el.addEventListener('input', callback);
    };

    bind('ve-prop-name', (e) => { part.assetName = e.target.value; });
    bind('ve-prop-x', (e) => { part.x = parseFloat(e.target.value) || 0; this.render(); });
    bind('ve-prop-y', (e) => { part.y = parseFloat(e.target.value) || 0; this.render(); });
    bind('ve-prop-rotation', (e) => { part.rotation = parseFloat(e.target.value) || 0; this.render(); });

    this.propertiesContent.querySelector('#ve-prop-type').addEventListener('change', (e) => {
      part.partType = e.target.value;
      const btn = this.container.querySelector('#ve-toggle-part-type');
      btn.textContent = part.partType === 'static' ? '🔒 Static' : '🔓 Dynamic';
      this.render();
    });

    this.propertiesContent.querySelector('#ve-prop-flip-h').addEventListener('change', (e) => {
      part.flipH = e.target.checked;
      this.render();
    });

    this.propertiesContent.querySelector('#ve-prop-flip-v').addEventListener('change', (e) => {
      part.flipV = e.target.checked;
      this.render();
    });

    this.propertiesContent.querySelector('#ve-prop-parent').addEventListener('change', (e) => {
      part.parentId = e.target.value || null;
    });

    // Remove pin buttons
    this.propertiesContent.querySelectorAll('.ve-remove-pin').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.pinIndex, 10);
        part.pins.splice(idx, 1);
        this.render();
        this.renderProperties();
      });
    });
  }

  /**
   * Update the canvas info text
   */
  updateCanvasInfo() {
    if (this.parts.length === 0) {
      this.canvasInfo.textContent = 'Drag parts from the palette onto the canvas';
    } else {
      const staticCount = this.parts.filter(p => p.partType === 'static').length;
      const dynamicCount = this.parts.filter(p => p.partType === 'dynamic').length;
      this.canvasInfo.textContent = `${this.parts.length} parts (${dynamicCount} dynamic, ${staticCount} static)`;
    }
  }

  /**
   * Export the canvas as a puppet skeleton config
   * @returns {Object} Puppet config object
   */
  exportPuppet() {
    if (this.parts.length === 0) {
      alert('No parts to export. Add parts to the canvas first.');
      return null;
    }

    const bones = [];

    this.parts.forEach(part => {
      // Find the first pin to use as the socket offset
      const pin = part.pins[0] || { x: part.width / 2, y: part.height };

      // Determine parent bone ID
      let parentId = null;
      if (part.parentId) {
        const parentPart = this.parts.find(p => p.id === part.parentId);
        if (parentPart) {
          parentId = parentPart.assetName || `bone-${parentPart.id}`;
        }
      }

      const bone = {
        id: part.assetName || `bone-${part.id}`,
        name: part.assetName || 'Part',
        parentId: parentId,
        asset: part.assetName || '',
        position: {
          x: Math.round(part.x),
          y: Math.round(part.y),
          z: 0,
        },
        rotation: {
          x: 0,
          y: 0,
          z: part.rotation,
        },
        scale: {
          x: part.width / 80,
          y: part.height / 80,
        },
        socketOffset: {
          x: Math.round(pin.x),
          y: Math.round(pin.y),
        },
        zDepth: bones.length,
        // Part type: static parts are accessories, dynamic parts are moving bones
        partType: part.partType,
      };

      bones.push(bone);
    });

    const config = {
      name: 'Custom Puppet',
      bones: bones,
    };

    // Emit to server if socket available
    if (this.socket) {
      this.socket.emit('save-puppet', config);
    }

    // Return config for further use
    return config;
  }

  /**
   * Add demo placeholder parts for testing
   */
  addDemoParts() {
    const demoParts = [
      { name: 'Torso', x: 250, y: 150, w: 100, h: 120, type: 'dynamic', color: '#cba6f7' },
      { name: 'Head', x: 270, y: 50, w: 60, h: 60, type: 'dynamic', color: '#f9e2af' },
      { name: 'Left Arm', x: 150, y: 160, w: 50, h: 100, type: 'dynamic', color: '#a6e3a1' },
      { name: 'Right Arm', x: 400, y: 160, w: 50, h: 100, type: 'dynamic', color: '#a6e3a1' },
      { name: 'Left Leg', x: 230, y: 280, w: 45, h: 110, type: 'dynamic', color: '#89b4fa' },
      { name: 'Right Leg', x: 325, y: 280, w: 45, h: 110, type: 'dynamic', color: '#89b4fa' },
      { name: 'Hat', x: 265, y: 10, w: 70, h: 40, type: 'static', color: '#f38ba8' },
    ];

    demoParts.forEach(d => {
      const part = {
        id: `part-${this.nextPartId++}`,
        assetName: d.name,
        assetPath: '',
        x: d.x,
        y: d.y,
        width: d.w,
        height: d.h,
        rotation: 0,
        flipH: false,
        flipV: false,
        partType: d.type,
        parentId: null,
        pins: [{ x: d.w / 2, y: d.h }],
        image: null,
        _demoColor: d.color,
      };
      this.parts.push(part);
    });

    // Set parent relationships
    const head = this.parts.find(p => p.assetName === 'Head');
    const leftArm = this.parts.find(p => p.assetName === 'Left Arm');
    const rightArm = this.parts.find(p => p.assetName === 'Right Arm');
    const leftLeg = this.parts.find(p => p.assetName === 'Left Leg');
    const rightLeg = this.parts.find(p => p.assetName === 'Right Leg');
    const hat = this.parts.find(p => p.assetName === 'Hat');

    if (head) head.parentId = this.parts[0].id;
    if (leftArm) leftArm.parentId = this.parts[0].id;
    if (rightArm) rightArm.parentId = this.parts[0].id;
    if (leftLeg) leftLeg.parentId = this.parts[0].id;
    if (rightLeg) rightLeg.parentId = this.parts[0].id;
    if (hat) hat.parentId = head?.id || null;

    this.selectPart(this.parts[0].id);
    this.render();
    this.updateCanvasInfo();
  }

  /**
   * Load parts from a puppet config
   * @param {Object} config - Puppet config with bones array
   */
  loadPuppetConfig(config) {
    if (!config || !config.bones) return;

    this.parts = [];
    this.selectedPartId = null;
    this.nextPartId = 1;

    config.bones.forEach(bone => {
      const part = {
        id: `part-${this.nextPartId++}`,
        assetName: bone.name || bone.id,
        assetPath: bone.asset || '',
        x: bone.position?.x || 100,
        y: bone.position?.y || 100,
        width: 80,
        height: 80,
        rotation: bone.rotation?.z || 0,
        flipH: false,
        flipV: false,
        partType: bone.partType || 'dynamic',
        parentId: null,
        pins: bone.socketOffset ? [{ x: bone.socketOffset.x, y: bone.socketOffset.y }] : [],
        image: null,
      };

      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        part.width = img.naturalWidth;
        part.height = img.naturalHeight;
        if (part.width > 150) {
          const scale = 150 / part.width;
          part.width = 150;
          part.height = part.height * scale;
        }
        part.image = img;
        this.render();
      };
      img.onerror = () => {
        part.image = null;
        this.render();
      };

      if (this.assetBrowser && bone.asset) {
        // Try to find the asset in the manifest
        const assets = this.assetBrowser.getAssetsByCategory('puppets') || [];
        const found = assets.find(a => a.name === bone.asset || a.path === bone.asset);
        if (found) {
          img.src = this.assetBrowser.getAssetUrl(found.path);
        }
      }

      this.parts.push(part);
    });

    this.render();
    this.updateCanvasInfo();
  }
}

export default VisualEditor;
