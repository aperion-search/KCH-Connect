const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');

console.log('========================================');
console.log('   KCH Connect - Automatic Launcher');
console.log('========================================');

// 1. Check and install root dependencies
if (!fs.existsSync(path.join(rootDir, 'node_modules'))) {
    console.log('\n[Setup] Installing root dependencies...');
    try {
        execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
        console.log('[Setup] Root dependencies installed successfully.');
    } catch (err) {
        console.error('[Error] Failed to install root dependencies:', err.message);
        process.exit(1);
    }
} else {
    console.log('[Setup] Root dependencies already installed.');
}

// 2. Check and install frontend dependencies
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log('\n[Setup] Installing frontend dependencies...');
    try {
        execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
        console.log('[Setup] Frontend dependencies installed successfully.');
    } catch (err) {
        console.error('[Error] Failed to install frontend dependencies:', err.message);
        process.exit(1);
    }
} else {
    console.log('[Setup] Frontend dependencies already installed.');
}

// 3. Build frontend if dist doesn't exist
if (!fs.existsSync(path.join(frontendDir, 'dist'))) {
    console.log('\n[Setup] Building frontend production bundle...');
    try {
        execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
        console.log('[Setup] Frontend built successfully.');
    } catch (err) {
        console.error('[Error] Failed to build frontend:', err.message);
        process.exit(1);
    }
} else {
    console.log('[Setup] Frontend build found.');
}

// 4. Start the server
console.log('\n[Server] Starting KCH Connect server (server.js)...');
const server = spawn('node', ['server.js'], { cwd: rootDir, stdio: 'inherit' });

server.on('error', (err) => {
    console.error('[Error] Failed to start server:', err.message);
});

server.on('close', (code) => {
    console.log(`[Server] Server process exited with code ${code}`);
});
