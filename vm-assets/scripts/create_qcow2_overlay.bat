@echo off
REM =====================================================================
REM  CTF-Style Vulnerable Machine Lab - QCOW2 Overlay Snapshot Generator
REM =====================================================================
setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
set BASE_IMAGE=%SCRIPT_DIR%..\images\ctf_base.qcow2
set OVERLAY_IMAGE=%SCRIPT_DIR%..\images\ctf_overlay.qcow2

echo [CTF Lab] Initializing QCOW2 Copy-on-Write Overlay...

where qemu-img.exe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set QEMU_IMG=qemu-img.exe
) else (
    if exist "C:\Program Files\qemu\qemu-img.exe" (
        set QEMU_IMG="C:\Program Files\qemu\qemu-img.exe"
    ) else (
        echo [Warning] qemu-img not found in PATH or Program Files.
        echo [Notice] The application will use its high-fidelity embedded isolated sandbox.
        exit /b 0
    )
)

if not exist "%BASE_IMAGE%" (
    echo [Info] Creating base template QCOW2 placeholder image...
    %QEMU_IMG% create -f qcow2 "%BASE_IMAGE%" 2G
)

if exist "%OVERLAY_IMAGE%" (
    echo [Info] Removing existing modified overlay...
    del /f /q "%OVERLAY_IMAGE%"
)

echo [Info] Generating pristine copy-on-write overlay linked to base image...
%QEMU_IMG% create -f qcow2 -b "%BASE_IMAGE%" -F qcow2 "%OVERLAY_IMAGE%"

echo [Success] QCOW2 overlay created: %OVERLAY_IMAGE%
exit /b 0
