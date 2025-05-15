const { spawn } = require('child_process');
const path = require('path');

// Start backend server
const backend = spawn('node', ['src/backend/src/index.js'], {
    stdio: 'inherit',
    shell: true
});

// Start frontend server
const frontend = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, 'src/frontend')
});

// Handle process termination
process.on('SIGINT', () => {
    backend.kill();
    frontend.kill();
    process.exit();
});

// Handle errors
backend.on('error', (err) => {
    console.error('Backend server error:', err);
});

frontend.on('error', (err) => {
    console.error('Frontend server error:', err);
}); 