import path from 'path';

export interface VmConfiguration {
  vmName: string;
  memoryMb: number;
  cpus: number;
  hostPort: number;
  guestPort: number;
  sandboxHost: string;
  baseImageName: string;
  overlayImageName: string;
  qemuBinaryName: string;
}

export const DEFAULT_VM_CONFIG: VmConfiguration = {
  vmName: 'Antigravity-Isolated-CTF-Linux-Node',
  memoryMb: 1024,
  cpus: 1,
  hostPort: 8888,
  guestPort: 80,
  sandboxHost: '127.0.0.1',
  baseImageName: 'ctf_base.qcow2',
  overlayImageName: 'ctf_overlay.qcow2',
  qemuBinaryName: 'qemu-system-x86_64.exe',
};

export function getQemuArguments(
  qemuPath: string,
  imagePath: string,
  config: VmConfiguration = DEFAULT_VM_CONFIG,
  accel: 'whpx' | 'haxm' | 'tcg' = 'tcg'
): string[] {
  return [
    '-m', `${config.memoryMb}`,
    '-smp', `${config.cpus}`,
    '-name', config.vmName,
    '-drive', `file=${imagePath},if=virtio,cache=writeback`,
    // Strict internal host-only isolation: restrict=on blocks all guest access to external networks
    '-netdev', `user,id=net0,restrict=on,hostfwd=tcp:${config.sandboxHost}:${config.hostPort}-:${config.guestPort}`,
    '-device', 'virtio-net-pci,netdev=net0',
    '-display', 'none', // Headless background VM for desktop application
    '-accel', accel,
    '-no-reboot'
  ];
}
