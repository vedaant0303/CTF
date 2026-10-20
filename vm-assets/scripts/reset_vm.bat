@echo off
REM =====================================================================
REM  CTF-Style Vulnerable Machine Lab - Instant Snapshot Reset
REM =====================================================================
setlocal EnableDelayedExpansion

set SCRIPT_DIR=%~dp0
echo [CTF Lab] Performing Instant Clean Snapshot Reset...

REM Call create_qcow2_overlay.bat to discard changes in overlay and restore clean base
call "%SCRIPT_DIR%create_qcow2_overlay.bat"

echo [Success] Lab VM environment restored to clean initial state.
exit /b 0
