const { spawn } = require('child_process');
const path = require('path');

// Change to the backend directory
const backendDir = path.join(__dirname, 'backend');

// Install dependencies
console.log('Installing dependencies...');
const npmInstall = spawn('npm', ['install'], { cwd: backendDir });

npmInstall.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

npmInstall.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

npmInstall.on('close', (code) => {
  console.log(`npm install exited with code ${code}`);
  
  if (code === 0) {
    // Start the server
    console.log('Starting the server...');
    const server = spawn('node', ['server.js'], { cwd: backendDir });
    
    server.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`);
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Server stderr: ${data}`);
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
  }
});