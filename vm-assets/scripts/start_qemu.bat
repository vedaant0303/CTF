@echo off
REM =====================================================================
REM  CTF-Style Vulnerable Machine Lab - QEMU Isolated Launcher
REM =====================================================================
setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
set OVERLAY_IMAGE=%SCRIPT_DIR%..\images\ctf_overlay.qcow2

echo [CTF Lab] Launching Isolated Linux QCOW2 Machine...

where qemu-system-x86_64.exe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set QEMU_BIN=qemu-system-x86_64.exe
) else (
    if exist "C:\Program Files\qemu\qemu-system-x86_64.exe" (
        set QEMU_BIN="C:\Program Files\qemu\qemu-system-x86_64.exe"
    ) else (
        echo [Notice] QEMU not found. The lab will run via the embedded Node sandbox.
        exit /b 0
    )
)

REM Launch with strictly isolated host-only network (restrict=on prevents VM from reaching outside LAN/Internet)
%QEMU_BIN% -m 1024 -smp 1 -name "CTF-Isolated-Lab" ^
  -drive file="%OVERLAY_IMAGE%",if=virtio,cache=writeback ^
  -netdev user,id=net0,restrict=on,hostfwd=tcp:127.0.0.1:8888-:80 ^
  -device virtio-net-pci,netdev=net0 ^
  -display none ^
  -accel tcg ^
  -no-reboot
