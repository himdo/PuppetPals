/** Unit Tests for shared/protocols.js
 * Tests socket protocol event definitions
 */

const SocketEvents = require('../shared/protocols');

describe('Socket Protocols', () => {
  it('should export an object', () => {
    expect(typeof SocketEvents).toBe('object');
    expect(SocketEvents).not.toBeNull();
  });

  it('should have connection & authentication events', () => {
    expect(SocketEvents.REQUEST_JOIN).toBe('request-join');
    expect(SocketEvents.JOIN_CONFIRMED).toBe('join-confirmed');
    expect(SocketEvents.NICKNAME_TAKEN).toBe('nickname-taken');
    expect(SocketEvents.PLAYER_DISCONNECTED).toBe('player-disconnected');
  });

  it('should have puppet movement events', () => {
    expect(SocketEvents.MOVE_PUPPET).toBe('move-puppet');
    expect(SocketEvents.PUPPET_MOVED).toBe('puppet-moved');
  });

  it('should have animation events', () => {
    expect(SocketEvents.START_ANIMATION).toBe('start-animation');
    expect(SocketEvents.ANIMATION_STARTED).toBe('animation-started');
    expect(SocketEvents.ANIMATION_STATE).toBe('animation-state');
    expect(SocketEvents.STOP_ANIMATION).toBe('stop-animation');
    expect(SocketEvents.ADMIN_START_ANIMATION).toBe('admin-start-animation');
    expect(SocketEvents.ADMIN_STOP_ANIMATION).toBe('admin-stop-animation');
  });

  it('should have state sync events', () => {
    expect(SocketEvents.STATE_SYNC).toBe('state-sync');
    expect(SocketEvents.STATE_UPDATE).toBe('state-update');
  });

  it('should have admin control events', () => {
    expect(SocketEvents.ADMIN_MOVE_PUPPET).toBe('admin-move-puppet');
    expect(SocketEvents.ADMIN_LOCK_PUPPET).toBe('admin-lock-puppet');
    expect(SocketEvents.ADMIN_EJECT_PLAYER).toBe('admin-eject-player');
    expect(SocketEvents.ADMIN_CHANGE_BACKGROUND).toBe('admin-change-background');
    expect(SocketEvents.ADMIN_OFFSTAGE_PUPPET).toBe('admin-offstage-puppet');
  });

  it('should have asset management events', () => {
    expect(SocketEvents.UPLOAD_ASSET).toBe('upload-asset');
    expect(SocketEvents.ASSET_UPLOADED).toBe('asset-uploaded');
    expect(SocketEvents.ASSET_MANIFEST).toBe('asset-manifest');
    expect(SocketEvents.DELETE_ASSET).toBe('delete-asset');
  });

  it('should have puppet editor events', () => {
    expect(SocketEvents.PUPPET_UPDATED).toBe('puppet-updated');
    expect(SocketEvents.SYNC_PUPPET).toBe('sync-puppet');
  });

  it('should have chat events', () => {
    expect(SocketEvents.CHAT_MESSAGE).toBe('chat-message');
    expect(SocketEvents.SYSTEM_MESSAGE).toBe('system-message');
  });

  it('should have all event values as unique strings', () => {
    const values = Object.values(SocketEvents);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });

  it('should have all event keys as unique', () => {
    const keys = Object.keys(SocketEvents);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });
});