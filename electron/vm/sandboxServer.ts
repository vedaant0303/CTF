import http from 'http';
import url from 'url';
import { handlePico, handlePicoDownload } from './picoChallenges';

export interface SandboxServerOptions {
  host?: string;
  port?: number;
}

export class SandboxServer {
  private server: http.Server | null = null;
  private port: number;
  private host: string;
  private isRunning = false;
  private startTime: number = Date.now();

  // In-memory challenge state for clean snapshot resets
  private state = {
    users: [
      { id: 1, username: 'taylor', email: 'taylor@meridian.local', role: 'admin', note: 'Private Member Note: Target flag captured! flag{data_not_instructions}' },
      { id: 2, username: 'alex', email: 'alex@meridian.local', role: 'customer', note: 'Standard member note.' },
    ],
    tickets: [
      { id: 100, owner: 'admin', subject: 'CONFIDENTIAL: Meridian Audit Findings', body: 'Confidential security assessment item: Target Flag is flag{idor_ticket_exposed_991}. Do not distribute.', isPrivate: true },
      { id: 101, owner: 'taylor', subject: 'Receipt copy for order MM-1042', body: 'Please send receipt for the organic tea delivery.', isPrivate: false },
      { id: 104, owner: 'alex', subject: 'Welcome to your Meridian Support Ticket', body: 'Your support ticket #104 is active. Inspect URL parameters to see how direct object authorization works!', isPrivate: false },
    ],
    uploadedFiles: new Map<string, { filename: string; content: string; date: string }>(),
    rateLimitCounter: 0,
    rateLimitLastReset: Date.now(),
  };

  constructor(options: SandboxServerOptions = {}) {
    this.host = options.host || '127.0.0.1';
    this.port = options.port || 8888;
  }

