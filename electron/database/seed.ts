export interface SeedChallenge {
  id: string;
  order_index: number;
  track?: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimated_time: string;
  xp_reward: number;
  description: string;
  learning_objectives: string;
  prerequisites: string;
  safety_notes: string;
  target_url: string;
  flag_plain: string;
  hint_1: string;
  hint_2: string;
  hint_3: string;
  remediation_summary: string;
  remediation_diff: string;
  quiz_question: string;
  quiz_options: string[];
  quiz_answer: string;
  unlocked: number;
}

export const SEED_CHALLENGES: SeedChallenge[] = [
  {
    id: 'ch-sqli-01',
    order_index: 1,
    title: 'SQL Injection',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    estimated_time: '15 min',
    xp_reward: 100,
    description: 'Learn how unsafe database input can bypass a shop\'s login. Explore the login fields and observe how input gets mixed into database questions.',
    learning_objectives: 'Understand how unparameterized SQL queries allow arbitrary query manipulation; learn how tautology payloads bypass Boolean WHERE clauses; examine query logs; implement parameterized queries for remediation.',
    prerequisites: 'No prior SQL knowledge required. All testing runs in the guided local sandbox.',
    safety_notes: 'All testing is confined to the local MERIDIAN-01 sandbox (127.0.0.1:8888). No external targets or live traffic.',
    target_url: 'http://127.0.0.1:8888/login',
    flag_plain: 'flag{data_not_instructions}',
    hint_1: 'Think about trust: The app trusts login input too much. What should stay as data?',
    hint_2: 'Follow the response: After the guided case opens an account, look for a private member note. Flags use the format flag{...}.',
    hint_3: 'Apply the guided test input (\' OR 1=1 --) into the username field, sign in, and open the private member note on the account overview page.',
    remediation_summary: 'Unsafe input handling can change a database request and expose private areas. Parameterized queries protect the boundary between data and instructions.',
    remediation_diff: `- // Vulnerable Implementation:
- const sql = "SELECT * FROM users WHERE username = '" + user + "' AND password = '" + pass + "'";
- const user = await db.query(sql);

+ // Remediated Secure Implementation:
+ const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
+ const user = await db.query(sql, [user, pass]);`,
    quiz_question: 'Which software development pattern completely prevents SQL Injection by design?',
    quiz_options: [
      'Filtering out single quotes with regex replace',
      'Using Parameterized Queries (Prepared Statements) with bound parameters',
      'Encoding strings to Base64 before querying',
      'Hiding the database behind a reverse proxy'
    ],
    quiz_answer: 'Using Parameterized Queries (Prepared Statements) with bound parameters',
    unlocked: 1,
  },
  {
    id: 'ch-info-02',
    order_index: 2,
    title: 'Information Disclosure',
    category: 'Reconnaissance',
    difficulty: 'Easy',
    estimated_time: '10 min',
    xp_reward: 100,
    description: 'Follow the debug note clue and find information the shop should keep private. Discover exposed configuration endpoints.',
    learning_objectives: 'Discover how web crawlers, robots.txt, and neglected dotfiles (.git, .env, .bak) cause information exposure.',
    prerequisites: 'Completion of SQL Injection challenge and understanding of web document paths.',
    safety_notes: 'All challenges stay in MERIDIAN-01. No external network scanning.',
    target_url: 'http://127.0.0.1:8888/info-disc',
    flag_plain: 'flag{debug_notes_reveal_secrets}',
    hint_1: 'Check standard search engine exclusion lists by requesting /robots.txt in the address bar.',
    hint_2: 'Inspect paths disallowed in robots.txt. Try navigating to /.git/config or /backups/debug_conf_2026.bak.',
    hint_3: 'Navigate to http://127.0.0.1:8888/.git/config or /backups/debug_conf_2026.bak to view the raw configuration dump with the flag.',
    remediation_summary: 'Information disclosure results from misconfigured web server directives that expose hidden folders. Remediate by blocking dotfile access (.git, .env) in Nginx/Apache.',
    remediation_diff: `- # Vulnerable Web Server Config (Allows dotfiles):
- location / {
-     try_files $uri $uri/ =404;
- }

+ # Remediated Nginx Config (Denies all hidden files):
+ location ~ /\\. {
+     deny all;
+     return 404;
+ }`,
    quiz_question: 'Why should version control directories like .git never be deployed to a production web root?',
    quiz_options: [
      'They slow down web server CPU performance',
      'They allow anyone to download commit history, source code, and hardcoded secrets',
      'They consume excessive bandwidth',
      'They conflict with SSL certificates'
    ],
    quiz_answer: 'They allow anyone to download commit history, source code, and hardcoded secrets',
    unlocked: 1,
  },
  {
    id: 'ch-auth-03',
    order_index: 3,
    title: 'Authentication',
    category: 'Web Security',
    difficulty: 'Easy',
    estimated_time: '25 min',
    xp_reward: 150,
    description: 'Understand how weak account checks expose private areas. Test session boundary manipulation on the admin gateway.',
    learning_objectives: 'Examine authentication logic flaws; understand how SQL comment delimiters neutralize subsequent password checks.',
    prerequisites: 'Completion of Information Disclosure challenge.',
    safety_notes: 'Authenticating to unauthorized accounts outside safe educational labs is strictly prohibited.',
    target_url: 'http://127.0.0.1:8888/auth',
    flag_plain: 'flag{auth_boundary_bypassed}',
    hint_1: 'The login query verifies username and password simultaneously. If the password check is commented out, what happens?',
    hint_2: 'Input an administrator username followed by an SQL comment operator: admin\' --',
    hint_3: 'Type admin\' -- into the Admin Username field, leave Password blank, and submit.',
    remediation_summary: 'Authentication bypass happens when queries trust unescaped input. Remediation requires prepared statements and secure password hashing with bcrypt.',
    remediation_diff: `- // Vulnerable 1-step SQL authentication:
- const user = await db.query(\`SELECT * FROM admins WHERE user='\${req.body.user}' AND pass='\${req.body.pass}'\`);

+ // Remediated 2-step secure authentication:
+ const user = await db.query('SELECT * FROM admins WHERE user = ?', [req.body.user]);
+ if (!user || !(await bcrypt.compare(req.body.pass, user.passwordHash))) {
+   throw new Error('Invalid credentials');
+ }`,
    quiz_question: 'What is the most secure method for verifying user passwords in a database?',
    quiz_options: [
      'Comparing plaintext strings in SQL WHERE clauses',
      'Storing MD5 hashes and checking string equality',
      'Using a salted slow cryptographic hash function like Argon2 or bcrypt with timing-safe comparison',
      'Encrypting passwords with a reversible AES key stored in source code'
    ],
    quiz_answer: 'Using a salted slow cryptographic hash function like Argon2 or bcrypt with timing-safe comparison',
    unlocked: 1,
  },
  {
    id: 'ch-idor-04',
    order_index: 4,
    title: 'XSS / IDOR',
    category: 'API & Web Security',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 150,
    description: 'Explore unwanted page content and missing access checks. Inspect order and ticket parameters to observe direct object exposure.',
    learning_objectives: 'Analyze broken object level authorization (OWASP API1); understand difference between authentication and authorization.',
    prerequisites: 'Basic familiarity with query string parameters (?id=...).',
    safety_notes: 'Accessing private records belonging to other users without authorization is prohibited on real systems.',
    target_url: 'http://127.0.0.1:8888/support?id=104',
    flag_plain: 'flag{idor_ticket_exposed_991}',
    hint_1: 'Observe the current URL parameter: ?id=104. What happens if you decrement or increment this number?',
    hint_2: 'Notice the quick navigation links or try visiting ?id=100 in the address bar.',
    hint_3: 'Change the URL to http://127.0.0.1:8888/support?id=100 to view the confidential audit ticket.',
    remediation_summary: 'IDOR occurs when an application receives an object identifier from the client and retrieves data without verifying read permissions.',
    remediation_diff: `- // Vulnerable Endpoint (Zero authorization check):
- app.get('/support', async (req, res) => {
-   const ticket = await Ticket.findById(req.query.id);
-   res.json(ticket);
- });

+ // Remediated Endpoint (Enforces ownership & RBAC):
+ app.get('/support', async (req, res) => {
+   const ticket = await Ticket.findById(req.query.id);
+   if (!ticket || (ticket.ownerId !== req.user.id && !req.user.isAdmin)) {
+     return res.status(403).json({ error: 'Access forbidden' });
+   }
+   res.json(ticket);
+ });`,
    quiz_question: 'How should an API prevent Insecure Direct Object References (IDOR)?',
    quiz_options: [
      'By obfuscating IDs with Base64 encoding',
      'By checking on the server that the authenticated session owns or has permission to view the requested object',
      'By hiding the ID in an HTTP POST request header',
      'By making IDs longer numbers'
    ],
    quiz_answer: 'By checking on the server that the authenticated session owns or has permission to view the requested object',
    unlocked: 1,
  },
  {
    id: 'ch-upload-05',
    order_index: 5,
    title: 'File Upload',
    category: 'System Compromise',
    difficulty: 'Medium',
    estimated_time: '25 min',
    xp_reward: 200,
    description: 'Discover why apps need to validate uploaded files safely. Upload a test script to observe server-side execution risks.',
    learning_objectives: 'Understand file upload attack vectors; explore extension filtering and MIME spoofing; implement server-side validation.',
    prerequisites: 'Basic understanding of server-side script execution (PHP).',
    safety_notes: 'Uploading web shells to production systems outside authorized tests is prohibited.',
    target_url: 'http://127.0.0.1:8888/upload',
    flag_plain: 'flag{file_upload_shell_exec}',
    hint_1: 'Inspect accepted extensions. Does the server execute files with .php or .phtml extensions?',
    hint_2: 'Set the filename field to shell.php and keep the sample code payload in the content area.',
    hint_3: 'Submit the form with filename shell.php. The simulated server will execute the script in uploads and display the flag.',
    remediation_summary: 'Arbitrary file upload vulnerabilities lead to full server takeover (RCE). Remediate by validating MIME type using magic bytes and disabling execution on upload folders.',
    remediation_diff: `- // Vulnerable: Saves original user filename in public directory
- const destPath = path.join('/var/www/uploads', req.body.filename);
- fs.writeFileSync(destPath, req.body.content);

+ // Remediated: Strict extension whitelist, random UUID naming, private non-exec storage
+ const allowedExts = ['.jpg', '.jpeg', '.png'];
+ const ext = path.extname(req.body.filename).toLowerCase();
+ if (!allowedExts.includes(ext)) throw new Error('Disallowed file extension');
+ const safeFilename = crypto.randomUUID() + ext;
+ const destPath = path.join('/opt/private_storage', safeFilename);`,
    quiz_question: 'Which of the following is the most robust defense against malicious file uploads?',
    quiz_options: [
      'Checking file extension with JavaScript in the browser',
      'Storing uploaded files in an isolated non-executable storage bucket with randomized filenames and strict server-side content-type verification',
      'Limiting file upload size to under 2MB',
      'Renaming the file extension to uppercase'
    ],
    quiz_answer: 'Storing uploaded files in an isolated non-executable storage bucket with randomized filenames and strict server-side content-type verification',
    unlocked: 1,
  },
  {
    id: 'ch-privesc-06',
    order_index: 6,
    title: 'Privilege Escalation',
    category: 'System Exploitation',
    difficulty: 'Medium',
    estimated_time: '30 min',
    xp_reward: 250,
    description: 'Follow the chain from limited access to elevated permissions. Inspect sudo permissions to discover misconfigured binaries.',
    learning_objectives: 'Perform Linux host enumeration; inspect sudo permissions via sudo -l; identify breakout binaries; enforce least privilege.',
    prerequisites: 'Basic Linux command line knowledge (whoami, sudo, find).',
    safety_notes: 'Practicing privilege escalation on unowned systems is unlawful.',
    target_url: 'http://127.0.0.1:8888/terminal',
    flag_plain: 'flag{privesc_root_access_granted}',
    hint_1: 'Start by running sudo -l in the terminal to inspect commands the current user may execute without a password.',
    hint_2: 'Notice that /usr/bin/find has NOPASSWD privileges. The -exec parameter can spawn a root shell.',
    hint_3: 'Execute: sudo find . -exec /bin/sh \\; in the terminal. The prompt will switch to root and output /root/flag.txt.',
    remediation_summary: 'Granting NOPASSWD sudo access to interactive binaries allows instant root escalation. Remediate by auditing /etc/sudoers.',
    remediation_diff: `- # Vulnerable /etc/sudoers entry:
- www-data ALL=(ALL) NOPASSWD: /usr/bin/find

+ # Remediated /etc/sudoers:
+ # Restrict service accounts from executing interactive shell-escape binaries.`,
    quiz_question: 'Why is granting NOPASSWD sudo access to the `find` binary dangerous?',
    quiz_options: [
      'It allows users to search the entire hard drive too quickly',
      'The `find` command includes an `-exec` flag that allows executing arbitrary commands as the root user',
      'It breaks the file index database',
      'It prevents regular users from finding their own files'
    ],
    quiz_answer: 'The `find` command includes an `-exec` flag that allows executing arbitrary commands as the root user',
    unlocked: 1,
  },
  {
    id: 'ch-dos-07',
    order_index: 7,
    track: 'meridian',
    title: 'DoS Simulation',
    category: 'Resilience & Networking',
    difficulty: 'Easy',
    estimated_time: '15 min',
    xp_reward: 100,
    description: 'See how resource limits protect availability in a simulation. Observe circuit breakers and rate limiting in action.',
    learning_objectives: 'Understand denial-of-service concepts; observe resource exhaustion; explore token bucket algorithms; configure HTTP 429 responses.',
    prerequisites: 'Basic knowledge of HTTP status codes and API architectures.',
    safety_notes: 'CRITICAL: Uses an in-memory client rate model. Does not send live flood packets.',
    target_url: 'http://127.0.0.1:8888/stress',
    flag_plain: 'flag{rate_limiting_protects_service}',
    hint_1: 'Click "Run Controlled Local Burst" in the interactive sandbox.',
    hint_2: 'Watch the simulated load meter approach the 15-request threshold.',
    hint_3: 'Allow the burst to complete. When the circuit breaker trips with HTTP 429, the flag is revealed.',
    remediation_summary: 'Without rate limiting, clients can exhaust server pools. Remediate with token bucket rate limiting and CDN edge caching.',
    remediation_diff: `- // Vulnerable Endpoint (Unlimited requests):
- app.get('/api/data', (req, res) => res.json(compute()));

+ // Remediated Endpoint (Rate limited):
+ const rateLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
+ app.get('/api/data', rateLimiter, (req, res) => res.json(compute()));`,
    quiz_question: 'What HTTP status code is the standard response when a client exceeds an API rate limit?',
    quiz_options: [
      '401 Unauthorized',
      '404 Not Found',
      '429 Too Many Requests',
      '500 Internal Server Error'
    ],
    quiz_answer: '429 Too Many Requests',
    unlocked: 1,
  },
  {
    id: 'ch-ssrf-08',
    order_index: 8,
    track: 'meridian',
    title: 'SSRF: Cloud Metadata',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 150,
    description: 'The product image import tool fetches remote images on behalf of users. Exploit the Server-Side Request Forgery flaw to probe the cloud metadata service on 169.254.169.254.',
    learning_objectives: 'Understand Server-Side Request Forgery (SSRF); explore cloud metadata endpoints (169.254.169.254); exfiltrate internal IAM credentials; enforce IP blacklisting and private subnet isolation.',
    prerequisites: 'Basic HTTP concepts and cloud metadata familiarity.',
    safety_notes: 'Target runs in the local sandbox at http://127.0.0.1:8888/ssrf.',
    target_url: 'http://127.0.0.1:8888/ssrf',
    flag_plain: 'flag{ssrf_internal_metadata_leaked_882}',
    hint_1: 'Look at the Image URL input. What internal IP addresses do cloud hosting providers use for instance metadata?',
    hint_2: 'Try entering http://169.254.169.254/latest/meta-data/iam/security-credentials or http://localhost:8888/internal/admin-secret.',
    hint_3: 'Enter http://169.254.169.254/latest/meta-data/ into the Image URL field and submit to retrieve the IAM role credentials and flag.',
    remediation_summary: 'SSRF occurs when a server accepts an arbitrary URL from user input and makes an outbound request without restricting private IP ranges (RFC 1918, link-local 169.254.0.0/16).',
    remediation_diff: `- // Vulnerable: Direct fetch of user-supplied URL
- const response = await fetch(req.body.imageUrl);

+ // Remediated: Resolve IP and reject private / loopback ranges
+ const ip = await dns.resolve(parsedUrl.hostname);
+ if (isPrivateOrLoopbackIp(ip)) throw new Error("Private network access blocked");`,
    quiz_question: 'Which IP address is reserved by cloud providers (AWS, GCP, Azure) for instance metadata retrieval?',
    quiz_options: ['169.254.169.254', '192.168.1.1', '10.0.0.1', '127.0.0.2'],
    quiz_answer: '169.254.169.254',
    unlocked: 1,
  },
  {
    id: 'ch-jwt-09',
    order_index: 9,
    track: 'meridian',
    title: 'Broken Token Auth (JWT)',
    category: 'API & Web Security',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 150,
    description: 'The internal staff management portal uses JSON Web Tokens (JWT) for authentication. Exploit the insecure "alg": "none" vulnerability or modify the user role to gain administrator access.',
    learning_objectives: 'Understand JWT structure (Header.Payload.Signature); identify algorithm confusion and "alg: none" exploits; enforce strict cryptographic signature validation.',
    prerequisites: 'Basic Base64 and JSON knowledge.',
    safety_notes: 'Runs inside the local sandbox at http://127.0.0.1:8888/jwt-portal.',
    target_url: 'http://127.0.0.1:8888/jwt-portal',
    flag_plain: 'flag{jwt_alg_none_privilege_escalation_741}',
    hint_1: 'Inspect the current JWT token in the editor: notice the payload contains {"user": "guest", "role": "customer"}.',
    hint_2: 'Change the role to "admin", and change the header "alg" to "none".',
    hint_3: 'Click "Auto-Forge Admin JWT" or update the payload role to "admin" with alg "none" to access the Admin Vault.',
    remediation_summary: 'JWT verification libraries must explicitly whitelist permitted algorithms and reject tokens specifying "alg": "none" or asymmetric/symmetric mismatches.',
    remediation_diff: `- // Vulnerable: Accepts unsigned none algorithm
- const decoded = jwt.decode(token);

+ // Remediated: Enforces algorithms and secret verification
+ const verified = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });`,
    quiz_question: 'Why is setting the JWT algorithm header to "none" a critical security vulnerability?',
    quiz_options: [
      'It tells the server to skip signature verification entirely, allowing anyone to forge administrative tokens',
      'It deletes the user account',
      'It causes an infinite loop in the browser',
      'It disables TLS encryption'
    ],
    quiz_answer: 'It tells the server to skip signature verification entirely, allowing anyone to forge administrative tokens',
    unlocked: 1,
  },
  {
    id: 'ch-csrf-10',
    order_index: 10,
    track: 'meridian',
    title: 'Cross-Site Request Forgery',
    category: 'Web Security',
    difficulty: 'Easy',
    estimated_time: '15 min',
    xp_reward: 100,
    description: 'Meridian account holders can transfer member reward points. The transfer action lacks Anti-CSRF protection and SameSite cookies, allowing malicious sites to submit requests on the user\'s behalf.',
    learning_objectives: 'Understand Cross-Site Request Forgery (CSRF); craft simulated exploit forms; implement Anti-CSRF tokens and SameSite=Strict cookie attributes.',
    prerequisites: 'Understanding of HTTP cookies and form submissions.',
    safety_notes: 'Simulated victim and attacker tabs inside local sandbox.',
    target_url: 'http://127.0.0.1:8888/csrf',
    flag_plain: 'flag{csrf_state_change_unauthorized_239}',
    hint_1: 'Notice that transferring points uses a standard POST request with session cookies attached automatically.',
    hint_2: 'Open the Attacker Malicious Page tab in the sandbox.',
    hint_3: 'Click "Launch Forged Transfer Request" to submit an unauthorized points transfer and claim the security audit flag.',
    remediation_summary: 'Cross-Site Request Forgery is prevented using cryptographically random anti-CSRF synchronization tokens and configuring SameSite=Lax or SameSite=Strict on session cookies.',
    remediation_diff: `- // Vulnerable: No CSRF token verification
- app.post('/transfer', (req, res) => transferPoints(req.body));

+ // Remediated: Anti-CSRF token verification middleware
+ app.post('/transfer', csrfProtection, (req, res) => transferPoints(req.body));`,
    quiz_question: 'Which modern cookie attribute prevents the browser from sending cookies on cross-origin requests?',
    quiz_options: ['SameSite=Strict', 'HttpOnly', 'Secure', 'Path=/'],
    quiz_answer: 'SameSite=Strict',
    unlocked: 1,
  },
  {
    id: 'ch-race-11',
    order_index: 11,
    track: 'meridian',
    title: 'Race Condition (Double-Spend)',
    category: 'Business Logic',
    difficulty: 'Hard',
    estimated_time: '20 min',
    xp_reward: 200,
    description: 'A $50 promotional store credit voucher (SAVE50) can be redeemed once per customer. Due to missing database transactions, concurrent requests can redeem the same voucher multiple times.',
    learning_objectives: 'Understand Time-of-Check to Time-of-Use (TOCTOU) race conditions; test concurrent API requests; implement database mutex locks and atomic transactions.',
    prerequisites: 'Knowledge of asynchronous execution and databases.',
    safety_notes: 'Simulated concurrency testing in local sandbox.',
    target_url: 'http://127.0.0.1:8888/race-condition',
    flag_plain: 'flag{race_condition_double_spend_success_912}',
    hint_1: 'Single voucher redemption checks: if (!voucher.used) { addBalance(); voucher.used = true; }.',
    hint_2: 'If 5 requests hit the check before voucher.used is set to true, all 5 will be approved.',
    hint_3: 'Click "Execute Concurrent Burst (5 threads)" in the sandbox. The balance will jump past $100 and output the flag.',
    remediation_summary: 'Race conditions in financial transactions are remediated using database row-level locking (SELECT FOR UPDATE) or atomic conditional updates (UPDATE vouchers SET used=1 WHERE code=? AND used=0).',
    remediation_diff: `- // Vulnerable: Non-atomic check and update
- const v = await db.get("SELECT * FROM vouchers WHERE code = ?", [code]);
- if (!v.used) { await db.run("UPDATE users SET bal = bal + 50"); await db.run("UPDATE vouchers SET used = 1"); }

+ // Remediated: Atomic transaction with conditional update
+ const res = await db.run("UPDATE vouchers SET used = 1 WHERE code = ? AND used = 0", [code]);
+ if (res.changes === 0) throw new Error("Voucher already redeemed");
+ await db.run("UPDATE users SET bal = bal + 50");`,
    quiz_question: 'Which database technique prevents race conditions during balance updates and voucher redemptions?',
    quiz_options: [
      'Atomic transactions with row-level locks or conditional updates (SELECT FOR UPDATE)',
      'Increasing CPU clock speed',
      'Using JSON files instead of SQL',
      'Sleeping for 1 second between requests'
    ],
    quiz_answer: 'Atomic transactions with row-level locks or conditional updates (SELECT FOR UPDATE)',
    unlocked: 1,
  },

  // ==========================================
  // PICOCTF CURRICULUM: ALL ATTACK DISCIPLINES
  // ==========================================

  // --- Web Exploitation ---
  {
    id: 'pico-web-insp3ct0r',
    order_index: 8,
    track: 'picoctf',
    title: 'Insp3ct0r',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    estimated_time: '10 min',
    xp_reward: 100,
    description: 'Kishor Balan tipped us off that the following code may need inspection. View the page source, linked stylesheets, and scripts to uncover the flag fragments.',
    learning_objectives: 'Learn browser developer tools; inspect HTML structure; analyze CSS comments; examine external JavaScript assets.',
    prerequisites: 'Basic familiarity with web pages (HTML, CSS, JS).',
    safety_notes: 'Runs on the local sandbox at http://127.0.0.1:8888/pico/inspector.',
    target_url: 'http://127.0.0.1:8888/pico/inspector',
    flag_plain: 'picoCTF{specs_0n_spect4cl3s__4dd392c1}',
    hint_1: 'How do you inspect the HTML code of a web page?',
    hint_2: 'There are 3 parts to the flag: HTML source, linked CSS stylesheet, and linked JavaScript file.',
    hint_3: 'Combine the three parts: 1/3 (HTML) + 2/3 (CSS) + 3/3 (JS).',
    remediation_summary: 'Never store production secrets, keys, or sensitive comments in publicly accessible client-side code.',
    remediation_diff: `- <!-- Secret API key: 8931293 -->
+ <!-- Code comments stripped in production build -->`,
    quiz_question: 'Which tool allows you to view client-side HTML, CSS, and JS in any modern browser?',
    quiz_options: ['Browser Developer Tools (F12)', 'Wireshark', 'Metasploit', 'Nmap'],
    quiz_answer: 'Browser Developer Tools (F12)',
    unlocked: 1,
  },
  {
    id: 'pico-web-cookies',
    order_index: 9,
    track: 'picoctf',
    title: 'Cookies',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    estimated_time: '15 min',
    xp_reward: 100,
    description: 'Who doesn\'t love cookies? Try to figure out the best one. Manipulate your session cookies to see how the server reacts to different privilege levels.',
    learning_objectives: 'Understand HTTP cookies; inspect cookie storage; tamper with cookie values to access privileged states.',
    prerequisites: 'Knowledge of HTTP headers and browser cookies.',
    safety_notes: 'Contained to the local sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/cookies',
    flag_plain: 'picoCTF{3v3ryb0dy_l1k3s_c00k13s_96f01e30}',
    hint_1: 'Search for "snickerdoodle" on the page and notice what cookie is set.',
    hint_2: 'Look in Storage > Cookies. Notice the integer value of the "name" cookie.',
    hint_3: 'Change the "name" cookie value to 18 and refresh the page to claim the special admin cookie flag.',
    remediation_summary: 'Never rely on unencrypted, guessable client-side cookies for authentication or authorization.',
    remediation_diff: `- document.cookie = "auth_level=" + level;
+ app.use(session({ secret: process.env.SESSION_SECRET, httpOnly: true, secure: true }));`,
    quiz_question: 'Why should sensitive user roles never be stored in plain text cookies?',
    quiz_options: [
      'Clients have full read and write control over their browser cookies',
      'Cookies expire after 10 seconds',
      'Browsers automatically delete numbers in cookies',
      'Cookies only work on port 80'
    ],
    quiz_answer: 'Clients have full read and write control over their browser cookies',
    unlocked: 1,
  },
  {
    id: 'pico-web-local-auth',
    order_index: 10,
    track: 'picoctf',
    title: 'Local Authority',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    estimated_time: '10 min',
    xp_reward: 100,
    description: 'Can you get the flag? Go to this website and see what you can discover. Look at the login validation script carefully.',
    learning_objectives: 'Understand client-side vs server-side validation; identify hardcoded credentials in front-end source files.',
    prerequisites: 'Basic JavaScript inspection.',
    safety_notes: 'Isolated local sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/local-authority',
    flag_plain: 'picoCTF{j5_15_7r4n5p4r3n7_05dfa048}',
    hint_1: 'Try logging in with any random username and password, then check the Network and Sources tabs.',
    hint_2: 'Look for secure.js or checkPassword() loaded in the browser.',
    hint_3: 'Inspect secure.js to find the exact username "admin" and password "strongPassword0987".',
    remediation_summary: 'Authentication checks and credentials must never exist in client-side code.',
    remediation_diff: `- function checkPassword(user, pass) { return pass === "supersecret"; }
+ const isValid = await bcrypt.compare(pass, user.passwordHash);`,
    quiz_question: 'Where should user authentication checks always take place?',
    quiz_options: ['Exclusively on the server', 'In client-side JavaScript', 'In CSS media queries', 'In the DNS resolver'],
    quiz_answer: 'Exclusively on the server',
    unlocked: 1,
  },
  {
    id: 'pico-web-get-ahead',
    order_index: 11,
    track: 'picoctf',
    title: 'GET aHEAD',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    estimated_time: '15 min',
    xp_reward: 150,
    description: 'Find the flag being held on this server to get ahead of the competition. Observe the difference between GET, POST, and other HTTP methods.',
    learning_objectives: 'Understand HTTP request methods; craft custom HTTP HEAD requests; inspect HTTP response headers.',
    prerequisites: 'Understanding of HTTP verbs (GET, POST, HEAD, PUT, DELETE).',
    safety_notes: 'Local sandbox target.',
    target_url: 'http://127.0.0.1:8888/pico/get-ahead',
    flag_plain: 'picoCTF{r3ad_the_h3ad3r_2d89b31d}',
    hint_1: 'Maybe you have more options than just GET and POST?',
    hint_2: 'The challenge title hints at the HTTP method you need to use: HEAD.',
    hint_3: 'Send an HTTP HEAD request using curl: curl -I http://127.0.0.1:8888/pico/get-ahead.',
    remediation_summary: 'Ensure sensitive headers and administrative debugging triggers are removed before production deployment.',
    remediation_diff: `- res.setHeader("flag", FLAG);
+ res.setHeader("Cache-Control", "no-store");`,
    quiz_question: 'What is the purpose of an HTTP HEAD request?',
    quiz_options: [
      'It asks for the response headers identical to a GET request, but without the response body',
      'It sends encrypted headers only',
      'It deletes headers from the server',
      'It reboots the web server daemon'
    ],
    quiz_answer: 'It asks for the response headers identical to a GET request, but without the response body',
    unlocked: 1,
  },
  {
    id: 'pico-web-forbidden-paths',
    order_index: 12,
    track: 'picoctf',
    title: 'Forbidden Paths',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    estimated_time: '15 min',
    xp_reward: 150,
    description: 'Can you get the flag? The server filters absolute paths starting with /, but can you navigate up the directory tree using relative paths?',
    learning_objectives: 'Understand Directory Traversal / Path Traversal vulnerabilities; learn how ../ breaks out of the web root.',
    prerequisites: 'Basic knowledge of Linux directory hierarchy.',
    safety_notes: 'Simulated sandbox path traversal.',
    target_url: 'http://127.0.0.1:8888/pico/forbidden-paths',
    flag_plain: 'picoCTF{7h3_p47h_70_5ucc355_e5a4f781}',
    hint_1: 'The site doesn\'t allow paths starting with /. Can you use relative paths?',
    hint_2: 'Try using ../ to move up directories from /usr/share/nginx/html.',
    hint_3: 'Enter ../../../../flag.txt into the filename input field to read the root flag file.',
    remediation_summary: 'Validate and canonicalize all file paths; verify that the resolved path starts with the allowed base directory.',
    remediation_diff: `- const filePath = path.join(BASE_DIR, userInput);
+ const resolved = path.resolve(BASE_DIR, userInput);
+ if (!resolved.startsWith(BASE_DIR)) throw new Error("Access Denied");`,
    quiz_question: 'Which sequence of characters is typically used in Path Traversal attacks to climb up directories?',
    quiz_options: ['../', '&&', '||', '--'],
    quiz_answer: '../',
    unlocked: 1,
  },

  // --- Cryptography ---
  {
    id: 'pico-crypto-mod26',
    order_index: 13,
    track: 'picoctf',
    title: 'Mod 26',
    category: 'Cryptography',
    difficulty: 'Easy',
    estimated_time: '10 min',
    xp_reward: 100,
    description: 'Cryptography can be easy, do you know what ROT13 is? Decode this message: cvpbPGS{arkg_gvzr_V\'yy_gel_2_ebhaqf_bs_ebg13_GYFjXn9w}',
    learning_objectives: 'Understand symmetric rotation ciphers; master the Caesar / ROT13 algorithm; decode monoalphabetic ciphers.',
    prerequisites: 'Basic awareness of rotation ciphers.',
    safety_notes: 'Pure cryptography puzzle.',
    target_url: 'http://127.0.0.1:8888/pico/crypto-rot13',
    flag_plain: 'picoCTF{next_time_I\'ll_try_2_rounds_of_rot13_TLFwKn9j}',
    hint_1: 'ROT13 rotates every letter by 13 positions forward (or backward).',
    hint_2: 'Numbers and special symbols remain unchanged.',
    hint_3: 'Use the built-in decoder widget or CyberChef to translate the ROT13 ciphertext.',
    remediation_summary: 'ROT13 and Caesar ciphers provide zero confidentiality against attackers. Use AES-GCM or ChaCha20.',
    remediation_diff: `- const encrypted = rot13(secret);
+ const encrypted = crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);`,
    quiz_question: 'How many times do you need to apply ROT13 to return to the original plaintext?',
    quiz_options: ['2 times (13 + 13 = 26)', '13 times', '26 times', '1 time'],
    quiz_answer: '2 times (13 + 13 = 26)',
    unlocked: 1,
  },
  {
    id: 'pico-crypto-the-numbers',
    order_index: 14,
    track: 'picoctf',
    title: 'The Numbers',
    category: 'Cryptography',
    difficulty: 'Easy',
    estimated_time: '10 min',
    xp_reward: 100,
    description: 'The numbers... what do they mean? 16 9 3 15 3 20 6 { 20 8 5 14 21 13 2 5 18 19 13 1 19 15 14 }',
    learning_objectives: 'Understand A1Z26 substitution; map numerical values 1-26 to alphabet letters A-Z.',
    prerequisites: 'Basic cipher awareness.',
    safety_notes: 'Offline cryptography decoding.',
    target_url: 'http://127.0.0.1:8888/pico/crypto-numbers',
    flag_plain: 'picoCTF{thenumbersmason}',
    hint_1: 'Notice the first numbers: 16=P, 9=I, 3=C, 15=O, 3=C, 20=T, 6=F.',
    hint_2: 'The brackets { } are preserved as part of the flag format.',
    hint_3: 'Translate 20=T, 8=H, 5=E, 14=N, 21=U, 13=M, 2=B, 5=E, 18=R, 19=S, 13=M, 1=A, 19=S, 15=O, 14=N.',
    remediation_summary: 'Simple substitution is vulnerable to direct frequency analysis and trivial substitution.',
    remediation_diff: `- const code = text.split('').map(c => c.charCodeAt(0) - 64).join(' ');
+ const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);`,
    quiz_question: 'What is the name of the cipher where A=1, B=2, ..., Z=26?',
    quiz_options: ['A1Z26 Substitution Cipher', 'RSA 2048', 'Diffie-Hellman', 'Elliptic Curve'],
    quiz_answer: 'A1Z26 Substitution Cipher',
    unlocked: 1,
  },

  // --- Forensics ---
  {
    id: 'pico-forensics-information',
    order_index: 15,
    track: 'picoctf',
    title: 'Information',
    category: 'Forensics',
    difficulty: 'Easy',
    estimated_time: '15 min',
    xp_reward: 100,
    description: 'Files can always have secret data tucked inside them. Inspect the metadata tags of cat.jpg to find the hidden base64 string.',
    learning_objectives: 'Learn EXIF metadata extraction; inspect hidden file tags; decode Base64 strings found in media headers.',
    prerequisites: 'Knowledge of image metadata and Base64.',
    safety_notes: 'Confined to local sandbox image analysis.',
    target_url: 'http://127.0.0.1:8888/pico/forensics-exif',
    flag_plain: 'picoCTF{th3_m3tadata_1s_modified_c1e2a492}',
    hint_1: 'Look at the EXIF data of the image using exiftool or the in-app inspector.',
    hint_2: 'Notice the "Artist" tag contains: cGljb0NURnt0aDNfbTN0YWRhdGFfMXNfbW9kaWZpZWRfYzFlMmE0OTJ9.',
    hint_3: 'Decode the base64 string: echo "cGljb0NURnt0aDNfbTN0YWRhdGFfMXNfbW9kaWZpZWRfYzFlMmE0OTJ9" | base64 -d.',
    remediation_summary: 'Always strip EXIF metadata from uploaded user media before saving to public storage.',
    remediation_diff: `- await uploadToS3(rawUserImage);
+ const stripped = await sharp(rawUserImage).rotate().toBuffer(); // strips EXIF metadata`,
    quiz_question: 'Which tool is most commonly used in digital forensics to view EXIF image metadata?',
    quiz_options: ['exiftool', 'sqlmap', 'nmap', 'hydra'],
    quiz_answer: 'exiftool',
    unlocked: 1,
  },
  {
    id: 'pico-forensics-matryoshka',
    order_index: 16,
    track: 'picoctf',
    title: 'Matryoshka Doll',
    category: 'Forensics',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 150,
    description: 'Matryoshka dolls are a set of traditional Russian wooden dolls of decreasing size placed one inside another. Inspect the image for nested files.',
    learning_objectives: 'Learn file carving and binwalk techniques; extract nested zip archives from image files.',
    prerequisites: 'Knowledge of file headers and archive extraction.',
    safety_notes: 'Sandbox forensic file analysis.',
    target_url: 'http://127.0.0.1:8888/pico/forensics-matryoshka',
    flag_plain: 'picoCTF{3xp4nd3d_1n_th3_d3pth5_839a041f}',
    hint_1: 'Use binwalk or a hex editor to search for zip file magic bytes (PK\\x03\\x04) appended to the image.',
    hint_2: 'Keep extracting the nested layers: dolls.jpg -> 2_c.jpg -> 3_c.jpg -> 4_c.jpg -> flag.txt.',
    hint_3: 'Inside the final extracted archive layer is flag.txt containing picoCTF{3xp4nd3d_1n_th3_d3pth5_839a041f}.',
    remediation_summary: 'Validate file signatures and truncate trailing file payloads to prevent steganographic data exfiltration.',
    remediation_diff: `- saveFileAsIs(uploadedBuffer);
+ const validated = sanitizeImageBuffer(uploadedBuffer);`,
    quiz_question: 'Which forensic utility is standard for searching binary files for embedded file signatures and archives?',
    quiz_options: ['binwalk', 'ping', 'ssh', 'traceroute'],
    quiz_answer: 'binwalk',
    unlocked: 1,
  },

  // --- Reverse Engineering & Binary Exploitation ---
  {
    id: 'pico-rev-transformation',
    order_index: 17,
    track: 'picoctf',
    title: 'Transformation',
    category: 'Reverse Engineering',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 200,
    description: 'I wonder what this really is... Enc’d file: 灩捯䍔䙻ㄶ形楴獟楮獴㌴摟潦弸弲㘶㠴挲ぽ. Generated with: \'\' .join([chr((ord(flag[i]) << 8) + ord(flag[i + 1])) for i in range(0, len(flag), 2)])',
    learning_objectives: 'Reverse bitwise transformations; reconstruct byte pairs from 16-bit packed characters; implement python reverse decoders.',
    prerequisites: 'Basic Python & bitwise operations.',
    safety_notes: 'Reverse engineering challenge.',
    target_url: 'http://127.0.0.1:8888/pico/reverse-transformation',
    flag_plain: 'picoCTF{16_bits_inst34d_of_8_26684c70}',
    hint_1: 'Each 16-bit character was packed by combining two 8-bit ASCII characters: (char1 << 8) + char2.',
    hint_2: 'To unpack: char1 = chr(ord(c) >> 8) and char2 = chr(ord(c) & 0xFF).',
    hint_3: 'Reverse the bitwise shift: extract the high byte (c >> 8) and low byte (c & 0xFF) for each character in Python or the sandbox solver.',
    remediation_summary: 'Bitwise packing obfuscates data but provides zero cryptographic strength against disassembly.',
    remediation_diff: `- const obfuscated = pack16(secret);
+ const encrypted = encryptWithPublicKey(secret, serverPublicKey);`,
    quiz_question: 'In the expression (char1 << 8) + char2, how many bits is char1 shifted left by?',
    quiz_options: ['8 bits (1 byte)', '16 bits', '32 bits', '4 bits'],
    quiz_answer: '8 bits (1 byte)',
    unlocked: 1,
  },
  {
    id: 'pico-bin-gdb-testdrive',
    order_index: 18,
    track: 'picoctf',
    title: 'GDB Test Drive',
    category: 'Binary Exploitation',
    difficulty: 'Medium',
    estimated_time: '25 min',
    xp_reward: 200,
    description: 'Can you get the flag? Start the binary under GDB, set a breakpoint on the target instruction to skip the sleep function, and examine register values.',
    learning_objectives: 'Learn GDB debugging commands; set breakpoints; step through assembly instructions; inspect memory.',
    prerequisites: 'Basic Linux terminal and assembly comprehension.',
    safety_notes: 'Runs inside the isolated local terminal sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/binary-gdb',
    flag_plain: 'picoCTF{d3bugg1ng_1s_4_5p0rt_829fa03e}',
    hint_1: 'Run the simulated GDB session by clicking "Start Debug Session".',
    hint_2: 'Set a breakpoint at main+99: break *(main+99), then enter "run" and "jump *(main+104)".',
    hint_3: 'In GDB, run break *(main+99) then run then jump *(main+104) to skip the delay instruction and print the flag.',
    remediation_summary: 'Strip binary symbols and compile with stack canaries, ASLR, and full RELRO.',
    remediation_diff: `- gcc vuln.c -o vuln
+ gcc -O2 -fstack-protector-strong -D_FORTIFY_SOURCE=2 -Wl,-z,relro,-z,now vuln.c -s -o vuln`,
    quiz_question: 'Which GDB command is used to set a breakpoint at a specific address or function?',
    quiz_options: ['break (b)', 'delete', 'quit', 'kill'],
    quiz_answer: 'break (b)',
    unlocked: 1,
  },

  // --- Additional Web Exploitation Attacks ---
  {
    id: 'pico-web-cmd-inject',
    order_index: 19,
    track: 'picoctf',
    title: 'Command Injection',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    estimated_time: '15 min',
    xp_reward: 150,
    description: 'The server provides an online network ping utility to test host connectivity. Can you inject shell commands to read the hidden flag file?',
    learning_objectives: 'Understand OS command injection vulnerabilities; exploit command separators (; , &&, |); explore defensive command parameterization.',
    prerequisites: 'Basic Linux shell commands (cat, ls).',
    safety_notes: 'Executed in the isolated sandbox environment.',
    target_url: 'http://127.0.0.1:8888/pico/cmd-inject',
    flag_plain: 'picoCTF{c0mm4nd_1nj3ct10n_succ3ss_8f1a92e1}',
    hint_1: 'How do you run multiple commands on a single Linux or Windows command line?',
    hint_2: 'Try appending a semicolon or ampersand: 127.0.0.1; cat /flag.txt or 127.0.0.1 && cat flag.txt',
    hint_3: 'Enter 127.0.0.1; cat flag.txt into the IP address field and submit.',
    remediation_summary: 'Never pass unsanitized user input into system shell execution functions like exec(), system(), or popen(). Use child_process.execFile with parameter arrays.',
    remediation_diff: `- // Vulnerable: Direct shell interpolation
- exec("ping -c 1 " + req.body.ip, (err, stdout) => { ... });

+ // Remediated: Parameterized execution without shell
+ execFile("/bin/ping", ["-c", "1", req.body.ip], (err, stdout) => { ... });`,
    quiz_question: 'Which character acts as a command separator in Unix shells, allowing chained execution of a second command?',
    quiz_options: ['; (semicolon)', '@ (at sign)', '# (hash)', '~ (tilde)'],
    quiz_answer: '; (semicolon)',
    unlocked: 1,
  },
  {
    id: 'pico-web-xss-eval',
    order_index: 20,
    track: 'picoctf',
    title: 'Cross-Site Scripting (XSS)',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    estimated_time: '15 min',
    xp_reward: 150,
    description: 'A community bulletin board renders user feedback directly into the DOM without sanitization. Craft an XSS payload to trigger the admin viewer payload and exfiltrate the flag.',
    learning_objectives: 'Understand Reflected and Stored Cross-Site Scripting (XSS); learn how unencoded HTML/JS execution steals cookies; implement Context-Aware Output Encoding and Content Security Policy (CSP).',
    prerequisites: 'Basic HTML & JavaScript.',
    safety_notes: 'Contained to the local sandbox browser session.',
    target_url: 'http://127.0.0.1:8888/pico/xss-eval',
    flag_plain: 'picoCTF{xss_s3cur1ty_byp4ss_alert_91c34a2e}',
    hint_1: 'Try submitting simple HTML formatting tags like <b>bold</b> or <u>underline</u> to see if the server filters HTML.',
    hint_2: 'Input a standard JavaScript payload: <script>alert(1)</script> or <img src=x onerror="alert(document.cookie)">',
    hint_3: 'Submit <script>alert(1)</script> or click "Trigger Simulated Admin Visit" to execute the payload and receive the flag.',
    remediation_summary: 'Cross-Site Scripting occurs when untrusted input is reflected or rendered into web documents without proper context encoding. Remediate with HTML escaping and Content-Security-Policy headers.',
    remediation_diff: `- // Vulnerable: Direct innerHTML injection
- element.innerHTML = userComment;

+ // Remediated: Safe textContent or DOMPurify
+ element.textContent = userComment;`,
    quiz_question: 'What is the most effective defense against Cross-Site Scripting (XSS)?',
    quiz_options: [
      'Context-aware output encoding (HTML escaping) and strict Content Security Policy (CSP)',
      'Storing passwords in MD5',
      'Using HTTP POST instead of GET',
      'Minifying JavaScript files'
    ],
    quiz_answer: 'Context-aware output encoding (HTML escaping) and strict Content Security Policy (CSP)',
    unlocked: 1,
  },
  {
    id: 'pico-web-sqli-search',
    order_index: 21,
    track: 'picoctf',
    title: 'SQLi: UNION Exfiltration',
    category: 'Web Exploitation',
    difficulty: 'Hard',
    estimated_time: '20 min',
    xp_reward: 200,
    description: 'The search catalog queries a product database. Use a UNION-based SQL Injection payload to combine the product results with the secret database table.',
    learning_objectives: 'Learn UNION-based SQL injection techniques; match column counts and data types; extract records from hidden database tables.',
    prerequisites: 'Basic SQL SELECT syntax.',
    safety_notes: 'Runs inside the local SQLite database sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/sqli-search',
    flag_plain: 'picoCTF{un10n_b4s3d_3xf1ltr4t10n_48da1e92}',
    hint_1: 'Determine the number of columns returned by the query using: \' ORDER BY 1 --, \' ORDER BY 2 --, etc.',
    hint_2: 'The query returns 3 columns. Try: \' UNION SELECT 1, flag, 3 FROM secret_vault --',
    hint_3: 'Search for: \' UNION SELECT 1, flag, 3 FROM secret_vault -- to output the secret flag in the product title column.',
    remediation_summary: 'UNION SQL injection allows unauthorized attackers to read any table accessible to the database user. Always use parameterized queries.',
    remediation_diff: `- const query = "SELECT id, name, price FROM items WHERE name LIKE '%" + search + "%'";
+ const query = "SELECT id, name, price FROM items WHERE name LIKE ?";
+ db.all(query, ['%' + search + '%']);`,
    quiz_question: 'What requirement must be met for an SQL UNION operator to succeed?',
    quiz_options: [
      'Both SELECT statements must return the same number of columns with compatible data types',
      'Both tables must have identical names',
      'The database must be MySQL',
      'The query must run over HTTPS'
    ],
    quiz_answer: 'Both SELECT statements must return the same number of columns with compatible data types',
    unlocked: 1,
  },

  // --- Additional Cryptography Attacks ---
  {
    id: 'pico-crypto-caesar',
    order_index: 22,
    track: 'picoctf',
    title: 'Caesar Cipher',
    category: 'Cryptography',
    difficulty: 'Easy',
    estimated_time: '10 min',
    xp_reward: 100,
    description: 'Decrypt the classical Caesar cipher message with unknown shift: wpjvJTM{j43s4r_c1ph3r_sh1ft_k3y_92a10bf8}. Adjust the shift key until recognizable English words emerge.',
    learning_objectives: 'Understand Caesar substitution ciphers; perform shift key frequency analysis and brute-force key search.',
    prerequisites: 'Basic alphabet knowledge.',
    safety_notes: 'Classical cryptography decoding.',
    target_url: 'http://127.0.0.1:8888/pico/crypto-caesar',
    flag_plain: 'picoCTF{c43s4r_c1ph3r_sh1ft_k3y_92a10bf8}',
    hint_1: 'The flag format starts with "picoCTF{". Compare "w" to "p" to calculate the shift distance.',
    hint_2: 'From \'w\' (23) backwards to \'p\' (16) is a shift of 7 positions.',
    hint_3: 'Use the interactive Caesar slider set to shift 7 (or 19 forward) to decode the flag.',
    remediation_summary: 'Caesar ciphers have a keyspace of only 25 possible shifts, making them breakable in microseconds. Use modern authenticated ciphers like AES-GCM.',
    remediation_diff: `- const encrypted = caesarShift(secret, 7);
+ const encrypted = crypto.createCipheriv('aes-256-gcm', key, iv);`,
    quiz_question: 'What is the maximum keyspace size (number of possible keys) in a standard 26-letter Caesar cipher?',
    quiz_options: ['25 possible non-trivial keys', '256 keys', '65,536 keys', '1,000,000 keys'],
    quiz_answer: '25 possible non-trivial keys',
    unlocked: 1,
  },
  {
    id: 'pico-crypto-vigenere',
    order_index: 23,
    track: 'picoctf',
    title: 'Vigenère Cipher',
    category: 'Cryptography',
    difficulty: 'Medium',
    estimated_time: '15 min',
    xp_reward: 150,
    description: 'Can you decrypt this polyalphabetic Vigenère ciphertext: rgkoEVG{v1g3n3r3_c1ph3r_cr4ck3d_48f12a3d}? We intercepted the secret keyword: CYBER.',
    learning_objectives: 'Understand polyalphabetic ciphers; master the Vigenère tableau; repeat key strings across plaintext characters.',
    prerequisites: 'Caesar cipher familiarity.',
    safety_notes: 'Polyalphabetic decryption.',
    target_url: 'http://127.0.0.1:8888/pico/crypto-vigenere',
    flag_plain: 'picoCTF{v1g3n3r3_c1ph3r_cr4ck3d_48f12a3d}',
    hint_1: 'The Vigenère cipher uses a repeating key word. Here the key is "CYBER".',
    hint_2: 'For each alphabetic letter, subtract the shift of the corresponding key letter (A=0, B=1, C=2, etc.). Non-alphabetic characters remain untouched.',
    hint_3: 'Use the Vigenère decipher tool in the sandbox with key "CYBER" to decrypt the flag.',
    remediation_summary: 'Polyalphabetic substitution ciphers like Vigenère are vulnerable to Kasiski examination and index of coincidence analysis.',
    remediation_diff: `- const cipher = vigenereEncrypt(msg, "KEY");
+ const cipher = modernAsymmetricEncrypt(msg, recipientPublicKey);`,
    quiz_question: 'Which cryptanalytic method is historically famous for breaking Vigenère ciphers by finding repeating sequence distances?',
    quiz_options: ['Kasiski Examination', 'Frequency Analysis of Single Characters', 'Rainbow Tables', 'SQL Injection'],
    quiz_answer: 'Kasiski Examination',
    unlocked: 1,
  },
  {
    id: 'pico-crypto-rsa-easy',
    order_index: 24,
    track: 'picoctf',
    title: 'RSA: Small Public Exponent',
    category: 'Cryptography',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 150,
    description: 'An insecure RSA implementation encrypted a short message with public exponent e = 3 and a very large modulus N. Since m^3 < N, no modular reduction occurred!',
    learning_objectives: 'Understand asymmetric public key cryptography (RSA); learn how small exponents without proper OAEP padding allow direct cube root decryption.',
    prerequisites: 'Basic modular arithmetic and exponentiation.',
    safety_notes: 'Educational asymmetric crypto lab.',
    target_url: 'http://127.0.0.1:8888/pico/crypto-rsa',
    flag_plain: 'picoCTF{sm4ll_e_cwb3_r00t_4tt4ck_7d92a1f0}',
    hint_1: 'In RSA, ciphertext c = m^e (mod N). If m^e is smaller than N, then c = m^e in standard integer arithmetic.',
    hint_2: 'Since e = 3, m is simply the integer cube root of c: m = round(c^(1/3)).',
    hint_3: 'Compute the integer cube root of c (using Python gmpy2.iroot(c, 3) or calculator), then verify m to decode the ASCII flag.',
    remediation_summary: 'Never use RSA with small exponents without cryptographically secure padding schemes like RSA-OAEP.',
    remediation_diff: `- // Vulnerable: Raw textbook RSA without padding
- const c = BigInt(m) ** 3n % N;

+ // Remediated: RSA with OAEP padding
+ const c = crypto.publicEncrypt({ key: pubKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, m);`,
    quiz_question: 'Why is "textbook RSA" without random padding like OAEP vulnerable?',
    quiz_options: [
      'It is deterministic and small messages with e=3 do not wrap around the modulus, enabling direct nth-root recovery',
      'It only works on prime numbers',
      'It uses symmetric keys',
      'It slows down CPUs'
    ],
    quiz_answer: 'It is deterministic and small messages with e=3 do not wrap around the modulus, enabling direct nth-root recovery',
    unlocked: 1,
  },
  {
    id: 'pico-crypto-xor',
    order_index: 25,
    track: 'picoctf',
    title: 'Single-Byte XOR',
    category: 'Cryptography',
    difficulty: 'Medium',
    estimated_time: '15 min',
    xp_reward: 150,
    description: 'A message was encrypted by XORing every character with a single hidden byte key (0x00 to 0xFF). Brute-force the 256 possible keys to read the decrypted plaintext.',
    learning_objectives: 'Understand bitwise XOR (^) properties; recognize XOR reversibility (A ^ B ^ B = A); automate single-byte key searching.',
    prerequisites: 'Hexadecimal numbers and bitwise operations.',
    safety_notes: 'Contained crypto lab.',
    target_url: 'http://127.0.0.1:8888/pico/crypto-xor',
    flag_plain: 'picoCTF{x0r_k3y_brut3_f0rc3_d0n3_1a2f9c84}',
    hint_1: 'Since a single byte has only 256 possible values (0-255), brute-forcing every key takes less than a millisecond.',
    hint_2: 'Look for the decrypted result that begins with the known flag header "picoCTF{".',
    hint_3: 'Slide the XOR key slider to 0x5A (decimal 90) until readable text starting with picoCTF{ appears.',
    remediation_summary: 'Single-byte or repeated-key XOR is easily broken using frequency analysis or crib dragging. Use authenticated encryption.',
    remediation_diff: `- const enc = data.map(b => b ^ singleKey);
+ const cipher = crypto.createCipheriv('chacha20-poly1305', key, nonce);`,
    quiz_question: 'What is the result of the bitwise XOR operation (A ^ B) ^ B?',
    quiz_options: ['A', '0', 'B', '2 * A'],
    quiz_answer: 'A',
    unlocked: 1,
  },

  // --- Additional Forensics Attacks ---
  {
    id: 'pico-forensics-wireshark',
    order_index: 26,
    track: 'picoctf',
    title: 'Wireshark Packet Analysis',
    category: 'Forensics',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 150,
    description: 'We intercepted a network packet capture (.pcap) containing unencrypted HTTP traffic. Inspect the TCP streams to discover submitted credentials and the transmission flag.',
    learning_objectives: 'Analyze network packets; follow TCP streams; filter unencrypted HTTP POST traffic; understand risks of cleartext protocols.',
    prerequisites: 'Basic knowledge of IP networking and HTTP.',
    safety_notes: 'Simulated packet analyzer on local synthetic traffic.',
    target_url: 'http://127.0.0.1:8888/pico/forensics-pcap',
    flag_plain: 'picoCTF{p4ck3t_sn1ff1ng_w1r3sh4rk_92af401e}',
    hint_1: 'Filter packets by protocol: search for HTTP requests or apply a filter like http.request.method == "POST".',
    hint_2: 'Follow TCP Stream 3 to read the conversation between client and authentication server.',
    hint_3: 'Inspect the POST body in packet #14: the user submitted secret_auth_flag=picoCTF{p4ck3t_sn1ff1ng_w1r3sh4rk_92af401e}.',
    remediation_summary: 'Plaintext protocols (HTTP, FTP, Telnet) expose passwords and session tokens to any eavesdropper on the local network. Enforce TLS 1.3 / HTTPS with HSTS.',
    remediation_diff: `- // Insecure cleartext HTTP listener
- http.createServer(app).listen(80);

+ // Secure TLS HTTPS listener
+ https.createServer({ key, cert }, app).listen(443);`,
    quiz_question: 'Which Wireshark feature reconstructs and displays an entire two-way TCP conversation as human-readable text?',
    quiz_options: ['Follow TCP Stream', 'Ping Sweep', 'Traceroute Graph', 'ARP Poisoning'],
    quiz_answer: 'Follow TCP Stream',
    unlocked: 1,
  },
  {
    id: 'pico-forensics-file-types',
    order_index: 27,
    track: 'picoctf',
    title: 'Corrupted File Header',
    category: 'Forensics',
    difficulty: 'Medium',
    estimated_time: '15 min',
    xp_reward: 150,
    description: 'An attacker damaged the magic bytes (file signature) of an image containing secret flag data. Inspect the hex dump, repair the corrupted header, and extract the flag.',
    learning_objectives: 'Understand file signatures (magic bytes); identify PNG file headers (89 50 4E 47 0D 0A 1A 0A); edit hex bytes to restore damaged files.',
    prerequisites: 'Basic hex dump familiarity.',
    safety_notes: 'Hex editing in browser sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/forensics-magic-bytes',
    flag_plain: 'picoCTF{m4g1c_byt3s_r3st0r3d_f1l3_4c81a92e}',
    hint_1: 'Every valid PNG file starts with the exact 8-byte sequence: 89 50 4E 47 0D 0A 1A 0A (.PNG....).',
    hint_2: 'Notice the first four bytes are corrupted to: 00 00 00 00.',
    hint_3: 'Enter the 4 PNG magic bytes (89 50 4E 47) into the hex editor header fields and click Apply Hex Patch.',
    remediation_summary: 'Relying solely on file extensions for security checks is unsafe because file extensions can be renamed. Verify magic bytes on the server.',
    remediation_diff: `- // Insecure: Extension check only
- if (file.name.endsWith('.png')) accept();

+ // Secure: Magic bytes signature verification
+ const magic = buffer.slice(0, 8);
+ if (!magic.equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) throw new Error("Invalid file header");`,
    quiz_question: 'What are the first four hexadecimal magic bytes that identify a PNG image file?',
    quiz_options: ['89 50 4E 47', 'FF D8 FF E0', '4D 5A 90 00', '50 4B 03 04'],
    quiz_answer: '89 50 4E 47',
    unlocked: 1,
  },

  // --- Additional Reverse Engineering Attacks ---
  {
    id: 'pico-rev-strings',
    order_index: 28,
    track: 'picoctf',
    title: 'Static Analysis: Strings',
    category: 'Reverse Engineering',
    difficulty: 'Easy',
    estimated_time: '10 min',
    xp_reward: 100,
    description: 'Can you find the flag in an unstripped binary without running it? Run static string extraction on the executable to uncover hardcoded secrets.',
    learning_objectives: 'Perform static binary triage; use the Linux strings utility; filter output with grep; identify unstripped debug symbols.',
    prerequisites: 'Basic terminal command knowledge.',
    safety_notes: 'Static binary analysis sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/reverse-strings',
    flag_plain: 'picoCTF{str1ngs_3xtr4ct10n_b1n4ry_31a9fd20}',
    hint_1: 'The Linux strings command prints printable character sequences that are at least 4 characters long.',
    hint_2: 'Combine strings with grep: strings mystery_bin | grep picoCTF',
    hint_3: 'Run strings mystery_bin | grep pico in the interactive terminal to extract the hardcoded flag.',
    remediation_summary: 'Never hardcode API keys, passwords, or encryption secrets in client binaries. Always strip symbols and use external key stores.',
    remediation_diff: `- const SECRET_TOKEN = "picoCTF{hardcoded_key}";
+ const token = await fetchSecretFromKms();`,
    quiz_question: 'Which standard command line tool extracts printable ASCII strings from compiled binary executables?',
    quiz_options: ['strings', 'cat', 'chmod', 'chown'],
    quiz_answer: 'strings',
    unlocked: 1,
  },
  {
    id: 'pico-rev-crackme',
    order_index: 29,
    track: 'picoctf',
    title: 'Crackme: Keygen Logic',
    category: 'Reverse Engineering',
    difficulty: 'Medium',
    estimated_time: '20 min',
    xp_reward: 150,
    description: 'Decompile the key verification routine of a protected license checker. Reverse the mathematical check to compute a valid registration key and unlock the flag.',
    learning_objectives: 'Decompile pseudo-code; analyze conditional checks; calculate expected input values from algorithmic logic.',
    prerequisites: 'Basic programming logic understanding.',
    safety_notes: 'Offline crackme reversing.',
    target_url: 'http://127.0.0.1:8888/pico/reverse-crackme',
    flag_plain: 'picoCTF{cr4ckm3_k3y_r3v3rs3d_99b01ae4}',
    hint_1: 'Examine the decompiled function check_key(input): it calculates sum(ord(c)) for the first 4 characters and compares it to 348.',
    hint_2: 'Also, input[4] must equal \'-\' and input[5..8] must match "2026".',
    hint_3: 'Calculate a 4-char prefix whose ASCII sum is 348 (e.g. WWWW since 87*4=348), enter WWWW-2026, and click Check Key.',
    remediation_summary: 'Client-side license checks can always be reverse engineered or patched. Validate licenses with cryptographically signed asymmetric tokens verified online.',
    remediation_diff: `- if (userKey === computeValidKey(username)) unlock();
+ const verified = crypto.verify(null, licenseBuffer, publicKey, signature);`,
    quiz_question: 'Why are client-side serial number verification algorithms inherently vulnerable to reverse engineering?',
    quiz_options: [
      'The binary contains both the verification logic and the expected conditions, allowing attackers to decompile and reconstruct valid keys',
      'Binaries can only run on Intel processors',
      'Compilers delete secret keys automatically',
      'The CPU architecture rejects license checks'
    ],
    quiz_answer: 'The binary contains both the verification logic and the expected conditions, allowing attackers to decompile and reconstruct valid keys',
    unlocked: 1,
  },

  // --- Additional Binary Exploitation Attacks ---
  {
    id: 'pico-bin-buffer-overflow',
    order_index: 30,
    track: 'picoctf',
    title: 'Stack Buffer Overflow',
    category: 'Binary Exploitation',
    difficulty: 'Hard',
    estimated_time: '25 min',
    xp_reward: 200,
    description: 'A C program uses the unsafe gets() function to read input into a 64-byte stack buffer. Overwrite the adjacent modified variable on the stack to trigger the win condition.',
    learning_objectives: 'Understand stack memory layouts; observe buffer overflow memory corruptions; overwrite adjacent stack variables; explore stack canaries and safe I/O functions.',
    prerequisites: 'C memory concepts (stack, buffers).',
    safety_notes: 'Simulated stack memory visualization in sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/binary-bof',
    flag_plain: 'picoCTF{st4ck_sm4sh_v4r_0v3rwr1tt3n_68f1a29d}',
    hint_1: 'The buffer allocated on the stack is char buf[64]. The integer modified is located immediately after buf in memory.',
    hint_2: 'If you supply 64 characters, the next bytes will spill over into the modified variable.',
    hint_3: 'Enter 64 characters of padding plus additional bytes (e.g. 64 "A"s followed by "BBBB") to overflow buf and modify the adjacent variable.',
    remediation_summary: 'Unsafe functions like gets() or strcpy() do not perform bounds checking. Replace with fgets() or snprintf(), and compile with stack protectors (-fstack-protector-all).',
    remediation_diff: `- // Vulnerable: Unbounded stack read
- char buf[64];
- gets(buf);

+ // Remediated: Bounds-checked input
+ char buf[64];
+ fgets(buf, sizeof(buf), stdin);`,
    quiz_question: 'Why was the `gets()` function completely removed from the official C11 ISO standard?',
    quiz_options: [
      'It cannot check buffer bounds, making stack buffer overflows inevitable with oversized input',
      'It is too slow for modern SSDs',
      'It only accepts lowercase letters',
      'It requires root privileges to compile'
    ],
    quiz_answer: 'It cannot check buffer bounds, making stack buffer overflows inevitable with oversized input',
    unlocked: 1,
  },
  {
    id: 'pico-bin-format-string',
    order_index: 31,
    track: 'picoctf',
    title: 'Format String Memory Leak',
    category: 'Binary Exploitation',
    difficulty: 'Hard',
    estimated_time: '25 min',
    xp_reward: 200,
    description: 'The program prints user input using printf(input) without a format specifier string. Supply format specifiers (%x, %p, %s) to leak private stack memory and read the hidden flag.',
    learning_objectives: 'Understand format string vulnerabilities; learn how %x and %s read parameters from stack registers; remediate by using static format specifiers (printf("%s", input)).',
    prerequisites: 'Knowledge of C printf format specifiers.',
    safety_notes: 'Simulated memory inspection sandbox.',
    target_url: 'http://127.0.0.1:8888/pico/binary-format-string',
    flag_plain: 'picoCTF{f0rm4t_str1ng_m3m0ry_l34k_22a10be8}',
    hint_1: 'When printf() encounters %x without corresponding arguments, it reads whatever values are currently on the stack.',
    hint_2: 'Supplying %s treats a value on the stack as a pointer and prints the string at that address.',
    hint_3: 'Submit %x.%x.%x.%x.%s into the input field to dump stack frames and dereference the flag pointer.',
    remediation_summary: 'Never pass user-controlled strings as the first argument to formatted output functions. Always specify the format string explicitly: printf("%s", user_str).',
    remediation_diff: `- // Vulnerable: User string as format argument
- printf(userInput);

+ // Remediated: Explicit format specifier
+ printf("%s", userInput);`,
    quiz_question: 'What happens when `printf(userInput)` is called and `userInput` contains `%x` format specifiers?',
    quiz_options: [
      'The function reads and prints values directly from subsequent stack memory positions',
      'The program reboots the operating system',
      'The compiler deletes the binary',
      'The output is automatically encrypted with AES'
    ],
    quiz_answer: 'The function reads and prints values directly from subsequent stack memory positions',
    unlocked: 1,
  }
];

export const SEED_BADGES = [
  { code: 'FIRST_FLAG', title: 'First flag captured', description: 'SQL Injection · 100 XP earned. You learned to separate input from database instructions.', icon: 'Flag' },
  { code: 'SQL_MASTER', title: 'SQL Whisperer', description: 'Successfully exploited SQL Injection logic bypass.', icon: 'Database' },
  { code: 'AUTH_CRACKER', title: 'Gate Crasher', description: 'Bypassed authentication without valid credentials.', icon: 'Key' },
  { code: 'CLEAN_RUN', title: 'Zero-Hint Master', description: 'Completed a challenge without revealing any hints.', icon: 'Zap' },
  { code: 'CHAIN_COMPLETE', title: 'Kill Chain Breaker', description: 'Completed the entire chained attack progression from web to root.', icon: 'Award' },
  { code: 'DEFENDER_MIND', title: 'Defensive Mindset', description: 'Answered all post-challenge remediation questions correctly.', icon: 'ShieldCheck' },
];
