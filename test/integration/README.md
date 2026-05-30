# PuppetPals Integration & E2E Testing Guide

This directory contains integration tests that test the PuppetPals web application beyond unit tests. These tests verify that different parts of the system work together correctly.

## Testing Strategy Overview

PuppetPals uses a **3-Layer Testing Strategy**:

### Layer 1: Unit Tests (`test/*.test.js`)
- **What**: Tests individual functions/classes in isolation
- **Scope**: Business logic, data structures, algorithms
- **Mocks**: Heavy mocking of dependencies (Three.js, Socket.io, etc.)
- **Speed**: Fast (~1-2 seconds for all tests)
- **Run**: `npm run test:unit`

### Layer 2: Integration Tests (`test/integration/`)
- **What**: Tests real server with HTTP endpoints and Socket.io events
- **Scope**: API endpoints, socket event flows, multi-client communication
- **Mocks**: No mocks — uses a real PuppetPalsServer instance
- **Speed**: Medium (~3 seconds)
- **Run**: `npm run test:integration`

### Layer 3: Browser E2E Tests (Planned)
- **What**: Tests the full application in a real browser
- **Scope**: UI interactions, page navigation, visual elements
- **Tool**: Playwright (`@playwright/test` installed)
- **Status**: Framework ready, tests to be added
- **Run**: `npx playwright test`

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (unit + integration) |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run all tests with coverage report |

## Integration Test Coverage

The integration tests (`test/integration/server.integration.test.js`) cover:

### HTTP Endpoints
- `GET /api/health` — Server health check
- `GET /api/assets/manifest` — Asset manifest retrieval
- `GET /api/assets/puppets` — Available puppets list
- `GET /api/assets/search` — Asset search
- Static file serving (HTML, CSS, JS)

### Socket.io Connection & Join Flow
- First client becomes owner
- Subsequent clients join as regular players
- Duplicate nickname rejection
- Player disconnection broadcast

### Multi-Client Communication
- Player join/disconnect events
- Real-time state synchronization

### Animation Events
- Start animation broadcast
- Stop animation
- Authentication enforcement

### Admin Events
- Owner can lock puppets
- Owner can change backgrounds
- Non-owner admin action rejection

### Puppet Movement
- Movement broadcast to all clients
- Authentication enforcement

### State Sync
- New clients receive existing player list

## Adding New Integration Tests

### Pattern for Socket Event Tests

```javascript
it('should broadcast EVENT_NAME when action performed', async () => {
  // 1. Connect clients
  const r1 = await connectClient(testServer.baseUrl, 'Owner', clients);
  const r2 = await connectClient(testServer.baseUrl, 'Watcher', clients);

  // 2. Set up listener on watcher
  const eventPromise = new Promise((resolve) => {
    watcherClient.once('event-name', (data) => resolve(data));
  });

  // 3. Perform action on owner
  ownerClient.emit('action-event', { payload: 'data' });

  // 4. Assert the broadcast was received
  const data = await Promise.race([
    eventPromise,
    new Promise((_, reject) => setTimeout(
      () => reject(new Error('Timeout')), 5000
    )),
  ]);

  expect(data).toBeDefined();
});
```

### Important Notes

1. **Owner is first**: The first client to join becomes the owner. Admin tests must connect the owner in `beforeAll` and reuse it.
2. **Game state registration**: Before admin actions on a puppet, the target must be registered in the game state via `registerPuppet()`.
3. **Clean up clients**: Always add clients to the `clients` array so they are disconnected in `afterAll`.
4. **Use correct event names**: Event names come from `shared/protocols.js`.

## Running Browser E2E Tests (Future)

Once Playwright tests are written:

```bash
# Install browser binaries
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

## Troubleshooting

### Tests fail with "Connection timeout"
- Ensure no other server is running on the same port
- Integration tests use random ports, so this is rare

### "Jest did not exit" warning
- Use `--forceExit` flag (already in npm scripts)
- This is caused by Socket.io keeping connections open

### Tests pass locally but fail in CI
- Check for port conflicts
- Ensure Node.js version is compatible (v16+)