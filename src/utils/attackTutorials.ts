export interface TutorialStep {
  stepNumber: number;
  title: string;
  instructions: string;
  actionType: 'navigate' | 'input' | 'inspect' | 'trigger' | 'extract';
  payload?: string;
  payloadLabel?: string;
  hint?: string;
}

export interface AttackTutorialData {
  challengeId: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  cwe: string;
  owasp: string;
  targetEndpoint: string;
  expectedFlag: string;
  shortInfo: {
    overview: string;
    mechanism: string;
    impact: string;
  };
  tutorialSteps: TutorialStep[];
}

export const ATTACK_TUTORIALS: Record<string, AttackTutorialData> = {
  // =========================================================================
  // 11 MERIDIAN EXPLOIT CHAIN ATTACKS
  // =========================================================================

  'ch-sqli-01': {
    challengeId: 'ch-sqli-01',
    title: 'SQL Injection',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
    owasp: 'OWASP A03:2021 – Injection',
    targetEndpoint: 'http://127.0.0.1:8888/login',
    expectedFlag: 'flag{data_not_instructions}',
    shortInfo: {
      overview: 'SQL Injection occurs when untrusted user input is directly concatenated into database queries without sanitization or parameter binding.',
      mechanism: 'The login query constructs `SELECT * FROM users WHERE username = \'<INPUT>\' AND password = \'<PASS>\'`. Supplying a boolean tautology (`\' OR 1=1 --`) causes the WHERE clause to always evaluate to true, while the `--` comment sequence drops the password check.',
      impact: 'Complete authentication bypass, unauthorized access to user accounts, and exposure of private member notes and records.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect Login Form',
        instructions: 'Locate the login form in the center sandbox browser at /login. Notice the Email or username and Password input fields.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Inject Tautology Payload',
        instructions: 'Paste the SQL injection bypass payload into the "Email or username" input field. You can click "Apply guided test input" at the bottom or copy the payload below.',
        actionType: 'input',
        payload: "' OR 1=1 --",
        payloadLabel: "SQL Tautology Payload",
        hint: "The single quote closes the string literal, OR 1=1 forces true, and -- comments out the password requirement."
      },
      {
        stepNumber: 3,
        title: 'Submit Authentication Request',
        instructions: 'Enter any dummy text into the Password field (e.g. "test") and click the "Sign in" button.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Exfiltrate Flag from Account Note',
        instructions: 'Upon login bypass, you will be redirected to Taylor\'s account overview (/account). Locate the green member note card to find the secret flag token.',
        actionType: 'extract',
        payload: "flag{data_not_instructions}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-info-02': {
    challengeId: 'ch-info-02',
    title: 'Information Disclosure',
    category: 'Reconnaissance',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    targetEndpoint: 'http://127.0.0.1:8888/info-disc',
    expectedFlag: 'flag{debug_notes_reveal_secrets}',
    shortInfo: {
      overview: 'Information Disclosure happens when web applications inadvertently expose sensitive internal files, version control metadata, or backup archives in public directories.',
      mechanism: 'Developers frequently leave dotfiles (.git, .env) or database backups (.bak) in web roots. Search engine crawlers can be inspected via /robots.txt to identify disallowed internal paths.',
      impact: 'Leakage of source code, database passwords, API credentials, and internal infrastructure configuration.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Check Search Engine Directives',
        instructions: 'In the sandbox address bar above the browser, change the URL path to /robots.txt and press Enter to view crawler rules.',
        actionType: 'navigate',
        payload: "http://127.0.0.1:8888/robots.txt",
        payloadLabel: "Robots Directives Path"
      },
      {
        stepNumber: 2,
        title: 'Inspect Disallowed Endpoints',
        instructions: 'Notice the disallowed paths listed: /.git/ and /backups/debug_conf_2026.bak.',
        actionType: 'inspect',
      },
      {
        stepNumber: 3,
        title: 'Access Exposed Configuration Backup',
        instructions: 'Navigate to http://127.0.0.1:8888/backups/debug_conf_2026.bak or http://127.0.0.1:8888/.git/config in the sandbox browser.',
        actionType: 'trigger',
        payload: "http://127.0.0.1:8888/backups/debug_conf_2026.bak",
        payloadLabel: "Exposed Backup URI"
      },
      {
        stepNumber: 4,
        title: 'Extract Disclosed Flag',
        instructions: 'Read the plain-text configuration file containing the production environment secrets and copy the flag token.',
        actionType: 'extract',
        payload: "flag{debug_notes_reveal_secrets}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-auth-03': {
    challengeId: 'ch-auth-03',
    title: 'Authentication',
    category: 'Web Security',
    difficulty: 'Easy',
    xpReward: 150,
    cwe: 'CWE-287: Improper Authentication',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    targetEndpoint: 'http://127.0.0.1:8888/auth',
    expectedFlag: 'flag{auth_boundary_bypassed}',
    shortInfo: {
      overview: 'Authentication vulnerabilities allow attackers to bypass login barriers and assume identities without possessing valid credentials.',
      mechanism: 'The administrative gateway constructs an inline SQL verification query where the password check is stripped when comment operators (-- or /*) follow the administrator username.',
      impact: 'Full administrative takeover of the management gateway and unauthenticated privilege acquisition.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Navigate to Admin Gateway',
        instructions: 'Ensure the sandbox browser is viewing http://127.0.0.1:8888/auth. You will see the "Meridian Admin Gateway" login form.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Craft Admin Comment Bypass',
        instructions: 'Enter the admin comment truncation payload into the Admin Username field.',
        actionType: 'input',
        payload: "admin' --",
        payloadLabel: "Admin Bypass Payload",
        hint: "The single quote ends the username string and -- turns the rest of the query into a comment."
      },
      {
        stepNumber: 3,
        title: 'Submit Admin Login',
        instructions: 'Click "Sign in as Admin". The database executes the query matching username="admin" and ignores the password clause.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Retrieve Admin Flag Token',
        instructions: 'The green success box will appear showing "Administrative boundary bypassed!" with the flag.',
        actionType: 'extract',
        payload: "flag{auth_boundary_bypassed}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-idor-04': {
    challengeId: 'ch-idor-04',
    title: 'XSS / IDOR',
    category: 'API & Web Security',
    difficulty: 'Medium',
    xpReward: 150,
    cwe: 'CWE-639: Authorization Bypass Through User-Controlled Key (IDOR)',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    targetEndpoint: 'http://127.0.0.1:8888/support?id=104',
    expectedFlag: 'flag{idor_ticket_exposed_991}',
    shortInfo: {
      overview: 'Insecure Direct Object References (IDOR) happen when an application uses client-supplied input to access database records without verifying authorization.',
      mechanism: 'The support ticket viewer reads `?id=104` directly from the URL query parameter and queries the database without checking whether the requesting user owns that ticket.',
      impact: 'Unauthorized access to other users\' private support inquiries, sensitive personal information, and internal confidential executive records.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect Active Ticket Parameter',
        instructions: 'Observe the current URL in the sandbox address bar: http://127.0.0.1:8888/support?id=104. Note the numeric parameter id=104.',
        actionType: 'inspect',
      },
      {
        stepNumber: 2,
        title: 'Enumerate Direct Object References',
        instructions: 'In the address bar, edit the URL query parameter to decrement or test lower sequential IDs, specifically id=100.',
        actionType: 'input',
        payload: "http://127.0.0.1:8888/support?id=100",
        payloadLabel: "Confidential Ticket URL"
      },
      {
        stepNumber: 3,
        title: 'Navigate to Ticket #100',
        instructions: 'Press Enter or click the link "Confidential (#100)" at the bottom of the ticket page.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Extract Flag from Audit Findings',
        instructions: 'Read the red confidential ticket titled "CONFIDENTIAL: Meridian Audit Findings" and copy the flag.',
        actionType: 'extract',
        payload: "flag{idor_ticket_exposed_991}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-upload-05': {
    challengeId: 'ch-upload-05',
    title: 'File Upload',
    category: 'System Compromise',
    difficulty: 'Medium',
    xpReward: 200,
    cwe: 'CWE-434: Unrestricted Upload of File with Dangerous Type',
    owasp: 'OWASP A04:2021 – Insecure Design',
    targetEndpoint: 'http://127.0.0.1:8888/upload',
    expectedFlag: 'flag{file_upload_shell_exec}',
    shortInfo: {
      overview: 'Unrestricted File Upload occurs when a web server allows users to upload files with arbitrary extensions into directories executed by the server script engine.',
      mechanism: 'The avatar upload endpoint fails to enforce an extension whitelist (.png, .jpg) and writes user files into an executable directory where .php or .phtml files trigger server-side code execution.',
      impact: 'Remote Code Execution (RCE), complete web server compromise, and unauthorized file system read/write access.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Open Avatar Upload Form',
        instructions: 'Ensure the sandbox browser is on http://127.0.0.1:8888/upload. You will see the Meridian Avatar Upload form.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Specify Executable Script Extension',
        instructions: 'In the "Filename" input field, specify an executable PHP script name such as shell.php or exploit.phtml.',
        actionType: 'input',
        payload: "shell.php",
        payloadLabel: "Executable Shell Filename",
        hint: "Server-side script extensions like .php or .phtml are executed by the web server runtime."
      },
      {
        stepNumber: 3,
        title: 'Upload and Trigger Execution',
        instructions: 'Click the "Upload & Execute" button. The server writes the file and validates code execution.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Capture Remote Execution Flag',
        instructions: 'The response banner will confirm "PHP Execution Verified!" and output the flag token.',
        actionType: 'extract',
        payload: "flag{file_upload_shell_exec}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-privesc-06': {
    challengeId: 'ch-privesc-06',
    title: 'Privilege Escalation',
    category: 'System Exploitation',
    difficulty: 'Medium',
    xpReward: 250,
    cwe: 'CWE-269: Improper Privilege Management',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    targetEndpoint: 'http://127.0.0.1:8888/terminal',
    expectedFlag: 'flag{privesc_root_access_granted}',
    shortInfo: {
      overview: 'Linux privilege escalation involves elevating privileges from a restricted user account (e.g. www-data) to the superuser (root).',
      mechanism: 'The /etc/sudoers file misconfiguration allows user `www-data` to run `/usr/bin/find` as root without a password (NOPASSWD). Attackers leverage GTFOBins breakout flags (`-exec /bin/sh \\;`) to spawn a root shell.',
      impact: 'Complete operating system compromise, full root terminal control, and unrestricted access to all host files.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Open Console Terminal',
        instructions: 'In the sandbox browser at /terminal, you will see the interactive MERIDIAN-01 terminal prompt for user www-data.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Enumerate Sudo Privileges',
        instructions: 'Type `sudo -l` into the command input and press Enter to list commands permitted with superuser privileges.',
        actionType: 'input',
        payload: "sudo -l",
        payloadLabel: "Sudo Enumeration Command",
        hint: "Output reveals: (root) NOPASSWD: /usr/bin/find."
      },
      {
        stepNumber: 3,
        title: 'Execute GTFOBins Root Breakout',
        instructions: 'Enter the `find -exec` privilege escalation command into the terminal prompt and press Enter.',
        actionType: 'trigger',
        payload: "sudo find . -exec /bin/sh \\;",
        payloadLabel: "Root Breakout Command"
      },
      {
        stepNumber: 4,
        title: 'Read Root Flag Token',
        instructions: 'Root privileges (uid=0) will be granted and /root/flag.txt will be displayed in the terminal output.',
        actionType: 'extract',
        payload: "flag{privesc_root_access_granted}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-dos-07': {
    challengeId: 'ch-dos-07',
    title: 'DoS Simulation',
    category: 'Resilience & Networking',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-400: Uncontrolled Resource Consumption',
    owasp: 'OWASP A04:2021 – Insecure Design',
    targetEndpoint: 'http://127.0.0.1:8888/stress',
    expectedFlag: 'flag{rate_limiting_protects_service}',
    shortInfo: {
      overview: 'Denial of Service (DoS) simulations demonstrate how applications handle sudden traffic surges and verify whether protective rate limiters and circuit breakers engage.',
      mechanism: 'The API tracks requests in a sliding window. When rapid successive requests hit the endpoint, the defensive circuit breaker trips at 15 requests and returns HTTP 429 Too Many Requests.',
      impact: 'Service degradation and resource exhaustion if unmitigated; verified availability protection when defensive rate limits engage.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Open Rate Limiting Simulator',
        instructions: 'View http://127.0.0.1:8888/stress in the sandbox browser to load the API Rate Limiting Simulator.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Trigger Controlled Client Burst',
        instructions: 'Click the "⚡ Run Controlled Burst" button to send an automated series of rapid requests to /stress?ping=1.',
        actionType: 'trigger',
      },
      {
        stepNumber: 3,
        title: 'Observe Circuit Breaker Activation',
        instructions: 'Watch the real-time execution log: initial requests return 200 OK. Once the threshold (15 req) is crossed, the status transitions to 429 Rate Limited.',
        actionType: 'inspect',
      },
      {
        stepNumber: 4,
        title: 'Collect Resilience Flag Token',
        instructions: 'The green banner appears with "Rate Limit Tripped! Flag: ...". Copy the flag token into the right panel.',
        actionType: 'extract',
        payload: "flag{rate_limiting_protects_service}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-ssrf-08': {
    challengeId: 'ch-ssrf-08',
    title: 'SSRF: Cloud Metadata',
    category: 'Web Exploitation',
    difficulty: 'Medium',
    xpReward: 150,
    cwe: 'CWE-918: Server-Side Request Forgery (SSRF)',
    owasp: 'OWASP A10:2021 – Server-Side Request Forgery (SSRF)',
    targetEndpoint: 'http://127.0.0.1:8888/ssrf',
    expectedFlag: 'flag{ssrf_internal_metadata_leaked_882}',
    shortInfo: {
      overview: 'Server-Side Request Forgery (SSRF) allows an attacker to induce the server-side application to make HTTP requests to an arbitrary destination of the attacker’s choosing.',
      mechanism: 'The image import feature fetches remote URLs on behalf of users without restricting private IP ranges (RFC 1918) or cloud instance metadata (169.254.169.254).',
      impact: 'Exfiltration of temporary AWS/cloud IAM security credentials, access to internal services, and port scanning behind firewalls.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect Remote Importer Form',
        instructions: 'Open http://127.0.0.1:8888/ssrf in the sandbox browser. Notice the "Image Asset URL" input field.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Supply Cloud Metadata URI',
        instructions: 'Replace the default image URL with the link-local cloud metadata IP: http://169.254.169.254/latest/meta-data/',
        actionType: 'input',
        payload: "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        payloadLabel: "Cloud Metadata URI",
        hint: "169.254.169.254 is the standard link-local address for cloud instance metadata."
      },
      {
        stepNumber: 3,
        title: 'Fetch Internal Resource',
        instructions: 'Click "Fetch Remote Resource". The server executes an internal GET request to the metadata endpoint on your behalf.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Exfiltrate IAM Role Flag',
        instructions: 'Review the JSON response containing the leaked instance profile credentials and copy the TargetFlag.',
        actionType: 'extract',
        payload: "flag{ssrf_internal_metadata_leaked_882}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-jwt-09': {
    challengeId: 'ch-jwt-09',
    title: 'Broken Token Auth (JWT)',
    category: 'API & Web Security',
    difficulty: 'Medium',
    xpReward: 150,
    cwe: 'CWE-345: Insufficient Verification of Data Authenticity',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    targetEndpoint: 'http://127.0.0.1:8888/jwt-portal',
    expectedFlag: 'flag{jwt_alg_none_privilege_escalation_741}',
    shortInfo: {
      overview: 'JWT vulnerabilities occur when token verification libraries trust insecure algorithm headers like `"alg": "none"` or fail to enforce cryptographic signatures.',
      mechanism: 'Setting `"alg": "none"` in the JWT header instructs the vulnerable parser to skip signature verification entirely, allowing anyone to modify claims (e.g. change `"role": "customer"` to `"role": "admin"`).',
      impact: 'Privilege escalation to administrator, account spoofing, and complete access to confidential staff endpoints.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect Active JWT Bearer Token',
        instructions: 'Navigate to http://127.0.0.1:8888/jwt-portal. Notice the active token in the textarea and review its parsed header and payload.',
        actionType: 'inspect',
      },
      {
        stepNumber: 2,
        title: 'Forge Admin Token with alg:none',
        instructions: 'Construct a JWT with header `{"alg":"none","typ":"JWT"}` and payload `{"user":"alex","role":"admin","exp":1775000000}`. Both parts are base64url encoded and joined with a trailing dot.',
        actionType: 'input',
        payload: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWxleCIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NTAwMDAwMH0.",
        payloadLabel: "Forged Admin JWT Token",
        hint: "Notice the trailing dot: header.payload. with an empty signature."
      },
      {
        stepNumber: 3,
        title: 'Submit Forged Token',
        instructions: 'Paste the forged token into the textarea and click "Submit Token".',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Claim Administrator Flag',
        instructions: 'The green banner confirms "Admin Privilege Escalation Confirmed!" and displays the master flag.',
        actionType: 'extract',
        payload: "flag{jwt_alg_none_privilege_escalation_741}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-csrf-10': {
    challengeId: 'ch-csrf-10',
    title: 'Cross-Site Request Forgery',
    category: 'Web Security',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-352: Cross-Site Request Forgery (CSRF)',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    targetEndpoint: 'http://127.0.0.1:8888/csrf',
    expectedFlag: 'flag{csrf_state_change_unauthorized_239}',
    shortInfo: {
      overview: 'Cross-Site Request Forgery (CSRF) tricks a logged-in user\'s browser into executing unwanted state-changing actions on a trusted web application.',
      mechanism: 'The Points Transfer endpoint accepts HTTP POST requests without verifying an Anti-CSRF token or requiring SameSite=Strict cookies. An external malicious site can submit a form to the transfer endpoint using the victim\'s ambient session credentials.',
      impact: 'Unauthorized fund/point transfers, unintended email or password changes, and state alteration without user consent.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect Legitimate Transfer Form',
        instructions: 'Navigate to http://127.0.0.1:8888/csrf. On tab 1, review the Points Transfer Service form. Notice there is no hidden csrf_token field.',
        actionType: 'inspect',
      },
      {
        stepNumber: 2,
        title: 'Switch to Simulated Attacker Site',
        instructions: 'Click the tab button "2. Malicious External Site (CSRF PoC)" to view the simulated phishing domain (free-gift-cards-claim.net).',
        actionType: 'navigate',
      },
      {
        stepNumber: 3,
        title: 'Trigger Cross-Origin Forged Request',
        instructions: 'Click the red button "Simulate Victim Clicking Malicious Link". This triggers a hidden cross-origin POST to Meridian using the victim\'s cookies.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Exfiltrate CSRF Audit Flag',
        instructions: 'The exploit banner confirms: "CSRF Exploit Verified: 500 Points transferred to attacker_wallet_99!" and displays the flag.',
        actionType: 'extract',
        payload: "flag{csrf_state_change_unauthorized_239}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'ch-race-11': {
    challengeId: 'ch-race-11',
    title: 'Race Condition (Double-Spend)',
    category: 'Business Logic',
    difficulty: 'Hard',
    xpReward: 200,
    cwe: 'CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization (Race Condition)',
    owasp: 'OWASP A04:2021 – Insecure Design',
    targetEndpoint: 'http://127.0.0.1:8888/race-condition',
    expectedFlag: 'flag{race_condition_double_spend_success_912}',
    shortInfo: {
      overview: 'A race condition (TOCTOU) occurs when multiple concurrent execution threads check a condition and modify state before database locks can synchronize the transaction.',
      mechanism: 'The voucher redemption logic verifies `if (!voucher.used)` before setting `voucher.used = true`. If multiple requests hit the check simultaneously, all threads are approved before the flag is updated.',
      impact: 'Double-spending of promotional vouchers, balance manipulation, and financial business logic bypass.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect Voucher Portal',
        instructions: 'Navigate to http://127.0.0.1:8888/race-condition. Observe the starting store credit balance ($10.00) and the single-use coupon limit.',
        actionType: 'inspect',
      },
      {
        stepNumber: 2,
        title: 'Understand Standard vs Burst Mode',
        instructions: 'Clicking "Standard Single Request" correctly adds $50 once ($60 total). But sending concurrent threads tests if the check can be raced.',
        actionType: 'inspect',
      },
      {
        stepNumber: 3,
        title: 'Execute Concurrent Thread Burst',
        instructions: 'Click the green button "⚡ Execute Concurrent Burst (5 Threads Simultaneously)". This fires 5 simultaneous requests before database row locks engage.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Retrieve Double-Spend Flag',
        instructions: 'The balance increases past the single-use limit to $110.00, confirming the TOCTOU double-spend, and outputs the flag.',
        actionType: 'extract',
        payload: "flag{race_condition_double_spend_success_912}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  // =========================================================================
  // PICOCTF ARENA ATTACKS (First 3 + Others)
  // =========================================================================

  'pico-web-insp3ct0r': {
    challengeId: 'pico-web-insp3ct0r',
    title: 'Insp3ct0r',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-615: Inclusion of Sensitive Information in Source Code Comments',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    targetEndpoint: 'http://127.0.0.1:8888/pico/inspector',
    expectedFlag: 'picoCTF{specs_0n_spect4cl3s__4dd392c1}',
    shortInfo: {
      overview: 'Web applications are built out of HTML markup, CSS styling, and JavaScript logic. Developers often mistakenly leave internal notes or credentials in public comments.',
      mechanism: 'The secret flag is split into three parts and stored in source comments across index.html, mycss.css, and myjs.js. Inspecting all three assets reveals the entire flag.',
      impact: 'Unintentional exposure of developer notes, internal keys, endpoint architectures, and credentials to anyone inspecting source code.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Open Source Assets Drawer',
        instructions: 'Navigate to http://127.0.0.1:8888/pico/inspector in the sandbox browser. Locate the "Browser DevTools / Source Assets Drawer" on the page.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Find Part 1 in HTML',
        instructions: 'With index.html selected, read the HTML comment near the top: <!-- Html is neat. Lay out your pages with pride. 1/3: picoCTF{specs_0n_ -->',
        actionType: 'inspect',
        payload: "picoCTF{specs_0n_",
        payloadLabel: "Flag Fragment 1/3 (HTML)"
      },
      {
        stepNumber: 3,
        title: 'Find Part 2 in CSS',
        instructions: 'Click the "mycss.css" tab. Look at the CSS comment on the first line: /* You need CSS to look good. 2/3: spect4cl3s_ */',
        actionType: 'inspect',
        payload: "spect4cl3s_",
        payloadLabel: "Flag Fragment 2/3 (CSS)"
      },
      {
        stepNumber: 4,
        title: 'Find Part 3 in JavaScript & Combine',
        instructions: 'Click the "myjs.js" tab. Read the JS comment: /* Javascript is fun. 3/3: _4dd392c1} */. Combine all three pieces to form the complete flag.',
        actionType: 'extract',
        payload: "picoCTF{specs_0n_spect4cl3s__4dd392c1}",
        payloadLabel: "Full Assembled Flag"
      }
    ]
  },

  'pico-web-cookies': {
    challengeId: 'pico-web-cookies',
    title: 'Cookies',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-565: Reliance on Cookies without Validation and Integrity Checking',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    targetEndpoint: 'http://127.0.0.1:8888/pico/cookies',
    expectedFlag: 'picoCTF{3v3ryb0dy_l1k3s_c00k13s_96f01e30}',
    shortInfo: {
      overview: 'Cookies stored in the client browser are completely controlled by the user. Relying on predictable integers to distinguish users or privilege levels is insecure.',
      mechanism: 'The server uses a numeric `name` cookie (0, 1, 2...) to look up cookie recipes. Testing sequential cookie IDs reveals that cookie value 18 is reserved for the secret administrator flag.',
      impact: 'Privilege escalation and unauthorized data access through trivial cookie value enumeration.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect Cookie Search Form',
        instructions: 'Ensure the sandbox browser is at http://127.0.0.1:8888/pico/cookies. Notice the "Search Cookie ID / Value" form.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Test Sample Cookie Numbers',
        instructions: 'Enter "0" or "1" and click "Update Cookie". Observe the active cookie header updates to name=0 (Chocolate Chip) or name=1 (Snickerdoodle).',
        actionType: 'input',
        payload: "0",
        payloadLabel: "Initial Probe Value"
      },
      {
        stepNumber: 3,
        title: 'Set Target Cookie Value to 18',
        instructions: 'Enter "18" into the Cookie ID input and click the "Update Cookie" button.',
        actionType: 'trigger',
        payload: "18",
        payloadLabel: "Target Flag Cookie ID",
        hint: "Cookie index 18 corresponds to the special secret FLAG_COOKIE in the bakery registry."
      },
      {
        stepNumber: 4,
        title: 'Extract Secret Cookie Flag',
        instructions: 'The green banner confirms: "🎉 Special Cookie Recognized!" and displays the secret flag.',
        actionType: 'extract',
        payload: "picoCTF{3v3ryb0dy_l1k3s_c00k13s_96f01e30}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'pico-web-local-auth': {
    challengeId: 'pico-web-local-auth',
    title: 'Local Authority',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-598: Use of GET Request with Sensitive Data / Client-Side Auth Logic',
    owasp: 'OWASP A07:2021 – Identification and Authentication Failures',
    targetEndpoint: 'http://127.0.0.1:8888/pico/local-authority',
    expectedFlag: 'picoCTF{j5_15_7r4n5p4r3n7_05dfa048}',
    shortInfo: {
      overview: 'Client-side authentication is fundamentally insecure because any code or credentials executed in the user\'s browser can be inspected and bypassed.',
      mechanism: 'The portal loads an external script `secure.js` that contains a plain-text function `checkPassword(user, pass)`. Hardcoded credentials (admin / strongPassword0987) are visible directly in the source.',
      impact: 'Immediate bypass of authentication controls and unauthorized administrative system access.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'View Portal Login Form',
        instructions: 'Navigate to http://127.0.0.1:8888/pico/local-authority in the sandbox browser to view the Local Authority login page.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Inspect secure.js Client Script',
        instructions: 'Click the link "🔍 View Loaded secure.js Script" at the bottom of the page to inspect the verification logic.',
        actionType: 'inspect',
      },
      {
        stepNumber: 3,
        title: 'Recover Hardcoded Credentials',
        instructions: 'Look at the function checkPassword: it verifies if username === "admin" && password === "strongPassword0987".',
        actionType: 'inspect',
        payload: "Username: admin | Password: strongPassword0987",
        payloadLabel: "Hardcoded Admin Credentials"
      },
      {
        stepNumber: 4,
        title: 'Sign In and Extract Flag',
        instructions: 'Enter "admin" in Username and "strongPassword0987" in Password, then click "Log in". The green banner reveals the flag.',
        actionType: 'extract',
        payload: "picoCTF{j5_15_7r4n5p4r3n7_05dfa048}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'pico-web-get-ahead': {
    challengeId: 'pico-web-get-ahead',
    title: 'GET aHEAD',
    category: 'Web Exploitation',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-650: Trusting HTTP Method Without Verification',
    owasp: 'OWASP A05:2021 – Security Misconfiguration',
    targetEndpoint: 'http://127.0.0.1:8888/pico/get-ahead',
    expectedFlag: 'picoCTF{r3ad_the_h3ad3r_2d89b31d}',
    shortInfo: {
      overview: 'Web applications often handle different HTTP verbs (GET, POST, HEAD, OPTIONS) differently. Testing alternate methods can reveal hidden headers.',
      mechanism: 'Sending an HTTP HEAD request instead of GET/POST causes the server to return only the HTTP headers without a body, where the `flag` header is revealed.',
      impact: 'Information disclosure through neglected HTTP method handlers.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'View Color Switcher Portal',
        instructions: 'Navigate to /pico/get-ahead. Notice the buttons that trigger GET (Red) and POST (Blue) requests.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Inspect HTTP Verb Handlers',
        instructions: 'Notice the challenge title "GET aHEAD" hints at the HTTP HEAD method.',
        actionType: 'inspect',
      },
      {
        stepNumber: 3,
        title: 'Send HEAD Request',
        instructions: 'Click the "Send HEAD Request" button or use curl -I in the console to inspect response headers.',
        actionType: 'trigger',
        payload: "curl -I http://127.0.0.1:8888/pico/get-ahead",
        payloadLabel: "Curl HEAD Probe"
      },
      {
        stepNumber: 4,
        title: 'Extract Flag from Header',
        instructions: 'Read the custom HTTP response header: `flag: picoCTF{r3ad_the_h3ad3r_2d89b31d}`.',
        actionType: 'extract',
        payload: "picoCTF{r3ad_the_h3ad3r_2d89b31d}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  },

  'pico-crypto-mod26': {
    challengeId: 'pico-crypto-mod26',
    title: 'Mod 26',
    category: 'Cryptography',
    difficulty: 'Easy',
    xpReward: 100,
    cwe: 'CWE-326: Inadequate Encryption Strength (Caesar / ROT13)',
    owasp: 'OWASP A02:2021 – Cryptographic Failures',
    targetEndpoint: 'http://127.0.0.1:8888/pico/crypto-rot13',
    expectedFlag: 'picoCTF{next_zpt_kat_30_days_bfb4}',
    shortInfo: {
      overview: 'ROT13 is a simple Caesar cipher with a shift of 13. It is a substitution cipher that provides zero cryptographic confidentiality.',
      mechanism: 'Each letter is replaced with the letter 13 positions forward in the alphabet (modulo 26). Applying the transformation twice restores the original plaintext.',
      impact: 'Trivial cryptanalysis and instant decryption of obfuscated strings without any secret key.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Inspect ROT13 Ciphertext',
        instructions: 'Open the ROT13 tool in the sandbox browser to view the ciphered string: cvpbPGS{arkg_mcf_xng_30_qnlf_oso4}.',
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Apply 13-Character Alphabet Shift',
        instructions: 'Apply ROT13 substitution: "c" becomes "p", "v" becomes "i", "p" becomes "c", etc.',
        actionType: 'input',
        payload: "cvpbPGS{arkg_mcf_xng_30_qnlf_oso4}",
        payloadLabel: "Ciphertext"
      },
      {
        stepNumber: 3,
        title: 'Click Decrypt / Rotate',
        instructions: 'Click the "Apply ROT13" button in the sandbox to calculate the modulo 26 shift.',
        actionType: 'trigger',
      },
      {
        stepNumber: 4,
        title: 'Extract Plaintext Flag',
        instructions: 'Read the decrypted plaintext and submit the resulting picoCTF flag.',
        actionType: 'extract',
        payload: "picoCTF{next_zpt_kat_30_days_bfb4}",
        payloadLabel: "Captured Flag Token"
      }
    ]
  }
};

/**
 * Returns a complete AttackTutorialData for any challenge ID, falling back dynamically
 * to well-structured contextual guidance for any custom/imported challenges.
 */
export function getAttackTutorial(
  challengeId: string,
  title: string = '',
  category: string = '',
  description: string = '',
  targetUrl: string = '',
  flagPlain: string = ''
): AttackTutorialData {
  if (challengeId && ATTACK_TUTORIALS[challengeId]) {
    return ATTACK_TUTORIALS[challengeId];
  }

  const lowerId = (challengeId || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // Keyword matchers for Meridian
  for (const key of Object.keys(ATTACK_TUTORIALS)) {
    if (lowerId.includes(key) || key.includes(lowerId)) {
      return ATTACK_TUTORIALS[key];
    }
  }

  // Dynamic contextual tutorial generator
  const isPico = lowerId.startsWith('pico') || (category || '').toLowerCase().includes('pico');
  const target = targetUrl || 'http://127.0.0.1:8888/';
  const flag = flagPlain || (isPico ? 'picoCTF{sample_flag_token}' : 'flag{sample_flag_token}');

  return {
    challengeId: challengeId || 'custom-challenge',
    title: title || 'Cybersecurity Vulnerability Challenge',
    category: category || 'Web Exploitation',
    difficulty: 'Medium',
    xpReward: 100,
    cwe: 'CWE-200: Information Exposure & Security Misconfiguration',
    owasp: 'OWASP A01:2021 – Broken Access Control',
    targetEndpoint: target,
    expectedFlag: flag,
    shortInfo: {
      overview: description || `This challenge guides you through identifying and exploiting vulnerabilities in ${title}.`,
      mechanism: `Analyze the ${category} attack surface, inspect input parameters, request headers, and client-side logic to uncover security flaws.`,
      impact: 'Enables unauthorized state alteration, credential exfiltration, or access control bypass if unpatched.',
    },
    tutorialSteps: [
      {
        stepNumber: 1,
        title: 'Target Reconnaissance',
        instructions: `Navigate to the target service endpoint at ${target} in the center browser and inspect available inputs or links.`,
        actionType: 'navigate',
      },
      {
        stepNumber: 2,
        title: 'Inspect Parameters & Assets',
        instructions: 'Examine URL query parameters, form fields, developer comments, or network requests for unvalidated data flows.',
        actionType: 'inspect',
      },
      {
        stepNumber: 3,
        title: 'Deliver Exploit Payload',
        instructions: 'Craft and deliver the specialized payload to trigger the vulnerability condition and bypass security checks.',
        actionType: 'trigger',
        payload: isPico ? "Inspect devtools / network tab" : "' OR 1=1 --",
        payloadLabel: "Guided Target Payload"
      },
      {
        stepNumber: 4,
        title: 'Exfiltrate Flag Token',
        instructions: `Locate the flag token in the server response or page source and submit it in the format: ${isPico ? 'picoCTF{...}' : 'flag{...}'}.`,
        actionType: 'extract',
        payload: flag,
        payloadLabel: "Target Flag Token"
      }
    ]
  };
}
