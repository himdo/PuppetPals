/** Test Server Helper for Integration Tests
 * Starts and stops a PuppetPals server instance on a random port
 */

import http from 'http';
import PuppetPalsServer from '../../server/PuppetPalsServer.js';

/**
 * Find a random available port
 */
export function getRandomPort() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address();
      srv.close(() => resolve(address.port));
    });
  });
}

/**
 * Start a test server on a random port
 * @returns {Promise<{server: PuppetPalsServer, port: number, baseUrl: string}>}
 */
export async function startTestServer() {
  const port = await getRandomPort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const server = new PuppetPalsServer();
  await server.start(port, '127.0.0.1');

  return {
    server,
    port,
    baseUrl,
  };
}

/**
 * Stop a test server
 * @param {Object} testServer - Result from startTestServer()
 */
export async function stopTestServer(testServer) {
  if (testServer && testServer.server && testServer.server.stop) {
    await testServer.server.stop();
  }
}

/**
 * Wait for a condition to be true (polling)
 * @param {Function} condition - Async function returning boolean
 * @param {number} timeout - Max wait time in ms
 * @param {number} interval - Polling interval in ms
 */
export async function waitFor(condition, timeout = 5000, interval = 100) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

export default {
  startTestServer,
  stopTestServer,
  waitFor,
  getRandomPort,
};