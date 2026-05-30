/** PuppetPals Server Entry Point
 * Express + Socket.io server for real-time puppet control
 */

import PuppetPalsServer from './PuppetPalsServer.js';

// Create and start server if running directly
const server = new PuppetPalsServer();
server.start();

export default server;