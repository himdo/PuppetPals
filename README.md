# PuppetPals

A web-based puppet controlling software where one person acts as the server owner with master controls, and up to 10 clients can connect to control their own puppets on a shared 3D stage.

## Features

- **Real-time 3D Stage**: Shared Three.js scene with synchronized puppet rendering
- **Hierarchical Puppet System**: Bone-based skeleton hierarchy with parent-child relationships
- **Animation Engine**: Keyframe-based animation system with 8 pre-defined animations
- **In-Browser Editor**: Visual puppet and animation editors
- **Admin Controls**: Server owner master controls over all players and puppets
- **Network Optimization**: Delta state updates, throttled broadcasts, animation batching
- **Connection Quality Monitoring**: Real-time ping tracking and connection classification
- **Graceful Failover**: Automatic owner promotion when server owner disconnects

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|-----------|
| Frontend | Vanilla JavaScript + ES Modules | Modular client-side code |
| 3D Rendering | Three.js | 3D stage, puppet rendering, camera controls |
| Real-time Communication | Socket.io (WebSocket) | Server-client synchronization |
| Server | Node.js + Express | HTTP server, asset streaming, game logic |
| UI | Custom HTML/CSS | Clean, performant UI overlays |
| Asset Format | PNG images + JSON | Puppet parts, skeletons, animations |

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm installed

### Installation

```bash
# Clone the repository
git clone https://github.com/himdo/PuppetPals.git
cd PuppetPals

# Install dependencies
npm install
```

### Running the Server

```bash
# Start the server (default port: 3000)
npm start

# Run in development mode with file watching
npm run dev
```

The server will start at `http://localhost:3000`. Open this URL in up to 11 browser tabs (1 owner + 10 clients).

### Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npm test -- --testPathPattern=gameState.test.js

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

```
PuppetPals/
├── package.json
├── README.md
├── PROJECT_PLAN.md
├── server/
│   ├── index.js              # Server entry point
│   ├── config.js             # Server configuration
│   ├── socket-handler.js     # Socket.io event handlers
│   ├── game-state.js         # Centralized game state manager
│   ├── asset-manager.js      # Asset upload/streaming
│   ├── auth-manager.js       # Nickname authentication
│   ├── admin-controller.js   # Server owner master controls
│   └── animation-sync.js     # Server-side animation synchronization
├── client/
│   ├── index.html            # Main HTML entry point
│   ├── css/
│   │   ├── main.css          # Global styles
│   │   ├── editor.css        # Puppet editor UI styles
│   │   └── animations.css    # Animation panel styles
│   └── js/
│       ├── main.js           # Client entry point
│       ├── app-state.js      # Client state management
│       ├── socket-client.js  # Socket.io client connection
│       ├── three/            # Three.js scene, camera, renderer
│       ├── puppet/           # Puppet, bone, skeleton classes
│       ├── animation/        # Animation system, keyframes, sync
│       └── ui/               # UI panels (admin, chat, settings)
├── assets/                   # Server-side asset storage
│   ├── puppets/
│   ├── backgrounds/
│   └── animations/
├── shared/
│   ├── constants.js          # Shared constants
│   ├── protocols.js          # Socket event definitions
│   └── utils.js              # Shared utility functions
└── test/                     # Jest test suites
```

