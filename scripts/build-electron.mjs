import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distElectron = path.resolve(rootDir, 'dist-electron');

if (!fs.existsSync(distElectron)) {
  fs.mkdirSync(distElectron, { recursive: true });
}

async function build() {
  console.log('[Build] Compiling Electron main and preload scripts...');
  
  // Build Main Process
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'electron/main.ts')],
    outfile: path.resolve(distElectron, 'main.js'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: ['electron', 'mongodb', 'dotenv'],
    sourcemap: 'inline',
  });

  // Build Preload Script
  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'electron/preload.ts')],
    outfile: path.resolve(distElectron, 'preload.js'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: ['electron'],
    sourcemap: 'inline',
  });

  // Copy sql-wasm.wasm if present in node_modules
  const sqlWasmSrc = path.resolve(rootDir, 'node_modules/sql.js/dist/sql-wasm.wasm');
  const sqlWasmDest = path.resolve(distElectron, 'sql-wasm.wasm');
  if (fs.existsSync(sqlWasmSrc)) {
    fs.copyFileSync(sqlWasmSrc, sqlWasmDest);
    console.log('[Build] Copied sql-wasm.wasm to dist-electron');
  }

  console.log('[Build] Electron build complete.');
}

build().catch((err) => {
  console.error('[Build Error]', err);
  process.exit(1);
});