  public start(): Promise<void> {
    if (this.isRunning && this.server) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));

      this.server.on('error', (err: any) => {
        console.error('[SandboxServer] Server error:', err.message);
        reject(err);
      });

      this.server.listen(this.port, this.host, () => {
        this.isRunning = true;
        this.startTime = Date.now();
        console.log(`[SandboxServer] Meridian Market Lab running on http://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server || !this.isRunning) {
        resolve();
        return;
      }
      this.server.close(() => {
        this.isRunning = false;
        resolve();
      });
    });
  }

  public reset(): void {
    this.state.users = [
      { id: 1, username: 'taylor', email: 'taylor@meridian.local', role: 'admin', note: 'Private Member Note: Target flag captured! flag{data_not_instructions}' },
      { id: 2, username: 'alex', email: 'alex@meridian.local', role: 'customer', note: 'Standard member note.' },
    ];
    this.state.tickets = [
      { id: 100, owner: 'admin', subject: 'CONFIDENTIAL: Meridian Audit Findings', body: 'Confidential security assessment item: Target Flag is flag{idor_ticket_exposed_991}. Do not distribute.', isPrivate: true },
      { id: 101, owner: 'taylor', subject: 'Receipt copy for order MM-1042', body: 'Please send receipt for the organic tea delivery.', isPrivate: false },
      { id: 104, owner: 'alex', subject: 'Welcome to your Meridian Support Ticket', body: 'Your support ticket #104 is active. Inspect URL parameters to see how direct object authorization works!', isPrivate: false },
    ];
    this.state.uploadedFiles.clear();
    this.state.rateLimitCounter = 0;
    this.state.rateLimitLastReset = Date.now();
    console.log('[SandboxServer] State reset to initial clean snapshot.');
  }

  public getStatus() {
    return {
      running: this.isRunning,
      host: this.host,
      port: this.port,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      isolated: true,
      vmName: 'MERIDIAN-01',
    };
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Frame-Options', 'ALLOWALL');

    // Universal guided attack helper script injected into all HTML challenge pages
    const originalEnd = res.end.bind(res);
    (res as any).end = function (chunk?: any, encoding?: any, callback?: any) {
      if (typeof chunk === 'string') {
        const guidedScript = `
<script id="guided-attack-listener">
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'AUTOGUIDE_FILL') {
      var p = event.data.payload || '';
      var targetInput = document.querySelector('input[name="username"], input[name="name"], input[name="user"], input[name="recipient"], input[type="text"], textarea');
      if (targetInput) {
        targetInput.value = p;
        targetInput.style.border = '2px solid #10b981';
        targetInput.style.backgroundColor = '#ecfdf5';
        targetInput.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.7)';
        targetInput.focus();
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      var passInput = document.querySelector('input[type="password"]');
      if (passInput && (!passInput.value || passInput.value === '••••••••')) {
        passInput.value = 'testpass123';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      var amountInput = document.querySelector('input[name="amount"]');
      if (amountInput) {
        amountInput.value = '500';
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (typeof applyTestInput === 'function') {
        applyTestInput();
      }
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:12px;right:16px;background:#065f46;color:#a7f3d0;border:1px solid #10b981;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:700;z-index:999999;box-shadow:0 4px 14px rgba(0,0,0,0.25);animation:fadeIn 0.2s ease;';
      banner.innerHTML = '⚡ Payload Injected into Form! Click Sign In / Submit below.';
      document.body.appendChild(banner);
      setTimeout(function() { banner.remove(); }, 3500);
    }
  });
</script>`;
        if (chunk.includes('</body>')) {
          chunk = chunk.replace('</body>', `${guidedScript}\n</body>`);
        } else if (chunk.includes('</html>')) {
          chunk = chunk.replace('</html>', `${guidedScript}\n</html>`);
        }
      }
      return (originalEnd as any)(chunk, encoding, callback);
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';

    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getStatus()));
      return;
    }

    if (pathname === '/api/reset' && req.method === 'POST') {
      this.reset();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Lab reset to clean snapshot.' }));
      return;
    }

    // 1. Meridian Market Login & Account (Challenge 01 SQL Injection)
    if (pathname === '/' || pathname === '/login' || pathname === '/meridian' || pathname === '/sqli') {
      this.handleMeridianLogin(req, res, parsedUrl);
      return;
    }

    if (pathname === '/account') {
      this.handleMeridianAccount(res, parsedUrl);
      return;
    }

    // 2. Information Disclosure
    if (pathname === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end("User-agent: *\nDisallow: /admin-internal/\nDisallow: /.git/\nDisallow: /backups/debug_conf_2026.bak\n# Confidential system files archived");
      return;
    }

    if (pathname === '/.git' || pathname === '/.git/config') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n[remote "origin"]\n\turl = http://meridian.local/internal.git\n# Debug note leaked in git commit:\n# flag{debug_notes_reveal_secrets}`);
      return;
    }

    if (pathname === '/backups/debug_conf_2026.bak') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`APP_ENV=production\nDB_PASS=Meridian2026Secure!\nFLAG=flag{debug_notes_reveal_secrets}\nHOST=127.0.0.1`);
      return;
    }

    if (pathname.startsWith('/info-disc')) {
      this.handleInfoDisc(res);
      return;
    }

    // 3. Authentication Bypass
    if (pathname.startsWith('/auth')) {
      this.handleAuth(req, res, parsedUrl);
      return;
    }

    // 4. XSS & IDOR
    if (pathname.startsWith('/support') || pathname.startsWith('/idor')) {
      this.handleIdor(req, res, parsedUrl);
      return;
    }

    // 5. File Upload
    if (pathname.startsWith('/upload')) {
      this.handleUpload(req, res, parsedUrl);
      return;
    }

    // 6. DoS Controlled Simulation
    if (pathname.startsWith('/stress') || pathname.startsWith('/dos')) {
      this.handleDos(req, res, parsedUrl);
      return;
    }

    // 7. Privilege Escalation Terminal
    if (pathname.startsWith('/terminal') || pathname.startsWith('/privesc')) {
      this.handlePrivesc(req, res, parsedUrl);
      return;
    }

    // 8. SSRF (Server-Side Request Forgery)
    if (pathname.startsWith('/ssrf')) {
      this.handleSsrf(req, res, parsedUrl);
      return;
    }

    // 9. Broken Token Auth (JWT)
    if (pathname.startsWith('/jwt-portal')) {
      this.handleJwtPortal(req, res, parsedUrl);
      return;
    }

    // 10. CSRF (Cross-Site Request Forgery)
    if (pathname.startsWith('/csrf')) {
      this.handleCsrf(req, res, parsedUrl);
      return;
    }

    // 11. Race Condition / Concurrency
    if (pathname.startsWith('/race-condition')) {
      this.handleRaceCondition(req, res, parsedUrl);
      return;
    }

    // 12. picoCTF Download Endpoints
    if (pathname.startsWith('/pico/download')) {
      this.handlePicoDownload(res, parsedUrl);
      return;
    }

    // 13. picoCTF Multi-Discipline Challenges
    if (pathname.startsWith('/pico/')) {
      this.handlePico(req, res, parsedUrl);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`<html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>404 - Not Found</h2><p><a href="/login">Return to Meridian Market Login</a></p></body></html>`);
  }

  // --- Meridian Market Login (Challenge 01) ---
  private handleMeridianLogin(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let username = '';
      let password = '';
      let error = '';

      if (req.method === 'POST') {
        const params = new URLSearchParams(body);
        username = params.get('username') || '';
        password = params.get('password') || '';

        const lower = username.toLowerCase();
        // SQL Injection evaluation:
        if (
          lower.includes("' or 1=1") ||
          lower.includes("' or '1'='1") ||
          lower.includes("admin' --") ||
          lower.includes("' or true --") ||
          lower.includes("' or ''='")
        ) {
          // Redirect or render account page with Taylor's logged in session!
          res.writeHead(302, { Location: '/account?auth=sqli_success' });
          res.end();
          return;
        } else {
          error = 'Invalid email or password. Please check your credentials.';
        }
      }

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Meridian Market - Sign in</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #111a16; margin: 0; padding: 24px 32px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e3eae6; padding-bottom: 14px; margin-bottom: 36px; }
          .brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 800; color: #005944; letter-spacing: -0.02em; }
          .nav { display: flex; gap: 20px; font-size: 13.5px; color: #4b5a54; font-weight: 500; }
          .nav a { color: inherit; text-decoration: none; }
          .container { max-width: 440px; margin: 0 auto; }
          .subtag { font-size: 11px; font-weight: 700; color: #72827a; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
          h1 { font-size: 22px; font-weight: 800; color: #111a16; margin: 0 0 6px; letter-spacing: -0.02em; }
          p.sub { font-size: 13.5px; color: #72827a; margin: 0 0 24px; }
          label { display: block; font-size: 13px; font-weight: 600; color: #111a16; margin-bottom: 6px; }
          input[type="text"], input[type="password"] { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cdd9d3; border-radius: 8px; font-size: 14px; outline: none; margin-bottom: 16px; }
          input:focus { border-color: #005944; box-shadow: 0 0 0 3px rgba(0, 89, 68, 0.12); }
          .row { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: #4b5a54; margin-bottom: 20px; }
          .btn-signin { width: 100%; background: #005944; color: white; border: none; padding: 11px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; }
          .btn-signin:hover { background: #004636; }
          .signup-text { text-align: center; font-size: 13px; color: #72827a; margin-top: 18px; }
          .signup-text a { color: #005944; font-weight: 600; text-decoration: none; }
          .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; margin-bottom: 16px; }
          
          /* Guided Test Bar */
          .guided-case { margin-top: 40px; padding: 14px 18px; background: #f8faf9; border: 1px solid #e3eae6; border-radius: 10px; }
          .case-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; font-weight: 700; }
          .case-tag { color: #005944; text-transform: uppercase; }
          .case-badge { background: #e8f7f1; color: #004d3b; padding: 2px 8px; border-radius: 999px; font-size: 10.5px; }
          .case-desc { font-size: 12px; color: #4b5a54; line-height: 1.4; margin: 0 0 10px; }
          .btn-apply { background: white; border: 1px solid #005944; color: #005944; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; cursor: pointer; }
          .btn-apply:hover { background: #e8f7f1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005944" stroke-width="2.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>meridian market</span>
          </div>
          <div class="nav">
            <a href="/login">Shop</a>
            <a href="/login" style="color: #005944; font-weight: 600;">My account</a>
          </div>
        </div>

        <div class="container">
          <div class="subtag">EVERYDAY GOODS, THOUGHTFULLY CHOSEN</div>
          <h1>Good to see you again.</h1>
          <p class="sub">Sign in to view orders, saved items, and member notes.</p>

          ${error ? `<div class="error">${error}</div>` : ''}

          <form method="POST" action="/login" id="loginForm">
            <div>
              <label>Email or username</label>
              <input type="text" id="userInput" name="username" value="${username || 'alex'}" required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" id="passInput" name="password" value="••••••••" />
            </div>
            <div class="row">
              <label style="display:flex; align-items:center; gap:6px; margin:0; font-weight:normal; font-size:12.5px;">
                <input type="checkbox" checked /> Remember me
              </label>
              <a href="#" style="color:#72827a; text-decoration:none;">Forgot password?</a>
            </div>
            <button type="submit" class="btn-signin">Sign in</button>
          </form>

          <div class="signup-text">
            New around here? <a href="#">Create an account</a>
          </div>

          <!-- Bottom Guided Learning Case Matching Screenshot 07 -->
          <div class="guided-case">
            <div class="case-header">
              <span class="case-tag">Guided learning case · SQL-01</span>
              <span class="case-badge">Ready to try</span>
            </div>
            <p class="case-desc">
              A built-in, sandbox-only test demonstrates unsafe input handling. No commands to run or real-world target is involved.
            </p>
            <button type="button" class="btn-apply" onclick="applyTestInput()">
              ➔ Apply guided test input
            </button>
          </div>
        </div>

        <script>
          function applyTestInput() {
            const userInput = document.getElementById('userInput');
            userInput.value = "' OR 1=1 --";
            document.getElementById('passInput').value = "testpass";
            // Highlight change
            userInput.style.borderColor = "#005944";
            userInput.style.backgroundColor = "#e8f7f1";
          }
        </script>
      </body>
      </html>
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }

  // --- Meridian Market Account (Screenshot 08) ---
  private handleMeridianAccount(res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    const showNote = parsedUrl.query.note === '1';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Meridian Market - Your account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #111a16; margin: 0; padding: 24px 32px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e3eae6; padding-bottom: 14px; margin-bottom: 28px; }
        .brand { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 800; color: #005944; }
        .nav { display: flex; gap: 20px; font-size: 13.5px; color: #4b5a54; font-weight: 500; }
        .nav a { color: inherit; text-decoration: none; }
        .container { max-width: 620px; margin: 0 auto; }
        .subtag { font-size: 11px; font-weight: 700; color: #72827a; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
        h1 { font-size: 22px; font-weight: 800; color: #111a16; margin: 0 0 6px; letter-spacing: -0.02em; }
        p.sub { font-size: 13.5px; color: #72827a; margin: 0 0 20px; }
        
        .welcome-bar { display: flex; justify-content: space-between; align-items: center; background: #f8faf9; border: 1px solid #e3eae6; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
        .tabs { display: flex; gap: 16px; border-bottom: 1px solid #e3eae6; margin-bottom: 20px; font-size: 13px; font-weight: 600; }
        .tab { padding: 8px 0; color: #72827a; text-decoration: none; cursor: pointer; }
        .tab.active { color: #005944; border-bottom: 2px solid #005944; }

        .order-card { background: white; border: 1px solid #e3eae6; border-radius: 10px; padding: 16px 18px; margin-bottom: 16px; display: flex; gap: 14px; align-items: center; }
        
        /* Member Note Card (Screenshot 08) */
        .note-card { background: #e8f7f1; border: 1.5px solid #b8ebd9; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px; }
        .flag-token { background: #005944; color: #34d399; font-family: monospace; font-size: 14px; font-weight: bold; padding: 8px 14px; border-radius: 6px; display: inline-block; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005944" stroke-width="2.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>meridian market</span>
        </div>
        <div class="nav">
          <a href="#">Shop</a>
          <a href="/account" style="color:#005944; font-weight:600;">My account</a>
        </div>
      </div>

      <div class="container">
        <div class="subtag">EVERYDAY GOODS, THOUGHTFULLY CHOSEN</div>
        <h1>Your account, your little corner.</h1>
        <p class="sub">Orders, saved items, and a few things just for you.</p>

        <div class="welcome-bar">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: #111a16;">Welcome back, Taylor.</div>
            <div style="font-size: 12px; color: #72827a;">Member since 2024 · Customer account</div>
          </div>
          <span style="font-size: 20px;">👤</span>
        </div>

        <div class="tabs">
          <span class="tab active">Overview</span>
          <span class="tab">Orders</span>
          <span class="tab">Saved items</span>
        </div>

        <div class="order-card">
          <div style="font-size: 22px;">📦</div>
          <div>
            <div style="font-size: 13.5px; font-weight: 600; color: #111a16;">Your latest order has arrived.</div>
            <div style="font-size: 12px; color: #72827a;">Order MM-1042 · 2 items · Delivered</div>
          </div>
        </div>

        <!-- Green Member Note Card Holding Flag -->
        <div class="note-card">
          <div style="font-size: 14px; font-weight: 700; color: #004d3b; margin-bottom: 4px;">
            A note for our curious members
          </div>
          <p style="font-size: 13px; color: #1e3a2f; margin: 0 0 10px; line-height: 1.5;">
            There's a small discovery waiting in your private learning note:
          </p>

          <div>
            <span class="flag-token">flag{data_not_instructions}</span>
          </div>

          <div style="font-size: 11.5px; color: #005944; margin-top: 8px;">
            Copy this complete flag into the right panel to complete Challenge 01!
          </div>
        </div>

        <div style="text-align: right; margin-top: 14px;">
          <a href="/login" style="font-size: 12.5px; color: #72827a; text-decoration: none;">Sign out of Taylor's account</a>
        </div>
      </div>
    </body>
    </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  // --- Other Target Handlers ---
  private handleInfoDisc(res: http.ServerResponse): void {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Meridian Market - Developer Portal</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #111a16; padding: 32px; }
        .card { max-width: 600px; margin: 0 auto; border: 1px solid #e3eae6; border-radius: 12px; padding: 24px; }
        code { background: #e8f7f1; color: #005944; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="color: #005944; margin-top:0;">Meridian Internal Portal</h2>
        <p>Developers inadvertently left repository assets exposed in production:</p>
        <ul>
          <li>Search engine directives: <a href="/robots.txt"><code>/robots.txt</code></a></li>
          <li>Git revision metadata: <a href="/.git/config"><code>/.git/config</code></a></li>
          <li>Server backups: <a href="/backups/debug_conf_2026.bak"><code>/backups/debug_conf_2026.bak</code></a></li>
        </ul>
      </div>
    </body>
    </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private handleAuth(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let message = '';
      let isSuccess = false;
      let flag = '';

      if (req.method === 'POST') {
        const params = new URLSearchParams(body);
        const username = params.get('username') || '';
        if (username.includes("admin' --") || username.includes("' or 1=1")) {
          isSuccess = true;
          flag = 'flag{auth_boundary_bypassed}';
          message = 'Administrative boundary bypassed!';
        } else {
          message = 'Invalid credentials.';
        }
      }

      const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family:sans-serif; padding:40px; background:#f8faf9; display:flex; justify-content:center;">
        <div style="background:white; border:1px solid #e3eae6; border-radius:12px; padding:32px; width:400px;">
          <h2 style="color:#005944; margin-top:0;">Meridian Admin Gateway</h2>
          ${isSuccess ? `
            <div style="background:#e8f7f1; padding:16px; border-radius:8px; color:#004d3b;">
              <strong>${message}</strong><br><br>
              Flag: <code style="font-size:14px; font-weight:bold;">${flag}</code>
            </div>
          ` : `
            ${message ? `<div style="color:red; margin-bottom:12px;">${message}</div>` : ''}
            <form method="POST" action="/auth">
              <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:600;">Admin Username</label>
              <input type="text" name="username" placeholder="admin' --" style="width:100%; box-sizing:border-box; padding:10px; margin-bottom:16px; border:1px solid #cdd9d3; border-radius:6px;" />
              <button type="submit" style="width:100%; background:#005944; color:white; padding:10px; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Sign in as Admin</button>
            </form>
          `}
        </div>
      </body>
      </html>
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }

  private handleIdor(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    const idParam = (parsedUrl.query.id as string) || '104';
    const id = parseInt(idParam, 10);
    const ticket = this.state.tickets.find(t => t.id === id);

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif; padding:32px; background:#f8faf9;">
      <div style="max-width:600px; margin:0 auto; background:white; border:1px solid #e3eae6; border-radius:12px; padding:24px;">
        <h2 style="color:#005944; margin-top:0;">Customer Ticket Desk</h2>
        <p>Viewing Ticket: <strong>#${idParam}</strong></p>
        ${ticket ? `
          <div style="padding:16px; border-radius:8px; background:${ticket.isPrivate ? '#fef2f2; border:1px solid #fecaca;' : '#f8faf9; border:1px solid #e3eae6;'}">
            <h4>${ticket.subject}</h4>
            <p>${ticket.body}</p>
          </div>
        ` : `<p>Ticket not found.</p>`}
        <div style="margin-top:16px; font-size:13px;">
          <a href="/support?id=104" style="color:#005944;">My Ticket (#104)</a> | 
          <a href="/support?id=100" style="color:#005944;">Confidential (#100)</a>
        </div>
      </div>
    </body>
    </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private handleUpload(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const params = new URLSearchParams(body);
        const filename = (params.get('filename') || '').toLowerCase();
        let flag = '';
        if (filename.endsWith('.php') || filename.endsWith('.phtml')) {
          flag = 'flag{file_upload_shell_exec}';
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family:sans-serif; padding:32px; background:#f8faf9;">
          <div style="max-width:600px; margin:0 auto; background:white; border:1px solid #e3eae6; border-radius:12px; padding:24px;">
            <h2 style="color:#005944; margin-top:0;">File Uploaded</h2>
            <p>File '${filename}' written to server web directory.</p>
            ${flag ? `<div style="background:#e8f7f1; color:#004d3b; padding:16px; border-radius:8px;"><strong>PHP Execution Verified!</strong><br>Flag: <code>${flag}</code></div>` : ''}
            <p><a href="/upload" style="color:#005944;">Upload another file</a></p>
          </div>
        </body>
        </html>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });
      return;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif; padding:32px; background:#f8faf9;">
      <div style="max-width:600px; margin:0 auto; background:white; border:1px solid #e3eae6; border-radius:12px; padding:24px;">
        <h2 style="color:#005944; margin-top:0;">Meridian Avatar Upload</h2>
        <form method="POST" action="/upload">
          <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Filename</label>
          <input type="text" name="filename" value="shell.php" style="width:100%; box-sizing:border-box; padding:10px; margin-bottom:16px; border:1px solid #cdd9d3; border-radius:6px;" />
          <button type="submit" style="background:#005944; color:white; padding:10px 18px; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Upload & Execute</button>
        </form>
      </div>
    </body>
    </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private handleDos(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    if (parsedUrl.query.ping === '1') {
      this.state.rateLimitCounter++;
      const tripped = this.state.rateLimitCounter >= 15;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        requestsInWindow: this.state.rateLimitCounter,
        circuitBreakerTripped: tripped,
        flag: tripped ? 'flag{rate_limiting_protects_service}' : null,
      }));
      return;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif; padding:32px; background:#f8faf9;">
      <div style="max-width:600px; margin:0 auto; background:white; border:1px solid #e3eae6; border-radius:12px; padding:24px;">
        <h2 style="color:#005944; margin-top:0;">API Rate Limiting Simulator</h2>
        <p>Controlled client test model against local endpoint.</p>
        <button onclick="runBurst()" style="background:#005944; color:white; padding:10px 18px; border:none; border-radius:6px; font-weight:600; cursor:pointer;">⚡ Run Controlled Burst</button>
        <div id="flag" style="margin-top:16px; display:none; background:#e8f7f1; color:#004d3b; padding:14px; border-radius:8px; font-weight:bold;"></div>
        <pre id="log" style="background:#0d1714; color:#e8f7f1; padding:12px; border-radius:6px; margin-top:14px; font-size:12px;"></pre>
      </div>
      <script>
        async function runBurst() {
          const log = document.getElementById('log');
          for (let i = 1; i <= 18; i++) {
            const res = await fetch('/stress?ping=1');
            const data = await res.json();
            log.innerText += 'Request ' + i + ': ' + (data.circuitBreakerTripped ? '429 Rate Limited' : '200 OK') + '\\n';
            if (data.flag) {
              document.getElementById('flag').style.display = 'block';
              document.getElementById('flag').innerText = 'Rate Limit Tripped! Flag: ' + data.flag;
              break;
            }
          }
        }
      </script>
    </body>
    </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private handlePrivesc(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    if (parsedUrl.query.cmd) {
      const cmd = (parsedUrl.query.cmd as string).trim();
      let output = '';
      let isRoot = false;

      if (cmd === 'sudo -l') {
        output = 'User www-data may run the following commands on meridian-vm:\n    (root) NOPASSWD: /usr/bin/find';
      } else if (cmd.includes('find') && cmd.includes('-exec')) {
        isRoot = true;
        output = '[ROOT PRIVILEGE ESCALATION CONFIRMED]\nuid=0(root) gid=0(root)\nReading /root/flag.txt:\nflag{privesc_root_access_granted}';
      } else {
        output = `Command executed: ${cmd}. Try 'sudo -l'`;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ output, isRoot }));
      return;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:monospace; background:#0d1714; color:#e8f7f1; padding:32px;">
      <h3>MERIDIAN-01 Console Terminal (www-data)</h3>
      <p>Type: <code>sudo -l</code> or <code>sudo find . -exec /bin/sh \\;</code></p>
      <input type="text" id="cmd" placeholder="sudo -l" style="width:100%; background:#1c2b25; border:1px solid #2e473e; color:white; padding:10px; font-family:inherit;" />
      <pre id="out" style="margin-top:14px; white-space:pre-wrap;"></pre>
      <script>
        document.getElementById('cmd').addEventListener('keydown', async (e) => {
          if (e.key === 'Enter') {
            const res = await fetch('/terminal?cmd=' + encodeURIComponent(e.target.value));
            const data = await res.json();
            document.getElementById('out').innerText += '\\n$ ' + e.target.value + '\\n' + data.output;
            e.target.value = '';
          }
        });
      </script>
    </body>
    </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  // --- picoCTF Multi-Discipline Challenge Endpoints & Downloads ---
  private handlePico(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    handlePico(req, res, parsedUrl);
  }

  private handlePicoDownload(res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    handlePicoDownload(res, parsedUrl);
  }

  // --- 8. SSRF: Cloud Metadata Probe ---
  private handleSsrf(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let imageUrl = (parsedUrl.query.url as string) || '';
      if (req.method === 'POST') {
        const params = new URLSearchParams(body);
        imageUrl = params.get('url') || '';
      }

      let responseContent = '';
      let isExploited = false;

      if (imageUrl.includes('169.254.169.254') || imageUrl.includes('metadata')) {
        isExploited = true;
        responseContent = JSON.stringify({
          "InstanceProfile": "meridian-production-ecs-worker",
          "Region": "us-east-1",
          "SecurityCredentials": {
            "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
            "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            "Token": "IQoJb3JpZ2luX2VjEEXAMPLE...",
            "TargetFlag": "flag{ssrf_internal_metadata_leaked_882}"
          }
        }, null, 2);
      } else if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
        isExploited = true;
        responseContent = JSON.stringify({
          "status": "internal_loopback_accessed",
          "service": "Meridian Core Auth Daemon",
          "flag": "flag{ssrf_internal_metadata_leaked_882}"
        }, null, 2);
      } else if (imageUrl) {
        responseContent = `Fetched 2,048 bytes image buffer from ${imageUrl} [HTTP 200 OK]. Image validated.`;
      }

      const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>Meridian Market - Product Image Importer</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #111a16; padding: 24px 32px; max-width: 680px; margin: 0 auto; }
          .header { border-bottom: 1px solid #e3eae6; padding-bottom: 12px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
          .brand { font-weight: 800; color: #005944; font-size: 16px; }
          h2 { margin: 0 0 8px; font-size: 20px; }
          p { color: #4b5a54; font-size: 13.5px; line-height: 1.5; margin: 0 0 16px; }
          input[type="text"] { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cdd9d3; border-radius: 8px; font-size: 13.5px; margin-bottom: 12px; }
          .btn-submit { background: #005944; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
          .btn-sample { background: #f1f5f3; border: 1px solid #cdd9d3; color: #005944; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin-right: 8px; }
          .result-box { margin-top: 20px; background: #0d1714; color: #34d399; font-family: monospace; padding: 16px; border-radius: 8px; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
          .flag-banner { margin-top: 16px; background: #e8f7f1; border: 1.5px solid #005944; color: #004d3b; padding: 12px; border-radius: 8px; font-weight: bold; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">MERIDIAN MARKET · STAFF INVENTORY TOOLS</div>
          <span style="font-size: 12px; color: #72827a;">SERVICE: /import-url</span>
        </div>
        <h2>Remote Product Image Importer</h2>
        <p>Supply a remote URL. The backend server will fetch the asset on your behalf and store it in the public asset directory.</p>

        <form method="POST" action="/ssrf">
          <label style="font-size: 12.5px; font-weight: 700; display: block; margin-bottom: 6px;">Image Asset URL</label>
          <input type="text" id="urlInput" name="url" value="${imageUrl || 'https://cdn.meridian.local/assets/tea.jpg'}" required />
          <div style="margin-bottom: 12px; font-size:12px; color:#72827a;">
            Probing internal loopback addresses (127.0.0.1) or cloud instance metadata (169.254.169.254) requires manually supplying the target URI.
          </div>
          <button type="submit" class="btn-submit">Fetch Remote Resource</button>
        </form>

        ${responseContent ? `
        <h4 style="margin: 20px 0 6px; font-size: 13px;">Server Response Stream:</h4>
        <div class="result-box">${responseContent}</div>` : ''}

        ${isExploited ? `
        <div class="flag-banner">
          🏆 SSRF Exploit Succeeded! Flag: flag{ssrf_internal_metadata_leaked_882}
        </div>` : ''}

      </body>
      </html>`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }

  // --- 9. Broken Token Auth (JWT) ---
  private handleJwtPortal(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let token = (parsedUrl.query.token as string) || '';
      if (req.method === 'POST') {
        const params = new URLSearchParams(body);
        token = params.get('token') || '';
      }

      // Default customer token:
      const defaultHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
      const defaultPayload = Buffer.from(JSON.stringify({ user: "alex", role: "customer", exp: 1775000000 })).toString('base64url');
      const defaultSig = "c2lnbmF0dXJlX2hhc2hfZXhhbXBsZQ";
      const sampleCustomerToken = `${defaultHeader}.${defaultPayload}.${defaultSig}`;

      if (!token) token = sampleCustomerToken;

      let isAdmin = false;
      let parseError = '';
      let decodedPayload: any = {};
      let decodedHeader: any = {};

      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          decodedHeader = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
          decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

          // Check for "none" algorithm vulnerability or role escalation
          if (decodedHeader.alg === 'none' || decodedPayload.role === 'admin' || decodedPayload.role === 'supervisor') {
            isAdmin = true;
          }
        }
      } catch (err: any) {
        parseError = 'Failed to parse JWT token: ' + err.message;
      }

      const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>Meridian Market - Staff Portal (JWT)</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #111a16; padding: 24px 32px; max-width: 680px; margin: 0 auto; }
          .header { border-bottom: 1px solid #e3eae6; padding-bottom: 12px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
          .brand { font-weight: 800; color: #005944; font-size: 16px; }
          textarea { width: 100%; box-sizing: border-box; height: 75px; padding: 8px 12px; font-family: monospace; border: 1px solid #cdd9d3; border-radius: 8px; font-size: 12.5px; }
          .btn-submit { background: #005944; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; margin-top: 10px; }
          .card { background: #f8faf9; border: 1px solid #e3eae6; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .flag-banner { background: #e8f7f1; border: 1.5px solid #005944; color: #004d3b; padding: 14px; border-radius: 8px; font-weight: bold; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">MERIDIAN MARKET · EMPLOYEE SSO GATEWAY</div>
          <span style="font-size: 12px; color: #72827a;">PROTOCOL: RFC 7519 (JWT)</span>
        </div>
        <h2>Staff Administration Gateway</h2>
        <p>Inspect and submit your Bearer token. The server verifies access control based on the token payload.</p>

        <form method="POST" action="/jwt-portal">
          <label style="font-size: 12.5px; font-weight: 700; display: block; margin-bottom: 6px;">Active Bearer JWT</label>
          <textarea id="jwtInput" name="token">${token}</textarea>
          <div style="margin-top: 10px;">
            <button type="submit" class="btn-submit">Submit Token</button>
          </div>
        </form>

        <div class="card">
          <div style="font-size: 12px; font-weight: 700; color: #72827a; margin-bottom: 6px;">PARSED TOKEN DATA</div>
          <div style="font-size: 13px;"><strong>Header:</strong> <code>${JSON.stringify(decodedHeader)}</code></div>
          <div style="font-size: 13px; margin-top: 4px;"><strong>Payload:</strong> <code>${JSON.stringify(decodedPayload)}</code></div>
          <div style="font-size: 13px; margin-top: 4px;"><strong>Role:</strong> <span style="color: ${isAdmin ? '#005944' : '#b45309'}; font-weight: 700;">${decodedPayload.role || 'none'}</span></div>
        </div>

        ${isAdmin ? `
        <div class="flag-banner">
          🎉 Admin Privilege Escalation Confirmed!<br/>
          Master Flag: flag{jwt_alg_none_privilege_escalation_741}
        </div>` : `
        <div style="background: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 12px; border-radius: 8px; font-size: 13px;">
          🔒 Access Denied to Staff Admin Vault. Role "customer" does not have permission. Try forging "role": "admin" with "alg": "none".
        </div>`}

        <script>
          function forgeAdmin() {
            var h = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, '');
            var p = btoa(JSON.stringify({ user: "alex", role: "admin", exp: 1775000000 })).replace(/=/g, '');
            document.getElementById('jwtInput').value = h + '.' + p + '.';
          }
        </script>
      </body>
      </html>`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }

  // --- 10. CSRF (Cross-Site Request Forgery) ---
  private handleCsrf(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let recipient = '';
      let amount = '';
      let isForged = false;

      if (req.method === 'POST') {
        const params = new URLSearchParams(body);
        recipient = params.get('recipient') || '';
        amount = params.get('amount') || '';
        if (recipient.includes('attacker') || recipient.includes('evil') || params.get('is_csrf') === 'true') {
          isForged = true;
        }
      }

      const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>Meridian Market - Member Rewards Transfer</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #111a16; padding: 24px 32px; max-width: 680px; margin: 0 auto; }
          .header { border-bottom: 1px solid #e3eae6; padding-bottom: 12px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
          .brand { font-weight: 800; color: #005944; font-size: 16px; }
          .tabs { display: flex; gap: 8px; margin-bottom: 18px; }
          .tab { padding: 6px 14px; border-radius: 6px; border: 1px solid #cdd9d3; cursor: pointer; font-size: 12px; font-weight: 600; }
          .tab.active { background: #005944; color: white; border-color: #005944; }
          .form-box { background: #f8faf9; border: 1px solid #e3eae6; border-radius: 8px; padding: 20px; }
          input { width: 100%; box-sizing: border-box; padding: 8px 12px; border: 1px solid #cdd9d3; border-radius: 6px; margin-bottom: 12px; font-size: 13px; }
          .btn-submit { background: #005944; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
          .flag-banner { margin-top: 20px; background: #e8f7f1; border: 1.5px solid #005944; color: #004d3b; padding: 14px; border-radius: 8px; font-weight: bold; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">MERIDIAN MARKET · MEMBER REWARDS</div>
          <span style="font-size: 12px; color: #72827a;">BALANCE: 500 PTS</span>
        </div>
        <h2>Points Transfer Service</h2>
        <p>Transfer reward credits to another member account. Notice the form lacks an Anti-CSRF token!</p>

        <div class="tabs">
          <button class="tab active" id="tabVictim" onclick="showTab('victim')">1. Legitimate Meridian Transfer Form</button>
          <button class="tab" id="tabAttacker" onclick="showTab('attacker')">2. Malicious External Site (CSRF PoC)</button>
        </div>

        <div id="victimView" class="form-box">
          <form method="POST" action="/csrf">
            <label style="font-size: 12px; font-weight: 700; display: block; margin-bottom: 4px;">Recipient Account ID</label>
            <input type="text" name="recipient" value="${recipient || 'taylor'}" />
            <label style="font-size: 12px; font-weight: 700; display: block; margin-bottom: 4px;">Points to Transfer</label>
            <input type="text" name="amount" value="${amount || '50'}" />
            <button type="submit" class="btn-submit">Transfer Points</button>
          </form>
        </div>

        <div id="attackerView" class="form-box" style="display:none; background: #fff5f5; border-color: #fecaca;">
          <h4 style="margin: 0 0 8px; color: #991b1b;">http://free-gift-cards-claim.net (Attacker Page)</h4>
          <p style="font-size: 12px; color: #7f1d1d;">This simulated attacker website triggers a hidden POST request to Meridian using the victim's ambient browser cookies.</p>
          <form method="POST" action="/csrf">
            <input type="hidden" name="recipient" value="attacker_wallet_99" />
            <input type="hidden" name="amount" value="500" />
            <input type="hidden" name="is_csrf" value="true" />
            <button type="submit" style="background: #dc2626; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 700;">
              Simulate Victim Clicking Malicious Link
            </button>
          </form>
        </div>

        ${isForged ? `
        <div class="flag-banner">
          🚩 CSRF Exploit Verified: 500 Points transferred to attacker_wallet_99!<br/>
          Flag: flag{csrf_state_change_unauthorized_239}
        </div>` : ''}

        <script>
          function showTab(t) {
            if (t === 'victim') {
              document.getElementById('victimView').style.display = 'block';
              document.getElementById('attackerView').style.display = 'none';
              document.getElementById('tabVictim').className = 'tab active';
              document.getElementById('tabAttacker').className = 'tab';
            } else {
              document.getElementById('victimView').style.display = 'none';
              document.getElementById('attackerView').style.display = 'block';
              document.getElementById('tabVictim').className = 'tab';
              document.getElementById('tabAttacker').className = 'tab active';
            }
          }
        </script>
      </body>
      </html>`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }

  // --- 11. Race Condition / Concurrency ---
  private handleRaceCondition(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let balance = 10;
      let attempts = 0;
      let exploited = false;

      if (req.method === 'POST') {
        const params = new URLSearchParams(body);
        const mode = params.get('mode') || 'single';

        if (mode === 'burst') {
          // Simulate 5 concurrent threads completing before DB lock checks
          balance = 110; // $10 + (2 x $50) double-spend
          attempts = 5;
          exploited = true;
        } else {
          balance = 60; // $10 + $50 single redemption
          attempts = 1;
        }
      }

      const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>Meridian Market - Voucher Redemption</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #111a16; padding: 24px 32px; max-width: 680px; margin: 0 auto; }
          .header { border-bottom: 1px solid #e3eae6; padding-bottom: 12px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
          .brand { font-weight: 800; color: #005944; font-size: 16px; }
          .balance-card { background: #f8faf9; border: 1.5px solid #e3eae6; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px; }
          .balance-num { font-size: 32px; font-weight: 800; color: #005944; margin: 8px 0; }
          .btn-single { background: #f1f5f3; border: 1px solid #cdd9d3; color: #111a16; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
          .btn-burst { background: #005944; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 13px; margin-left: 10px; }
          .flag-banner { margin-top: 20px; background: #e8f7f1; border: 1.5px solid #005944; color: #004d3b; padding: 14px; border-radius: 8px; font-weight: bold; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">MERIDIAN MARKET · VOUCHER CHECKOUT</div>
          <span style="font-size: 12px; color: #72827a;">VOUCHER: SAVE50-2026</span>
        </div>
        <h2>Store Credit Voucher Portal</h2>
        <p>Customers can redeem promo code <code>SAVE50-2026</code> once for $50 credit. Due to missing row-level database locks, sending simultaneous requests creates a TOCTOU race condition.</p>

        <div class="balance-card">
          <div style="font-size: 12px; font-weight: 700; color: #72827a;">CURRENT ACCOUNT STORE CREDIT</div>
          <div class="balance-num">$${balance}.00</div>
          <div style="font-size: 12px; color: #72827a;">Single-use coupon limit: 1 per account</div>
        </div>

        <form method="POST" action="/race-condition" style="display: flex; justify-content: center; gap: 10px;">
          <input type="hidden" name="mode" value="single" />
          <button type="submit" class="btn-single">Standard Single Request</button>
        </form>

        <form method="POST" action="/race-condition" style="margin-top: 10px; display: flex; justify-content: center;">
          <input type="hidden" name="mode" value="burst" />
          <button type="submit" class="btn-burst">⚡ Execute Concurrent Burst (5 Threads Simultaneously)</button>
        </form>

        ${exploited ? `
        <div class="flag-banner">
          🚀 Race Condition Exploit Confirmed! Double-spend credited $100 instead of $50.<br/>
          Flag: flag{race_condition_double_spend_success_912}
        </div>` : ''}
      </body>
      </html>`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  }
}
