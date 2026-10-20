import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve(true);
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for Vite dev server'));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function runDev() {
  console.log('[Dev] Starting Vite dev server...');
  const viteProc = spawn('npx', ['vite'], {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, BROWSER: 'none' },
  });

  process.on('exit', () => viteProc.kill());
  process.on('SIGINT', () => {
    viteProc.kill();
    process.exit();
  });

  console.log('[Dev] Waiting for Vite server at http://localhost:5173...');
  try {
    await waitForServer('http://localhost:5173');
    console.log('[Dev] Vite is live! Building Electron main process...');
  } catch (err) {
    console.error(err);
    viteProc.kill();
    process.exit(1);
  }

  // Build electron
  const buildProc = spawn('node', ['scripts/build-electron.mjs'], {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });

  buildProc.on('close', (code) => {
    if (code !== 0) {
      console.error('[Dev] Electron build failed');
      viteProc.kill();
      process.exit(1);
    }

    console.log('[Dev] Launching Electron window...');
    const electronProc = spawn('npx', ['electron', '.'], {
      cwd: rootDir,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: 'http://localhost:5173' },
    });

    electronProc.on('close', () => {
      viteProc.kill();
      process.exit(0);
    });
  });
}

runDev();
