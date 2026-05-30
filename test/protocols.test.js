/** Unit Tests for shared/protocols.js
 * Tests socket protocol event definitions
 */

const assert = require('node:assert');
const { describe, it } = require('node:test');

const SocketEvents = require('../shared/protocols');

describe('Socket Protocols', () => {
  it('should export an object', () => {
    assert.ok(typeof SocketEvents === 'object');
    assert.ok(SocketEvents !== null);
  });

  it('should have connection & authentication events', () => {
    assert.strictEqual(SocketEvents.REQUEST_JOIN, 'request-join');
    assert.strictEqual(SocketEvents.JOIN_CONFIRMED, 'join-confirmed');
    assert.strictEqual(SocketEvents.NICKNAME_TAKEN, 'nickname-taken');
    assert.strictEqual(SocketEvents.PLAYER_DISCONNECTED, 'player-disconnected');
  });

  it('should have puppet movement events', () => {
    assert.strictEqual(SocketEvents.MOVE_PUPPET, 'move-puppet');
    assert.strictEqual(SocketEvents.PUPPET_MOVED, 'puppet-moved');
  });

  it('should have animation events', () => {
    assert.strictEqual(SocketEvents.START_ANIMATION, 'start-animation');
    assert.strictEqual(SocketEvents.ANIMATION_STARTED, 'animation-started');
    assert.strictEqual(SocketEvents.ANIMATION_STATE, 'animation-state');
    assert.strictEqual(SocketEvents.STOP_ANIMATION, 'stop-animation');
    assert.strictEqual(SocketEvents.ADMIN_START_ANIMATION, 'admin-start-animation');
    assert.strictEqual(SocketEvents.ADMIN_STOP_ANIMATION, 'admin-stop-animation');
  });

  it('should have state sync events', () => {
    assert.strictEqual(SocketEvents.STATE_SYNC, 'state-sync');
    assert.strictEqual(SocketEvents.STATE_UPDATE, 'state-update');
  });

  it('should have admin control events', () => {
    assert.strictEqual(SocketEvents.ADMIN_MOVE_PUPPET, 'admin-move-puppet');
    assert.strictEqual(SocketEvents.ADMIN_LOCK_PUPPET, 'admin-lock-puppet');
    assert.strictEqual(SocketEvents.ADMIN_EJECT_PLAYER, 'admin-eject-player');
    assert.strictEqual(SocketEvents.ADMIN_CHANGE_BACKGROUND, 'admin-change-background');
    assert.strictEqual(SocketEvents.ADMIN_OFFSTAGE_PUPPET, 'admin-offstage-puppet');
  });

  it('should have asset management events', () => {
    assert.strictEqual(SocketEvents.UPLOAD_ASSET, 'upload-asset');
    assert.strictEqual(SocketEvents.ASSET_UPLOADED, 'asset-uploaded');
    assert.strictEqual(SocketEvents.ASSET_MANIFEST, 'asset-manifest');
    assert.strictEqual(SocketEvents.DELETE_ASSET, 'delete-asset');
  });

  it('should have puppet editor events', () => {
    assert.strictEqual(SocketEvents.PUPPET_UPDATED, 'puppet-updated');
    assert.strictEqual(SocketEvents.SYNC_PUPPET, 'sync-puppet');
  });

  it('should have chat events', () => {
    assert.strictEqual(SocketEvents.CHAT_MESSAGE, 'chat-message');
    assert.strictEqual(SocketEvents.SYSTEM_MESSAGE, 'system-message');
  });

  it('should have all event values as unique strings', () => {
    const values = Object.values(SocketEvents);
    const uniqueValues = new Set(values);
    assert.strictEqual(values.length, uniqueValues.size, 'Duplicate event values found');
  });

  it('should have all event keys as unique', () => {
    const keys = Object.keys(SocketEvents);
    const uniqueKeys = new Set(keys);
    assert.strictEqual(keys.length, uniqueKeys.size, 'Duplicate event keys found');
  });
});