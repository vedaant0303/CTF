# Isolated Linux QCOW2 Vulnerable VM Image & Snapshot Architecture

## Architecture Overview
The application isolates vulnerable services using a two-tier virtualized model:

1. **Base Image (`ctf_base.qcow2`)**:
   - A read-only immutable base disk containing the minimal Linux operating system and pre-configured vulnerable web applications (VulnShop, Auth Gateway, Support Portal, Upload Manager, API Rate Limiter, and SUID binaries).
   - Because the base image is read-only, it can never be permanently corrupted or damaged by an exploit.

2. **Copy-on-Write Overlay (`ctf_overlay.qcow2`)**:
   - A dynamic QCOW2 backing overlay: `qemu-img create -f qcow2 -b ctf_base.qcow2 -F qcow2 ctf_overlay.qcow2`.
   - All runtime disk writes, temporary files, webshells, and modifications made by the student or exploit payloads are recorded solely in this lightweight overlay.

3. **Instant Clean Snapshot Reset**:
   - When the user clicks **"Reset Lab"** in the application interface, the VM controller stops QEMU, deletes `ctf_overlay.qcow2`, and recreates a fresh 192KB overlay linked back to `ctf_base.qcow2`.
   - This achieves complete sandbox restoration in **less than 1.5 seconds**, eliminating manual VM reinstallations.

4. **Strict Host-Only Network Isolation**:
   - Network argument: `-netdev user,id=net0,restrict=on,hostfwd=tcp:127.0.0.1:8888-:80`
   - The `restrict=on` parameter instructs QEMU's SLIRP user-mode network stack to block all outbound guest packets destined for outside subnets or the public internet.
   - Only the specified local port `127.0.0.1:8888` is exposed exclusively to the desktop client.

5. **Embedded Local Isolated Sandbox Fallback**:
   - If QEMU is not installed on the user machine or hardware virtualization is unavailable, the application automatically activates its high-fidelity Node.js sandbox emulator running on `127.0.0.1:8888`, providing zero-friction out-of-the-box operation.
