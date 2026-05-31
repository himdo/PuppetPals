/** Unit Tests for shared/protocols.js
 * Tests the socket event protocols
 */

import SocketEvents from '../shared/protocols.js';

describe('SocketEvents', () => {
  it('should export an object', () => {
    expect(typeof SocketEvents).toBe('object');
  });

  it('should have REQUEST_JOIN event', () => {
    expect(SocketEvents).toHaveProperty('REQUEST_JOIN');
  });

  it('should have JOIN_CONFIRMED event', () => {
    expect(SocketEvents).toHaveProperty('JOIN_CONFIRMED');
  });

  it('should have NICKNAME_TAKEN event', () => {
    expect(SocketEvents).toHaveProperty('NICKNAME_TAKEN');
  });

  it('should have PLAYER_DISCONNECTED event', () => {
    expect(SocketEvents).toHaveProperty('PLAYER_DISCONNECTED');
  });

  it('should have UPLOAD_ASSET event', () => {
    expect(SocketEvents).toHaveProperty('UPLOAD_ASSET');
  });

  it('should have ASSET_UPLOADED event', () => {
    expect(SocketEvents).toHaveProperty('ASSET_UPLOADED');
  });

  it('should have UPLOAD_ERROR event', () => {
    expect(SocketEvents).toHaveProperty('UPLOAD_ERROR');
  });

  it('should have ASSET_MANIFEST event', () => {
    expect(SocketEvents).toHaveProperty('ASSET_MANIFEST');
  });

  it('should have ASSET_MANIFEST_RESPONSE event', () => {
    expect(SocketEvents).toHaveProperty('ASSET_MANIFEST_RESPONSE');
  });

  it('should have DELETE_ASSET event', () => {
    expect(SocketEvents).toHaveProperty('DELETE_ASSET');
  });

  it('should have DELETE_RESULT event', () => {
    expect(SocketEvents).toHaveProperty('DELETE_RESULT');
  });

  it('should have DELETE_ERROR event', () => {
    expect(SocketEvents).toHaveProperty('DELETE_ERROR');
  });

  it('should have ASSET_DELETED event', () => {
    expect(SocketEvents).toHaveProperty('ASSET_DELETED');
  });

  it('should have MOVE_DIRECTION event', () => {
    expect(SocketEvents).toHaveProperty('MOVE_DIRECTION');
  });

  it('should have SLOT_MOVED event', () => {
    expect(SocketEvents).toHaveProperty('SLOT_MOVED');
  });

  it('should have STAGE_CONFIG_UPDATE event', () => {
    expect(SocketEvents).toHaveProperty('STAGE_CONFIG_UPDATE');
  });
});