## Socket API Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `request-join` | `{ nickname: string }` | Request to join with nickname |
| `move-puppet` | `{ puppetId: string, location?: string, x?: number, z?: number }` | Move puppet to location |
| `rotate-bone` | `{ puppetId: string, boneId: string, rotation: Object }` | Rotate a bone |
| `start-animation` | `{ puppetId: string, animation: Object }` | Start animation playback |
| `stop-animation` | `{ puppetId: string }` | Stop current animation |
| `upload-asset` | `{ fileName: string, data: string, category: string }` | Upload new asset |
| `save-animation` | `{ animation: Object }` | Save custom animation |
| `admin-move-puppet` | `{ playerId: string, location?: string, x?: number, z?: number }` | Admin: force move |
| `admin-lock-puppet` | `{ playerId: string, lock: boolean }` | Admin: lock/unlock puppet |
| `admin-force-animation` | `{ playerId: string, animation: Object }` | Admin: force animation |
| `admin-eject-player` | `{ playerId: string }` | Admin: eject player |
| `admin-change-background` | `{ background: string }` | Admin: change background |
| `admin-offstage-puppet` | `{ playerId: string }` | Admin: move off-stage |
| `request-asset-manifest` | `{}` | Request asset list |
| `delete-asset` | `{ assetId: string }` | Delete an asset |
| `chat-message` | `{ message: string }` | Send chat message |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-confirmed` | `{ sessionId, role, nickname, players }` | Join successful |
| `nickname-taken` | `{ message: string }` | Nickname already used |
| `player-disconnected` | `{ sessionId, nickname, players }` | Player left |
| `puppet-moved` | `{ playerId, puppetId, position }` | Puppet position changed |
| `animation-started` | `{ puppetId, animation, serverTime, currentTime }` | Animation begun |
| `animation-state` | `{ puppetId, currentTime, serverTime }` | Animation sync update |
| `asset-uploaded` | `{ asset: Object }` | New asset available |
| `asset-manifest` | `{ assets: Array }` | Full asset list |
| `state-sync` | `{ players: Object }` | Full state sync |
| `state-update` | `{ playerId, puppetId, position }` | Incremental update |
| `state-delta-update` | `{ playerId, puppetId, delta: Object }` | Delta-only update |
| `admin-puppet-locked` | `{ playerId, locked: boolean }` | Puppet lock changed |
| `background-changed` | `{ background: string }` | Background updated |
| `chat-message` | `{ playerId, nickname, message, timestamp }` | Chat message |
| `system-message` | `{ message: string }` | System notification |

## Data Formats

### Skeleton JSON Format

```json
{
  "name": "Puppet Name",
  "bones": [
    {
      "id": "unique-id",
      "name": "Display Name",
      "parentId": null,
      "asset": "bone-image.png",
      "position": { "x": 0, "y": 0, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 1, "y": 1 },
      "socketPoints": [
        { "id": "top", "offset": { "x": 0, "y": 0.5 } }
      ]
    }
  ]
}
```

### Animation JSON Format

```json
{
  "id": "animation-id",
  "name": "Animation Name",
  "duration": 1000,
  "loop": true,
  "interpolation": "linear",
  "keyframes": [
    {
      "time": 0,
      "boneId": "bone-id",
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "position": { "x": 0, "y": 0, "z": 0 }
    }
  ]
}
```

## Network Optimization

### State Delta Updates

The server only sends changed data to clients. Instead of broadcasting full state snapshots, the `GameState.computeDelta()` method compares cached states with current states and only transmits differences:

```javascript
// Server computes delta
const delta = gameState.computeDelta(playerId, cachedState);
// Only sends: { position: { old, new }, isLocked: { old, new } }
```

### Throttled Position Updates

Position updates are throttled to a maximum of 20Hz (50ms interval) to reduce network load:

```javascript
// Configurable throttle interval
gameState.setThrottleInterval(50);  // 50ms = 20Hz max

// Check before broadcasting
if (gameState.canBroadcastUpdate(playerId)) {
  // Broadcast allowed
  gameState.recordUpdate(playerId);
}
```

### Animation State Batching

Animation updates are batched and sent together to reduce the number of network messages:

```javascript
// Queue updates
gameState.queueAnimationUpdate(puppetId, { type: 'start', animationId: 'walk' });
gameState.queueAnimationUpdate(puppetId, { type: 'seek', time: 500 });

// Flush all at once (last update per puppet wins)
const batch = gameState.flushAnimationBatch();
```

### Connection Quality Monitoring

The server tracks ping times and classifies connection quality:

| Quality | Ping Range | Description |
|---------|-----------|-------------|
| Excellent | < 50ms | Smooth real-time sync |
| Good | 50-100ms | Minor latency |
| Poor | 100-200ms | Noticeable lag |
| Critical | > 200ms | Severe latency |

```javascript
// Record ping
gameState.recordPing(playerId, pingMs);

// Get quality classification
const quality = gameState.getConnectionQuality(playerId);  // 'excellent', 'good', 'poor', 'critical'
```

## Edge Case Handling

### Server Owner Disconnect

When the server owner disconnects, the earliest-joined client is automatically promoted to owner:

```javascript
// Called in disconnect handler
if (authManager.getOwnerId() === null) {
  const newOwnerId = authManager.promoteOwner();
  // Broadcast new owner to all clients
}
```

### Asset Loading Failures

When a puppet config fails to load, the system falls back to a default puppet:

```javascript
const config = gameState.resolvePuppetConfig(playerId, loadedConfig);
// Returns default puppet if config is null or invalid
```

### Animation Sync Drift Correction

The server tracks animation timing drift and recommends resync when drift exceeds 200ms:

```javascript
gameState.setAnimationTime(playerId, serverTime, clientTime);

if (gameState.needsAnimationResync(playerId, 200)) {
  // Force resync this player's animation
}
```

### Duplicate Session Handling

Duplicate socket connections from the same user are detected and handled:

```javascript
if (authManager.isDuplicateSocket(socketId)) {
  authManager.handleDuplicateConnection(socketId, nickname);
}
```

## Configuration

Edit `server/config.js` to customize:

- `PORT`: Server port (default: 3000)
- `MAX_PLAYERS`: Maximum connected players (default: 10)
- `MAX_ASSET_SIZE`: Maximum upload size in bytes
- `HOST`: Server bind address

## Testing

All features are covered by Jest unit tests:

```bash
npm test
```

Test files follow the pattern `test/*.test.js` and mirror the source file structure.

## License

MIT