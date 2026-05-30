/** Jest Configuration
 * Centralized test configuration - no need to manually add test files to npm scripts
 */
module.exports = {
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 10000, // 10 second timeout for all tests
  verbose: true,
  collectCoverageFrom: [
    'server/**/*.js',
    'shared/**/*.js',
    'client/js/three/**/*.js',
    'client/js/puppet/**/*.js',
    '!server/index.js', // Exclude auto-starting server from coverage
  ],
  moduleNameMapper: {
    '^three$': '<rootDir>/__mocks__/three.js',
    '^three/addons/controls/OrbitControls\\.js$': '<rootDir>/__mocks__/three-addons-controls.js',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(three)/)',
  ],
};