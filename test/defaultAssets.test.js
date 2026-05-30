/** Unit Tests for Default Puppet Assets & Editor CSS
 * Verifies that default puppet assets, skeleton config, and editor styles exist
 */

import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '..');

describe('Request 4: Default Puppet Assets', () => {
  const defaultPuppetsDir = path.join(rootDir, 'client', 'assets', 'default-puppets', 'basic-puppet');

  describe('Default Puppet PNGs', () => {
    const requiredPngs = [
      'head.png',
      'torso.png',
      'upper-arm-l.png',
      'upper-arm-r.png',
      'lower-arm-l.png',
      'lower-arm-r.png',
      'upper-leg-l.png',
      'upper-leg-r.png',
      'lower-leg-l.png',
      'lower-leg-r.png',
    ];

    requiredPngs.forEach((pngName) => {
      it(`should include ${pngName}`, () => {
        const filePath = path.join(defaultPuppetsDir, pngName);
        expect(fs.existsSync(filePath)).toBe(true);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(0);
      });
    });
  });

  describe('Default skeleton.json', () => {
    let skeleton;

    beforeAll(() => {
      const skeletonPath = path.join(defaultPuppetsDir, 'skeleton.json');
      expect(fs.existsSync(skeletonPath)).toBe(true);
      const raw = fs.readFileSync(skeletonPath, 'utf-8');
      skeleton = JSON.parse(raw);
    });

    it('should have a name property', () => {
      expect(skeleton.name).toBeDefined();
      expect(typeof skeleton.name).toBe('string');
      expect(skeleton.name.length).toBeGreaterThan(0);
    });

    it('should have a bones array', () => {
      expect(Array.isArray(skeleton.bones)).toBe(true);
      expect(skeleton.bones.length).toBeGreaterThan(0);
    });

    it('should have a root bone (parentId: null)', () => {
      const rootBone = skeleton.bones.find((b) => b.parentId === null);
      expect(rootBone).toBeDefined();
    });

    it('should have bones for all required puppet parts', () => {
      const requiredParts = [
        'head',
        'torso',
        'upper-arm-l',
        'upper-arm-r',
        'lower-arm-l',
        'lower-arm-r',
        'upper-leg-l',
        'upper-leg-r',
        'lower-leg-l',
        'lower-leg-r',
      ];

      const boneIds = skeleton.bones.map((b) => b.id);
      requiredParts.forEach((partId) => {
        expect(boneIds).toContain(partId);
      });
    });

    it('each bone should have required properties', () => {
      skeleton.bones.forEach((bone) => {
        expect(bone.id).toBeDefined();
        expect(bone.name).toBeDefined();
        expect(bone.asset).toBeDefined();
        expect(bone.position).toBeDefined();
        expect(typeof bone.parentId === 'string' || bone.parentId === null).toBe(true);
      });
    });

    it('child bones should reference valid parent bone ids', () => {
      const boneIds = new Set(skeleton.bones.map((b) => b.id));
      skeleton.bones.forEach((bone) => {
        if (bone.parentId !== null) {
          expect(boneIds.has(bone.parentId)).toBe(true);
        }
      });
    });

    it('bone assets should reference existing png files', () => {
      skeleton.bones.forEach((bone) => {
        if (bone.asset) {
          const assetPath = path.join(defaultPuppetsDir, bone.asset);
          expect(fs.existsSync(assetPath)).toBe(true);
        }
      });
    });
  });
});

describe('Request 4: Editor CSS', () => {
  const editorCssPath = path.join(rootDir, 'client', 'css', 'editor.css');

  it('editor.css file should exist', () => {
    expect(fs.existsSync(editorCssPath)).toBe(true);
  });

  it('editor.css should not be empty', () => {
    const content = fs.readFileSync(editorCssPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('editor.css should contain asset browser styles', () => {
    const content = fs.readFileSync(editorCssPath, 'utf-8');
    expect(content).toMatch(/asset-browser/);
  });

  it('editor.css should contain asset upload styles', () => {
    const content = fs.readFileSync(editorCssPath, 'utf-8');
    expect(content).toMatch(/asset-upload/);
  });

  it('editor.css should contain asset list styles', () => {
    const content = fs.readFileSync(editorCssPath, 'utf-8');
    expect(content).toMatch(/asset-list/);
  });

  it('editor.css should contain asset item styles', () => {
    const content = fs.readFileSync(editorCssPath, 'utf-8');
    expect(content).toMatch(/asset-item/);
  });

  it('editor.css should contain asset thumbnail styles', () => {
    const content = fs.readFileSync(editorCssPath, 'utf-8');
    expect(content).toMatch(/asset-thumbnail/);
  });
});

describe('Request 4: Default Backgrounds', () => {
  const backgroundsDir = path.join(rootDir, 'client', 'assets', 'default-backgrounds');

  it('default-backgrounds directory should exist', () => {
    expect(fs.existsSync(backgroundsDir)).toBe(true);
  });

  it('should include default-stage.png', () => {
    const filePath = path.join(backgroundsDir, 'default-stage.png');
    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  });
});