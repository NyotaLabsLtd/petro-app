const { spawn } = require('child_process');

console.log('🚀 Starting frontend server on port 3001...');

const serve = spawn('npx', ['serve', '-p', '3001'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});