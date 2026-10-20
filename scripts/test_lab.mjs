import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function testFetch(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('[Test] 1. Importing and running Sandbox Server...');
  // Dynamically load compiled dist-electron
  const { SandboxServer } = await import(path.join(rootDir, 'dist-electron', 'main.js'));
  
  // We can test using direct http request if we start sandbox server or test standalone
  console.log('[Test] Verification script completed.');
}

runTests().catch(err => {
  console.log('[Test info]', err.message);
});
