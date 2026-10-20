import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { DEFAULT_VM_CONFIG, getQemuArguments, VmConfiguration } from './vmConfig';
import { QemuDetector, VmDiagnostics } from './qemuDetector';
import { SandboxServer } from './sandboxServer';

export type VmState = 'stopped' | 'starting' | 'running' | 'resetting' | 'error';

export interface VmStatusReport {
  state: VmState;
  vmName: string;
  uptimeSeconds: number;
  memoryMb: number;
  cpus: number;
  endpoint: string;
  isolated: boolean;
  engine: 'qemu-whpx' | 'qemu-tcg' | 'embedded-isolated-sandbox';
  qemuPath: string | null;
  baseImagePresent: boolean;
  overlayImagePresent: boolean;
  lastError?: string;
}

export class VmController extends EventEmitter {
  private state: VmState = 'stopped';
  private config: VmConfiguration;
  private qemuProcess: ChildProcess | null = null;
  private sandboxServer: SandboxServer;
  private startTime: number | null = null;
  private lastError: string | undefined;
  private baseDir: string;
  private qemuPath: string | null = null;
  private diagnostics: VmDiagnostics | null = null;

  constructor(baseDir: string, config: Partial<VmConfiguration> = {}) {
    super();
    this.baseDir = baseDir;
    this.config = { ...DEFAULT_VM_CONFIG, ...config };
    this.sandboxServer = new SandboxServer({
      host: this.config.sandboxHost,
      port: this.config.hostPort,
    });
  }

  public async init(): Promise<void> {
    this.diagnostics = await QemuDetector.runDiagnostics();
    this.qemuPath = this.diagnostics.qemuPath;
    console.log(`[VmController] Diagnostics result: QEMU found: ${this.diagnostics.qemuFound}, Engine: ${this.diagnostics.accelerationEngine}`);
  }

  public async getDiagnostics(): Promise<VmDiagnostics> {
    this.diagnostics = await QemuDetector.runDiagnostics(this.qemuPath || undefined);
    return this.diagnostics;
  }

  public async start(): Promise<boolean> {
    if (this.state === 'running' || this.state === 'starting') {
      return true;
    }

    this.setState('starting');
    this.lastError = undefined;

    try {
      // 1. Start the isolated sandbox server
      await this.sandboxServer.start();

      // 2. Check if a real QEMU image exists and QEMU is installed
      const imagesDir = path.join(this.baseDir, 'vm-assets', 'images');
      const baseImagePath = path.join(imagesDir, this.config.baseImageName);
      const overlayImagePath = path.join(imagesDir, this.config.overlayImageName);

      if (this.qemuPath && fs.existsSync(this.qemuPath) && fs.existsSync(baseImagePath)) {
        console.log('[VmController] Launching QEMU VM with copy-on-write overlay...');
        this.ensureQcow2Overlay(baseImagePath, overlayImagePath);

        const args = getQemuArguments(this.qemuPath, overlayImagePath, this.config, 'tcg');
        this.qemuProcess = spawn(this.qemuPath, args, {
          detached: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        this.qemuProcess.on('exit', (code) => {
          console.log(`[VmController] QEMU process exited with code ${code}`);
          if (this.state === 'running') {
            this.setState('stopped');
          }
        });

        this.qemuProcess.on('error', (err) => {
          console.error('[VmController] QEMU runtime error:', err);
          this.lastError = err.message;
        });
      } else {
        console.log('[VmController] Using High-Fidelity Embedded Local Isolated Sandbox.');
      }

      this.startTime = Date.now();
      this.setState('running');
      return true;
    } catch (err: any) {
      console.error('[VmController] Start error:', err);
      this.lastError = err.message;
      this.setState('error');
      return false;
    }
  }

  public async stop(): Promise<void> {
    if (this.state === 'stopped') return;

    if (this.qemuProcess) {
      try {
        this.qemuProcess.kill('SIGTERM');
      } catch {
        // ignore
      }
      this.qemuProcess = null;
    }

    await this.sandboxServer.stop();
    this.startTime = null;
    this.setState('stopped');
  }

  public async reset(): Promise<boolean> {
    console.log('[VmController] Initiating complete lab reset to clean snapshot...');
    this.setState('resetting');

    try {
      // 1. Reset sandbox server in-memory database & files
      this.sandboxServer.reset();

      // 2. If QEMU was running, re-create the QCOW2 overlay to revert all disk changes
      const imagesDir = path.join(this.baseDir, 'vm-assets', 'images');
      const baseImagePath = path.join(imagesDir, this.config.baseImageName);
      const overlayImagePath = path.join(imagesDir, this.config.overlayImageName);

      if (fs.existsSync(overlayImagePath)) {
        try {
          fs.unlinkSync(overlayImagePath);
          console.log('[VmController] Deleted modified QCOW2 overlay.');
        } catch (e) {
          // ignore
        }
      }

      if (fs.existsSync(baseImagePath)) {
        this.ensureQcow2Overlay(baseImagePath, overlayImagePath);
      }

      // Restore running state
      this.startTime = Date.now();
      this.setState('running');
      return true;
    } catch (err: any) {
      console.error('[VmController] Reset error:', err);
      this.lastError = err.message;
      this.setState('error');
      return false;
    }
  }

  private ensureQcow2Overlay(baseImage: string, overlayImage: string): void {
    if (fs.existsSync(overlayImage)) return;

    // In a real QEMU setup, qemu-img create -f qcow2 -b base.qcow2 overlay.qcow2 is invoked.
    // If qemu-img is not found, copy or create placeholder
    const qemuImgBin = this.qemuPath ? path.join(path.dirname(this.qemuPath), 'qemu-img.exe') : null;
    if (qemuImgBin && fs.existsSync(qemuImgBin)) {
      try {
        const { execSync } = require('child_process');
        execSync(`"${qemuImgBin}" create -f qcow2 -b "${baseImage}" -F qcow2 "${overlayImage}"`);
        return;
      } catch (err) {
        console.warn('[VmController] qemu-img overlay creation failed, copying base image...');
      }
    }

    try {
      fs.copyFileSync(baseImage, overlayImage);
    } catch {
      // ignore
    }
  }

  public getStatus(): VmStatusReport {
    const imagesDir = path.join(this.baseDir, 'vm-assets', 'images');
    const baseImagePath = path.join(imagesDir, this.config.baseImageName);
    const overlayImagePath = path.join(imagesDir, this.config.overlayImageName);

    const uptime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const hasQemu = !!(this.qemuPath && fs.existsSync(this.qemuPath));

    return {
      state: this.state,
      vmName: this.config.vmName,
      uptimeSeconds: uptime,
      memoryMb: this.config.memoryMb,
      cpus: this.config.cpus,
      endpoint: `http://${this.config.sandboxHost}:${this.config.hostPort}`,
      isolated: true,
      engine: hasQemu ? 'qemu-tcg' : 'embedded-isolated-sandbox',
      qemuPath: this.qemuPath,
      baseImagePresent: fs.existsSync(baseImagePath),
      overlayImagePresent: fs.existsSync(overlayImagePath),
      lastError: this.lastError,
    };
  }

  private setState(newState: VmState): void {
    this.state = newState;
    this.emit('stateChange', this.getStatus());
  }
}
