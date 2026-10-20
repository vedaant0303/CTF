export interface AttackVectorStage {
  step: number;
  label: string;
  iconType: 'probe' | 'vector' | 'exfil' | 'crypto' | 'code' | 'network';
  description: string;
}

export interface DetailedAttackInfo {
  cwe: string;
  owasp: string;
  attackVectorName: string;
  technicalMechanism: string;
  samplePayload: string;
  stages: AttackVectorStage[];
  mitigationCode: string;
  defensiveKeyTakeaways: string[];
}

export const CHALLENGE_DETAILED_INFO: Record<string, DetailedAttackInfo> = {
  // ==========================================
  // MERIDIAN EXPLOIT CHAIN (11 Challenges)
  // ==========================================

  'ch-sqli-01': {
    cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
    owasp: 'OWASP A03:2021 – Injection',
    attackVectorName: 'SQL Injection via Authentication Bypass (Tautology Attack)',
    technicalMechanism:
      'SQL Injection occurs when user-supplied input is directly concatenated into a dynamic SQL query string without sanitization or parameterization. In this challenge, the backend constructs: `SELECT * FROM users WHERE username = \'<INPUT>\' AND password = \'<PASS>\'`. Supplying the tautology payload `\' OR 1=1 --` evaluates the WHERE condition as TRUE for all rows, while the `--` comment sequence truncates the remaining password verification check, granting administrative session authorization.',
    samplePayload: `' OR 1=1 --`,
    stages: [
      { step: 1, label: 'Input Probe', iconType: 'probe', description: 'Inject single quote (\') to force SQL syntax error and detect string literal boundaries.' },
      { step: 2, label: 'Boolean Tautology', iconType: 'vector', description: 'Append OR 1=1 -- to force the WHERE clause evaluation to true and neutralize password logic.' },
      { step: 3, label: 'Session Hijack', iconType: 'exfil', description: 'Bypass authentication barrier, gain admin session, and exfiltrate flag token.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Dynamic String Concatenation):
const sql = "SELECT * FROM users WHERE username = '" + req.body.user + "' AND password = '" + req.body.pass + "'";
const user = await db.query(sql);

// ✅ Secure (Parameterized Queries / Prepared Statements):
const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
const user = await db.query(sql, [req.body.user, req.body.pass]);`,
    defensiveKeyTakeaways: [
      'Always separate database code logic from user data using Parameterized Queries (Prepared Statements).',
      'Never concatenate untrusted user input directly into SQL statement strings.',
      'Enforce least-privilege database user permissions for application connection pools.',
    ],
  },

  'ch-info-02': {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Sensitive File Disclosure via Unindexed Web Directories & Backups',
    technicalMechanism:
      'Information Disclosure occurs when web servers expose sensitive configuration files, version control metadata (.git, .env), or backup archives (.bak, .old) in publicly accessible web roots. Search engine crawlers index these endpoints via /robots.txt files or automated scanners. Attackers extract database credentials, API keys, internal routing paths, and secret tokens directly from plain-text backup artifacts.',
    samplePayload: `curl http://127.0.0.1:8888/.git/config
curl http://127.0.0.1:8888/backups/debug_conf_2026.bak`,
    stages: [
      { step: 1, label: 'Crawler Recon', iconType: 'probe', description: 'Request /robots.txt to identify disallowed server paths and hidden administrative folders.' },
      { step: 2, label: 'Dotfile Enumeration', iconType: 'vector', description: 'Probe for exposed version control files (.git/config, .env) and legacy backup archives (.bak).' },
      { step: 3, label: 'Secret Extraction', iconType: 'exfil', description: 'Download raw server configuration dumps and extract hardcoded flag credentials.' },
    ],
    mitigationCode: `# ❌ Vulnerable Nginx Server Config (Exposes dotfiles and backups):
location / {
    try_files $uri $uri/ =404;
}

# ✅ Secure Nginx Config (Blocks hidden files and backup extensions):
location ~ /\\. {
    deny all;
    return 404;
}
location ~* \\.(bak|config|env|log|sql|swp)$ {
    deny all;
    return 404;
}`,
    defensiveKeyTakeaways: [
      'Never store version control directories (.git) or environment files (.env) inside public web document roots.',
      'Configure web server rules (Nginx/Apache) to deny access to all hidden files matching /\\..*',
      'Automate CI/CD artifact cleaning to purge leftover backup files prior to deployment.',
    ],
  },

  'ch-auth-03': {
    cwe: 'CWE-287: Improper Authentication',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    attackVectorName: 'Authentication Logic Bypass via Comment Injections',
    technicalMechanism:
      'Authentication bypass vulnerabilities manifest when identity verification logic depends on flawed database queries or client-controlled parameters. By injecting inline comment syntax (`admin\' --`), the application executes only the username matching query while completely discarding password hash validation. Attackers assume administrative privileges without providing valid credentials.',
    samplePayload: `Username: admin' --
Password: [BLANK]`,
    stages: [
      { step: 1, label: 'Identity Probe', iconType: 'probe', description: 'Identify target administrative account usernames (admin, root, administrator).' },
      { step: 2, label: 'Comment Truncation', iconType: 'vector', description: 'Append SQL comment operators (-- or /*) to strip the password verification subclause.' },
      { step: 3, label: 'Admin Escalation', iconType: 'exfil', description: 'Authenticate as administrator, bypass auth gateway, and retrieve protected flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Combined User/Password Query):
const query = \`SELECT * FROM admins WHERE username = '\${user}' AND password = '\${pass}'\`;

// ✅ Secure (2-Step Authentication with Timing-Safe Bcrypt Hash Verification):
const user = await db.query('SELECT id, password_hash FROM admins WHERE username = ?', [req.body.username]);
if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
  return res.status(401).json({ error: 'Invalid username or password' });
}`,
    defensiveKeyTakeaways: [
      'Enforce strict 2-step authentication: fetch user identity by username, then verify password using bcrypt/Argon2.',
      'Always use timing-safe comparison functions to prevent timing attack side-channels.',
      'Implement multi-factor authentication (MFA) for administrative gateways.',
    ],
  },

  'ch-idor-04': {
    cwe: 'CWE-639: Authorization Bypass Through User-Controlled Key (IDOR)',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Insecure Direct Object Reference (IDOR) & Access Control Failure',
    technicalMechanism:
      'Insecure Direct Object Reference (IDOR) occurs when an application uses client-provided input (such as GET parameters `?id=104` or JSON fields `{"ticketId": 104}`) to directly access database records without verifying if the authenticated session owns that record. Attackers increment or decrement numerical object IDs to inspect private tickets, financial transactions, or user profiles belonging to other accounts.',
    samplePayload: `GET http://127.0.0.1:8888/support?id=100`,
    stages: [
      { step: 1, label: 'Parameter Mapping', iconType: 'probe', description: 'Observe GET/POST request parameters containing sequential database keys (?id=104).' },
      { step: 2, label: 'Key Manipulation', iconType: 'vector', description: 'Iterate or decrement the object identifier (?id=100) to target adjacent user records.' },
      { step: 3, label: 'Unauthorized Read', iconType: 'exfil', description: 'Bypass authorization barrier and read confidential support tickets containing flags.' },
    ],
    mitigationCode: `// ❌ Vulnerable Endpoint (Zero Ownership Verification):
app.get('/api/ticket', async (req, res) => {
  const ticket = await db.get('SELECT * FROM tickets WHERE id = ?', [req.query.id]);
  res.json(ticket);
});

// ✅ Secure Endpoint (Strict Session Ownership & Access Control):
app.get('/api/ticket', async (req, res) => {
  const ticket = await db.get('SELECT * FROM tickets WHERE id = ? AND owner_id = ?', [
    req.query.id,
    req.session.user.id
  ]);
  if (!ticket) return res.status(403).json({ error: 'Access denied' });
  res.json(ticket);
});`,
    defensiveKeyTakeaways: [
      'Never rely on client-supplied object identifiers without server-side permission verification.',
      'Enforce Role-Based Access Control (RBAC) or Object-Level Access Control on every database lookup.',
      'Use cryptographically secure non-sequential UUIDs (v4) to prevent trivial enumeration.',
    ],
  },

  'ch-upload-05': {
    cwe: 'CWE-434: Unrestricted Upload of File with Dangerous Type',
    owasp: 'OWASP A04:2021 – Insecure Design',
    attackVectorName: 'Arbitrary File Upload & Remote Code Execution (RCE)',
    technicalMechanism:
      'Arbitrary File Upload vulnerabilities arise when an application accepts user files (e.g., profile avatars) without verifying file extension, MIME type, or file headers, and stores them in a web-accessible directory with execution permissions. Uploading a PHP script (e.g., `shell.php`) allows the attacker to request the file via HTTP, triggering the web server to execute arbitrary operating system commands as the web daemon user.',
    samplePayload: `Filename: shell.php
Content: <?php system($_GET['cmd']); ?>`,
    stages: [
      { step: 1, label: 'Upload Probe', iconType: 'probe', description: 'Test upload form handling with executable script extensions (.php, .phtml, .exe).' },
      { step: 2, label: 'Web Shell Storage', iconType: 'vector', description: 'Bypass extension checks and place executable payload inside public web storage path.' },
      { step: 3, label: 'Remote Command Exec', iconType: 'exfil', description: 'Request script via HTTP to execute system commands and read flag token.' },
    ],
    mitigationCode: `// ❌ Vulnerable Upload Handler (Preserves Extension in Web Root):
const uploadPath = path.join('/var/www/html/uploads', req.body.filename);
fs.writeFileSync(uploadPath, req.body.fileData);

// ✅ Secure Upload Handler (Extension Whitelist, UUID Renaming, Non-Executable Storage):
const ext = path.extname(req.body.filename).toLowerCase();
const ALLOWED_EXTS = ['.jpg', '.png', '.webp'];
if (!ALLOWED_EXTS.includes(ext)) throw new Error('Disallowed file extension');

const safeName = \`\${crypto.randomUUID()}\${ext}\`;
const securePath = path.join('/var/app/storage/uploads', safeName);
fs.writeFileSync(securePath, req.body.fileData);`,
    defensiveKeyTakeaways: [
      'Store all user uploads outside the public web root in non-executable storage locations.',
      'Re-encode images and validate magic header bytes (e.g., 0xFF 0xD8 0xFF for JPEG).',
      'Rename uploaded files to random UUIDs to prevent directory traversal and direct execution.',
    ],
  },

  'ch-privesc-06': {
    cwe: 'CWE-269: Improper Privilege Management',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Linux Sudo Misconfiguration Privilege Escalation',
    technicalMechanism:
      'Privilege Escalation occurs when a low-privileged account leverages system misconfigurations to gain higher privileges (such as root). In Linux environments, granting `sudo` execution rights without password verification (`NOPASSWD`) to binaries capable of spawning interactive shells (such as `find`, `vim`, `awk`, or `less`) allows attackers to escape binary boundaries and spawn an unrestricted root shell (`find . -exec /bin/sh \\;`).',
    samplePayload: `sudo -l
sudo find . -exec /bin/sh \\;`,
    stages: [
      { step: 1, label: 'Sudo Enumeration', iconType: 'probe', description: 'Run sudo -l to list binaries permitted for execution under elevated privileges.' },
      { step: 2, label: 'GTFOBins Breakout', iconType: 'vector', description: 'Leverage the -exec flag in /usr/bin/find to escape command restrictions.' },
      { step: 3, label: 'Root Shell Access', iconType: 'exfil', description: 'Spawn interactive root shell (#) and retrieve restricted /root/flag.txt.' },
    ],
    mitigationCode: `# ❌ Vulnerable /etc/sudoers (Grants NOPASSWD access to GTFOBins binary):
www-data ALL=(ALL) NOPASSWD: /usr/bin/find

# ✅ Secure /etc/sudoers (Principle of Least Privilege):
# Never grant wildcard or interactive binary sudo permissions to web service accounts.
www-data ALL=(ALL) NOPASSWD: /usr/local/bin/safe_backup_script.sh`,
    defensiveKeyTakeaways: [
      'Audit `/etc/sudoers` configuration files regularly for dangerous `NOPASSWD` entries.',
      'Consult GTFOBins documentation before granting sudo permissions on system utilities.',
      'Enforce strict security boundaries using AppArmor, SELinux, or Linux Namespaces.',
    ],
  },

  'ch-dos-07': {
    cwe: 'CWE-770: Allocation of Resources Without Limits or Throttling',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'Denial of Service (DoS) & Rate Limiting Failure',
    technicalMechanism:
      'Denial of Service (DoS) vulnerabilities happen when application endpoints perform computationally expensive tasks or database queries without rate limiting or request throttling. Unrestricted client traffic consumes CPU cycles, memory pools, and worker threads, rendering the service unavailable to legitimate users. Defense mechanisms employ Token Bucket rate limiting and HTTP 429 Too Many Requests responses.',
    samplePayload: `POST /api/search HTTP/1.1
[Burst 50 requests/sec from single IP]`,
    stages: [
      { step: 1, label: 'Traffic Burst Probe', iconType: 'probe', description: 'Send high-frequency HTTP request bursts against resource-intensive endpoints.' },
      { step: 2, label: 'Resource Exhaustion', iconType: 'vector', description: 'Observe API response delays as thread pools and database connections saturate.' },
      { step: 3, label: 'Circuit Breaker Trip', iconType: 'exfil', description: 'Verify rate limiting enforcement (HTTP 429) and obtain resilience flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable Endpoint (Unlimited Requests Allowed):
app.post('/api/search', async (req, res) => {
  const results = await heavyComplexSearch(req.body.query);
  res.json(results);
});

// ✅ Secure Endpoint (Express Rate Limiter Middleware):
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per window
  message: { error: 'Too many requests, please try again later.' },
  statusCode: 429,
});

app.post('/api/search', apiLimiter, async (req, res) => { ... });`,
    defensiveKeyTakeaways: [
      'Implement global and per-endpoint rate limiting using memory or Redis token buckets.',
      'Offload static assets and initial request filtering to Web Application Firewalls (WAF) or CDNs.',
      'Implement circuit breaker design patterns to gracefully degrade services during high load.',
    ],
  },

  'ch-ssrf-08': {
    cwe: 'CWE-918: Server-Side Request Forgery (SSRF)',
    owasp: 'OWASP A10:2021 – Server-Side Request Forgery (SSRF)',
    attackVectorName: 'Server-Side Request Forgery (SSRF) Cloud Metadata Exfiltration',
    technicalMechanism:
      'Server-Side Request Forgery (SSRF) occurs when a web application accepts a user-supplied URL (e.g., for fetching profile avatars or importing external web data) and makes an HTTP request on behalf of the user without validating the target IP. In cloud hosting environments (AWS, GCP, Azure), querying the link-local metadata address `169.254.169.254` returns internal IAM role credentials, private tokens, and configuration data.',
    samplePayload: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`,
    stages: [
      { step: 1, label: 'Fetch URL Probe', iconType: 'probe', description: 'Identify endpoints that fetch remote content via user-controlled URL parameters.' },
      { step: 2, label: 'Metadata Redirection', iconType: 'vector', description: 'Supply link-local cloud metadata IP (169.254.169.254) or internal loopback IPs.' },
      { step: 3, label: 'IAM Creds Leak', iconType: 'exfil', description: 'Fetch internal cloud security credentials and extract embedded flag token.' },
    ],
    mitigationCode: `// ❌ Vulnerable SSRF Code (Direct HTTP Request):
app.post('/import-avatar', async (req, res) => {
  const response = await fetch(req.body.imageUrl);
  const data = await response.buffer();
  res.send(data);
});

// ✅ Secure SSRF Protection (DNS Resolution & Private IP Whitelisting):
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

app.post('/import-avatar', async (req, res) => {
  const parsed = new URL(req.body.imageUrl);
  const addrs = await dns.resolve(parsed.hostname);
  const ip = ipaddr.parse(addrs[0]);
  
  if (ip.range() !== 'unicast') {
    return res.status(400).json({ error: 'Requests to private IP ranges are strictly forbidden' });
  }
  // Proceed with safe external fetch...
});`,
    defensiveKeyTakeaways: [
      'Never allow application servers to fetch user-supplied URLs without resolving IP and blocking private subnets (127.0.0.0/8, 10.0.0.0/8, 169.254.0.0/16).',
      'Require AWS IMDSv2 (Session Token required) to protect cloud metadata endpoints.',
      'Deploy network-level egress filtering rules restricting outbound server traffic.',
    ],
  },

  'ch-jwt-09': {
    cwe: 'CWE-347: Improper Verification of Cryptographic Signature',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'JSON Web Token (JWT) "alg": "none" Signature Bypass',
    technicalMechanism:
      'JWT Authentication Bypasses occur when JWT verification libraries improperly accept tokens with the algorithm header set to `"alg": "none"`, or fail to enforce signature checking on modified payloads. Attackers decode the Base64 Header and Payload, modify claim values (e.g., changing `"role": "user"` to `"role": "admin"`), set `"alg": "none"`, and submit the token without a signature suffix.',
    samplePayload: `Header:  {"alg": "none", "typ": "JWT"} -> eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0
Payload: {"user": "alex", "role": "admin"} -> eyJ1c2VyIjoiYWxleCIsInJvbGUiOiJhZG1pbiJ9
Token:   eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWxleCIsInJvbGUiOiJhZG1pbiJ9.`,
    stages: [
      { step: 1, label: 'Token Decoding', iconType: 'probe', description: 'Decode JWT session token structure (Header.Payload.Signature) from HTTP headers.' },
      { step: 2, label: 'Alg None Modification', iconType: 'vector', description: 'Set "alg": "none" in Header and change "role": "admin" in Payload claims.' },
      { step: 3, label: 'Unsigned Auth', iconType: 'exfil', description: 'Submit modified token without signature, gain admin session, and unlock vault flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Decodes Token Without Enforcing Signature Algorithms):
const claims = jwt.decode(token); // Ignores signature verification!

// ✅ Secure (Enforces Explicit Algorithm Whitelist & Secret Verification):
const claims = jwt.verify(token, process.env.JWT_SECRET_KEY, {
  algorithms: ['HS256'], // Explicitly whitelist allowed signing algorithms
  issuer: 'ctf-auth-service',
});`,
    defensiveKeyTakeaways: [
      'Explicitly specify allowed cryptographic algorithms (e.g. `algorithms: ["HS256"]`) when verifying JWT tokens.',
      'Reject tokens containing `"alg": "none"` or mismatched symmetric/asymmetric algorithms.',
      'Keep JWT signing secrets long, random, and stored securely in environment secrets managers.',
    ],
  },

  'ch-csrf-10': {
    cwe: 'CWE-352: Cross-Site Request Forgery (CSRF)',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Cross-Site Request Forgery (CSRF) State Manipulation',
    technicalMechanism:
      'Cross-Site Request Forgery (CSRF) occurs when a malicious website causes a user\'s web browser to perform an unwanted action on a trusted site where the user is currently authenticated. Browsers automatically include session cookies with cross-site requests. Without Anti-CSRF tokens or `SameSite=Strict` cookie attributes, state-changing requests (like password changes or fund transfers) execute automatically.',
    samplePayload: `<form action="http://127.0.0.1:8888/api/change-email" method="POST">
  <input type="hidden" name="email" value="attacker@evil.com" />
</form>
<script>document.forms[0].submit();</script>`,
    stages: [
      { step: 1, label: 'Cookie Inspection', iconType: 'probe', description: 'Examine session cookie attributes for missing SameSite and Secure flags.' },
      { step: 2, label: 'Cross-Site Payload', iconType: 'vector', description: 'Host auto-submitting POST form targeting sensitive state-changing endpoints.' },
      { step: 3, label: 'Automatic State Exec', iconType: 'exfil', description: 'Victim browser automatically attaches session cookie, executing state change.' },
    ],
    mitigationCode: `// ❌ Vulnerable Cookie Setup (No Anti-CSRF Token or SameSite Protection):
res.cookie('session_id', sid, { httpOnly: true });

// ✅ Secure Setup (Anti-CSRF Tokens + SameSite=Strict Cookies):
res.cookie('session_id', sid, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // Prevents cross-site cookie transmission
});

// Enforce Synchronizer Anti-CSRF Token Middleware:
app.post('/api/change-email', csrfProtection, (req, res) => { ... });`,
    defensiveKeyTakeaways: [
      'Set `SameSite=Strict` or `SameSite=Lax` on all session cookies.',
      'Implement Anti-CSRF synchronizer tokens for all state-modifying HTTP POST/PUT/DELETE methods.',
      'Verify `Origin` and `Referer` headers on incoming HTTP requests.',
    ],
  },

  'ch-race-11': {
    cwe: 'CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization (\'Race Condition\')',
    owasp: 'OWASP A04:2021 – Insecure Design',
    attackVectorName: 'Time-of-Check to Time-of-Use (TOCTOU) Financial Race Condition',
    technicalMechanism:
      'A Race Condition occurs when multiple concurrent threads or HTTP requests access and modify shared state (such as store balances or single-use promotional vouchers) without atomic transaction locking. When a customer submits simultaneous redemption requests, each thread reads the voucher status as unused before any thread writes `used = true`, allowing the voucher to be redeemed multiple times.',
    samplePayload: `Concurrent burst: 5x POST /api/redeem-voucher
Body: { "code": "SAVE50" } (Within 20ms window)`,
    stages: [
      { step: 1, label: 'Concurrency Probe', iconType: 'probe', description: 'Analyze voucher redemption handler for non-atomic database read-then-write operations.' },
      { step: 2, label: 'Multi-Thread Burst', iconType: 'vector', description: 'Dispatch concurrent HTTP POST requests in parallel before database write commits.' },
      { step: 3, label: 'Double Spend Unlock', iconType: 'exfil', description: 'Exceed balance threshold through duplicated redemptions and extract flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Non-atomic Check-Then-Act):
const v = await db.get("SELECT * FROM vouchers WHERE code = ?", [code]);
if (!v.used) {
  await db.run("UPDATE users SET balance = balance + 50 WHERE id = ?", [userId]);
  await db.run("UPDATE vouchers SET used = 1 WHERE code = ?", [code]);
}

// ✅ Secure (Atomic Conditional Update / Row-Level Lock):
const res = await db.run("UPDATE vouchers SET used = 1 WHERE code = ? AND used = 0", [code]);
if (res.changes === 0) {
  throw new Error("Voucher already redeemed or concurrent request rejected");
}
await db.run("UPDATE users SET balance = balance + 50 WHERE id = ?", [userId]);`,
    defensiveKeyTakeaways: [
      'Use atomic SQL conditional updates (`UPDATE ... WHERE used=0`) to eliminate TOCTOU race windows.',
      'Wrap financial balance updates in ACID database transactions with row-level locks (`SELECT FOR UPDATE`).',
      'Implement distributed mutex locks (e.g. Redis Redlock) for sensitive multi-step workflows.',
    ],
  },

  // ==========================================
  // PICOCTF ARENA: WEB EXPLOITATION
  // ==========================================

  'pico-web-cookies': {
    cwe: 'CWE-565: Reliance on Cookies without Integrity Checking',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    attackVectorName: 'Client-Side Cookie Session Tampering',
    technicalMechanism:
      'Cookie-based authorization flaws occur when an application relies on unencrypted, unsigned client-side cookies (e.g., `name=0`, `name=1`, ...) to track authentication or privilege levels. Because the client has full read and write access to cookie storage in browser Developer Tools, an attacker can modify the numeric value of the `name` cookie to index `18` (representing administrative authority) and reload the page to bypass access controls.',
    samplePayload: `document.cookie = "name=18; path=/";
# or via curl:
curl -b "name=18" http://127.0.0.1:8888/pico/cookies`,
    stages: [
      { step: 1, label: 'Cookie Inspection', iconType: 'probe', description: 'Open DevTools Application/Storage -> Cookies to locate the plaintext "name" parameter.' },
      { step: 2, label: 'Index Manipulation', iconType: 'vector', description: 'Edit the integer value of "name" to privileged target index (name=18).' },
      { step: 3, label: 'Privilege Unlock', iconType: 'exfil', description: 'Refresh browser with modified cookie to trigger admin response and exfiltrate flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Unsigned, client-trusted cookie):
res.cookie('name', req.body.username);

// ✅ Secure (Server-Side Session Store with Signed, HttpOnly Cookie):
import session from 'express-session';
app.use(session({
  name: '__Host-SessionId',
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: 'strict' }
}));`,
    defensiveKeyTakeaways: [
      'Never trust client-side cookie values for authorization or privilege decisions.',
      'Store sensitive user states exclusively in server-side session stores or encrypted JWTs.',
      'Always set `HttpOnly`, `Secure`, and `SameSite=Strict` flags on all session cookies.',
    ],
  },

  'pico-web-insp3ct0r': {
    cwe: 'CWE-615: Inclusion of Sensitive Information in Source Code Comments',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'Client-Side Source Inspection & Comment Disclosure',
    technicalMechanism:
      'Web applications deliver HTML documents, CSS stylesheets, and JavaScript files directly to client browsers for local interpretation. Developers frequently leave sensitive notes, API keys, or flag fragments inside source comments (`<!-- ... -->`, `/* ... */`, `// ...`). Inspecting the page source and associated assets in Developer Tools exposes all client-side disclosures.',
    samplePayload: `Right-Click -> Inspect Element -> Search "picoCTF"
curl http://127.0.0.1:8888/pico/inspector/mycss.css
curl http://127.0.0.1:8888/pico/inspector/myjs.js`,
    stages: [
      { step: 1, label: 'DOM Inspection', iconType: 'probe', description: 'View Page Source to find 1/3 flag fragment hidden inside HTML comments.' },
      { step: 2, label: 'Asset Enumeration', iconType: 'vector', description: 'Inspect linked CSS stylesheet (mycss.css) and script (myjs.js) for remaining 2/3.' },
      { step: 3, label: 'Fragment Assembly', iconType: 'exfil', description: 'Concatenate the three discovered flag substrings into the complete token.' },
    ],
    mitigationCode: `<!-- ❌ Vulnerable (Production Comment with Secret): -->
<!-- Flag Part 1: picoCTF{specs_0n_... -->

<!-- ✅ Secure Implementation (Automated Minification strips comments): -->
<div class="content-header">Inspection Portal</div>`,
    defensiveKeyTakeaways: [
      'Use production bundlers (Vite, Webpack) with automated minification to strip all comments.',
      'Never hardcode secrets, private URLs, or internal notes in client-delivered files.',
      'Implement automated CI/CD static analysis checks to catch sensitive comments.',
    ],
  },

  'pico-web-local-auth': {
    cwe: 'CWE-259: Use of Hard-coded Password in Client-Side Logic',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    attackVectorName: 'Hardcoded Client-Side Credential Validation & Transparency',
    technicalMechanism:
      'Client-side authentication occurs when credential verification logic executes in the user\'s browser rather than on a protected backend server. In this challenge, submitting a login form triggers a local script (`secure.js`) containing the `checkPassword(username, password)` function. Because JavaScript source code is completely transparent, inspecting `secure.js` directly reveals the hardcoded credentials (`admin` / `strongPassword0987`).',
    samplePayload: `// Inspect secure.js in Browser Sources / Network tab:
function checkPassword(username, password) {
  if (username === "admin" && password === "strongPassword0987") {
    return true;
  }
  return false;
}`,
    stages: [
      { step: 1, label: 'Login Trace', iconType: 'probe', description: 'Submit arbitrary credentials and inspect loaded scripts in DevTools Sources tab.' },
      { step: 2, label: 'Function Audit', iconType: 'vector', description: 'Locate secure.js and inspect the checkPassword() credential comparison logic.' },
      { step: 3, label: 'Admin Replay', iconType: 'exfil', description: 'Sign in with extracted credentials (admin / strongPassword0987) to claim flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Client-side validation):
function checkPassword(u, p) { return u === "admin" && p === "secret"; }

// ✅ Secure (Server-side authentication with salted password hashes):
app.post('/api/login', async (req, res) => {
  const user = await db.getUser(req.body.username);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.userId = user.id;
  res.json({ success: true });
});`,
    defensiveKeyTakeaways: [
      'Authentication checks must strictly execute on server-side environments.',
      'Never hardcode passwords or cryptographic verification logic in client scripts.',
      'Always hash passwords using salted cryptographic algorithms like Argon2 or bcrypt.',
    ],
  },

  'pico-web-get-ahead': {
    cwe: 'CWE-650: Trust Mediation Exploit via HTTP Method Manipulation',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'HTTP Method Manipulation (GET aHEAD)',
    technicalMechanism:
      'Web servers and application frameworks often route incoming traffic based on HTTP verbs (`GET`, `POST`, `HEAD`, `OPTIONS`). In this challenge, requesting the page via standard `GET` returns a response stating "NO FLAG HERE". However, inspecting the server handler reveals that the flag is attached exclusively inside the HTTP response headers when requested via the `HEAD` HTTP method.',
    samplePayload: `curl -I http://127.0.0.1:8888/pico/get-ahead
# or: curl -X HEAD -i http://127.0.0.1:8888/pico/get-ahead`,
    stages: [
      { step: 1, label: 'HTTP Method Probe', iconType: 'probe', description: 'Analyze server responses across standard HTTP verbs (GET, POST, HEAD, OPTIONS).' },
      { step: 2, label: 'HEAD Request Dispatch', iconType: 'vector', description: 'Send HTTP HEAD request to fetch response headers without downloading message body.' },
      { step: 3, label: 'Header Exfiltration', iconType: 'exfil', description: 'Extract flag token embedded inside custom Flag response headers.' },
    ],
    mitigationCode: `// ❌ Vulnerable Route Handler (Exposes secrets in HEAD response headers):
app.all('/index.html', (req, res) => {
  if (req.method === 'HEAD') {
    res.setHeader('Flag', 'picoCTF{r3ad_the_h3ad3r_...');
    return res.end();
  }
  res.send('NO FLAG HERE');
});

// ✅ Secure Route Handler (Uniform access control across all HTTP methods):
app.get('/index.html', (req, res) => {
  res.send('Public Page Content');
});`,
    defensiveKeyTakeaways: [
      'Ensure security controls and access filters apply uniformly across all supported HTTP verbs.',
      'Never transmit confidential tokens or flags in HTTP response headers.',
      'Disable unused HTTP methods (e.g. TRACE, TRACK) at the web server level.',
    ],
  },

  'pico-web-forbidden-paths': {
    cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory (\'Path Traversal\')',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Relative Path Traversal Directory Escape',
    technicalMechanism:
      'Path Traversal occurs when an application accepts user input representing a file path without adequate sanitization. The application blocks absolute paths starting with `/`, but fails to sanitize relative directory climbing sequences (`../`). Prepending four directory traversal segments (`../../../../flag.txt`) allows an attacker to navigate out of `/usr/share/nginx/html/` to the root filesystem and read `/flag.txt`.',
    samplePayload: `../../../../flag.txt`,
    stages: [
      { step: 1, label: 'Path Filter Probe', iconType: 'probe', description: 'Attempt reading /flag.txt to observe server rejection of leading slash (/).' },
      { step: 2, label: 'Relative Climbing', iconType: 'vector', description: 'Construct relative traversal payload (../../../../flag.txt) to climb out of web root.' },
      { step: 3, label: 'Arbitrary File Exfil', iconType: 'exfil', description: 'Read system root flag.txt file rendered by the file-reading endpoint.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Direct Path Concatenation):
const targetPath = path.join(BASE_DIR, req.body.filename);
const content = fs.readFileSync(targetPath, 'utf8');

// ✅ Secure (Path Canonicalization & Base Directory Verification):
const resolvedPath = path.resolve(BASE_DIR, req.body.filename);
if (!resolvedPath.startsWith(path.resolve(BASE_DIR) + path.sep)) {
  return res.status(403).json({ error: 'Access Denied: Path Traversal Detected' });
}
const content = fs.readFileSync(resolvedPath, 'utf8');`,
    defensiveKeyTakeaways: [
      'Canonicalize paths using `path.resolve()` and verify that the target path remains inside the allowed base directory.',
      'Reject or strip directory traversal sequences (`../`, `..\\`) from user input.',
      'Run web daemons with minimal operating system file read permissions.',
    ],
  },

  'pico-web-cmd-inject': {
    cwe: 'CWE-78: Improper Neutralization of Special Elements used in an OS Command',
    owasp: 'OWASP A03:2021 – Injection',
    attackVectorName: 'Operating System Command Injection via Shell Metacharacters',
    technicalMechanism:
      'OS Command Injection occurs when an application executes system shell commands (`exec`, `system`) and concatenates unsanitized user input into the command string. In network ping utilities, passing command separators like `;`, `&&`, or `|` terminates the legitimate `ping` binary and executes secondary attacker-supplied commands (`cat flag.txt`) with the web server\'s operating system permissions.',
    samplePayload: `127.0.0.1; cat flag.txt
# or: 127.0.0.1 && cat /flag.txt`,
    stages: [
      { step: 1, label: 'Separator Probe', iconType: 'probe', description: 'Test command delimiters (; , &&, |) in the IP address input field.' },
      { step: 2, label: 'Command Chaining', iconType: 'vector', description: 'Chain arbitrary shell utility (127.0.0.1; cat flag.txt) after ping target.' },
      { step: 3, label: 'Output Exfiltration', iconType: 'exfil', description: 'Read command execution stdout rendered in the web page response.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Direct Shell Interpolation):
exec("ping -c 1 " + req.body.ip, (err, stdout) => { res.send(stdout); });

// ✅ Secure (Parameterized Execution without Shell Wrapper):
import { execFile } from 'child_process';
execFile('/bin/ping', ['-c', '1', req.body.ip], (err, stdout) => {
  res.send(stdout);
});`,
    defensiveKeyTakeaways: [
      'Never execute shell commands through shell wrappers (`sh -c` or `cmd.exe /c`) with raw user input.',
      'Use parameter array execution functions (`execFile`) that bypass shell command parsing entirely.',
      'Apply strict input regex validation (e.g., restricting IP inputs strictly to valid IPv4 patterns).',
    ],
  },

  'pico-web-xss-eval': {
    cwe: 'CWE-79: Improper Neutralization of Input During Web Page Generation (\'Cross-site Scripting\')',
    owasp: 'OWASP A03:2021 – Injection',
    attackVectorName: 'Stored Cross-Site Scripting (XSS) Cookie / DOM Exfiltration',
    technicalMechanism:
      'Cross-Site Scripting (XSS) occurs when untrusted user input is stored in a database and rendered into HTML pages without contextual output encoding or sanitization. Attackers submit JavaScript payloads (`<script>alert(document.cookie)</script>` or `<img src=x onerror="...">`) which execute inside the browser sessions of visiting administrators, allowing session hijacking or credential theft.',
    samplePayload: `<script>alert(document.cookie)</script>
# or: <img src=x onerror="alert('XSS:' + document.cookie)">`,
    stages: [
      { step: 1, label: 'HTML Injection Probe', iconType: 'probe', description: 'Submit HTML tags (<b>bold</b>, <u>underline</u>) to verify unescaped reflection.' },
      { step: 2, label: 'Script Execution', iconType: 'vector', description: 'Inject executable JavaScript tag (<script>alert(1)</script>) into message board.' },
      { step: 3, label: 'Admin Exfiltration', iconType: 'exfil', description: 'Simulate administrator visit to trigger payload execution and receive flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Unescaped innerHTML insertion):
element.innerHTML = userComment;

// ✅ Secure (Context-Aware Output Encoding & DOMPurify):
import DOMPurify from 'dompurify';
element.textContent = userComment; // Safe text rendering
// Or when HTML is required:
element.innerHTML = DOMPurify.sanitize(userComment);`,
    defensiveKeyTakeaways: [
      'Always encode output before rendering untrusted data in HTML body, attribute, or JavaScript contexts.',
      'Deploy strict Content Security Policy (CSP) headers that disable inline script execution (`unsafe-inline`).',
      'Set `HttpOnly` on session cookies to prevent theft via JavaScript `document.cookie`.',
    ],
  },

  'pico-web-sqli-search': {
    cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
    owasp: 'OWASP A03:2021 – Injection',
    attackVectorName: 'SQL Injection UNION-Based Database Enumeration',
    technicalMechanism:
      'UNION-based SQL Injection allows attackers to append results from an attacker-controlled query to the results of the original query executed by the web application. By injecting `\' UNION SELECT 1, flag, 3 FROM secret_vault --`, the application combines the standard product search catalog results with secret records from the `secret_vault` table, displaying the flag directly in the search results table.',
    samplePayload: `' UNION SELECT 1, flag, 3 FROM secret_vault --`,
    stages: [
      { step: 1, label: 'Column Count Probe', iconType: 'probe', description: 'Use ORDER BY clauses (\' ORDER BY 1 --, \' ORDER BY 3 --) to determine result column count.' },
      { step: 2, label: 'UNION Combination', iconType: 'vector', description: 'Inject UNION SELECT with matching column types to read from hidden tables.' },
      { step: 3, label: 'Data Exfiltration', iconType: 'exfil', description: 'Extract flag string displayed within the rendered search results interface.' },
    ],
    mitigationCode: `// ❌ Vulnerable (String concatenation in LIKE query):
const query = "SELECT id, name, price FROM items WHERE name LIKE '%" + search + "%'";
const results = await db.query(query);

// ✅ Secure (Parameterized Prepared Statement):
const query = "SELECT id, name, price FROM items WHERE name LIKE ?";
const results = await db.query(query, ['%' + search + '%']);`,
    defensiveKeyTakeaways: [
      'Use parameterized queries for all database interactions including `LIKE` search filters.',
      'Enforce least privilege on database accounts to restrict access to sensitive audit tables.',
      'Avoid exposing raw database error messages to end-users.',
    ],
  },

  // ==========================================
  // PICOCTF ARENA: CRYPTOGRAPHY
  // ==========================================

  'pico-crypto-mod26': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'ROT13 Monoalphabetic Substitution Cipher Analysis',
    technicalMechanism:
      'ROT13 (Rotate by 13 places) is a monoalphabetic substitution cipher that replaces a letter with the 13th letter after it in the alphabet. Because the Latin alphabet contains 26 letters, applying ROT13 twice reverses the encryption (`ROT13(ROT13(x)) = x`). ROT13 provides zero cryptographic confidentiality and is easily inverted.',
    samplePayload: `echo "cvpbPGS{...}" | tr 'A-Za-z' 'N-ZA-Mn-za-m'`,
    stages: [
      { step: 1, label: 'Ciphertext Inspection', iconType: 'probe', description: 'Identify monoalphabetic ROT13 ciphertext structure (cvpbPGS{...).' },
      { step: 2, label: 'Alphabet Rotation', iconType: 'vector', description: 'Rotate ASCII character codes by 13 positions using tr or Python script.' },
      { step: 3, label: 'Plaintext Recovery', iconType: 'exfil', description: 'Decipher text to reveal original picoCTF{...} flag string.' },
    ],
    mitigationCode: `# Python ROT13 Decryption:
import codecs
decrypted_flag = codecs.decode(ciphertext, 'rot_13')

# Secure Replacement:
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
aesgcm = AESGCM(key)
ct = aesgcm.encrypt(nonce, plaintext, None)`,
    defensiveKeyTakeaways: [
      'ROT13 and Caesar ciphers are weak substitution schemes suitable only for basic obfuscation.',
      'Never rely on custom or historic ciphers for confidential data security.',
      'Use standard authenticated encryption algorithms like AES-256-GCM.',
    ],
  },

  'pico-crypto-the-numbers': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'A1Z26 Alphabetical Index Substitution Cipher',
    technicalMechanism:
      'The A1Z26 cipher maps each letter of the alphabet to its 1-based sequential index ($1 = A, 2 = B, \\dots, 26 = Z$). Non-numerical characters like curly braces `{}` and spaces serve as delimiters. Translating each number back to its ASCII letter representation (`chr(num + 64)`) decrypts the secret without needing a private key.',
    samplePayload: `numbers = [20, 8, 5, 14, 21, 13, 2, 5, 18, 19, 13, 1, 19, 15, 14]
flag = "".join(chr(n + 64) for n in numbers) # THENUMBERSMASON`,
    stages: [
      { step: 1, label: 'Number Stream Mapping', iconType: 'probe', description: 'Analyze numerical sequence (16 9 3 15 3 20 6) matching known flag prefix (PICOCTF).' },
      { step: 2, label: 'A1Z26 Inversion', iconType: 'vector', description: 'Map numbers 1-26 to alphabet letters A-Z using modular arithmetic.' },
      { step: 3, label: 'Flag Reconstruction', iconType: 'exfil', description: 'Reconstruct decrypted string and wrap into picoCTF{...} format.' },
    ],
    mitigationCode: `# Python A1Z26 Decoder:
numbers = [16, 9, 3, 15, 3, 20, 6]
flag = "".join([chr(n + 64) for n in numbers]) # PICOCTF`,
    defensiveKeyTakeaways: [
      'Positional index substitution provides zero mathematical secrecy.',
      'Always differentiate between encoding (A1Z26, Base64) and authenticated encryption.',
      'Modern cryptographic systems require large key entropy (at least 128 bits).',
    ],
  },

  'pico-crypto-caesar': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Caesar Cipher Frequency & Key Shift Decryption',
    technicalMechanism:
      'The Caesar Cipher is a classic substitution cipher where each letter in the plaintext is shifted by a fixed key value $k$ ($0 \\le k \\le 25$). With only 26 possible keys, attackers perform a brute-force search across all key shifts or perform letter frequency analysis to instantly decrypt the ciphertext.',
    samplePayload: `python3 -c '
ct = "wpjvJTM{..."
for k in range(26):
    print(k, "".join([chr((ord(c)-97-k)%26+97) if c.islower() else c for c in ct]))
'`,
    stages: [
      { step: 1, label: 'Key Search Setup', iconType: 'probe', description: 'Prepare brute-force decryption script testing key shifts k=0 through 25.' },
      { step: 2, label: 'Modular Shift', iconType: 'vector', description: 'Compute inverse shift (c - k) mod 26 for all alphabetic characters.' },
      { step: 3, label: 'Flag Identification', iconType: 'exfil', description: 'Locate readable plaintext output containing picoCTF format flag.' },
    ],
    mitigationCode: `# Python Caesar Cipher Decryption Routine:
def decrypt_caesar(ciphertext, key):
    result = []
    for char in ciphertext:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result.append(chr((ord(char) - base - key) % 26 + base))
        else:
            result.append(char)
    return "".join(result)`,
    defensiveKeyTakeaways: [
      'Small key spaces ($26$ keys) invite effortless brute-force attacks.',
      'Modern encryption requires key lengths of at least 128 or 256 bits ($2^{256}$ keyspace).',
      'Always use well-audited cryptographic libraries.',
    ],
  },

  'pico-crypto-vigenere': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Polyalphabetic Vigenère Cipher Decryption',
    technicalMechanism:
      'The Vigenère Cipher uses a repeating keyword to shift each letter of the plaintext according to a polyalphabetic substitution table. While stronger than monoalphabetic ciphers, knowing the key or determining the key length using Kasiski examination allows an attacker to subtract the keyword shifts modulo 26 and recover the original plaintext message.',
    samplePayload: `# Decrypt with key "CYBER":
key = "CYBER"
decrypted = "".join(chr((ord(c) - ord('a') - (ord(key[i % len(key)].lower()) - ord('a'))) % 26 + ord('a')) for i, c in enumerate(ct))`,
    stages: [
      { step: 1, label: 'Key Scheduling', iconType: 'probe', description: 'Repeat keyword "CYBER" across the length of the ciphertext.' },
      { step: 2, label: 'Polyalphabetic Shift', iconType: 'vector', description: 'Subtract key letter shift values modulo 26 for each character position.' },
      { step: 3, label: 'Plaintext Exfiltration', iconType: 'exfil', description: 'Read decoded message containing picoCTF flag.' },
    ],
    mitigationCode: `# Python Vigenère Decryption:
def decrypt_vigenere(ct, key):
    res = []
    k_idx = 0
    for c in ct:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            k_shift = ord(key[k_idx % len(key)].lower()) - ord('a')
            res.append(chr((ord(c) - base - k_shift) % 26 + base))
            k_idx += 1
        else:
            res.append(c)
    return "".join(res)`,
    defensiveKeyTakeaways: [
      'Repeating polyalphabetic keys introduce periodic statistical patterns vulnerable to cryptanalysis.',
      'Use stream ciphers (ChaCha20) with cryptographically secure random pseudo-random number generators.',
      'Never reuse nonces or keys across multiple encrypted sessions.',
    ],
  },

  'pico-crypto-rsa-easy': {
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'RSA Small Public Exponent Attack (e = 3)',
    technicalMechanism:
      'RSA Encryption computes ciphertext as $c \\equiv m^e \\pmod N$. When a small public exponent $e = 3$ is used without proper PKCS#1 v1.5 or OAEP padding, and the plaintext message $m$ is small ($m^3 < N$), the modulus $N$ never wraps around ($c = m^3$). Attackers compute the integer cube root of the ciphertext directly to recover the secret plaintext without factoring $N$.',
    samplePayload: `import gmpy2
m, exact = gmpy2.iroot(c, 3)
print(bytes.fromhex(hex(m)[2:]).decode())`,
    stages: [
      { step: 1, label: 'Exponent Analysis', iconType: 'probe', description: 'Inspect RSA public parameters and detect small public exponent e = 3.' },
      { step: 2, label: 'Cube Root Extraction', iconType: 'vector', description: 'Verify m^3 < N condition and compute exact integer cube root of ciphertext c.' },
      { step: 3, label: 'Plaintext Exfiltration', iconType: 'exfil', description: 'Convert big integer result back to ASCII bytes to reveal flag.' },
    ],
    mitigationCode: `# ✅ Secure RSA Encryption (Use e=65537 and OAEP Padding):
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA

key = RSA.generate(2048, e=65537) # Standard secure public exponent
cipher = PKCS1_OAEP.new(key)
ciphertext = cipher.encrypt(b"picoCTF{secure_rsa_oaep}")`,
    defensiveKeyTakeaways: [
      'Always use standard public exponent $e = 65537$ ($2^{16}+1$) for RSA.',
      'Never encrypt raw messages without OAEP or PKCS#1 v1.5 padding.',
      'Use 2048-bit or 4096-bit key sizes to prevent factorization attacks.',
    ],
  },

  'pico-crypto-xor': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Single-Byte XOR Key Brute-Force (0x00 - 0xFF)',
    technicalMechanism:
      'Single-byte XOR encryption applies a bitwise XOR operation ($C_i = P_i \\oplus K$) across each byte using a single 8-bit key. Because there are only 256 possible byte values ($0 \\le K \\le 255$), testing all 256 keys and filtering outputs for English words or known flag prefixes (`picoCTF{`) decrypts the ciphertext in milliseconds.',
    samplePayload: `for k in range(256):
    res = bytes([b ^ k for b in ciphertext])
    if b"picoCTF" in res:
        print(f"Key: {hex(k)} -> {res.decode()}")`,
    stages: [
      { step: 1, label: 'Keyspace Setup', iconType: 'probe', description: 'Prepare automated loop testing keys 0 through 255.' },
      { step: 2, label: 'Bitwise Inversion', iconType: 'vector', description: 'Compute byte ^ key across raw ciphertext buffer.' },
      { step: 3, label: 'Header Matching', iconType: 'exfil', description: 'Detect decrypted string matching "picoCTF{" and extract flag.' },
    ],
    mitigationCode: `# Python Single Byte XOR Solver:
def crack_single_xor(data):
    for k in range(256):
        attempt = bytes([b ^ k for b in data])
        if b"picoCTF" in attempt:
            return k, attempt
    return None, None`,
    defensiveKeyTakeaways: [
      'Single-byte XOR provides zero mathematical security and is considered basic obfuscation.',
      'Never reuse fixed XOR keys across multiple data streams.',
      'Use authenticated encryption like AES-GCM or ChaCha20-Poly1305.',
    ],
  },

  // ==========================================
  // PICOCTF ARENA: FORENSICS
  // ==========================================

  'pico-forensics-information': {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Digital Image EXIF Metadata Extraction',
    technicalMechanism:
      'Digital media files (JPEG, PNG, WAV) contain metadata headers defined by EXIF (Exchangeable Image File Format) standards. Metadata includes camera parameters, GPS coordinates, timestamps, and custom text fields like `Artist` or `Comment`. Sensitive tokens stored in EXIF metadata remain hidden from standard image viewers but are easily extracted using command-line metadata tools.',
    samplePayload: `exiftool cat.jpg | grep -i Artist
# Decode extracted Base64:
echo "cGljb0NURnt0aDNfbTN0YWRhdGFfMXNfbW9kaWZpZWRfYzFlMmE0OTJ9" | base64 -d`,
    stages: [
      { step: 1, label: 'File Header Inspection', iconType: 'probe', description: 'Identify image file format and locate APP1 EXIF marker tags (0xFFE1).' },
      { step: 2, label: 'Metadata Parsing', iconType: 'vector', description: 'Use exiftool or strings to parse EXIF tags (Artist, Copyright, Comments).' },
      { step: 3, label: 'Base64 Decoding', iconType: 'exfil', description: 'Decode extracted Base64 string value to reveal hidden flag token.' },
    ],
    mitigationCode: `# Command to strip all EXIF metadata before publishing images:
exiftool -all= public_image.jpg`,
    defensiveKeyTakeaways: [
      'Strip EXIF metadata from user-uploaded or public media files using tools like ImageMagick or ExifTool.',
      'EXIF data can inadvertently expose photographer GPS location and internal username details.',
      'Include automated metadata stripping in web application media processing pipelines.',
    ],
  },

  'pico-forensics-matryoshka': {
    cwe: 'CWE-436: Interpretation Conflict / Steganography',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'Nested Archive File Carving & Binwalk Extraction',
    technicalMechanism:
      'Steganography and file carving techniques uncover hidden archives embedded inside legitimate files. When zip archives are appended to JPEG images after the end-of-image marker (`FF D9`), image viewers ignore the extra bytes while archive utilities can read them. Recursively carving embedded zip files (`binwalk -e`) reveals deeper nested layers until `flag.txt` is discovered.',
    samplePayload: `binwalk -e dolls.jpg
cd _dolls.jpg.extracted
binwalk -e 2_c.jpg && binwalk -e 3_c.jpg && cat 4_c.jpg.extracted/flag.txt`,
    stages: [
      { step: 1, label: 'Signature Scanning', iconType: 'probe', description: 'Scan image with binwalk to identify appended Zip file signatures (PK\\x03\\x04).' },
      { step: 2, label: 'Recursive Carving', iconType: 'vector', description: 'Extract nested archives through multiple image layers (dolls -> 2_c -> 3_c -> 4_c).' },
      { step: 3, label: 'Payload Recovery', iconType: 'exfil', description: 'Extract final compressed archive containing plaintext flag.txt file.' },
    ],
    mitigationCode: `# Python script to verify image byte boundaries:
def sanitize_image(image_path):
    with open(image_path, 'rb') as f:
        data = f.read()
    # Find JPEG EOF marker (FF D9)
    eof = data.find(b'\\xff\\xd9')
    if eof != -1 and len(data) > eof + 2:
        print("Warning: Trailing embedded data detected and truncated")
        return data[:eof+2]
    return data`,
    defensiveKeyTakeaways: [
      'Validate file length against format specifications to detect appended payloads.',
      'Re-encode uploaded images on the server to strip hidden steganographic data.',
      'Inspect network egress traffic for anomalous binary file sizes.',
    ],
  },

  'pico-forensics-wireshark': {
    cwe: 'CWE-319: Cleartext Transmission of Sensitive Information',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Network Packet Capture (PCAP) Sniffing & Stream Reassembly',
    technicalMechanism:
      'Packet Capture (PCAP) files record raw network interface traffic. When applications transmit HTTP requests, FTP credentials, or DNS queries in plain text over unencrypted networks (HTTP vs HTTPS), network analysts use Wireshark or tshark to inspect frame headers, follow TCP streams, and reconstruct transmitted payloads.',
    samplePayload: `tshark -r capture.pcap -Y "http.request.method == POST" -T fields -e text
# or open in Wireshark: Right-click packet -> Follow -> TCP Stream`,
    stages: [
      { step: 1, label: 'PCAP Dissection', iconType: 'probe', description: 'Open network capture in Wireshark/tshark and apply HTTP display filters.' },
      { step: 2, label: 'TCP Stream Reassembly', iconType: 'vector', description: 'Reconstruct full TCP stream conversation between client and server.' },
      { step: 3, label: 'Plaintext Extraction', iconType: 'exfil', description: 'Locate HTTP POST body parameters and extract unencrypted flag token.' },
    ],
    mitigationCode: `# ✅ Require TLS/HTTPS Everywhere (Nginx HSTS & SSL Config):
server {
    listen 443 ssl http2;
    server_name meridian.local;
    ssl_certificate /etc/ssl/certs/meridian.crt;
    ssl_certificate_key /etc/ssl/private/meridian.key;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}`,
    defensiveKeyTakeaways: [
      'Encrypt all network traffic using TLS 1.3 to prevent passive packet sniffing.',
      'Enforce HTTP Strict Transport Security (HSTS) to prevent SSL stripping attacks.',
      'Never send authentication credentials over unencrypted HTTP or FTP protocols.',
    ],
  },

  'pico-forensics-file-types': {
    cwe: 'CWE-228: Improper Handling of Syntactically Invalid Structure',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'File Format Header Repair & PNG Magic Byte Reconstruction',
    technicalMechanism:
      'Operating systems and file viewers identify file types using "Magic Bytes"—fixed byte sequences at the beginning of a file. PNG files require the 8-byte header `89 50 4E 47 0D 0A 1A 0A`. If magic bytes are corrupted (e.g., replaced with `00 00 00 00`), image viewers report file corruption. Editing raw hex bytes in a hex editor restores the header, enabling file rendering and chunk extraction.',
    samplePayload: `hexeditor corrupted.png
# Replace first 4 bytes with: 89 50 4E 47`,
    stages: [
      { step: 1, label: 'Hex Header Inspection', iconType: 'probe', description: 'Inspect raw file bytes in hex editor and detect corrupted 00 00 00 00 signature.' },
      { step: 2, label: 'Magic Byte Patching', iconType: 'vector', description: 'Patch first 4 bytes with standard PNG magic header signature (89 50 4E 47).' },
      { step: 3, label: 'Chunk Extraction', iconType: 'exfil', description: 'Open repaired PNG or inspect tEXt comment metadata chunks to read flag.' },
    ],
    mitigationCode: `# Python script to verify PNG magic header signature:
def validate_png_header(file_path):
    PNG_MAGIC = b'\\x89PNG\\r\\n\\x1a\\n'
    with open(file_path, 'rb') as f:
        header = f.read(8)
    return header == PNG_MAGIC`,
    defensiveKeyTakeaways: [
      'File extensions (.png, .jpg) can be easily faked; always verify file magic bytes server-side.',
      'File repairs are a fundamental aspect of digital forensics and data recovery.',
      'Validate structural integrity of incoming binary streams before processing.',
    ],
  },

  // ==========================================
  // PICOCTF ARENA: REVERSE ENGINEERING
  // ==========================================

  'pico-rev-transformation': {
    cwe: 'CWE-176: Improper Handling of Unicode Encoding',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: '16-bit Bit-Shift Cipher Reversal (Transformation)',
    technicalMechanism:
      'Reverse Engineering challenges require analyzing obfuscation algorithms and constructing inverse transformation routines. This challenge encodes text by packing pairs of 8-bit ASCII characters into single 16-bit Unicode characters using bitwise shift operations: `chr((ord(s[i]) << 8) + ord(s[i + 1]))`. Reversing the process requires shifting bits right by 8 (`chr(ord(c) >> 8)`) and masking lower bytes (`chr(ord(c) & 0xFF)`).',
    samplePayload: `encoded = "灩捯䍔䙻..."
flag = "".join([chr(ord(c) >> 8) + chr(ord(c) & 0xFF) for c in encoded])
print(flag)`,
    stages: [
      { step: 1, label: 'Code Analysis', iconType: 'probe', description: 'Examine Python encoding string transformation algorithm string bit-shifts.' },
      { step: 2, label: 'Bitwise Inversion', iconType: 'vector', description: 'Construct inverse Python script using right shift (>> 8) and bitwise AND (& 0xFF).' },
      { step: 3, label: 'ASCII Recovery', iconType: 'exfil', description: 'Unpack 16-bit Unicode codepoints back into original 8-bit ASCII flag string.' },
    ],
    mitigationCode: `# Encryption Transformation Code:
enc = ''.join([chr((ord(flag[i]) << 8) + ord(flag[i + 1])) for i in range(0, len(flag), 2)])

# Inversion Decryption Script:
dec = ''.join([chr(ord(c) >> 8) + chr(ord(c) & 0xFF) for c in enc])`,
    defensiveKeyTakeaways: [
      'Simple bitwise shifts are obfuscation, not encryption.',
      'Use standard cryptographic primitives (AES-GCM, ChaCha20) instead of custom algorithms.',
      'Reverse engineers can easily disassemble and invert deterministic mathematical operations.',
    ],
  },

  'pico-rev-strings': {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'ELF Binary Static Analysis & Printable String Extraction',
    technicalMechanism:
      'Compiled Linux ELF binaries contain initialized global variables, string constants, and symbol tables inside `.rodata` (Read-Only Data) sections. Running the GNU `strings` utility scans binary files for sequences of printable ASCII characters, extracting hardcoded flag strings without requiring dynamic execution or debugging.',
    samplePayload: `strings mystery_bin | grep picoCTF`,
    stages: [
      { step: 1, label: 'Binary Header Check', iconType: 'probe', description: 'Verify file type using file utility (ELF 64-bit LSB executable).' },
      { step: 2, label: 'Printable String Scan', iconType: 'vector', description: 'Run strings utility to extract ASCII sequences from .rodata section.' },
      { step: 3, label: 'Pattern Filter', iconType: 'exfil', description: 'Filter output with grep picoCTF to locate embedded flag string.' },
    ],
    mitigationCode: `// ❌ Vulnerable C Code (Plaintext String Constant):
const char* flag = "picoCTF{str1ngs_3xtr4ct10n_b1n4ry}";

// ✅ Secure C Code (Dynamic Encrypted Secret Retrieval):
// Store secrets in secure KMS or decrypt at runtime in protected memory.`,
    defensiveKeyTakeaways: [
      'The `strings` command can instantly extract all unencrypted text from compiled C/C++ binaries.',
      'Strip symbol tables from production binaries (`strip --strip-all binary`).',
      'Never embed license keys or administrative passwords directly in binary executables.',
    ],
  },

  'pico-rev-crackme': {
    cwe: 'CWE-540: Inclusion of Sensitive Information in Source Code',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Binary Keygen Algorithm Decompilation & Reverse Verification',
    technicalMechanism:
      'Decompiling key verification logic in protected software reveals the underlying mathematical algorithms used to validate serial numbers. In this crackme, the first four characters must sum to 348 in ASCII (`WWWW` since $87 \\times 4 = 348$), followed by `-2026`. Reversing the validation conditions allows synthesizing valid registration keys without purchasing access.',
    samplePayload: `Input Key: WWWW-2026
# Calculation: ord('W') = 87 -> 87 * 4 = 348; followed by "-2026"`,
    stages: [
      { step: 1, label: 'Decompilation', iconType: 'probe', description: 'Decompile verification routine check_key(input) using Python decompiler or Ghidra.' },
      { step: 2, label: 'Constraint Math', iconType: 'vector', description: 'Solve character constraints: sum(ord(c[0..3])) == 348 and suffix == "-2026".' },
      { step: 3, label: 'Keygen Replay', iconType: 'exfil', description: 'Submit synthesized key (WWWW-2026) to satisfy validation logic and reveal flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Deterministic math check in client binary):
if (sum(key.slice(0, 4)) === 348 && key.endsWith("-2026")) unlock();

// ✅ Secure (Asymmetric Signature Verification):
const isLicensed = crypto.verify('SHA256', licenseBuffer, publicKey, signature);`,
    defensiveKeyTakeaways: [
      'Client-side registration algorithms can always be decompiled and solved by reverse engineers.',
      'Validate licenses online using cryptographically signed public-key certificates.',
      'Never embed hardcoded validation constants in distributed binaries.',
    ],
  },

  // ==========================================
  // PICOCTF ARENA: BINARY EXPLOITATION
  // ==========================================

  'pico-bin-gdb-testdrive': {
    cwe: 'CWE-215: Insertion of Sensitive Information Into Debugging Code',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'Dynamic Binary Debugging & Breakpoint Control (GDB)',
    technicalMechanism:
      'Debuggers like GDB (GNU Debugger) allow security researchers to execute binaries instruction-by-instruction, inspect processor registers, set breakpoints, and modify the instruction pointer (`EIP`/`RIP`). When a binary contains an intentional delay function (`sleep(1000)`), setting a breakpoint at `main+99` and jumping execution directly to `main+104` bypasses the delay and executes the flag printing function.',
    samplePayload: `gdb ./vuln
(gdb) break *(main+99)
(gdb) run
(gdb) jump *(main+104)`,
    stages: [
      { step: 1, label: 'Disassembly Analysis', iconType: 'probe', description: 'Disassemble main function in GDB (disas main) to identify sleep instruction call.' },
      { step: 2, label: 'Breakpoint Hooking', iconType: 'vector', description: 'Set breakpoint at main+99 (break *(main+99)) to pause execution before sleep.' },
      { step: 3, label: 'Control Flow Redirection', iconType: 'exfil', description: 'Redirect execution with jump *(main+104) to skip delay and trigger flag output.' },
    ],
    mitigationCode: `# Compilation hardening flags to hinder debugging and tampering:
gcc -O2 -s -fstack-protector-all -Wl,-z,relro,-z,now vuln.c -o secure_bin`,
    defensiveKeyTakeaways: [
      'Binaries running on client machines can have their execution flow redirected at will via debuggers.',
      'Strip debugging symbols from production binaries (`strip binary`).',
      'Never rely on client-side software delays or binary checks for security.',
    ],
  },

  'pico-bin-buffer-overflow': {
    cwe: 'CWE-120: Buffer Copy without Checking Size of Input (\'Classic Buffer Overflow\')',
    owasp: 'OWASP A06:2021 – Vulnerable and Outdated Components',
    attackVectorName: 'Stack Buffer Overflow (Memory Corruption)',
    technicalMechanism:
      'Buffer Overflow vulnerabilities occur when C/C++ applications use unsafe memory copy functions (`gets()`, `strcpy()`, `sprintf()`) to write user input into fixed-size stack buffers without verifying bounds. Overflowing the allocated buffer overwrites adjacent stack variables, frame pointers, and the saved instruction pointer (`EIP`/`RIP`), enabling attackers to redirect program execution flow.',
    samplePayload: `python3 -c 'print("A" * 64 + "BBBB")' | ./vuln`,
    stages: [
      { step: 1, label: 'Buffer Size Probe', iconType: 'probe', description: 'Send increasing length string payloads (32, 64, 128 bytes) to detect crash threshold.' },
      { step: 2, label: 'Stack Corruption', iconType: 'vector', description: 'Overwrite stack return address pointer (EIP/RIP) with target function offset.' },
      { step: 3, label: 'Control Flow Hijack', iconType: 'exfil', description: 'Redirect execution to print_flag() function and capture output.' },
    ],
    mitigationCode: `// ❌ Vulnerable C Code (Unsafe gets() function):
void get_user_input() {
    char buf[64];
    gets(buf); // Dangerous: No bounds checking!
}

// ✅ Secure C Code (Safe fgets() with bounded length):
void get_user_input() {
    char buf[64];
    if (fgets(buf, sizeof(buf), stdin) != NULL) {
        // Input safely truncated to 63 bytes + null terminator
    }
}`,
    defensiveKeyTakeaways: [
      'Never use unsafe legacy C functions (`gets`, `strcpy`, `strcat`, `sprintf`).',
      'Use bounded string functions (`fgets`, `strncpy`, `snprintf`) or memory-safe languages (Rust, Go).',
      'Enable compiler protections: Stack Canaries (`-fstack-protector-all`), ASLR, and DEP/NX.',
    ],
  },

  'pico-bin-format-string': {
    cwe: 'CWE-134: Use of Externally-Controlled Format String',
    owasp: 'OWASP A03:2021 – Injection',
    attackVectorName: 'Format String Vulnerability (Printf Injection)',
    technicalMechanism:
      'Format String vulnerabilities occur when user input is passed directly as the first argument to `printf(user_input)` rather than as a format specifier `printf("%s", user_input)`. Specifiers like `%x` and `%p` leak stack memory contents, while `%s` dereferences pointers on the stack, allowing attackers to dump flag strings stored in local variables.',
    samplePayload: `Input: %x.%x.%x.%x.%x.%s
# or: %p.%p.%p.%p.%s`,
    stages: [
      { step: 1, label: 'Format Specifier Probe', iconType: 'probe', description: 'Submit string containing format specifiers (%x, %p, %s) to user input prompt.' },
      { step: 2, label: 'Stack Memory Dump', iconType: 'vector', description: 'Observe hex memory address leakage from stack frame frames.' },
      { step: 3, label: 'Flag Pointer Deref', iconType: 'exfil', description: 'Dereference stack pointer containing flag buffer address to print secret string.' },
    ],
    mitigationCode: `// ❌ Vulnerable C Code (User input passed directly as format string):
char buf[128];
fgets(buf, sizeof(buf), stdin);
printf(buf); // Dangerous format string vulnerability!

// ✅ Secure C Code (Static format string specifier):
char buf[128];
fgets(buf, sizeof(buf), stdin);
printf("%s", buf); // Safe: User input treated strictly as string literal`,
    defensiveKeyTakeaways: [
      'Always pass explicit static format specifiers (`"%s"`) to `printf`, `sprintf`, and `syslog`.',
      'Enable compiler format string warnings (`-Wformat -Wformat-security`).',
      'Treat all external input as untrusted data.',
    ],
  },

  // ==========================================
  // COMMUNITY PACKS (Open-Source Modules)
  // ==========================================

  'pico-os-header-inject': {
    cwe: 'CWE-113: Improper Neutralization of CRLF Sequences in HTTP Headers (\'HTTP Response Splitting\')',
    owasp: 'OWASP A03:2021 – Injection',
    attackVectorName: 'CRLF Injection & HTTP Response Splitting',
    technicalMechanism:
      'CRLF Injection occurs when an application embeds unvalidated user input into HTTP response headers without stripping Carriage Return (`\\r` / `%0d`) and Line Feed (`\\n` / `%0a`) characters. Attackers terminate the legitimate header stream and inject arbitrary response headers (e.g., `Set-Cookie: admin=true`) or entire secondary HTML bodies.',
    samplePayload: `%0d%0aSet-Cookie: admin=true`,
    stages: [
      { step: 1, label: 'CRLF Probe', iconType: 'probe', description: 'Inject newline characters (%0d%0a) into HTTP header parameters.' },
      { step: 2, label: 'Header Injection', iconType: 'vector', description: 'Append Set-Cookie: admin=true header to response stream.' },
      { step: 3, label: 'State Escalation', iconType: 'exfil', description: 'Browser registers forged cookie and grants administrative access.' },
    ],
    mitigationCode: `// ❌ Vulnerable: Direct header interpolation
res.setHeader("X-Custom", req.query.val);

// ✅ Secure: Strip CRLF characters
res.setHeader("X-Custom", req.query.val.replace(/[\\r\\n]/g, ""));`,
    defensiveKeyTakeaways: [
      'Strip all carriage returns (`\\r`) and newlines (`\\n`) from values before setting HTTP headers.',
      'Use modern web frameworks that automatically encode or reject multi-line header values.',
      'Never allow untrusted user input to dictate response header structures.',
    ],
  },

  'pico-os-dir-listing': {
    cwe: 'CWE-548: Exposure of Information Through Directory Listing',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Web Server Directory Indexing & Automated Path Crawling',
    technicalMechanism:
      'Directory listing vulnerabilities happen when web servers (such as Nginx with `autoindex on;` or Apache with `Options +Indexes`) automatically generate an HTML directory listing for paths lacking an `index.html` file. Attackers crawl these exposed folders (e.g. `/assets/backups/`) and download internal database dumps, source files, and configuration archives.',
    samplePayload: `GET /assets/backups/ HTTP/1.1
curl http://127.0.0.1:8888/backups/debug_conf_2026.bak`,
    stages: [
      { step: 1, label: 'Directory Crawl', iconType: 'probe', description: 'Request server folders (/assets/, /backups/) without trailing index files.' },
      { step: 2, label: 'File Enumeration', iconType: 'vector', description: 'Observe generated directory listing exposing sensitive configuration archives.' },
      { step: 3, label: 'Secret Extraction', iconType: 'exfil', description: 'Download backup archives and extract embedded credentials and flags.' },
    ],
    mitigationCode: `# ❌ Vulnerable Nginx configuration:
location /assets/backups/ {
    autoindex on;
}

# ✅ Secure Nginx configuration:
location /assets/backups/ {
    autoindex off;
    deny all;
}`,
    defensiveKeyTakeaways: [
      'Ensure directory auto-indexing is disabled across all production web servers (`autoindex off;`).',
      'Store sensitive archives and database backups outside the web document root.',
      'Perform regular automated asset discovery and directory audits.',
    ],
  },

  'pico-os-jwt-sec': {
    cwe: 'CWE-522: Insufficiently Protected Credentials',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    attackVectorName: 'Offline Dictionary Attack on Weak HMAC-SHA256 JWT Secret',
    technicalMechanism:
      'When an application signs JSON Web Tokens using symmetric HMAC-SHA256 (`HS256`) and a weak, low-entropy passphrase (such as `"secret123"`), attackers can perform offline dictionary attacks. Using tools like Hashcat or John the Ripper, the secret key is cracked at millions of guesses per second, allowing the attacker to sign arbitrary administrative tokens.',
    samplePayload: `hashcat -m 16500 jwt_token.txt rockyou.txt
# Once secret "secret123" is found, forge admin role and re-sign with HMAC-SHA256`,
    stages: [
      { step: 1, label: 'Token Interception', iconType: 'probe', description: 'Intercept HS256 JWT token from authorization headers.' },
      { step: 2, label: 'Dictionary Cracking', iconType: 'vector', description: 'Execute dictionary search against token signature to recover HMAC secret.' },
      { step: 3, label: 'Admin Forgery', iconType: 'exfil', description: 'Sign forged payload ({"role": "admin"}) with recovered secret to gain admin access.' },
    ],
    mitigationCode: `// ❌ Vulnerable: Weak dictionary secret
const secret = "secret123";

// ✅ Secure: Cryptographically random 256-bit secret key
import crypto from 'crypto';
const secret = crypto.randomBytes(32).toString('hex');`,
    defensiveKeyTakeaways: [
      'Always use cryptographically secure 256-bit or 512-bit secrets for HMAC signatures.',
      'Store signing keys in secure secret managers (AWS Secrets Manager, HashiCorp Vault).',
      'Consider asymmetric signing (RS256, EdDSA) where only the server holds the private signing key.',
    ],
  },

  'pico-os-double-encoding': {
    cwe: 'CWE-116: Improper Encoding or Escaping of Output',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Multi-Stage Encoding Deconstruction (ROT13 -> Base64 -> Hex)',
    technicalMechanism:
      'Chained encoding schemes apply multiple data serialization layers in sequence (e.g. Plaintext -> Hex -> Base64 -> ROT13). While often mistakenly thought to provide security, each layer is completely deterministic. Reversing the transformation in exact reverse order (ROT13 Decode -> Base64 Decode -> Hex to ASCII) completely recovers the original plaintext.',
    samplePayload: `// CyberChef Recipe:
1. ROT13
2. From Base64
3. From Hex`,
    stages: [
      { step: 1, label: 'Pipeline Analysis', iconType: 'probe', description: 'Analyze encoding transformations and identify character set indicators.' },
      { step: 2, label: 'Reverse Unpacking', iconType: 'vector', description: 'Invert operations in reverse order: ROT13 -> Base64 Decode -> Hex to ASCII.' },
      { step: 3, label: 'Plaintext Recovery', iconType: 'exfil', description: 'Extract recovered flag string from the unpacked binary byte stream.' },
    ],
    mitigationCode: `// ❌ Insecure (Encoding is NOT encryption):
const obfuscated = rot13(btoa(Buffer.from(data).toString('hex')));

// ✅ Secure (Authenticated Encryption):
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);`,
    defensiveKeyTakeaways: [
      'Never confuse encoding with cryptographic encryption; encoding provides zero confidentiality.',
      'Always use standard authenticated encryption (AES-GCM, ChaCha20-Poly1305).',
      'Security through obscurity consistently fails against trivial reverse engineering.',
    ],
  },

  'pico-os-rsa-factordb': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'RSA Modulus Small Prime Factorization (FactorDB / Fermat)',
    technicalMechanism:
      'The security of the RSA cryptosystem relies on the computational difficulty of factoring the composite modulus $N = p \\times q$ into its large constituent primes. When $N$ is generated with insufficiently small primes ($256$ or $512$ bits), attackers factor $N$ using online prime databases (FactorDB) or Fermat\'s factorization method, calculate Euler\'s totient $\\phi(N) = (p-1)(q-1)$, derive the private key $d = e^{-1} \\pmod{\\phi(N)}$, and decrypt the ciphertext.',
    samplePayload: `# Compute private key:
phi = (p - 1) * (q - 1)
d = pow(e, -1, phi)
m = pow(c, d, N)
print(bytes.fromhex(hex(m)[2:]).decode())`,
    stages: [
      { step: 1, label: 'Modulus Factoring', iconType: 'probe', description: 'Submit modulus N to FactorDB or prime factorization solver to find p and q.' },
      { step: 2, label: 'Totient & Key Derivation', iconType: 'vector', description: 'Compute phi = (p-1)*(q-1) and modular inverse private exponent d.' },
      { step: 3, label: 'Message Decryption', iconType: 'exfil', description: 'Decrypt ciphertext using private exponent (m = c^d mod N) to obtain flag.' },
    ],
    mitigationCode: `// ❌ Vulnerable (Weak RSA Key Size):
const key = crypto.generateKeyPairSync('rsa', { modulusLength: 512 });

// ✅ Secure (Minimum 2048-bit or 4096-bit RSA):
const key = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });`,
    defensiveKeyTakeaways: [
      'RSA moduli must be at least 2048 bits (recommended 4096 bits) to resist factorization.',
      'Ensure prime factors $p$ and $q$ are generated using cryptographically secure random number generators.',
      'Transition legacy RSA systems to modern elliptic-curve cryptography (ECDH, Ed25519).',
    ],
  },

  'pico-os-freq-analysis': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Monoalphabetic Substitution Frequency Analysis (ETAOIN)',
    technicalMechanism:
      'Monoalphabetic substitution replaces each character with another character consistently. Because every language exhibits characteristic letter frequencies (in English: E, T, A, O, I, N appear far more frequently than Z, Q, X), counting character occurrences in the ciphertext and mapping the highest-frequency characters to English common letters breaks the cipher without knowing the key.',
    samplePayload: `# Frequency table matching:
Count character occurrences -> Map peak counts to E, T, A, O, I, N`,
    stages: [
      { step: 1, label: 'Frequency Tally', iconType: 'probe', description: 'Generate frequency histogram of all characters appearing in the ciphertext.' },
      { step: 2, label: 'Distribution Mapping', iconType: 'vector', description: 'Align frequency peaks with standard English letter distribution (ETAOIN).' },
      { step: 3, label: 'Plaintext Unlocking', iconType: 'exfil', description: 'Substitute characters iteratively until coherent flag plaintext emerges.' },
    ],
    mitigationCode: `# Decrypt monoalphabetic cipher via mapping table:
translation_table = str.maketrans(cipher_alphabet, english_alphabet)
plaintext = ciphertext.translate(translation_table)`,
    defensiveKeyTakeaways: [
      'Monoalphabetic ciphers preserve the statistical properties of the underlying plaintext language.',
      'Modern ciphers ensure diffusion and confusion, flattening output frequency distributions.',
      'Always use audited symmetric ciphers (AES-256-GCM).',
    ],
  },

  'pico-os-lsb-stego': {
    cwe: 'CWE-436: Interpretation Conflict',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'Least Significant Bit (LSB) RGB Pixel Steganography',
    technicalMechanism:
      'Least Significant Bit (LSB) steganography embeds confidential information into the lowest bit (0th bit) of 8-bit RGB color channels of pixels in an image. Changing the least significant bit changes color values by only 1 part in 256, which is imperceptible to the human eye. Extracting and concatenating the LSBs across pixel coordinates reveals the hidden bitstream and flag.',
    samplePayload: `from PIL import Image
img = Image.open('stego.png')
bits = [pix[c] & 1 for pix in img.getdata() for c in range(3)]
bytes_data = bytes([int("".join(map(str, bits[i:i+8])), 2) for i in range(0, len(bits), 8)])`,
    stages: [
      { step: 1, label: 'Pixel Plane Analysis', iconType: 'probe', description: 'Extract raw RGB pixel values and examine bit distribution across color channels.' },
      { step: 2, label: 'Bitstream Assembly', iconType: 'vector', description: 'Extract the 0th bit from Red, Green, and Blue channels for each pixel.' },
      { step: 3, label: 'Byte Conversion', iconType: 'exfil', description: 'Pack 8-bit sequences into ASCII bytes and search for picoCTF flag header.' },
    ],
    mitigationCode: `# Python function to re-encode and sanitize uploaded images:
from PIL import Image
def sanitize_image(input_path, output_path):
    img = Image.open(input_path)
    # Re-compressing as lossy JPEG or re-saving strips LSB bitstreams
    img.save(output_path, quality=90)`,
    defensiveKeyTakeaways: [
      'Re-encode and compress user-uploaded media files before saving to public storage.',
      'Monitor corporate file transfers for anomalous high-entropy or uncompressed image formats.',
      'Use steganographic detection tools (StegExpose) to identify hidden payloads.',
    ],
  },

  'pico-os-dns-exfil': {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'DNS Tunneling & Subdomain Payload Exfiltration',
    technicalMechanism:
      'DNS Tunneling bypasses perimeter firewalls by encoding confidential files into recursive DNS query subdomains (e.g. `7069636f.data.attacker.com`). Because UDP port 53 is almost universally permitted through corporate firewalls without deep payload inspection, attackers exfiltrate data undetected. Forensic analysts filter packet captures for outbound DNS queries and concatenate subdomain labels to reconstruct the data.',
    samplePayload: `tshark -r capture.pcap -Y "dns.flags.response == 0" -T fields -e dns.qry.name
# Concatenate hex labels and decode:
echo "7069636f4354467b..." | xxd -r -p`,
    stages: [
      { step: 1, label: 'DNS Packet Filtering', iconType: 'probe', description: 'Filter network capture for DNS queries: dns.flags.response == 0.' },
      { step: 2, label: 'Subdomain Extraction', iconType: 'vector', description: 'Identify high-entropy subdomains and extract hexadecimal data labels.' },
      { step: 3, label: 'Data Reassembly', iconType: 'exfil', description: 'Concatenate query chunks and hex-decode byte sequence to obtain flag.' },
    ],
    mitigationCode: `# Defensive DNS Firewall Policy:
# 1. Enforce DNS query logging and inspection.
# 2. Block or alert on subdomains with high Shannon entropy.
# 3. Rate-limit recursive DNS lookups to external non-approved resolvers.`,
    defensiveKeyTakeaways: [
      'Deploy DNS security inspection and sinkholing to monitor high-entropy subdomains.',
      'Restrict outbound UDP/TCP port 53 traffic exclusively to authorized enterprise DNS resolvers.',
      'Detect anomalous DNS query volume from internal hosts using SIEM behavioral analytics.',
    ],
  },

  'pico-os-zip-carve': {
    cwe: 'CWE-228: Improper Handling of Syntactically Invalid Structure',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'ZIP Archive Carving & End of Central Directory (EOCD) Restoration',
    technicalMechanism:
      'ZIP files follow a structured format beginning with Local File Headers (`PK\\x03\\x04`) and ending with an End of Central Directory (EOCD) record marked by `PK\\x05\\x06` (`50 4B 05 06`). When an attacker damages or truncates the EOCD record, standard archive tools report that the zip is corrupt. Repairing the EOCD record signature in a hex editor restores the archive structure, allowing extraction of embedded files.',
    samplePayload: `hexeditor damaged_archive.zip
# Search for central directory header and restore EOCD magic signature: 50 4B 05 06`,
    stages: [
      { step: 1, label: 'ZIP Structure Triage', iconType: 'probe', description: 'Inspect archive in hex editor to verify presence of PK\\x03\\x04 local file records.' },
      { step: 2, label: 'EOCD Restoration', iconType: 'vector', description: 'Locate central directory offset and patch corrupted EOCD signature (50 4B 05 06).' },
      { step: 3, label: 'Archive Decompression', iconType: 'exfil', description: 'Unzip repaired archive to extract hidden flag.txt artifact.' },
    ],
    mitigationCode: `# Python script to verify and repair ZIP EOCD records:
import zipfile
def test_and_repair_zip(zip_path):
    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            return z.namelist()
    except zipfile.BadZipFile:
        print("Archive corrupted: Manual EOCD hex repair required")`,
    defensiveKeyTakeaways: [
      'Verify digital signatures and cryptographic checksums (SHA-256) of archives before extraction.',
      'File carving and binary header repairs are essential skills in digital forensics.',
      'Never execute or extract untrusted archives without isolated sandbox environments.',
    ],
  },

  // ==========================================
  // BACKWARDS-COMPATIBILITY ALIASES
  // ==========================================

  'pico-web-01': {
    cwe: 'CWE-650: Trust Mediation Exploit via HTTP Method Manipulation',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'HTTP Method Manipulation (GET aHEAD)',
    technicalMechanism:
      'Web servers and application frameworks often route incoming traffic based on HTTP verbs (`GET`, `POST`, `HEAD`, `OPTIONS`). In this challenge, requesting the page via standard `GET` returns a response stating "NO FLAG HERE". However, inspecting the server handler reveals that the flag is attached exclusively inside the HTTP response headers when requested via the `HEAD` HTTP method.',
    samplePayload: `curl -I http://127.0.0.1:8888/pico/get-ahead`,
    stages: [
      { step: 1, label: 'HTTP Method Probe', iconType: 'probe', description: 'Analyze server responses across standard HTTP verbs (GET, POST, HEAD, OPTIONS).' },
      { step: 2, label: 'HEAD Request Dispatch', iconType: 'vector', description: 'Send HTTP HEAD request to fetch response headers without downloading message body.' },
      { step: 3, label: 'Header Exfiltration', iconType: 'exfil', description: 'Extract flag token embedded inside custom Flag response headers.' },
    ],
    mitigationCode: `// Secure Route Handler:
app.get('/index.html', (req, res) => { res.send('Public Page Content'); });`,
    defensiveKeyTakeaways: [
      'Ensure security controls apply uniformly across all HTTP methods.',
      'Never transmit confidential tokens in HTTP response headers.',
      'Disable unused HTTP methods at the web server level.',
    ],
  },

  'pico-web-02': {
    cwe: 'CWE-565: Reliance on Cookies without Integrity Checking',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    attackVectorName: 'Client-Side Cookie Session Tampering',
    technicalMechanism:
      'Cookie-based authentication flaws occur when an application stores authorization claims or user levels in plaintext client-accessible cookies (e.g., `name=-1` or `admin=false`) without cryptographic signature or encryption. Attackers edit cookie values directly in browser Developer Tools to manipulate session state and bypass authorization barriers.',
    samplePayload: `document.cookie = "name=18; path=/";`,
    stages: [
      { step: 1, label: 'Cookie Inspection', iconType: 'probe', description: 'Inspect Application Storage -> Cookies to discover plain cookie variables (name=0).' },
      { step: 2, label: 'Value Manipulation', iconType: 'vector', description: 'Modify cookie integer value to target administrative session index (name=18).' },
      { step: 3, label: 'Privilege Unlock', iconType: 'exfil', description: 'Refresh browser with modified cookie and retrieve administrative flag response.' },
    ],
    mitigationCode: `// Secure session store with signed cookies:
app.use(session({ secret: process.env.SESSION_SECRET, cookie: { httpOnly: true, secure: true } }));`,
    defensiveKeyTakeaways: [
      'Never trust client-side cookie values for authorization decisions.',
      'Use server-side session stores with HTTP-only, signed identifiers.',
      'Set HttpOnly flag on cookies to prevent JavaScript XSS access.',
    ],
  },

  'pico-web-03': {
    cwe: 'CWE-615: Inclusion of Sensitive Information in Source Code Comments',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'Client-Side Source Inspection & Comment Disclosure',
    technicalMechanism:
      'Web applications composed of HTML, CSS, and JavaScript are executed entirely within the client browser. Developers frequently leave sensitive passwords, internal flag fragments, or API endpoints inside HTML comments (`<!-- flag: ... -->`), inline JavaScript variables, or linked stylesheet files (.css). Inspecting Page Source or browser Developer Tools reveals these plain-text disclosures.',
    samplePayload: `curl http://127.0.0.1:8888/pico/inspector/mycss.css`,
    stages: [
      { step: 1, label: 'DOM Inspection', iconType: 'probe', description: 'Open Browser DevTools Elements tab and view page source HTML comments.' },
      { step: 2, label: 'Asset Enumeration', iconType: 'vector', description: 'Inspect associated external stylesheets (.css) and script files (.js).' },
      { step: 3, label: 'Fragment Assembly', iconType: 'exfil', description: 'Concatenate flag fragments discovered across HTML, CSS, and JS files.' },
    ],
    mitigationCode: `<!-- Secure Implementation: Strip comments in production build -->
<div>Welcome to our site</div>`,
    defensiveKeyTakeaways: [
      'Use production minifiers to strip all code comments automatically.',
      'Never place credentials or internal notes in client-side code.',
      'Perform automated static code scanning prior to deployment.',
    ],
  },

  'pico-rev-01': {
    cwe: 'CWE-176: Improper Handling of Unicode Encoding',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: '16-bit Bit-Shift Cipher Reversal (Transformation)',
    technicalMechanism:
      'Encodes text by packing pairs of 8-bit ASCII characters into single 16-bit Unicode characters using bitwise shift operations: `chr((ord(s[i]) << 8) + ord(s[i + 1]))`. Reversing requires shifting bits right by 8 and masking with 0xFF.',
    samplePayload: `''.join([chr(ord(c) >> 8) + chr(ord(c) & 0xFF) for c in enc])`,
    stages: [
      { step: 1, label: 'Code Analysis', iconType: 'probe', description: 'Examine Python encoding string transformation bit-shifts.' },
      { step: 2, label: 'Bitwise Inversion', iconType: 'vector', description: 'Construct inverse script using right shift (>> 8) and bitwise AND (& 0xFF).' },
      { step: 3, label: 'ASCII Recovery', iconType: 'exfil', description: 'Unpack 16-bit Unicode codepoints back into original ASCII flag.' },
    ],
    mitigationCode: `# Decryption Routine:
dec = ''.join([chr(ord(c) >> 8) + chr(ord(c) & 0xFF) for c in enc])`,
    defensiveKeyTakeaways: [
      'Bitwise shifts are obfuscation, not encryption.',
      'Use standard cryptographic primitives.',
      'Deterministic mathematical operations are easily inverted.',
    ],
  },

  'pico-rev-02': {
    cwe: 'CWE-540: Inclusion of Sensitive Information in Source Code',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Java Bytecode Decompilation & Hardcoded Vault Verification',
    technicalMechanism:
      'Compiled Java application binaries (.class) preserve class structures and literal strings. Decompiling Java bytecode reveals the raw `checkPassword()` verification logic, exposing hardcoded string comparison routines directly in plain text.',
    samplePayload: `javap -c VaultDoorTraining.class`,
    stages: [
      { step: 1, label: 'Bytecode Inspection', iconType: 'probe', description: 'Decompile .class Java binary using javap or jadx.' },
      { step: 2, label: 'Logic Extraction', iconType: 'vector', description: 'Locate the checkPassword() method and analyze string comparison.' },
      { step: 3, label: 'Flag Verification', iconType: 'exfil', description: 'Extract plain-text flag string directly from decompiled source code.' },
    ],
    mitigationCode: `// Salted Hashing & Secret Key Vault:
String inputHash = hashFunction(input, salt);`,
    defensiveKeyTakeaways: [
      'Compiled binaries can be decompiled back to near-original source code.',
      'Never hardcode secret keys or passwords in source code.',
      'Rely on server-side validation for critical security checks.',
    ],
  },

  'pico-rev-03': {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'ELF Binary Static Analysis & Printable String Extraction',
    technicalMechanism:
      'Compiled Linux ELF binaries contain initialized string constants inside `.rodata`. Running GNU `strings` extracts all continuous sequences of printable ASCII characters, extracting hardcoded flag strings without execution.',
    samplePayload: `strings mystery_bin | grep picoCTF`,
    stages: [
      { step: 1, label: 'Binary Header Check', iconType: 'probe', description: 'Verify file type using file utility.' },
      { step: 2, label: 'Printable String Scan', iconType: 'vector', description: 'Run strings utility to extract ASCII sequences from .rodata section.' },
      { step: 3, label: 'Pattern Filter', iconType: 'exfil', description: 'Filter output with grep picoCTF to locate embedded flag string.' },
    ],
    mitigationCode: `// Strip binary symbols:
strip --strip-all binary`,
    defensiveKeyTakeaways: [
      'The strings command can instantly extract unencrypted text from compiled binaries.',
      'Strip symbol tables from production binaries.',
      'Never embed secrets directly in binary executables.',
    ],
  },

  'pico-forensics-01': {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    attackVectorName: 'Digital Image EXIF Metadata Extraction',
    technicalMechanism:
      'Digital media files contain EXIF metadata tags like Artist or Comment. Sensitive tokens stored in EXIF metadata remain hidden from standard image viewers but are easily extracted using command-line metadata tools.',
    samplePayload: `exiftool cat.jpg | grep -i Artist`,
    stages: [
      { step: 1, label: 'File Header Inspection', iconType: 'probe', description: 'Locate APP1 EXIF marker tags.' },
      { step: 2, label: 'Metadata Parsing', iconType: 'vector', description: 'Parse EXIF tags using exiftool.' },
      { step: 3, label: 'Base64 Decoding', iconType: 'exfil', description: 'Decode extracted Base64 string value.' },
    ],
    mitigationCode: `exiftool -all= public_image.jpg`,
    defensiveKeyTakeaways: [
      'Strip EXIF metadata from user-uploaded files.',
      'EXIF data can inadvertently expose GPS locations and usernames.',
      'Include automated metadata stripping in media pipelines.',
    ],
  },

  'pico-forensics-02': {
    cwe: 'CWE-319: Cleartext Transmission of Sensitive Information',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Network Packet Capture (PCAP) Sniffing & Stream Reassembly',
    technicalMechanism:
      'Packet Capture files record raw network traffic. When applications transmit credentials in plain text over unencrypted networks, analysts use Wireshark to follow TCP streams and reconstruct payloads.',
    samplePayload: `tshark -r capture.pcap -Y "http.request.method == POST"`,
    stages: [
      { step: 1, label: 'PCAP Dissection', iconType: 'probe', description: 'Open network capture and apply HTTP display filters.' },
      { step: 2, label: 'TCP Stream Reassembly', iconType: 'vector', description: 'Reconstruct full TCP stream conversation.' },
      { step: 3, label: 'Plaintext Extraction', iconType: 'exfil', description: 'Locate HTTP POST body and extract unencrypted flag.' },
    ],
    mitigationCode: `ssl_certificate /etc/ssl/certs/meridian.crt;`,
    defensiveKeyTakeaways: [
      'Encrypt all network traffic using TLS 1.3.',
      'Enforce HTTP Strict Transport Security (HSTS).',
      'Never send authentication credentials over unencrypted protocols.',
    ],
  },

  'pico-forensics-03': {
    cwe: 'CWE-228: Improper Handling of Syntactically Invalid Structure',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    attackVectorName: 'File Format Header Repair & PNG Magic Byte Reconstruction',
    technicalMechanism:
      'PNG files require the 8-byte header `89 50 4E 47 0D 0A 1A 0A`. If magic bytes are corrupted, editing raw hex bytes in a hex editor restores the header, enabling file rendering.',
    samplePayload: `hexeditor corrupted.png # Patch first 4 bytes with: 89 50 4E 47`,
    stages: [
      { step: 1, label: 'Hex Header Inspection', iconType: 'probe', description: 'Inspect raw file bytes in hex editor.' },
      { step: 2, label: 'Magic Byte Patching', iconType: 'vector', description: 'Patch first 4 bytes with standard PNG magic header (89 50 4E 47).' },
      { step: 3, label: 'Chunk Extraction', iconType: 'exfil', description: 'Open repaired PNG to read flag.' },
    ],
    mitigationCode: `PNG_MAGIC = b'\\x89PNG\\r\\n\\x1a\\n'`,
    defensiveKeyTakeaways: [
      'File extensions can be faked; verify file magic bytes server-side.',
      'File repairs are a fundamental aspect of digital forensics.',
      'Validate structural integrity of incoming binary streams.',
    ],
  },

  'pico-crypto-01': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'ROT13 Monoalphabetic Substitution Cipher Analysis',
    technicalMechanism:
      'ROT13 replaces a letter with the 13th letter after it in the alphabet. Applying ROT13 twice reverses the encryption (`ROT13(ROT13(x)) = x`). ROT13 provides zero cryptographic confidentiality.',
    samplePayload: `echo "cvpbPGDS{..." | tr 'A-Za-z' 'N-ZA-Mn-za-m'`,
    stages: [
      { step: 1, label: 'Ciphertext Inspection', iconType: 'probe', description: 'Identify monoalphabetic ROT13 ciphertext structure.' },
      { step: 2, label: 'Alphabet Rotation', iconType: 'vector', description: 'Rotate ASCII character codes by 13 positions.' },
      { step: 3, label: 'Plaintext Recovery', iconType: 'exfil', description: 'Decipher text to reveal original flag.' },
    ],
    mitigationCode: `codecs.decode(ciphertext, 'rot_13')`,
    defensiveKeyTakeaways: [
      'ROT13 is suitable only for basic obfuscation.',
      'Never rely on historic ciphers for confidential data.',
      'Use authenticated encryption algorithms like AES-256-GCM.',
    ],
  },

  'pico-crypto-02': {
    cwe: 'CWE-326: Inadequate Encryption Strength',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'Caesar Cipher Frequency & Key Shift Decryption',
    technicalMechanism:
      'The Caesar Cipher shifts letters by a fixed key value $k$ ($0 \\le k \\le 25$). With only 26 possible keys, attackers perform a brute-force search across all key shifts to instantly decrypt the ciphertext.',
    samplePayload: `python3 -c 'for k in range(26): print(k, "".join([chr((ord(c)-97-k)%26+97) for c in ct]))'`,
    stages: [
      { step: 1, label: 'Key Search Setup', iconType: 'probe', description: 'Prepare brute-force decryption script testing key shifts k=0 through 25.' },
      { step: 2, label: 'Modular Shift', iconType: 'vector', description: 'Compute inverse shift (c - k) mod 26.' },
      { step: 3, label: 'Flag Identification', iconType: 'exfil', description: 'Locate readable plaintext output.' },
    ],
    mitigationCode: `def decrypt_caesar(ciphertext, key): ...`,
    defensiveKeyTakeaways: [
      'Small key spaces invite effortless brute-force attacks.',
      'Modern encryption requires key lengths of at least 128 or 256 bits.',
      'Always use well-audited cryptographic libraries.',
    ],
  },

  'pico-crypto-03': {
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    attackVectorName: 'RSA Small Public Exponent Attack (e = 3)',
    technicalMechanism:
      'When small public exponent $e = 3$ is used without proper padding, and $m^3 < N$, no modular reduction occurs ($c = m^3$). Attackers compute the integer cube root of $c$ directly to recover $m$.',
    samplePayload: `import gmpy2; m, exact = gmpy2.iroot(c, 3); print(bytes.fromhex(hex(m)[2:]).decode())`,
    stages: [
      { step: 1, label: 'Exponent Analysis', iconType: 'probe', description: 'Inspect RSA public parameters and detect e = 3.' },
      { step: 2, label: 'Cube Root Extraction', iconType: 'vector', description: 'Verify m^3 < N and compute integer cube root.' },
      { step: 3, label: 'Plaintext Exfiltration', iconType: 'exfil', description: 'Convert big integer result back to ASCII bytes.' },
    ],
    mitigationCode: `key = RSA.generate(2048, e=65537)`,
    defensiveKeyTakeaways: [
      'Always use standard public exponent e = 65537.',
      'Never encrypt raw messages without OAEP padding.',
      'Use 2048-bit or 4096-bit key sizes.',
    ],
  },

  'pico-pwn-01': {
    cwe: 'CWE-120: Buffer Copy without Checking Size of Input (\'Classic Buffer Overflow\')',
    owasp: 'OWASP A06:2021 – Vulnerable and Outdated Components',
    attackVectorName: 'Stack Buffer Overflow (Memory Corruption)',
    technicalMechanism:
      'Buffer Overflow occurs when C/C++ applications use unsafe memory copy functions (`gets()`, `strcpy()`) to write user input into fixed stack buffers without checking bounds, overwriting adjacent variables and return addresses.',
    samplePayload: `python3 -c 'print("A" * 64 + "\\x76\\x11\\x40\\x00")' | ./vuln`,
    stages: [
      { step: 1, label: 'Buffer Size Probe', iconType: 'probe', description: 'Send increasing length strings to detect crash threshold.' },
      { step: 2, label: 'Stack Corruption', iconType: 'vector', description: 'Overwrite return address with target function offset.' },
      { step: 3, label: 'Control Flow Hijack', iconType: 'exfil', description: 'Redirect execution to print_flag() function.' },
    ],
    mitigationCode: `fgets(buf, sizeof(buf), stdin);`,
    defensiveKeyTakeaways: [
      'Never use unsafe legacy C functions (gets, strcpy).',
      'Use bounded string functions or memory-safe languages.',
      'Enable Stack Canaries, ASLR, and DEP/NX.',
    ],
  },

  'pico-pwn-02': {
    cwe: 'CWE-134: Use of Externally-Controlled Format String',
    owasp: 'OWASP A03:2021 – Injection',
    attackVectorName: 'Format String Vulnerability (Printf Injection)',
    technicalMechanism:
      'Passing user input directly as the first argument to `printf(user_input)` rather than `printf("%s", user_input)` allows specifiers like `%x` and `%p` to leak stack memory and `%s` to dereference pointers on the stack.',
    samplePayload: `%x.%x.%x.%x.%x.%s`,
    stages: [
      { step: 1, label: 'Format Specifier Probe', iconType: 'probe', description: 'Submit string containing %x, %p, %s to prompt.' },
      { step: 2, label: 'Stack Memory Dump', iconType: 'vector', description: 'Observe hex memory address leakage from stack frames.' },
      { step: 3, label: 'Flag Pointer Deref', iconType: 'exfil', description: 'Dereference stack pointer containing flag buffer address.' },
    ],
    mitigationCode: `printf("%s", buf);`,
    defensiveKeyTakeaways: [
      'Always pass explicit static format specifiers ("%s") to printf.',
      'Enable compiler format string warnings (-Wformat -Wformat-security).',
      'Treat all external input as untrusted data.',
    ],
  },
};

/**
 * Robust attack detail retriever that matches challenges by:
 * 1. Exact challenge ID
 * 2. ID substring matches
 * 3. Title keyword matches
 * 
 * NEVER returns SQL injection for non-SQL challenges!
 */
export function getDetailedAttackInfo(challengeId: string, category: string, title: string): DetailedAttackInfo {
  // 1. Direct key lookup
  if (challengeId && CHALLENGE_DETAILED_INFO[challengeId]) {
    return CHALLENGE_DETAILED_INFO[challengeId];
  }

  const lowerId = (challengeId || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();
  const lowerCat = (category || '').toLowerCase();

  // 2. High-precision Web Exploitation matchers
  if (lowerId.includes('cookie') || lowerTitle.includes('cookie')) {
    return CHALLENGE_DETAILED_INFO['pico-web-cookies'];
  }
  if (lowerId.includes('insp3ct') || lowerTitle.includes('insp3ct') || lowerTitle.includes('inspector')) {
    return CHALLENGE_DETAILED_INFO['pico-web-insp3ct0r'];
  }
  if (lowerId.includes('local-auth') || lowerTitle.includes('local authority') || (lowerTitle.includes('authority') && lowerCat.includes('web'))) {
    return CHALLENGE_DETAILED_INFO['pico-web-local-auth'];
  }
  if (lowerId.includes('get-ahead') || lowerTitle.includes('get ahead') || lowerTitle.includes('ahead')) {
    return CHALLENGE_DETAILED_INFO['pico-web-get-ahead'];
  }
  if (lowerId.includes('forbidden') || lowerTitle.includes('forbidden paths') || lowerTitle.includes('traversal')) {
    return CHALLENGE_DETAILED_INFO['pico-web-forbidden-paths'];
  }
  if (lowerId.includes('cmd-inject') || lowerTitle.includes('command injection')) {
    return CHALLENGE_DETAILED_INFO['pico-web-cmd-inject'];
  }
  if (lowerId.includes('xss') || lowerTitle.includes('cross-site scripting')) {
    return CHALLENGE_DETAILED_INFO['pico-web-xss-eval'];
  }
  if (lowerId.includes('sqli-search') || lowerTitle.includes('union') || (lowerTitle.includes('sqli') && lowerTitle.includes('search'))) {
    return CHALLENGE_DETAILED_INFO['pico-web-sqli-search'];
  }
  if (lowerId.includes('header-inject') || lowerTitle.includes('response splitting') || lowerTitle.includes('crlf')) {
    return CHALLENGE_DETAILED_INFO['pico-os-header-inject'];
  }
  if (lowerId.includes('dir-listing') || lowerTitle.includes('directory indexing') || lowerTitle.includes('path leak')) {
    return CHALLENGE_DETAILED_INFO['pico-os-dir-listing'];
  }
  if (lowerId.includes('os-jwt') || lowerTitle.includes('jwt secret') || (lowerTitle.includes('jwt') && lowerTitle.includes('cracking'))) {
    return CHALLENGE_DETAILED_INFO['pico-os-jwt-sec'];
  }

  // 3. Meridian exploit chain matchers
  if (lowerId.includes('race') || lowerTitle.includes('race condition') || lowerTitle.includes('double-spend')) {
    return CHALLENGE_DETAILED_INFO['ch-race-11'];
  }
  if (lowerId.includes('csrf') || lowerTitle.includes('cross-site request forgery')) {
    return CHALLENGE_DETAILED_INFO['ch-csrf-10'];
  }
  if (lowerId.includes('jwt') || lowerTitle.includes('jwt') || lowerTitle.includes('broken token')) {
    return CHALLENGE_DETAILED_INFO['ch-jwt-09'];
  }
  if (lowerId.includes('ssrf') || lowerTitle.includes('metadata') || lowerTitle.includes('server-side request forgery')) {
    return CHALLENGE_DETAILED_INFO['ch-ssrf-08'];
  }
  if (lowerId.includes('dos') || lowerTitle.includes('denial of service') || lowerTitle.includes('stress')) {
    return CHALLENGE_DETAILED_INFO['ch-dos-07'];
  }
  if (lowerId.includes('privesc') || lowerTitle.includes('privilege escalation') || lowerTitle.includes('sudo')) {
    return CHALLENGE_DETAILED_INFO['ch-privesc-06'];
  }
  if (lowerId.includes('upload') || lowerTitle.includes('file upload')) {
    return CHALLENGE_DETAILED_INFO['ch-upload-05'];
  }
  if (lowerId.includes('idor') || lowerTitle.includes('idor') || lowerTitle.includes('direct object')) {
    return CHALLENGE_DETAILED_INFO['ch-idor-04'];
  }
  if (lowerId.includes('info') || lowerTitle.includes('information disclosure') || lowerTitle.includes('robots')) {
    return CHALLENGE_DETAILED_INFO['ch-info-02'];
  }
  if (lowerId.includes('auth') || lowerTitle.includes('authentication')) {
    return CHALLENGE_DETAILED_INFO['ch-auth-03'];
  }
  if (lowerId.includes('sqli') || lowerTitle.includes('sql injection') || lowerTitle.includes('sql')) {
    return CHALLENGE_DETAILED_INFO['ch-sqli-01'];
  }

  // 4. Cryptography matchers
  if (lowerId.includes('mod26') || lowerTitle.includes('mod 26') || lowerTitle.includes('rot13')) {
    return CHALLENGE_DETAILED_INFO['pico-crypto-mod26'];
  }
  if (lowerId.includes('numbers') || lowerTitle.includes('the numbers')) {
    return CHALLENGE_DETAILED_INFO['pico-crypto-the-numbers'];
  }
  if (lowerId.includes('caesar') || lowerTitle.includes('caesar')) {
    return CHALLENGE_DETAILED_INFO['pico-crypto-caesar'];
  }
  if (lowerId.includes('vigenere') || lowerTitle.includes('vigenère') || lowerTitle.includes('vigenere')) {
    return CHALLENGE_DETAILED_INFO['pico-crypto-vigenere'];
  }
  if (lowerId.includes('rsa-easy') || lowerTitle.includes('small public exponent') || (lowerTitle.includes('rsa') && lowerTitle.includes('exponent'))) {
    return CHALLENGE_DETAILED_INFO['pico-crypto-rsa-easy'];
  }
  if (lowerId.includes('xor') || lowerTitle.includes('xor')) {
    return CHALLENGE_DETAILED_INFO['pico-crypto-xor'];
  }
  if (lowerId.includes('double-encoding') || lowerTitle.includes('multi-stage encoding')) {
    return CHALLENGE_DETAILED_INFO['pico-os-double-encoding'];
  }
  if (lowerId.includes('factordb') || lowerTitle.includes('factorization') || (lowerTitle.includes('rsa') && lowerTitle.includes('prime'))) {
    return CHALLENGE_DETAILED_INFO['pico-os-rsa-factordb'];
  }
  if (lowerId.includes('freq-analysis') || lowerTitle.includes('frequency analysis')) {
    return CHALLENGE_DETAILED_INFO['pico-os-freq-analysis'];
  }

  // 5. Forensics matchers
  if (lowerId.includes('matryoshka') || lowerTitle.includes('matryoshka') || lowerTitle.includes('doll')) {
    return CHALLENGE_DETAILED_INFO['pico-forensics-matryoshka'];
  }
  if (lowerId.includes('wireshark') || lowerTitle.includes('wireshark') || lowerTitle.includes('pcap') || lowerTitle.includes('packet')) {
    return CHALLENGE_DETAILED_INFO['pico-forensics-wireshark'];
  }
  if (lowerId.includes('file-types') || lowerTitle.includes('magic bytes') || lowerTitle.includes('corrupted file') || lowerTitle.includes('file header')) {
    return CHALLENGE_DETAILED_INFO['pico-forensics-file-types'];
  }
  if (lowerId.includes('information') || (lowerTitle.includes('information') && lowerCat.includes('forensic'))) {
    return CHALLENGE_DETAILED_INFO['pico-forensics-information'];
  }
  if (lowerId.includes('lsb') || lowerTitle.includes('lsb steganography') || lowerTitle.includes('pixel extraction')) {
    return CHALLENGE_DETAILED_INFO['pico-os-lsb-stego'];
  }
  if (lowerId.includes('dns-exfil') || lowerTitle.includes('dns exfiltration') || lowerTitle.includes('dns tunneling')) {
    return CHALLENGE_DETAILED_INFO['pico-os-dns-exfil'];
  }
  if (lowerId.includes('zip-carve') || lowerTitle.includes('zip archive recovery') || lowerTitle.includes('file carving')) {
    return CHALLENGE_DETAILED_INFO['pico-os-zip-carve'];
  }

  // 6. Reverse Engineering & Binary Exploitation matchers
  if (lowerId.includes('transformation') || lowerTitle.includes('transformation')) {
    return CHALLENGE_DETAILED_INFO['pico-rev-transformation'];
  }
  if (lowerId.includes('gdb') || lowerTitle.includes('gdb test drive') || lowerTitle.includes('test drive')) {
    return CHALLENGE_DETAILED_INFO['pico-bin-gdb-testdrive'];
  }
  if (lowerId.includes('strings') || lowerTitle.includes('static analysis: strings') || (lowerTitle.includes('strings') && lowerCat.includes('reverse'))) {
    return CHALLENGE_DETAILED_INFO['pico-rev-strings'];
  }
  if (lowerId.includes('crackme') || lowerTitle.includes('crackme') || lowerTitle.includes('keygen')) {
    return CHALLENGE_DETAILED_INFO['pico-rev-crackme'];
  }
  if (lowerId.includes('buffer-overflow') || lowerTitle.includes('buffer overflow') || lowerTitle.includes('stack smash')) {
    return CHALLENGE_DETAILED_INFO['pico-bin-buffer-overflow'];
  }
  if (lowerId.includes('format-string') || lowerTitle.includes('format string') || lowerTitle.includes('printf')) {
    return CHALLENGE_DETAILED_INFO['pico-bin-format-string'];
  }

  // 7. Dynamic contextual fallback (never assuming SQL injection!)
  const dynamicCwe = lowerCat.includes('crypto')
    ? 'CWE-326: Inadequate Encryption Strength'
    : lowerCat.includes('forensic')
    ? 'CWE-200: Exposure of Sensitive Information in Artifacts'
    : lowerCat.includes('reverse')
    ? 'CWE-540: Inclusion of Sensitive Logic in Compiled Binaries'
    : lowerCat.includes('binary') || lowerCat.includes('pwn')
    ? 'CWE-119: Improper Restriction of Operations within Memory Buffer Bounds'
    : 'CWE-200: Information Exposure & Security Misconfiguration';

  const dynamicOwasp = lowerCat.includes('crypto')
    ? 'OWASP A02:2021 – Cryptographic Failures'
    : lowerCat.includes('forensic')
    ? 'OWASP A01:2021 – Broken Access Control'
    : lowerCat.includes('reverse')
    ? 'OWASP A02:2021 – Cryptographic Failures'
    : lowerCat.includes('binary') || lowerCat.includes('pwn')
    ? 'OWASP A06:2021 – Vulnerable and Outdated Components'
    : 'OWASP A05:2021 – Security Misconfiguration';

  return {
    cwe: dynamicCwe,
    owasp: dynamicOwasp,
    attackVectorName: `${title} Target Analysis`,
    technicalMechanism: `This challenge focuses on analyzing ${title} within the ${category} discipline. Security practitioners systematically inspect target protocols, assess trust boundaries, and craft precision payloads to uncover vulnerabilities and extract verification tokens.`,
    samplePayload: `# Target payload for ${title}:
Submit targeted parameters or inspect execution traces in the interactive sandbox.`,
    stages: [
      { step: 1, label: 'Target Recon', iconType: 'probe', description: `Inspect parameters, protocols, and data structures associated with ${title}.` },
      { step: 2, label: 'Vector Execution', iconType: 'vector', description: `Deliver tailored exploit payload to trigger target behavior.` },
      { step: 3, label: 'Token Exfiltration', iconType: 'exfil', description: `Observe sandbox response, locate proof-of-concept flag, and claim XP.` },
    ],
    mitigationCode: `// ✅ Defensive Guidance for ${title}:
// 1. Enforce strict input sanitization and parameter boundary verification.
// 2. Adhere to the principle of least privilege across all service components.
// 3. Keep software libraries and server components continuously patched.`,
    defensiveKeyTakeaways: [
      'Validate all untrusted input on the server side using strict whitelists.',
      'Enforce defense-in-depth across multiple infrastructure layers.',
      'Conduct regular automated vulnerability assessments and code audits.',
    ],
  };
}
