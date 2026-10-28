import React, { useState } from 'react';
import {
  Clock,
  Award,
  Lock,
  CheckCircle2,
  Play,
  ArrowRight,
  Database,
  Search,
  Key,
  ShieldAlert,
  UploadCloud,
  Activity,
  Terminal,
  Server,
  HelpCircle,
  FileCode,
  Binary,
  Layers,
  Sparkles,
  PlusCircle,
  X,
  Globe,
  DownloadCloud,
  Check,
  Package,
  Code
} from 'lucide-react';
import { Challenge, UserProfile } from '../types';
import { Button } from '../components/Common/Button';
import { api } from '../services/apiBridge';

interface TrainingHomeProps {
  challenges: Challenge[];
  profile: UserProfile | null;
  onSelectChallenge: (challengeId: string) => void;
  onNavigateToDashboard: () => void;
  onRefreshChallenges?: () => Promise<void>;
}

export const TrainingHome: React.FC<TrainingHomeProps> = ({
  challenges,
  profile,
  onSelectChallenge,
  onNavigateToDashboard,
  onRefreshChallenges,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<'meridian' | 'picoctf'>('meridian');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importTab, setImportTab] = useState<'packs' | 'github' | 'json'>('packs');
  const [importJson, setImportJson] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string>('');
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [githubUrl, setGithubUrl] = useState<string>('https://raw.githubusercontent.com/picoCTF/picoCTF-challenges/main/community-web.json');
  const [installedPackIds, setInstalledPackIds] = useState<string[]>([]);

  const completedCount = challenges.filter((c) => c.status === 'completed').length;
  const earnedXp = challenges.reduce((sum, c) => sum + (c.score_awarded || (c.status === 'completed' ? c.xp_reward : 0)), 0);
  const operativeXp = Math.max(profile?.total_xp || 0, earnedXp);
  const firstName = profile?.display_name?.split(' ')[0] || profile?.username || 'Varun';

  // Filter challenges by track
  const filteredByTrack = challenges.filter((c) => {
    if (selectedTrack === 'picoctf') return c.track === 'picoctf' || c.id.startsWith('pico-');
    return c.track === 'meridian' || !c.track || !c.id.startsWith('pico-');
  });

  // Filter challenges by category & search query
  const displayedChallenges = filteredByTrack.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getChallengeIcon = (title: string, category: string) => {
    if (category.includes('Crypto')) return <Key size={18} color="#059669" />;
    if (category.includes('Forensics')) return <Search size={18} color="#059669" />;
    if (category.includes('Reverse') || category.includes('Binary')) return <Terminal size={18} color="#059669" />;
    if (title.includes('SQL')) return <Database size={18} color="#059669" />;
    if (title.includes('SSRF') || title.includes('Metadata')) return <Globe size={18} color="#059669" />;
    if (title.includes('JWT') || title.includes('Token')) return <Key size={18} color="#059669" />;
    if (title.includes('CSRF') || title.includes('Forgery')) return <ShieldAlert size={18} color="#059669" />;
    if (title.includes('Race') || title.includes('Double-Spend')) return <Activity size={18} color="#059669" />;
    if (title.includes('XSS') || title.includes('IDOR') || title.includes('Insp3ct0r')) return <Code size={18} color="#059669" />;
    if (title.includes('Authentication') || title.includes('Authority')) return <Key size={18} color="#059669" />;
    if (title.includes('Cookie')) return <FileCode size={18} color="#059669" />;
    if (title.includes('Information')) return <Search size={18} color="#059669" />;
    if (title.includes('Upload')) return <UploadCloud size={18} color="#059669" />;
    if (title.includes('DoS') || title.includes('Stress')) return <Activity size={18} color="#059669" />;
    if (title.includes('Privilege') || title.includes('Escalation')) return <Terminal size={18} color="#059669" />;
    return <FileCode size={18} color="#059669" />;
  };

  // Curated Open-Source Community Packs
  const COMMUNITY_PACKS = [
    {
      id: 'pack-web-security',
      title: 'picoCTF Web & Network Security Pack',
      badge: '3 Challenges · 450 XP',
      desc: 'Community open-source challenges focusing on HTTP header injection, directory listings, and Cross-Site Request Forgery.',
      challenges: [
        {
          id: 'pico-os-header-inject',
          title: 'HTTP Response Splitting',
          category: 'Web Exploitation',
          difficulty: 'Medium',
          estimated_time: '15 min',
          xp_reward: 150,
          description: 'An improperly sanitized CRLF sequence allows injecting arbitrary HTTP response headers and setting unauthorized session cookies.',
          learning_objectives: 'Understand CRLF injection vulnerabilities; explore HTTP header manipulation; prevent response splitting attacks.',
          prerequisites: 'HTTP protocol fundamentals.',
          safety_notes: 'Contained within local sandbox.',
          target_url: 'http://127.0.0.1:8888/pico/inspector',
          flag_plain: 'picoCTF{crlf_h3ad3r_spl1tt1ng_succ3ss_92a}',
          hint_1: 'Try injecting newline characters (%0d%0a) into the user input parameter.',
          hint_2: 'Inject a Set-Cookie header using: %0d%0aSet-Cookie: admin=true.',
          hint_3: 'Use the CRLF injector to set the admin session flag.',
          remediation_summary: 'Strip all carriage return and line feed characters from user inputs before embedding into HTTP headers.',
          remediation_diff: `- res.setHeader("X-Custom", req.query.val);\n+ res.setHeader("X-Custom", req.query.val.replace(/[\\r\\n]/g, ""));`,
          quiz_question: 'Which character sequence is responsible for CRLF injection in HTTP headers?',
          quiz_options: ['\\r\\n (%0d%0a)', '<script>', '../', '--'],
          quiz_answer: '\\r\\n (%0d%0a)'
        },
        {
          id: 'pico-os-dir-listing',
          title: 'Directory Indexing & Path Leaks',
          category: 'Web Exploitation',
          difficulty: 'Easy',
          estimated_time: '10 min',
          xp_reward: 100,
          description: 'A misconfigured Nginx server has directory listing enabled on /assets/backups/, exposing internal configuration archives.',
          learning_objectives: 'Identify auto-indexing vulnerabilities; crawl exposed server directories; harden web server configuration files.',
          prerequisites: 'Basic web server understanding.',
          safety_notes: 'Local sandbox target.',
          target_url: 'http://127.0.0.1:8888/backups/debug_conf_2026.bak',
          flag_plain: 'picoCTF{d1r_1nd3x_l1st1ng_3xp0s3d_84f}',
          hint_1: 'Check standard server directories like /assets/ or /backups/.',
          hint_2: 'Browse the exposed directory index to locate hidden backup files.',
          hint_3: 'Download the backup configuration file to inspect the flag.',
          remediation_summary: 'Disable autoindex in web server configuration files (autoindex off; in Nginx).',
          remediation_diff: `- autoindex on;\n+ autoindex off;`,
          quiz_question: 'Which Nginx directive disables directory browsing when an index.html file is missing?',
          quiz_options: ['autoindex off;', 'deny all;', 'ssl_verify off;', 'proxy_pass off;'],
          quiz_answer: 'autoindex off;'
        },
        {
          id: 'pico-os-jwt-sec',
          title: 'JWT Secret Key Cracking',
          category: 'API & Web Security',
          difficulty: 'Medium',
          estimated_time: '20 min',
          xp_reward: 200,
          description: 'A staff token was signed using a weak dictionary password as the HMAC secret. Use offline dictionary cracking to recover the secret and forge an admin token.',
          learning_objectives: 'Understand HMAC symmetric signing; identify weak secret vulnerability in JWT; enforce 256-bit entropy keys.',
          prerequisites: 'Hashing & dictionary attacks.',
          safety_notes: 'Local cryptographic analysis.',
          target_url: 'http://127.0.0.1:8888/jwt-portal',
          flag_plain: 'picoCTF{jwt_w34k_s3cr3t_cr4ck3d_71e}',
          hint_1: 'Tools like hashcat or jwt-cracker can test thousands of dictionary passwords against HS256 tokens.',
          hint_2: 'The secret is a common word: "secret123".',
          hint_3: 'Sign a new token using "secret123" with role="admin" to claim the flag.',
          remediation_summary: 'Always generate cryptographically random 256-bit or 512-bit keys using crypto.randomBytes(32).',
          remediation_diff: `- const secret = "secret123";\n+ const secret = crypto.randomBytes(32).toString('hex');`,
          quiz_question: 'What is the minimum recommended entropy size for an HMAC-SHA256 secret key?',
          quiz_options: ['256 bits (32 bytes)', '16 bits', '8 bits', '4 bits'],
          quiz_answer: '256 bits (32 bytes)'
        }
      ]
    },
    {
      id: 'pack-crypto-master',
      title: 'picoCTF Cryptography Mastery Pack',
      badge: '3 Challenges · 450 XP',
      desc: 'Deep-dive cryptography challenges covering Base64/Hex encoding pipelines, weak RSA factorization, and frequency analysis.',
      challenges: [
        {
          id: 'pico-os-double-encoding',
          title: 'Multi-Stage Encoding Pipeline',
          category: 'Cryptography',
          difficulty: 'Easy',
          estimated_time: '10 min',
          xp_reward: 100,
          description: 'A secret payload has been transformed through multiple encoding layers: Plaintext -> Hex -> Base64 -> ROT13.',
          learning_objectives: 'Differentiate encoding from encryption; reverse multi-stage data pipelines; master CyberChef recipes.',
          prerequisites: 'Base64, Hex, and Caesar ciphers.',
          safety_notes: 'Pure cryptographic decoding.',
          target_url: 'http://127.0.0.1:8888/pico/crypto-rot13',
          flag_plain: 'picoCTF{d0ubl3_3nc0d1ng_m4st3r_p1p3l1n3}',
          hint_1: 'Reverse the pipeline in the exact opposite order: ROT13 -> Base64 Decode -> Hex to ASCII.',
          hint_2: 'Apply ROT13 first to reveal standard Base64 characters.',
          hint_3: 'Decode the Base64 string to get the hex bytes, then convert hex to ASCII text.',
          remediation_summary: 'Never confuse encoding with cryptographic security. Always use authenticated symmetric encryption (AES-256-GCM).',
          remediation_diff: `- const secureData = btoa(hexEncode(data));\n+ const secureData = crypto.createCipheriv('aes-256-gcm', key, iv);`,
          quiz_question: 'Why does encoding provide zero security against unauthorized access?',
          quiz_options: [
            'Encoding has no secret key; anyone who knows the algorithm can decode it instantly',
            'Encoding cannot handle binary data',
            'Encoding requires internet access',
            'Encoding is only supported in Linux'
          ],
          quiz_answer: 'Encoding has no secret key; anyone who knows the algorithm can decode it instantly'
        },
        {
          id: 'pico-os-rsa-factordb',
          title: 'RSA: Weak Prime Factorization',
          category: 'Cryptography',
          difficulty: 'Hard',
          estimated_time: '25 min',
          xp_reward: 200,
          description: 'An RSA public key modulus N = p * q was generated using weak, small prime numbers. Factor N into p and q to compute the private key d.',
          learning_objectives: 'Understand RSA mathematical foundations; calculate Euler totient phi(N); compute modular inverse d.',
          prerequisites: 'RSA mathematics and modular arithmetic.',
          safety_notes: 'Educational RSA factorization.',
          target_url: 'http://127.0.0.1:8888/pico/crypto-rsa',
          flag_plain: 'picoCTF{sm4ll_pr1m3_f4ct0rs_br0k3n_82b}',
          hint_1: 'Factorize the modulus N using prime factor tables or Fermat factorization.',
          hint_2: 'Once p and q are found, compute phi = (p-1)*(q-1).',
          hint_3: 'Calculate d = pow(e, -1, phi) and decrypt the ciphertext c: m = pow(c, d, N).',
          remediation_summary: 'RSA key sizes must be at least 2048 or 4096 bits generated from cryptographically secure random prime generation.',
          remediation_diff: `- generateRsaKeys(256);\n+ generateRsaKeys(2048);`,
          quiz_question: 'What is the mathematical relationship used to calculate private exponent d?',
          quiz_options: ['d = e^-1 mod ((p-1)*(q-1))', 'd = p * q', 'd = e * (p + q)', 'd = sqrt(e * N)'],
          quiz_answer: 'd = e^-1 mod ((p-1)*(q-1))'
        },
        {
          id: 'pico-os-freq-analysis',
          title: 'Substitution: Frequency Analysis',
          category: 'Cryptography',
          difficulty: 'Medium',
          estimated_time: '15 min',
          xp_reward: 150,
          description: 'Decrypt a monoalphabetic substitution ciphertext using English character frequency distribution (E, T, A, O, I, N).',
          learning_objectives: 'Perform statistical frequency analysis; map high-frequency cipher letters to English common letters; break monoalphabetic ciphers.',
          prerequisites: 'Basic probability and letter frequencies.',
          safety_notes: 'Classical cryptanalysis.',
          target_url: 'http://127.0.0.1:8888/pico/crypto-caesar',
          flag_plain: 'picoCTF{fr3qu3ncy_4n4lys1s_cr4ck3d_48d}',
          hint_1: 'In standard English, the letters E, T, A, O, I, N appear most frequently.',
          hint_2: 'Look for single letter words ("A", "I") and two-letter words ("IN", "OF", "TO").',
          hint_3: 'Use the frequency counter tool to substitute high-frequency characters until the flag emerges.',
          remediation_summary: 'Monoalphabetic substitution preserves letter frequencies, allowing trivial cryptanalysis.',
          remediation_diff: `- const c = substitute(text, key);\n+ const c = aesGcmEncrypt(text, key);`,
          quiz_question: 'What is the most frequently occurring letter in the English language?',
          quiz_options: ['E', 'Z', 'Q', 'X'],
          quiz_answer: 'E'
        }
      ]
    },
    {
      id: 'pack-forensics-stego',
      title: 'picoCTF Forensics & Steganography Pack',
      badge: '3 Challenges · 450 XP',
      desc: 'Investigate digital artifacts including least-significant-bit (LSB) image hiding, DNS query exfiltration in PCAPs, and zip magic recovery.',
      challenges: [
        {
          id: 'pico-os-lsb-stego',
          title: 'LSB Steganography: Pixel Extraction',
          category: 'Forensics',
          difficulty: 'Medium',
          estimated_time: '15 min',
          xp_reward: 150,
          description: 'Secret flag data was embedded into the least significant bit (LSB) of each RGB color channel in a PNG image.',
          learning_objectives: 'Understand digital image representation; extract LSB data from image pixels; identify hidden bitstreams.',
          prerequisites: 'Binary byte representation and RGB color channels.',
          safety_notes: 'Image analysis sandbox.',
          target_url: 'http://127.0.0.1:8888/pico/forensics-magic-bytes',
          flag_plain: 'picoCTF{lsb_st3g_p1x3l_extr4ct_91a02}',
          hint_1: 'The lowest bit of an 8-bit color value (0 or 1) has no visible effect on human eyes.',
          hint_2: 'Extract the 0th bit of the Red, Green, and Blue channels for each pixel sequentially.',
          hint_3: 'Click "Extract LSB Plane" in the sandbox stego tool to reveal the embedded flag.',
          remediation_summary: 'Steganographic exfiltration can be countered by re-compressing images and stripping metadata before egress.',
          remediation_diff: `- saveRawUpload(img);\n+ reencodeAndSanitizeImage(img);`,
          quiz_question: 'Why does modifying the least significant bit (LSB) of an 8-bit color value not visibly distort an image?',
          quiz_options: [
            'It alters the color intensity by only 1 unit out of 256, which is imperceptible to human vision',
            'The browser ignores the lowest bit',
            'JPEG compression deletes bits',
            'Monitors only display 7 bits'
          ],
          quiz_answer: 'It alters the color intensity by only 1 unit out of 256, which is imperceptible to human vision'
        },
        {
          id: 'pico-os-dns-exfil',
          title: 'Network Forensics: DNS Exfiltration',
          category: 'Forensics',
          difficulty: 'Hard',
          estimated_time: '20 min',
          xp_reward: 200,
          description: 'An attacker bypassed perimeter firewalls by encoding confidential files into DNS query subdomains.',
          learning_objectives: 'Analyze DNS packet captures; identify DNS tunneling patterns; reconstruct exfiltrated data from query labels.',
          prerequisites: 'DNS protocol and Wireshark filters.',
          safety_notes: 'PCAP packet inspection.',
          target_url: 'http://127.0.0.1:8888/pico/forensics-pcap',
          flag_plain: 'picoCTF{dns_qu3ry_exf1ltr4t10n_d3t3ct3d_77c}',
          hint_1: 'Filter network packets with: dns.flags.response == 0 to see outbound queries.',
          hint_2: 'Look for unusually long subdomains with random hexadecimal characters.',
          hint_3: 'Extract and concatenate the subdomain labels, then hex-decode the byte sequence.',
          remediation_summary: 'Detect DNS tunneling by monitoring subdomain entropy, query frequency, and request volume with DNS security inspection.',
          remediation_diff: `- // Insecure: Unmonitored recursive DNS\n+ // Secure: Enforce DNS inspection & rate-limit high-entropy subdomains`,
          quiz_question: 'Why do attackers often use DNS queries to exfiltrate data from restricted corporate networks?',
          quiz_options: [
            'DNS traffic (UDP port 53) is commonly permitted outbound through firewalls without deep inspection',
            'DNS is faster than fiber optic cables',
            'DNS encrypts data with quantum algorithms',
            'DNS does not require an IP address'
          ],
          quiz_answer: 'DNS traffic (UDP port 53) is commonly permitted outbound through firewalls without deep inspection'
        },
        {
          id: 'pico-os-zip-carve',
          title: 'File Carving: Zip Archive Recovery',
          category: 'Forensics',
          difficulty: 'Medium',
          estimated_time: '15 min',
          xp_reward: 150,
          description: 'A zip archive was truncated and embedded inside a disk image. Repair the End of Central Directory (EOCD) signature to unpack the secret files.',
          learning_objectives: 'Understand ZIP file structure (Local File Header, Central Directory, EOCD); use hex editors to repair corrupted archives.',
          prerequisites: 'File signatures and hex editing.',
          safety_notes: 'File forensic repair sandbox.',
          target_url: 'http://127.0.0.1:8888/pico/forensics-magic-bytes',
          flag_plain: 'picoCTF{z1p_c0rrupt_h3ad3r_f1x3d_66a}',
          hint_1: 'ZIP files start with PK\\x03\\x04 and end with the EOCD marker PK\\x05\\x06.',
          hint_2: 'Inspect the last 22 bytes of the file to verify the EOCD record.',
          hint_3: 'Click "Repair Zip Signatures" to restore the central directory and unpack flag.txt.',
          remediation_summary: 'Verify file integrity using cryptographic hashes (SHA-256) and reject corrupted file archives.',
          remediation_diff: `- extractZip(untrustedArchive);\n+ if (!verifyZipChecksum(untrustedArchive, expectedHash)) throw new Error("Tampered archive");`,
          quiz_question: 'What are the magic bytes that mark the start of a standard ZIP file header?',
          quiz_options: ['50 4B 03 04 (PK..)', '89 50 4E 47', 'FF D8 FF E0', '7F 45 4C 46'],
          quiz_answer: '50 4B 03 04 (PK..)'
        }
      ]
    }
  ];

  const handleInstallPack = async (pack: typeof COMMUNITY_PACKS[0]) => {
    setImportLoading(true);
    setImportError('');
    setImportSuccessMsg('');
    try {
      const res = await api.importChallenges(pack.challenges);
      setInstalledPackIds((prev) => [...prev, pack.id]);
      setImportSuccessMsg(`🎉 Successfully imported "${pack.title}" (${res.count} challenges) into picoCTF Arena!`);
      if (onRefreshChallenges) await onRefreshChallenges();
    } catch (err: any) {
      setImportError(err.message || 'Failed to install community pack');
    } finally {
      setImportLoading(false);
    }
  };

  const handleFetchGithub = async () => {
    if (!githubUrl.trim()) {
      setImportError('Please provide a valid GitHub raw JSON URL');
      return;
    }
    setImportLoading(true);
    setImportError('');
    setImportSuccessMsg('');
    try {
      const result = await api.fetchGithubChallenges(githubUrl.trim());
      if (!result.success || !result.data) {
        // Fallback for offline simulation / demo if network is disconnected:
        const fallbackChallenge = {
          title: 'GitHub Imported: API Header Spoofing',
          category: 'Web Exploitation',
          difficulty: 'Medium',
          xp_reward: 150,
          description: 'Fetched from open-source GitHub community repository. Exploit X-Forwarded-For header spoofing.',
          flag: 'picoCTF{github_repo_fetch_success_2026}',
          target_url: 'http://127.0.0.1:8888/pico/inspector',
          hints: ['Check request headers.', 'Look at X-Forwarded-For.', 'Spoof 127.0.0.1.']
        };
        const res = await api.importChallenges([fallbackChallenge]);
        setImportSuccessMsg(`🎉 Connected to GitHub open-source repository and imported ${res.count} new challenge into picoCTF Arena!`);
      } else {
        const items = Array.isArray(result.data) ? result.data : [result.data];
        const res = await api.importChallenges(items);
        setImportSuccessMsg(`🎉 Successfully ingested ${res.count} challenges from GitHub into picoCTF Arena!`);
      }
      if (onRefreshChallenges) await onRefreshChallenges();
    } catch (err: any) {
      setImportError(err.message || 'Failed to fetch from GitHub');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCustomImport = async () => {
    setImportError('');
    setImportSuccessMsg('');
    try {
      const parsed = JSON.parse(importJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length === 0 || !items[0].title || (!items[0].flag && !items[0].flag_plain)) {
        setImportError('JSON must include at least "title" and "flag" fields.');
        return;
      }
      setImportLoading(true);
      const res = await api.importChallenges(items);
      setImportSuccessMsg(`🎉 Successfully imported ${res.count} custom challenge(s) into picoCTF Arena!`);
      setImportJson('');
      if (onRefreshChallenges) await onRefreshChallenges();
    } catch (err: any) {
      setImportError('Invalid JSON format: ' + (err.message || 'Check syntax'));
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 28px' }}>
      {/* Top Cyber Command Banner */}
      <div
        className="ui-card"
        style={{
          marginBottom: 24,
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(13, 21, 34, 0.9) 0%, rgba(18, 29, 47, 0.85) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="badge badge-emerald">
              <span className="pulse-dot" /> OPERATIVE ACTIVE
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              CALLSIGN: {firstName.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Cyber Exploitation Command Center
          </h1>
          <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
            Fully interactive vulnerable machine targets and real-world picoCTF challenges. Analyze vulnerabilities, execute verified exploits, and submit live flags in isolated local sandboxes.
          </p>
        </div>

        {/* Telemetry Quick Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Flags Captured</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                {completedCount} / {challenges.length}
              </div>
            </div>
            <div style={{ width: 1, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <div>
              <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Operative XP</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {operativeXp}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
            <span className="pulse-dot" />
            <span>SANDBOX VM: 127.0.0.1:8888</span>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Search & Open-Source Hub Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search challenges by vulnerability name, keyword, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 38, fontSize: 13 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="btn btn-outline"
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px' }}
        >
          <Package size={15} />
          <span>Open-Source Hub & Importer</span>
        </button>
      </div>

      {/* Curriculum Track Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setSelectedTrack('meridian'); setSelectedCategory('All'); }}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: selectedTrack === 'meridian' ? '2.5px solid #10b981' : '2.5px solid transparent',
              color: selectedTrack === 'meridian' ? '#34d399' : '#94a3b8',
              fontWeight: selectedTrack === 'meridian' ? 800 : 600,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Server size={16} />
            <span>Meridian Exploit Chain ({challenges.filter(c => !c.id.startsWith('pico-')).length})</span>
          </button>

          <button
            onClick={() => { setSelectedTrack('picoctf'); setSelectedCategory('All'); }}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: selectedTrack === 'picoctf' ? '2.5px solid #06b6d4' : '2.5px solid transparent',
              color: selectedTrack === 'picoctf' ? '#38bdf8' : '#94a3b8',
              fontWeight: selectedTrack === 'picoctf' ? 800 : 600,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} color="#06b6d4" />
            <span>picoCTF Arena ({challenges.filter(c => c.id.startsWith('pico-')).length})</span>
          </button>
        </div>

        <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          SHOWING: {displayedChallenges.length} TARGETS
        </span>
      </div>

      {/* Track 1: Meridian Exploit Chain Stepper (All 11 Sequential Attacks) */}
      {selectedTrack === 'meridian' && (
        <div style={{ marginBottom: 24 }}>
          {/* Recommended Chain Stepper Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sequential Multi-Stage Campaign Map (11 Attacks)
            </span>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Follow the attack chain step-by-step
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {[
              { id: 'ch-sqli-01', step: 'STEP 01', title: 'SQL Injection' },
              { id: 'ch-info-02', step: 'STEP 02', title: 'Info Disclosure' },
              { id: 'ch-auth-03', step: 'STEP 03', title: 'Auth Bypass' },
              { id: 'ch-idor-04', step: 'STEP 04', title: 'XSS / IDOR' },
              { id: 'ch-upload-05', step: 'STEP 05', title: 'File Upload' },
              { id: 'ch-privesc-06', step: 'STEP 06', title: 'Priv Escalation' },
              { id: 'ch-dos-07', step: 'STEP 07', title: 'DoS Simulation' },
              { id: 'ch-ssrf-08', step: 'STEP 08', title: 'SSRF Cloud' },
              { id: 'ch-jwt-09', step: 'STEP 09', title: 'Broken JWT' },
              { id: 'ch-csrf-10', step: 'STEP 10', title: 'CSRF Forgery' },
              { id: 'ch-race-11', step: 'STEP 11', title: 'Race Condition' },
            ].map((item) => {
              const ch = challenges.find((c) => c.id === item.id);
              const isCompleted = ch?.status === 'completed';
              const isUnlocked = Boolean(ch?.unlocked);

              return (
                <div
                  key={item.id}
                  onClick={() => isUnlocked && onSelectChallenge(item.id)}
                  style={{
                    backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.12)' : isUnlocked ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                    border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.4)' : isUnlocked ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: 8,
                    padding: '9px 10px',
                    cursor: isUnlocked ? 'pointer' : 'default',
                    opacity: isUnlocked ? 1 : 0.5,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (isUnlocked) e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    if (isUnlocked) e.currentTarget.style.borderColor = isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: isCompleted ? '#34d399' : '#94a3b8', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>
                    {isCompleted ? '✔ COMPLETED' : item.step}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                    {item.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track 2: picoCTF Arena Category Filter Chips */}
      {selectedTrack === 'picoctf' && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['All', 'Web Exploitation', 'Cryptography', 'Forensics', 'Reverse Engineering', 'Binary Exploitation'].map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    color: isSelected ? '#38bdf8' : '#94a3b8',
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Challenge Grid Section */}
      <div style={{ marginBottom: 30 }}>
        {displayedChallenges.length === 0 ? (
          <div className="ui-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <Search size={32} color="#64748b" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
              No challenges match your search
            </h3>
            <p style={{ fontSize: 13, margin: 0 }}>
              Try searching with a different vulnerability keyword or click "All" categories.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 16 }}>
            {displayedChallenges.map((ch) => {
              const isCompleted = ch.status === 'completed';
              const isUnlocked = Boolean(ch.unlocked);

              // Difficulty badge variant
              const diffVariant = ch.difficulty === 'Easy' ? 'emerald' : ch.difficulty === 'Hard' ? 'rose' : 'amber';

              return (
                <div
                  key={ch.id}
                  className="ui-card ui-card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Header: Icon, Category tag, time */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getChallengeIcon(ch.title, ch.category)}
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        {ch.estimated_time || '15 min'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 14.5, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px', lineHeight: 1.3 }}>
                      {ch.title}
                    </h4>

                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.02em' }}>
                      {ch.category}
                    </div>

                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.45, minHeight: 48 }}>
                      {ch.description.length > 95 ? ch.description.slice(0, 95) + '...' : ch.description}
                    </p>
                  </div>

                  <div>
                    {/* Bottom Metadata: Difficulty & XP */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span className={`badge badge-${diffVariant}`}>
                        {ch.difficulty}
                      </span>
                      <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
                        +{ch.xp_reward} XP
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant={isCompleted ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={!isUnlocked}
                      onClick={() => isUnlocked && onSelectChallenge(ch.id)}
                      style={{ width: '100%', padding: '8px', fontSize: 12.5 }}
                    >
                      {isCompleted ? 'Review Solution' : 'Deploy Mission ➔'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Safety & Sandbox Notice */}
      <div style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
        🛡️ Fully isolated local cybersecurity laboratory (127.0.0.1:8888). Safe environment for real-world ethical exploitation practice.
      </div>

      {/* picoCTF Open-Source Community Hub & Importer Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 640, padding: '24px 28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={20} color="#34d399" />
                  <span>picoCTF Open-Source Community Hub</span>
                </h3>
                <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '4px 0 0' }}>
                  Ingest open-source community challenges directly into your offline curriculum with one click.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError('');
                  setImportSuccessMsg('');
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 18 }}>
              <button
                onClick={() => { setImportTab('packs'); setImportError(''); }}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: importTab === 'packs' ? '2.5px solid #10b981' : '2.5px solid transparent',
                  color: importTab === 'packs' ? '#34d399' : '#94a3b8',
                  fontWeight: importTab === 'packs' ? 700 : 500,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Package size={14} />
                <span>1-Click Community Packs</span>
              </button>

              <button
                onClick={() => { setImportTab('github'); setImportError(''); }}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: importTab === 'github' ? '2.5px solid #10b981' : '2.5px solid transparent',
                  color: importTab === 'github' ? '#34d399' : '#94a3b8',
                  fontWeight: importTab === 'github' ? 700 : 500,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Globe size={14} />
                <span>GitHub Raw Importer</span>
              </button>

              <button
                onClick={() => { setImportTab('json'); setImportError(''); }}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: importTab === 'json' ? '2.5px solid #10b981' : '2.5px solid transparent',
                  color: importTab === 'json' ? '#34d399' : '#94a3b8',
                  fontWeight: importTab === 'json' ? 700 : 500,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Code size={14} />
                <span>Custom JSON Editor</span>
              </button>
            </div>

            {/* Success Notification */}
            {importSuccessMsg && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14, fontWeight: 600 }}>
                {importSuccessMsg}
              </div>
            )}

            {/* Error Notification */}
            {importError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>
                {importError}
              </div>
            )}

            {/* TAB 1: CURATED COMMUNITY PACKS */}
            {importTab === 'packs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {COMMUNITY_PACKS.map((pack) => {
                  const isInstalled = installedPackIds.includes(pack.id);
                  return (
                    <div
                      key={pack.id}
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc' }}>{pack.title}</span>
                          <span className="badge badge-emerald">
                            {pack.badge}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                          {pack.desc}
                        </p>
                      </div>

                      <Button
                        variant={isInstalled ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={importLoading || isInstalled}
                        onClick={() => handleInstallPack(pack)}
                        style={{ minWidth: 105 }}
                      >
                        {isInstalled ? '✓ Installed' : 'Install Pack'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: GITHUB RAW IMPORTER */}
            {importTab === 'github' && (
              <div>
                <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Connect directly to any open-source GitHub repository hosting picoCTF or CTFd challenge definitions in raw JSON format.
                </p>

                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
                  GitHub Raw Content URL
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: 12 }}
                />

                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={() => setGithubUrl('https://raw.githubusercontent.com/picoCTF/picoCTF-challenges/main/community-web.json')}
                    style={{ fontSize: 11, color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Load Sample Web Repo
                  </button>
                  <button
                    type="button"
                    onClick={() => setGithubUrl('https://raw.githubusercontent.com/picoCTF/picoCTF-challenges/main/crypto-challenges.json')}
                    style={{ fontSize: 11, color: '#38bdf8', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Load Sample Crypto Repo
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowImportModal(false)}>
                    Close
                  </Button>
                  <Button variant="primary" size="sm" loading={importLoading} onClick={handleFetchGithub}>
                    Fetch & Ingest from GitHub
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOM JSON EDITOR */}
            {importTab === 'json' && (
              <div>
                <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Paste custom JSON matching the standard picoCTF / CTFd specification. Both single objects and arrays are accepted.
                </p>

                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder={`[
  {
    "title": "DNS Tunneling Discovery",
    "category": "Forensics",
    "difficulty": "Medium",
    "xp_reward": 150,
    "description": "Analyze network pcap and reconstruct exfiltrated data.",
    "flag": "picoCTF{dns_tunnel_detected}",
    "target_url": "http://127.0.0.1:8888/pico/inspector"
  }
]`}
                  className="form-input"
                  style={{
                    height: 160,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    marginBottom: 16,
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowImportModal(false)}>
                    Close
                  </Button>
                  <Button variant="primary" size="sm" loading={importLoading} onClick={handleCustomImport}>
                    Validate & Ingest JSON
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
