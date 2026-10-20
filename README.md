# CTF-Style Vulnerable Machine Design Application
### *Design a custom vulnerable VM with chained exploits as a teaching tool*

A real **Windows desktop software distributed as an `.exe` installer**, built with **Electron + React + TypeScript + Vite**, **Node.js** for the controller layer, **SQLite** for offline persistent progress, and **QEMU / Isolated Sandbox** for the isolated CTF environment.

---

## 🚀 Key Highlights & Features

- **Windows Desktop Installer (`.exe`)**: Packaged with NSIS installer (`release/CTF Vulnerable Machine Lab Setup 1.0.0.exe`), desktop shortcut, start menu shortcut, and custom app icon.
- **Strict Host-Only Network Isolation**: The vulnerable sandbox binds exclusively to `127.0.0.1:8888` with `-netdev user,id=net0,restrict=on`. All outbound external network egress is prohibited by design. No arbitrary external IPs or domains can be attacked.
- **7-Stage Chained Exploit Progression**:
  1. **SQL Injection**: Product catalog query manipulation (`' OR 1=1 --`) to extract hidden credentials.
  2. **Information Disclosure**: Reconnaissance discovering `/robots.txt`, `/.git/config`, and sensitive `.bak` config dumps.
  3. **Authentication Bypass**: Administrator login SQL injection (`admin' --`) to seize session access.
  4. **IDOR (Insecure Direct Object Reference)**: Support desk ticket enumeration (`?id=100`) extracting confidential executive tickets.
  5. **Arbitrary File Upload**: Avatar upload extension bypass (`shell.php`) achieving server-side execution.
  6. **Controlled DoS Simulation**: Safe local client-rate stress test demonstrating circuit-breaker trip & HTTP 429 rate-limiting defense.
  7. **Linux Privilege Escalation**: Service account (`www-data`) SUID/sudo permission breakout via `/usr/bin/find` to root shell.
- **Instant QCOW2 Snapshot Reset**: Reverting the lab environment discards changes in `ctf_overlay.qcow2` and re-links to clean base image in < 1.5 seconds.
- **Progressive Hint Engine**: 3 tiers of hints with transparent XP deductions (-10 XP, -20 XP, -30 XP) and confirmation dialogs.
- **Secure Timing-Safe Flag Verification**: Flags (`FLAG{...}`) are checked in constant time via `crypto.timingSafeEqual` without exposing correct flags in frontend code.
- **Post-Challenge Learning & Remediation**: Root-cause analysis, vulnerable vs secure code diff, and comprehension quiz.
- **Zero Cloud Dependency**: Runs 100% offline with SQLite (`ctf_training.sqlite`).

---

## 🗺️ Complete 10-Step User Journey

1. **01 Download & Launch**: Run installer and launch desktop software.
2. **02 Welcome / Start Isolated Lab**: Hero introduction, safety policy, and Start Lab trigger.
3. **03 Basic Registration**: Local user profile setup with emblem selection.
4. **04 Cybersecurity Q&A & Skill Assessment**: 4-question skill check calculating initial rank and unlocking recommended path.
5. **05 CTF Training Home**: Curriculum overview with 7 chained challenge cards and recommended path banner.
6. **06 Challenge Explanation**: Concept theory, mechanics breakdown, prerequisites, and test attack button.
7. **07 Active Challenge Sandbox**: 3-panel workspace with Mission Briefing (left), Embedded Target Web App (center), and Flag Submission Panel (right).
8. **08 Progressive Hints / Retry**: Tiered hints and feedback on incorrect submissions.
9. **09 Correct Flag / Challenge Success**: Celebration confetti, XP calculation, remediation diff, and comprehension quiz.
10. **10 Progress Dashboard**: Total XP, completion metrics, interactive kill chain visualizer, badges, and activity history.

---

## 🛠️ Build & Development Commands

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (Vite + Electron live window)
npm run dev

# 3. Build production bundle (Renderer + Electron main)
npm run build

# 4. Generate Windows .exe installer
npm run package
```

The compiled installer will be located at:
`release/CTF Vulnerable Machine Lab Setup 1.0.0.exe`

Unpacked standalone executable:
`release/win-unpacked/CTF Vulnerable Machine Lab.exe`
