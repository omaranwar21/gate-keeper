// Jest's globalSetup runs once before any e2e spec file, even across
// parallel workers — unlike a per-file beforeAll, so two spec files that
// each spawn `node dist/main.js` can't race on building dist/ concurrently.
const { execSync } = require('child_process');

module.exports = async () => {
  execSync('npm run build', { cwd: `${__dirname}/..`, stdio: 'inherit' });
};
