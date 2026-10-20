import http from 'http';
import url from 'url';

// --- Binary Artifact Generators ---

export function createJpegWithExif(artist: string): Buffer {
  const artistBuf = Buffer.from(artist + '\0', 'ascii');
  const tiff = Buffer.alloc(26 + artistBuf.length);
  tiff.write('II', 0); // Intel little-endian
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8); // 1 directory entry
  tiff.writeUInt16LE(0x013b, 10); // Artist tag ID
  tiff.writeUInt16LE(2, 12); // Type ASCII
  tiff.writeUInt32LE(artistBuf.length, 14); // Byte count
  tiff.writeUInt32LE(26, 18); // Offset to string value
  tiff.writeUInt32LE(0, 22); // Next IFD = 0
  artistBuf.copy(tiff, 26);

  const exifHeader = Buffer.from('Exif\0\0');
  const app1Payload = Buffer.concat([exifHeader, tiff]);
  const app1Header = Buffer.alloc(4);
  app1Header[0] = 0xff;
  app1Header[1] = 0xe1;
  app1Header.writeUInt16BE(app1Payload.length + 2, 2);

  const soi = Buffer.from([0xff, 0xd8]);
  const jpegBody = Buffer.from([
    0xff, 0xdb, 0x00, 0x43, 0x00,
    0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32,
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x00,
    0xff, 0xd9
  ]);

  return Buffer.concat([soi, app1Header, app1Payload, jpegBody]);
}

export function createPcapBuffer(payloadStr: string): Buffer {
  const gh = Buffer.alloc(24);
  gh.writeUInt32LE(0xa1b2c3d4, 0); // Magic number
  gh.writeUInt16LE(2, 4);          // Major version 2
  gh.writeUInt16LE(4, 6);          // Minor version 4
  gh.writeInt32LE(0, 8);           // Timezone
  gh.writeUInt32LE(0, 12);         // Sigfigs
  gh.writeUInt32LE(65535, 16);     // Snaplen
  gh.writeUInt32LE(1, 20);         // Linktype: Ethernet (1)

  const payload = Buffer.from(payloadStr, 'utf8');
  const eth = Buffer.from('00112233445500aabbccddeeff0800', 'hex'); // 14 bytes
  const ip = Buffer.alloc(20);
  ip[0] = 0x45;
  ip.writeUInt16BE(20 + 20 + payload.length, 2);
  ip.writeUInt16BE(0x1234, 4);
  ip[8] = 64; // TTL
  ip[9] = 6;  // TCP
  ip.writeUInt32BE(0xc0a8010a, 12); // 192.168.1.10
  ip.writeUInt32BE(0xc0a80132, 16); // 192.168.1.50

  const tcp = Buffer.alloc(20);
  tcp.writeUInt16BE(52410, 0); // Src port
  tcp.writeUInt16BE(80, 2);    // Dst port
  tcp.writeUInt32BE(1001, 4);
  tcp.writeUInt32BE(2001, 8);
  tcp[12] = 0x50; // Data offset 5
  tcp[13] = 0x18; // PSH, ACK
  tcp.writeUInt16BE(64240, 14);

  const packetData = Buffer.concat([eth, ip, tcp, payload]);
  const ph = Buffer.alloc(16);
  ph.writeUInt32LE(1672531199, 0);
  ph.writeUInt32LE(318000, 4);
  ph.writeUInt32LE(packetData.length, 8);
  ph.writeUInt32LE(packetData.length, 12);

  return Buffer.concat([gh, ph, packetData]);
}

export function createCorruptedPngBuffer(): Buffer {
  // First 4 bytes are 00 00 00 00 instead of 89 50 4E 47
  const header = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.from('0000000d4948445200000001000000010802000000907753de', 'hex');
  const commentKeyword = Buffer.from('Comment\0');
  const commentText = Buffer.from('picoCTF{m4g1c_byt3s_r3st0r3d_f1l3_4c81a92e}');
  const textPayload = Buffer.concat([commentKeyword, commentText]);
  const textChunkHeader = Buffer.alloc(8);
  textChunkHeader.writeUInt32BE(textPayload.length, 0);
  textChunkHeader.write('tEXt', 4);
  const textCrc = Buffer.from([0x5c, 0x72, 0xa8, 0x19]);
  const idat = Buffer.from('0000000c49444154789c6360000000020001e221bc33', 'hex');
  const iend = Buffer.from('0000000049454e44ae426082', 'hex');

  return Buffer.concat([header, ihdr, textChunkHeader, textPayload, textCrc, idat, iend]);
}

export function createElfBinaryBuffer(): Buffer {
  const elf = Buffer.alloc(512);
  elf.write('\x7fELF\x02\x01\x01\x00', 0);
  elf.writeUInt16LE(2, 16);
  elf.writeUInt16LE(62, 18);
  elf.writeUInt32LE(1, 20);
  elf.writeBigUInt64LE(0x401000n, 24);

  const strings = [
    "/lib64/ld-linux-x86-64.so.2",
    "libc.so.6",
    "puts",
    "printf",
    "__libc_start_main",
    "GLIBC_2.2.5",
    "Usage: ./mystery_bin <password>",
    "picoCTF{str1ngs_3xtr4ct10n_b1n4ry_31a9fd20}",
    "Access denied.",
    "mystery_bin: debug symbols verified"
  ].join('\0');

  elf.write(strings, 64);
  return elf;
}

// --- Download Handler ---

export function handlePicoDownload(res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
  const filename = String(parsedUrl.query.file || parsedUrl.pathname?.split('/').pop() || '').toLowerCase();

  if (filename === 'enc' || filename === 'transformation.enc' || filename === 'transformation.txt') {
    const data = Buffer.from('灩捯䍔䙻ㄶ形楴獟楮獴㌴摟潦弸弲㘶㠴挲ぽ', 'utf8');
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="enc"',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (filename === 'cat.jpg' || filename === 'cat') {
    const data = createJpegWithExif('cGljb0NURnt0aDNfbTN0YWRhdGFfMXNfbW9kaWZpZWRfYzFlMmE0OTJ9');
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="cat.jpg"',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (filename === 'capture.pcap' || filename === 'traffic.pcap') {
    const httpPayload = `POST /api/v1/auth HTTP/1.1\r\nHost: meridian.local\r\nUser-Agent: Mozilla/5.0 (X11; Linux x86_64)\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 76\r\n\r\nuser=auditor&secret_auth_flag=picoCTF{p4ck3t_sn1ff1ng_w1r3sh4rk_92af401e}\r\n`;
    const data = createPcapBuffer(httpPayload);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.tcpdump.pcap',
      'Content-Disposition': 'attachment; filename="traffic.pcap"',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (filename === 'flag_corrupted.png' || filename === 'corrupted.png') {
    const data = createCorruptedPngBuffer();
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="flag_corrupted.png"',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (filename === 'mystery_bin' || filename === 'gdbme') {
    const data = createElfBinaryBuffer();
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (filename === 'vuln_bof.c' || filename === 'vuln.c') {
    const data = Buffer.from(
`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void win() {
    printf("picoCTF{st4ck_sm4sh_v4r_0v3rwr1tt3n_68f1a29d}\\n");
}

int main(int argc, char **argv) {
    volatile int modified = 0;
    char buf[64];

    printf("Enter string: ");
    gets(buf);

    if (modified != 0) {
        printf("YOU WIN! Variable modified = 0x%08x\\n", modified);
        win();
    } else {
        printf("Try again! modified = 0x%08x\\n", modified);
    }
    return 0;
}
`, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="vuln_bof.c"',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (filename === 'crackme.c') {
    const data = Buffer.from(
`#include <stdio.h>
#include <string.h>

int check_key(char *key) {
    if (strlen(key) != 9) return 0;
    int sum = key[0] + key[1] + key[2] + key[3];
    if (sum != 348) return 0;
    if (key[4] != '-') return 0;
    if (strcmp(key + 5, "2026") != 0) return 0;
    return 1;
}

int main() {
    char key[64];
    printf("Enter license key: ");
    scanf("%63s", key);
    if (check_key(key)) {
        printf("Access Granted! picoCTF{cr4ckm3_k3y_r3v3rs3d_99b01ae4}\\n");
    } else {
        printf("Invalid key.\\n");
    }
    return 0;
}
`, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="crackme.c"',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  if (filename === 'numbers.txt' || filename === 'the_numbers.txt') {
    const data = Buffer.from('16 9 3 15 3 20 6 { 20 8 5 14 21 13 2 5 18 19 13 1 19 15 14 }', 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="numbers.txt"',
      'Content-Length': data.length,
    });
    res.end(data);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Challenge artifact not found');
}

// --- Common UI Components ---

function renderHeader(title: string, category: string, downloadLinks: { label: string; file: string }[] = []): string {
  const downloadHtml = downloadLinks.map(l =>
    `<a href="/pico/download?file=${l.file}" download="${l.file}" style="display:inline-flex; align-items:center; gap:6px; background:#f0fdf4; color:#047857; border:1px solid #a7f3d0; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:700; text-decoration:none; margin-right:8px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download ${l.label}
    </a>`
  ).join('');

  return `
    <div style="border-bottom:1px solid #e2e8f0; padding-bottom:14px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#059669; margin-bottom:4px;">picoCTF · ${category}</div>
        <h2 style="margin:0; font-size:20px; font-weight:800; color:#0f172a;">${title}</h2>
      </div>
      <div>${downloadHtml}</div>
    </div>
  `;
}

// --- picoCTF Challenge Routes ---

export function handlePico(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery): void {
  const pathname = parsedUrl.pathname || '';

  // 1. Insp3ct0r
  if (pathname === '/pico/inspector/mycss.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(`/* You need CSS to look good. 2/3: spect4cl3s_ */
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
.hero { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 48px 32px; text-align: center; }
.card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }`);
    return;
  }

  if (pathname === '/pico/inspector/myjs.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(`/* Javascript is fun. 3/3: _4dd392c1} */
console.log("Insp3ct0r: Web application assets initialized successfully.");`);
    return;
  }

  if (pathname === '/pico/inspector') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Insp3ct0r - picoCTF</title>
  <link rel="stylesheet" href="/pico/inspector/mycss.css">
  <script src="/pico/inspector/myjs.js"></script>
</head>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f8fafc; color:#0f172a; margin:0; padding:24px;">
  <!-- Html is neat. Lay out your pages with pride. 1/3: picoCTF{specs_0n_ -->
  <div style="max-width:760px; margin:0 auto; background:white; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
    <div style="background:#047857; color:white; padding:24px 32px;">
      <div style="font-size:12px; font-weight:700; letter-spacing:1px; opacity:0.85;">picoCTF · WEB EXPLOITATION</div>
      <h1 style="margin:6px 0 0; font-size:24px; font-weight:800;">Apex Creative Agency</h1>
    </div>
    <div style="padding:32px;">
      <h3 style="margin-top:0;">I made a website, can you help me inspect it?</h3>
      <p style="color:#475569; line-height:1.6; font-size:14px;">
        Web applications are built out of three core ingredients: <strong>HTML</strong> structure, <strong>CSS</strong> stylesheets, and <strong>JavaScript</strong> client logic. Inspect the raw source files, stylesheets, and scripts of this website to assemble the three parts of the secret flag!
      </p>

      <div style="margin-top:24px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
        <div style="background:#f1f5f9; padding:8px 16px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; font-weight:700; color:#475569;">Browser DevTools / Source Assets Drawer</span>
          <div style="display:flex; gap:6px;">
            <button onclick="showTab('html')" id="btnHtml" style="padding:4px 10px; font-size:11px; font-weight:700; border-radius:4px; border:1px solid #cbd5e1; background:#047857; color:white; cursor:pointer;">index.html</button>
            <button onclick="showTab('css')" id="btnCss" style="padding:4px 10px; font-size:11px; font-weight:700; border-radius:4px; border:1px solid #cbd5e1; background:white; color:#475569; cursor:pointer;">mycss.css</button>
            <button onclick="showTab('js')" id="btnJs" style="padding:4px 10px; font-size:11px; font-weight:700; border-radius:4px; border:1px solid #cbd5e1; background:white; color:#475569; cursor:pointer;">myjs.js</button>
          </div>
        </div>
        <pre id="tabContent" style="margin:0; padding:16px; background:#0f172a; color:#38bdf8; font-family:monospace; font-size:12.5px; line-height:1.5; overflow-x:auto; min-height:140px;"></pre>
      </div>
    </div>
  </div>

  <script>
    const sources = {
      html: \`<!DOCTYPE html>\\n<html>\\n<head>\\n  <title>Insp3ct0r</title>\\n  <link rel="stylesheet" href="/pico/inspector/mycss.css">\\n  <script src="/pico/inspector/myjs.js"><\\/script>\\n</head>\\n<body>\\n  <!-- Html is neat. Lay out your pages with pride. 1/3: picoCTF{specs_0n_ -->\\n  <h1>Apex Creative Agency</h1>\\n</body>\\n</html>\`,
      css: \`/* You need CSS to look good. 2/3: spect4cl3s_ */\\nbody { font-family: sans-serif; background: #f8fafc; color: #0f172a; margin: 0; }\\n.hero { background: #047857; color: white; padding: 48px; text-align: center; }\`,
      js: \`/* Javascript is fun. 3/3: _4dd392c1} */\\nconsole.log("Insp3ct0r: Web application assets initialized successfully.");\`
    };

    function showTab(type) {
      document.getElementById('tabContent').textContent = sources[type];
      ['html', 'css', 'js'].forEach(t => {
        const btn = document.getElementById('btn' + t.charAt(0).toUpperCase() + t.slice(1));
        if (t === type) {
          btn.style.background = '#047857';
          btn.style.color = 'white';
        } else {
          btn.style.background = 'white';
          btn.style.color = '#475569';
        }
      });
    }
    showTab('html');
  </script>
</body>
</html>`);
    return;
  }

  // 2. Cookies
  if (pathname === '/pico/cookies') {
    const cookieHeader = req.headers.cookie || '';
    let cookieVal = '';
    const match = cookieHeader.match(/name=([^;]+)/);
    if (match) cookieVal = match[1];

    if (parsedUrl.query.name !== undefined) {
      cookieVal = String(parsedUrl.query.name);
      res.setHeader('Set-Cookie', `name=${cookieVal}; Path=/pico/cookies`);
    }

    const cookieFlavors: Record<string, string> = {
      '0': 'Chocolate Chip',
      '1': 'Snickerdoodle',
      '2': 'Oatmeal Raisin',
      '3': 'Peanut Butter',
      '4': 'Sugar Cookie',
      '5': 'Macaron',
      '6': 'Gingersnap',
      '7': 'Shortbread',
      '8': 'White Chocolate Macadamia',
      '9': 'Butter Pecan',
      '10': 'Double Chocolate',
      '11': 'Gingerbread',
      '12': 'Biscotti',
      '13': 'Lemon Drop',
      '14': 'Fortune Cookie',
      '15': 'Almond Crescent',
      '16': 'Molasses Cookie',
      '17': 'Caramel Fudge',
      '18': 'FLAG_COOKIE',
      '19': 'Coconut Macaroon',
      '20': 'Black and White Cookie'
    };

    const isFlagCookie = cookieVal === '18';
    const flavor = cookieFlavors[cookieVal] || (cookieVal ? 'Custom Bakery Cookie' : null);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Cookies', 'Web Exploitation')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Who doesn't love cookies? Search for a cookie flavor in Grandma's Cookie Jar, or manipulate the HTTP <code>name</code> session cookie to find the special secret cookie.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <form method="GET" action="/pico/cookies">
      <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Search Cookie ID / Value</label>
      <div style="display:flex; gap:8px;">
        <input type="text" name="name" placeholder="Enter cookie number (0-25)" value="${cookieVal !== '' ? cookieVal : ''}" style="flex:1; padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13.5px;" />
        <button type="submit" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Update Cookie</button>
      </div>
    </form>
  </div>

  <div style="border:1px solid ${isFlagCookie ? '#a7f3d0' : '#e2e8f0'}; background:${isFlagCookie ? '#ecfdf5' : '#f8fafc'}; border-radius:8px; padding:16px;">
    <div style="font-size:12px; font-weight:700; color:#64748b; margin-bottom:4px;">ACTIVE COOKIE HEADER: <code style="color:#0f172a;">name=${cookieVal !== '' ? cookieVal : '(none)'}</code></div>
    ${isFlagCookie
      ? `<div style="color:#047857; font-weight:800; font-size:16px; margin-top:8px;">🎉 Special Cookie Recognized! Flag: <code style="background:#d1fae5; padding:4px 8px; border-radius:4px;">picoCTF{3v3ryb0dy_l1k3s_c00k13s_96f01e30}</code></div>`
      : flavor
        ? `<div style="font-size:14px; color:#334155;">🍪 You received a delicious <strong>${flavor}</strong>! But it's not the secret flag cookie. Try searching different cookie numbers!</div>`
        : `<div style="font-size:14px; color:#64748b;">No cookie searched yet. Try searching for a cookie ID.</div>`
    }
  </div>
</body>
</html>`);
    return;
  }

  // 3. Local Authority
  if (pathname === '/pico/local-authority/secure.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(`function checkPassword(username, password) {
  if (username === "admin" && password === "strongPassword0987") {
    return true;
  }
  return false;
}`);
    return;
  }

  if (pathname === '/pico/local-authority') {
    const u = parsedUrl.query.user as string;
    const p = parsedUrl.query.pass as string;
    const isSubmitted = u !== undefined && p !== undefined;
    const isAuth = u === 'admin' && p === 'strongPassword0987';

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <script src="/pico/local-authority/secure.js"></script>
</head>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Local Authority', 'Web Exploitation')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    An internal admin portal validates credentials on the client side using <code>secure.js</code>. Inspect the page scripts in DevTools or view the loaded source assets to uncover the hardcoded credentials.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:24px; margin:20px 0;">
    <form method="GET" action="/pico/local-authority">
      <div style="margin-bottom:14px;">
        <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Username</label>
        <input type="text" name="user" value="${u || ''}" placeholder="Enter administrator username" style="width:100%; box-sizing:border-box; padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13.5px;" />
      </div>
      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Password</label>
        <input type="password" name="pass" placeholder="Enter password" style="width:100%; box-sizing:border-box; padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13.5px;" />
      </div>
      <button type="submit" style="padding:10px 20px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Log in</button>
    </form>
  </div>

  ${isSubmitted ? (isAuth
    ? `<div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:8px; color:#047857; font-weight:bold;">
        ★ Authentication Succeeded! Welcome Administrator. Flag: <code>picoCTF{j5_15_7r4n5p4r3n7_05dfa048}</code>
       </div>`
    : `<div style="background:#fef2f2; border:1px solid #fecaca; padding:14px; border-radius:8px; color:#b91c1c; font-size:13px;">
        ✖ Access Denied: Invalid username or password. Check the loaded client scripts in DevTools.
       </div>`
  ) : ''}

  <div style="margin-top:20px;">
    <button onclick="document.getElementById('srcBox').style.display = document.getElementById('srcBox').style.display === 'none' ? 'block' : 'none'" style="background:none; border:none; color:#047857; font-size:12px; font-weight:700; cursor:pointer; padding:0; text-decoration:underline;">
      🔍 View Loaded secure.js Script
    </button>
    <pre id="srcBox" style="display:none; margin-top:10px; background:#0f172a; color:#38bdf8; padding:14px; border-radius:6px; font-family:monospace; font-size:12px; line-height:1.5;">function checkPassword(username, password) {
  if (username === "admin" && password === "strongPassword0987") {
    return true;
  }
  return false;
}</pre>
  </div>
</body>
</html>`);
    return;
  }

  // 4. GET aHEAD
  if (pathname === '/pico/get-ahead') {
    if (req.method === 'HEAD') {
      res.setHeader('flag', 'picoCTF{r3ad_the_h3ad3r_2d89b31d}');
      res.writeHead(200);
      res.end();
      return;
    }

    let color = 'white';
    if (req.method === 'POST') color = '#fee2e2'; // Red
    else if (parsedUrl.query.method === 'get') color = '#e0f2fe'; // Blue

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:${color}; color:#0f172a; padding:32px; max-width:680px; margin:0 auto; transition:background 0.3s;">
  ${renderHeader('GET aHEAD', 'Web Exploitation')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Choose a button to set the theme. GET sets blue, POST sets red. Maybe there is another HTTP method that will get you ahead?
  </p>

  <div style="display:flex; gap:12px; margin:24px 0;">
    <form method="GET" action="/pico/get-ahead">
      <input type="hidden" name="method" value="get" />
      <button type="submit" style="padding:12px 24px; background:#0284c7; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer;">Choose Blue (GET)</button>
    </form>
    <form method="POST" action="/pico/get-ahead">
      <button type="submit" style="padding:12px 24px; background:#dc2626; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer;">Choose Red (POST)</button>
    </form>
  </div>

  <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin-top:24px;">
    <h4 style="margin:0 0 10px; font-size:13.5px; color:#334155;">Custom HTTP Request Dispatcher</h4>
    <div style="display:flex; gap:8px;">
      <select id="methodSelect" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-weight:700;">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="HEAD">HEAD</option>
        <option value="OPTIONS">OPTIONS</option>
        <option value="PUT">PUT</option>
      </select>
      <button onclick="dispatchHttp()" style="padding:8px 16px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Send HTTP Request</button>
    </div>
    <pre id="responseHeaders" style="display:none; margin-top:14px; background:#0f172a; color:#38bdf8; padding:14px; border-radius:6px; font-family:monospace; font-size:12px; line-height:1.5;"></pre>
  </div>

  <script>
    async function dispatchHttp() {
      const m = document.getElementById('methodSelect').value;
      const resp = await fetch('/pico/get-ahead', { method: m });
      const headers = [];
      for (const [k, v] of resp.headers.entries()) {
        headers.push(k + ': ' + v);
      }
      const box = document.getElementById('responseHeaders');
      box.style.display = 'block';
      box.textContent = 'HTTP/1.1 ' + resp.status + ' OK\\n' + headers.join('\\n');
    }
  </script>
</body>
</html>`);
    return;
  }

  // 5. Forbidden Paths
  if (pathname === '/pico/forbidden-paths') {
    const readPath = (parsedUrl.query.path as string || '').trim();
    let fileOutput = '';
    let isError = false;

    if (readPath.startsWith('/')) {
      fileOutput = 'Error: Absolute paths starting with "/" are forbidden by access filters.';
      isError = true;
    } else if (readPath.includes('../../../../flag.txt') || readPath.includes('../flag.txt')) {
      fileOutput = 'picoCTF{7h3_p47h_70_5ucc355_e5a4f781}';
    } else if (readPath) {
      fileOutput = `File "${readPath}" not found in /usr/share/nginx/html/. Try relative path climbing.`;
      isError = true;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Forbidden Paths', 'Web Exploitation')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    The application reads documents from <code>/usr/share/nginx/html/</code>. The target flag is located at the filesystem root <code>/flag.txt</code>. The filter disallows absolute paths starting with <code>/</code>, but what about relative path traversal (<code>../</code>)?
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <form method="GET" action="/pico/forbidden-paths">
      <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Relative Path to File</label>
      <div style="display:flex; gap:8px;">
        <input type="text" name="path" value="${readPath}" placeholder="e.g. readfile.txt" style="flex:1; padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; font-size:13.5px;" />
        <button type="submit" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Read Document</button>
      </div>
    </form>
  </div>

  ${fileOutput ? `
  <div style="padding:16px; border-radius:8px; background:${isError ? '#fef2f2' : '#ecfdf5'}; border:1px solid ${isError ? '#fecaca' : '#a7f3d0'}; color:${isError ? '#b91c1c' : '#047857'}; font-family:monospace; font-size:13px; font-weight:${isError ? 'normal' : 'bold'};">
    ${fileOutput}
  </div>` : ''}
</body>
</html>`);
    return;
  }

  // 6. SQL Direct
  if (pathname === '/pico/sql-direct') {
    const q = (parsedUrl.query.query as string || '').trim();
    let sqlOut = '';

    if (q === '\\d' || q === '\\dt') {
      sqlOut = `             List of relations\\n Schema | Name  | Type  |  Owner   \\n--------+-------+-------+----------\\n public | flags | table | postgres\\n(1 row)`;
    } else if (q.toLowerCase().includes('select') && q.toLowerCase().includes('flag')) {
      sqlOut = ` id |                   flag                    \\n----+-------------------------------------------\\n  1 | picoCTF{congrat5_you_found_the_flag_9128a301}\\n(1 row)`;
    } else if (q) {
      sqlOut = `ERROR:  syntax error at or near "${q.split(' ')[0]}"\\nLINE 1: ${q}`;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:monospace; background:#0b1311; color:#e2e8f0; padding:32px;">
  <div style="max-width:760px; margin:0 auto;">
    <div style="color:#34d399; font-size:14px; font-weight:bold; margin-bottom:12px;">picoCTF · SQL Direct Terminal (PostgreSQL 14.2)</div>
    <p style="color:#94a3b8; font-size:12.5px; line-height:1.5;">Type <code>\\d</code> to list database relations, or execute SQL queries to retrieve table contents.</p>

    <form method="GET" action="/pico/sql-direct" style="margin:20px 0; display:flex; gap:8px;">
      <span style="color:#34d399; line-height:36px; font-weight:bold;">pico_db=#</span>
      <input type="text" name="query" value="${q}" placeholder="SELECT * FROM flags;" style="flex:1; padding:8px 12px; background:#16241f; border:1px solid #2e473e; color:#38bdf8; font-family:inherit; border-radius:6px;" autofocus />
      <button type="submit" style="padding:8px 16px; background:#059669; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Execute</button>
    </form>

    ${sqlOut ? `<pre style="background:#16241f; border:1px solid #2e473e; padding:16px; border-radius:8px; color:#34d399; font-size:12.5px; line-height:1.5; white-space:pre-wrap;">${sqlOut}</pre>` : ''}
  </div>
</body>
</html>`);
    return;
  }

  // 7. Mod 26 (ROT13)
  if (pathname === '/pico/crypto-rot13') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Mod 26 (ROT13)', 'Cryptography')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Cryptography can be easy, do you know what ROT13 is? ROT13 rotates every alphabetic character forward by 13 positions.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Ciphertext Input</label>
    <textarea id="rotInput" style="width:100%; box-sizing:border-box; height:70px; padding:10px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:6px;">cvpbPGS{arkg_gvzr_V'yy_gel_2_ebhaqf_bs_ebg13_GYFjXn9w}</textarea>

    <div style="margin:16px 0 8px;">
      <label style="font-size:12.5px; font-weight:700; color:#334155;">Rotation Shift: <span id="shiftCount" style="color:#047857;">13</span></label><br/>
      <input type="range" id="shiftRange" min="0" max="25" value="13" oninput="runRot(this.value)" style="width:100%; margin-top:6px;" />
    </div>
  </div>

  <div style="border:1px solid #a7f3d0; background:#ecfdf5; border-radius:8px; padding:16px;">
    <div style="font-size:11px; font-weight:800; color:#059669; margin-bottom:4px;">ROTATED OUTPUT</div>
    <div id="rotOutput" style="font-family:monospace; font-weight:bold; font-size:14px; color:#047857; word-break:break-all;"></div>
  </div>

  <script>
    function runRot(shift) {
      shift = parseInt(shift);
      document.getElementById('shiftCount').textContent = shift;
      const str = document.getElementById('rotInput').value;
      const dec = str.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
      });
      document.getElementById('rotOutput').textContent = dec;
    }
    runRot(13);
  </script>
</body>
</html>`);
    return;
  }

  // 8. The Numbers (A1Z26)
  if (pathname === '/pico/crypto-numbers') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('The Numbers', 'Cryptography', [{ label: 'numbers.txt', file: 'numbers.txt' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    The numbers... what do they mean? In an A1Z26 cipher, numbers 1 through 26 map to letters A through Z.
  </p>

  <div style="background:#0f172a; color:#38bdf8; font-family:monospace; padding:16px; border-radius:8px; font-size:13.5px; line-height:1.6; margin:20px 0;">
    16 9 3 15 3 20 6 { 20 8 5 14 21 13 2 5 18 19 13 1 19 15 14 }
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <h4 style="margin:0 0 10px; font-size:13px; color:#334155;">A1Z26 Reference Wheel & Translation Scratchpad</h4>
    <div style="font-family:monospace; font-size:11.5px; color:#64748b; line-height:1.6; margin-bottom:14px; background:white; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
      1=A  2=B  3=C  4=D  5=E  6=F  7=G  8=H  9=I  10=J 11=K 12=L 13=M<br/>
      14=N 15=O 16=P 17=Q 18=R 19=S 20=T 21=U 22=V 23=W 24=X 25=Y 26=Z
    </div>
    <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Test Your Translated Letters</label>
    <input type="text" id="solInput" placeholder="picoCTF{...}" oninput="checkNumbers(this.value)" style="width:100%; box-sizing:border-box; padding:8px 12px; font-family:monospace; border:1px solid #cbd5e1; border-radius:6px; font-size:13px;" />
    <div id="numFeedback" style="margin-top:10px; font-size:12.5px; font-weight:700; color:#64748b;"></div>
  </div>

  <script>
    function checkNumbers(v) {
      const fb = document.getElementById('numFeedback');
      if (v === 'picoCTF{thenumbersmason}') {
        fb.style.color = '#047857';
        fb.textContent = '🎉 Exact match! You deciphered The Numbers.';
      } else if (v.startsWith('picoCTF{')) {
        fb.style.color = '#0284c7';
        fb.textContent = 'Good start! Translate the numbers inside the braces: 20=T, 8=H, 5=E...';
      } else {
        fb.textContent = '';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 9. Information (EXIF Metadata)
  if (pathname === '/pico/forensics-exif') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Information', 'Forensics', [{ label: 'cat.jpg', file: 'cat.jpg' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Files can always have secret data tucked inside them. Inspect the EXIF metadata tags of <code>cat.jpg</code> using <code>exiftool</code> or <code>strings</code>, then decode the hidden Base64 payload.
  </p>

  <div style="background:#0f172a; color:#e2e8f0; font-family:monospace; padding:16px; border-radius:8px; font-size:12.5px; line-height:1.6; margin:20px 0;">
    <div style="color:#38bdf8; margin-bottom:8px;">$ exiftool cat.jpg</div>
    File Name                       : cat.jpg<br/>
    File Size                       : 878 kB<br/>
    Camera Model Name               : Digital SLR-500<br/>
    Artist                          : <span style="color:#34d399; font-weight:bold;">cGljb0NURnt0aDNfbTN0YWRhdGFfMXNfbW9kaWZpZWRfYzFlMmE0OTJ9</span><br/>
    Resolution                      : 1024x768
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <h4 style="margin:0 0 10px; font-size:13px; color:#334155;">Base64 Decoding Scratchpad</h4>
    <div style="display:flex; gap:8px;">
      <input type="text" id="b64Input" placeholder="Paste Base64 string here..." style="flex:1; padding:8px 12px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:6px;" />
      <button onclick="decodeB64()" style="padding:8px 16px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Decode Base64</button>
    </div>
    <div id="b64Result" style="display:none; margin-top:12px; padding:12px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; color:#047857; font-family:monospace; font-weight:bold; font-size:13px;"></div>
  </div>

  <script>
    function decodeB64() {
      const val = document.getElementById('b64Input').value.trim();
      const res = document.getElementById('b64Result');
      try {
        const decoded = atob(val);
        res.style.display = 'block';
        res.textContent = 'Decoded Text: ' + decoded;
      } catch (err) {
        res.style.display = 'block';
        res.textContent = 'Invalid Base64 string';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 10. Matryoshka Doll
  if (pathname === '/pico/forensics-matryoshka') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Matryoshka Doll', 'Forensics', [{ label: 'dolls.jpg', file: 'cat.jpg' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Matryoshka dolls are traditional nested Russian dolls placed one inside another. Use file carving tools like <code>binwalk -e</code> or <code>unzip</code> to extract the embedded image layers until you reach the secret flag text file.
  </p>

  <div style="background:#0b1311; color:#e2e8f0; font-family:monospace; padding:20px; border-radius:8px; font-size:12.5px; line-height:1.6;">
    <div style="color:#34d399; font-weight:bold; margin-bottom:10px;">Interactive Binwalk Terminal</div>
    <div id="termLogs" style="min-height:100px;">
      <span style="color:#94a3b8;">$ ls -la</span><br/>
      -rw-r--r-- 1 student student 642812 dolls.jpg<br/>
      <span style="color:#94a3b8;">Type <code>binwalk -e dolls.jpg</code> or <code>unzip</code> to extract layers.</span><br/>
    </div>
    <div style="display:flex; gap:8px; margin-top:12px;">
      <span style="color:#34d399; line-height:34px;">$</span>
      <input type="text" id="binwalkCmd" placeholder="binwalk -e dolls.jpg" onkeydown="if(event.key==='Enter') runBinwalk()" style="flex:1; background:#16241f; border:1px solid #2e473e; color:#38bdf8; font-family:inherit; padding:6px 12px; border-radius:4px;" />
      <button onclick="runBinwalk()" style="padding:6px 14px; background:#059669; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Run</button>
    </div>
  </div>

  <script>
    let step = 0;
    function runBinwalk() {
      const input = document.getElementById('binwalkCmd');
      const cmd = input.value.trim();
      input.value = '';
      const logs = document.getElementById('termLogs');
      logs.innerHTML += '<br/><span style="color:#38bdf8;">$ ' + cmd + '</span><br/>';

      if (cmd.includes('binwalk') || cmd.includes('unzip') || cmd.includes('cat')) {
        step++;
        if (step === 1) {
          logs.innerHTML += 'DECIMAL    HEXADECIMAL    DESCRIPTION\\n------------------------------------------------------------------\\n271822     0x425CE        Zip archive data, at least v2.0 to extract, compressed size: 382412, name: base_images/2_c.jpg\\n[+] Extracted: _dolls.jpg.extracted/base_images/2_c.jpg<br/>';
        } else if (step === 2) {
          logs.innerHTML += '[+] Carving nested archive from 2_c.jpg...<br/>Extracted: base_images/3_c.jpg -> base_images/4_c.jpg -> flag.txt<br/>';
        } else {
          logs.innerHTML += '<span style="color:#34d399; font-weight:bold;">flag.txt content: picoCTF{3xp4nd3d_1n_th3_d3pth5_839a041f}</span><br/>';
        }
      } else {
        logs.innerHTML += 'Command executed. Try: binwalk -e dolls.jpg<br/>';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 11. Transformation
  if (pathname === '/pico/reverse-transformation') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Transformation', 'Reverse Engineering', [{ label: 'enc file', file: 'enc' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    I wonder what this really is... The flag was packed two ASCII characters per 16-bit character with the following Python code:
  </p>

  <div style="background:#0f172a; color:#38bdf8; font-family:monospace; padding:14px; border-radius:8px; font-size:12.5px; margin:16px 0;">
    ''.join([chr((ord(flag[i]) &lt;&lt; 8) + ord(flag[i + 1])) for i in range(0, len(flag), 2)])
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px;">
    <div style="font-size:11px; font-weight:800; color:#64748b; margin-bottom:6px;">ENCODED STRING (UTF-16 CHARACTERS)</div>
    <code id="encStr" style="font-size:15px; color:#047857; font-weight:bold; word-break:break-all;">灩捯䍔䙻ㄶ形楴獟楮獴㌴摟潦弸弲㘶㠴挲ぽ</code>
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <h4 style="margin:0 0 8px; font-size:13px; color:#334155;">Interactive Python / Reversing Scratchpad</h4>
    <p style="font-size:12px; color:#64748b; margin:0 0 12px;">Reverse the 8-bit left shift: for each character <code>c</code>, extract the high byte with <code>c.charCodeAt(0) >> 8</code> and low byte with <code>c.charCodeAt(0) & 0xFF</code>.</p>
    <div style="display:flex; gap:8px;">
      <input type="text" id="shiftExpr" placeholder="Enter bitshift expression: (c >> 8), (c & 0xFF)" value="chr(c >> 8) + chr(c & 0xFF)" style="flex:1; padding:8px 12px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:6px;" />
      <button onclick="runUnpack()" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Run Solver</button>
    </div>
    <div id="unpackOutput" style="display:none; margin-top:14px; padding:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; font-family:monospace; font-weight:bold; font-size:13.5px; color:#047857; word-break:break-all;"></div>
  </div>

  <script>
    function runUnpack() {
      const enc = "灩捯䍔䙻ㄶ形楴獟楮獴㌴摟潦弸弲㘶㠴挲ぽ";
      let res = '';
      for (let i = 0; i < enc.length; i++) {
        const code = enc.charCodeAt(i);
        res += String.fromCharCode(code >> 8) + String.fromCharCode(code & 0xFF);
      }
      const out = document.getElementById('unpackOutput');
      out.style.display = 'block';
      out.textContent = 'Unpacked Output: ' + res;
    }
  </script>
</body>
</html>`);
    return;
  }

  // 12. GDB Test Drive
  if (pathname === '/pico/binary-gdb') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:monospace; background:#0b1311; color:#e2e8f0; padding:32px;">
  <div style="max-width:760px; margin:0 auto;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <div style="color:#34d399; font-size:14px; font-weight:bold;">picoCTF · GDB Test Drive (gdbme)</div>
      <a href="/pico/download?file=gdbme" download="gdbme" style="background:#16241f; border:1px solid #2e473e; color:#34d399; padding:4px 10px; border-radius:4px; font-size:12px; text-decoration:none; font-weight:bold;">⬇ Download gdbme</a>
    </div>
    <p style="color:#94a3b8; font-size:12.5px; line-height:1.5;">Start the binary under GDB, set a breakpoint on the target instruction to skip the sleep function, and step or jump to print the flag.</p>

    <div id="gdbLogs" style="background:#16241f; border:1px solid #2e473e; padding:16px; border-radius:8px; font-size:12.5px; line-height:1.5; min-height:120px;">
      Reading symbols from ./gdbme...<br/>
      (gdb) <span style="color:#94a3b8;">Suggested commands: <code>layout asm</code>, <code>break *(main+99)</code>, <code>run</code>, <code>jump *(main+104)</code></span><br/>
    </div>

    <div style="margin-top:14px; display:flex; gap:8px;">
      <span style="color:#34d399; line-height:34px; font-weight:bold;">(gdb)</span>
      <input type="text" id="gdbInput" placeholder="break *(main+99)" onkeydown="if(event.key==='Enter') runGdb()" style="flex:1; background:#16241f; border:1px solid #2e473e; color:#38bdf8; font-family:inherit; padding:6px 12px; border-radius:4px;" autofocus />
      <button onclick="runGdb()" style="padding:6px 14px; background:#059669; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Step</button>
    </div>
  </div>

  <script>
    function runGdb() {
      const input = document.getElementById('gdbInput');
      const val = input.value.trim();
      input.value = '';
      const logs = document.getElementById('gdbLogs');
      logs.innerHTML += '<span style="color:#38bdf8;">(gdb) ' + val + '</span><br/>';

      if (val.includes('break') || val.includes('b ')) {
        logs.innerHTML += 'Breakpoint 1 at 0x132a: file gdbme.c, line 14.<br/>';
      } else if (val === 'run' || val === 'r') {
        logs.innerHTML += 'Starting program: /home/student/gdbme<br/>Breakpoint 1, 0x000055555555532a in main () at gdbme.c:14<br/>';
      } else if (val.includes('jump') || val.includes('j ')) {
        logs.innerHTML += 'Continuing at 0x132f.<br/><span style="color:#34d399; font-weight:bold;">picoCTF{d3bugg1ng_1s_4_5p0rt_829fa03e}</span><br/>[Inferior 1 (process 412) exited normally]<br/>';
      } else {
        logs.innerHTML += 'Command received. Try <code>break *(main+99)</code> then <code>run</code> then <code>jump *(main+104)</code>.<br/>';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 13. Command Injection
  if (pathname === '/pico/cmd-inject') {
    const host = parsedUrl.query.host ? String(parsedUrl.query.host) : '';
    let output = '';
    const isExploit = host.includes(';') || host.includes('&&') || host.includes('|');

    if (host) {
      if (isExploit && (host.includes('cat') || host.includes('flag'))) {
        output = `PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.\\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.032 ms\\n--- 127.0.0.1 ping statistics ---\\n1 packets transmitted, 1 received, 0% packet loss\\n\\n[Injected Command Output: cat flag.txt]\\npicoCTF{c0mm4nd_1nj3ct10n_succ3ss_8f1a92e1}`;
      } else {
        output = `PING ${host} (${host}) 56(84) bytes of data.\\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.041 ms\\n--- ${host} ping statistics ---\\n1 packets transmitted, 1 received, 0% packet loss`;
      }
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Command Injection', 'Web Exploitation')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    An online diagnostic utility pings internal hostnames via system shell execution. Exploit command chaining operators (<code>;</code>, <code>&&</code>, <code>|</code>) to read <code>flag.txt</code>.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <form method="GET" action="/pico/cmd-inject">
      <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Target Host IP / Domain</label>
      <div style="display:flex; gap:8px;">
        <input type="text" name="host" value="${host || '127.0.0.1'}" placeholder="127.0.0.1; cat flag.txt" style="flex:1; padding:8px 12px; font-family:monospace; border:1px solid #cbd5e1; border-radius:6px; font-size:13.5px;" />
        <button type="submit" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Ping Host</button>
      </div>
    </form>
  </div>

  ${output ? `
  <div style="background:#0f172a; color:#38bdf8; font-family:monospace; padding:16px; border-radius:8px; font-size:12.5px; line-height:1.5; white-space:pre-wrap;">${output}</div>` : ''}
</body>
</html>`);
    return;
  }

  // 14. Cross-Site Scripting (XSS)
  if (pathname === '/pico/xss-eval') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Cross-Site Scripting (XSS)', 'Web Exploitation')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    A community message wall renders user comments directly into the DOM without HTML escaping. Submit a JavaScript payload (e.g. <code>&lt;script&gt;</code> or <code>&lt;img onerror&gt;</code>) to trigger the simulated admin bot and capture the session cookie.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Post Comment to Public Wall</label>
    <textarea id="xssInput" placeholder="Enter comment or XSS payload..." style="width:100%; box-sizing:border-box; height:80px; padding:10px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:6px;"></textarea>
    <div style="margin-top:10px;">
      <button onclick="postComment()" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Publish Comment</button>
    </div>
  </div>

  <div style="border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px;">
    <div style="font-size:12px; font-weight:700; color:#64748b; margin-bottom:8px;">PUBLIC COMMENTS FEED</div>
    <div id="commentsFeed" style="min-height:50px;">
      <div style="padding:6px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:13px;">Welcome to the message board!</div>
    </div>
  </div>

  <div id="botAlert" style="display:none; padding:16px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; color:#047857; font-family:monospace; font-weight:bold; font-size:13px;">
    ★ Admin Bot Triggered! Stolen Session Cookie: picoCTF{xss_s3cur1ty_byp4ss_alert_91c34a2e}
  </div>

  <script>
    function postComment() {
      const val = document.getElementById('xssInput').value;
      if (!val) return;
      document.getElementById('xssInput').value = '';
      const div = document.createElement('div');
      div.style.padding = '8px 0';
      div.style.borderBottom = '1px solid #f1f5f9';
      div.innerHTML = val;
      document.getElementById('commentsFeed').appendChild(div);

      const lower = val.toLowerCase();
      if (lower.includes('script') || lower.includes('onerror') || lower.includes('onload') || lower.includes('alert')) {
        setTimeout(() => {
          document.getElementById('botAlert').style.display = 'block';
        }, 500);
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 15. SQLi UNION Exfiltration
  if (pathname === '/pico/sqli-search') {
    const q = parsedUrl.query.q ? String(parsedUrl.query.q) : '';
    const isUnion = q.toLowerCase().includes('union') && q.toLowerCase().includes('select');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('SQLi: UNION Exfiltration', 'Web Exploitation')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Search products in the online store. The backend executes: <code>SELECT id, name, price FROM items WHERE name LIKE '%{search}%'</code>. Craft a UNION SELECT payload to exfiltrate the secret flag from <code>secret_vault</code>.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <form method="GET" action="/pico/sqli-search">
      <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Search Products</label>
      <div style="display:flex; gap:8px;">
        <input type="text" name="q" value="${q}" placeholder="e.g. Apples or ' UNION SELECT 1, flag, 3 FROM secret_vault --" style="flex:1; padding:8px 12px; font-family:monospace; border:1px solid #cbd5e1; border-radius:6px; font-size:13.5px;" />
        <button type="submit" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Search</button>
      </div>
    </form>
  </div>

  <table style="width:100%; border-collapse:collapse; font-size:13px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
    <thead>
      <tr style="background:#f1f5f9; text-align:left; color:#475569;">
        <th style="padding:10px 12px; border-bottom:1px solid #e2e8f0;">Item ID</th>
        <th style="padding:10px 12px; border-bottom:1px solid #e2e8f0;">Product Name</th>
        <th style="padding:10px 12px; border-bottom:1px solid #e2e8f0;">Price</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 12px;">101</td><td style="padding:10px 12px;">Organic Fuji Apples</td><td style="padding:10px 12px;">$3.99</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 12px;">102</td><td style="padding:10px 12px;">Sencha Green Tea</td><td style="padding:10px 12px;">$5.49</td></tr>
      ${isUnion ? `
      <tr style="background:#ecfdf5; font-weight:bold; color:#047857;">
        <td style="padding:10px 12px;">1</td>
        <td style="padding:10px 12px;">picoCTF{un10n_b4s3d_3xf1ltr4t10n_48da1e92}</td>
        <td style="padding:10px 12px;">3</td>
      </tr>` : ''}
    </tbody>
  </table>
</body>
</html>`);
    return;
  }

  // 16. Caesar Cipher
  if (pathname === '/pico/crypto-caesar') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Caesar Cipher', 'Cryptography')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Decrypt the intercepted ciphertext with an unknown key shift. Notice that the known flag header format is <code>picoCTF{</code>.
  </p>

  <div style="background:#0f172a; color:#38bdf8; font-family:monospace; padding:14px; border-radius:8px; font-size:13.5px; margin:16px 0;">
    wpjvJTM{j43s4r_c1ph3r_sh1ft_k3y_92a10bf8}
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <label style="display:block; font-size:12.5px; font-weight:700; color:#334155;">Shift Adjustment: <span id="shiftLabel" style="color:#047857; font-weight:bold;">0</span></label>
    <input type="range" id="caesarSlider" min="0" max="25" value="0" oninput="shiftCaesar(this.value)" style="width:100%; margin:8px 0 16px;" />

    <div style="font-size:11px; font-weight:800; color:#64748b; margin-bottom:4px;">DECRYPTED TEXT</div>
    <div id="caesarResult" style="padding:12px; background:white; border:1px solid #cbd5e1; border-radius:6px; font-family:monospace; font-weight:bold; font-size:13.5px; color:#0f172a; word-break:break-all;">
      wpjvJTM{j43s4r_c1ph3r_sh1ft_k3y_92a10bf8}
    </div>
  </div>

  <script>
    const cipher = "wpjvJTM{j43s4r_c1ph3r_sh1ft_k3y_92a10bf8}";
    function shiftCaesar(s) {
      s = parseInt(s);
      document.getElementById('shiftLabel').textContent = s;
      const dec = cipher.split('').map(c => {
        if (c >= 'a' && c <= 'z') return String.fromCharCode(((c.charCodeAt(0) - 97 - s + 26) % 26) + 97);
        if (c >= 'A' && c <= 'Z') return String.fromCharCode(((c.charCodeAt(0) - 65 - s + 26) % 26) + 65);
        return c;
      }).join('');
      const box = document.getElementById('caesarResult');
      box.textContent = dec;
      if (dec.startsWith('picoCTF{')) {
        box.style.background = '#ecfdf5';
        box.style.color = '#047857';
        box.style.borderColor = '#a7f3d0';
      } else {
        box.style.background = 'white';
        box.style.color = '#0f172a';
        box.style.borderColor = '#cbd5e1';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 17. Vigenère Cipher
  if (pathname === '/pico/crypto-vigenere') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Vigenère Cipher', 'Cryptography')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Can you decrypt this polyalphabetic ciphertext? We intercepted an operative's note containing the secret keyword: <strong>CYBER</strong>.
  </p>

  <div style="background:#0f172a; color:#38bdf8; font-family:monospace; padding:14px; border-radius:8px; font-size:13.5px; margin:16px 0;">
    rgkoEVG{v1g3n3r3_c1ph3r_cr4ck3d_48f12a3d}
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Secret Keyword</label>
    <div style="display:flex; gap:8px;">
      <input type="text" id="vKey" placeholder="Enter keyword (e.g. CYBER)" style="flex:1; padding:8px 12px; font-family:monospace; text-transform:uppercase; border:1px solid #cbd5e1; border-radius:6px; font-size:13px;" />
      <button onclick="decryptVig()" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Decrypt</button>
    </div>
    <div id="vigOutput" style="display:none; margin-top:14px; padding:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; font-family:monospace; font-weight:bold; font-size:13.5px; color:#047857;"></div>
  </div>

  <script>
    const cipherText = "rgkoEVG{v1g3n3r3_c1ph3r_cr4ck3d_48f12a3d}";
    function decryptVig() {
      const key = document.getElementById('vKey').value.toUpperCase().trim();
      if (!key) return;
      let ki = 0;
      const res = cipherText.split('').map(c => {
        if (c >= 'a' && c <= 'z') {
          const shift = key.charCodeAt(ki % key.length) - 65;
          ki++;
          return String.fromCharCode(((c.charCodeAt(0) - 97 - shift + 26) % 26) + 97);
        }
        if (c >= 'A' && c <= 'Z') {
          const shift = key.charCodeAt(ki % key.length) - 65;
          ki++;
          return String.fromCharCode(((c.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
        }
        return c;
      }).join('');
      const box = document.getElementById('vigOutput');
      box.style.display = 'block';
      box.textContent = res;
    }
  </script>
</body>
</html>`);
    return;
  }

  // 18. RSA Small Public Exponent
  if (pathname === '/pico/crypto-rsa') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('RSA: Small Public Exponent', 'Cryptography')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    An insecure RSA implementation encrypted a small flag with <code>e = 3</code> and a very large modulus <code>N</code>. Because <code>m^3 &lt; N</code>, no modular reduction took place, meaning <code>c = m^3</code>.
  </p>

  <div style="background:#0f172a; color:#38bdf8; font-family:monospace; padding:16px; border-radius:8px; font-size:12px; line-height:1.6; word-break:break-all; margin:16px 0;">
    <strong>e = 3</strong><br/>
    <strong>c = 21879018420918239018239081290381029381092381203981209381029381029381</strong>
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <h4 style="margin:0 0 8px; font-size:13px; color:#334155;">Decryption Verifier</h4>
    <p style="font-size:12px; color:#64748b; margin:0 0 10px;">Calculate the integer cube root of <code>c</code> using Python (<code>gmpy2.iroot(c, 3)</code>) or an arbitrary precision calculator, then verify your plaintext message.</p>
    <div style="display:flex; gap:8px;">
      <input type="text" id="mInput" placeholder="Enter computed integer m or hex" style="flex:1; padding:8px 12px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:6px;" />
      <button onclick="verifyRsa()" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Verify m</button>
    </div>
    <div id="rsaOutput" style="display:none; margin-top:14px; padding:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; font-family:monospace; font-weight:bold; font-size:13.5px; color:#047857;">
      ★ Cube root verified! Plaintext Flag: picoCTF{sm4ll_e_cwb3_r00t_4tt4ck_7d92a1f0}
    </div>
  </div>

  <script>
    function verifyRsa() {
      const v = document.getElementById('mInput').value.trim();
      if (v.length > 5) {
        document.getElementById('rsaOutput').style.display = 'block';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 19. Single-Byte XOR
  if (pathname === '/pico/crypto-xor') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Single-Byte XOR', 'Cryptography')}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    A message was encrypted by XORing each byte against an identical single-byte key (0x00 to 0xFF). Slide through the keyspace to locate the plaintext flag.
  </p>

  <div style="background:#0f172a; color:#38bdf8; font-family:monospace; padding:14px; border-radius:8px; font-size:12px; margin:16px 0; word-break:break-all;">
    Encrypted Bytes: 2a 33 39 35 19 0e 1c 20 6a 68 28 31 69 69 25 38 2f 6a 3a 28 69 3f 38 28 6a 3e 6a 34 6b 68 3e 69 36 68 2a 68 38 6e 27
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <label style="display:block; font-size:12.5px; font-weight:700; color:#334155;">Test XOR Key: 0x<span id="xorHex" style="color:#047857; font-weight:bold;">00</span> (Dec: <span id="xorDec">0</span>)</label>
    <input type="range" id="xorRange" min="0" max="255" value="0" oninput="testByteXor(this.value)" style="width:100%; margin:8px 0 16px;" />

    <div style="font-size:11px; font-weight:800; color:#64748b; margin-bottom:4px;">DECRYPTED STREAM</div>
    <div id="xorResult" style="padding:12px; background:white; border:1px solid #cbd5e1; border-radius:6px; font-family:monospace; font-weight:bold; font-size:13.5px; color:#0f172a; word-break:break-all;"></div>
  </div>

  <script>
    const flag = "picoCTF{x0r_k3y_brut3_f0rc3_d0n3_1a2f9c84}";
    const encBytes = flag.split('').map(c => c.charCodeAt(0) ^ 0x5A);

    function testByteXor(k) {
      k = parseInt(k);
      document.getElementById('xorHex').textContent = k.toString(16).toUpperCase().padStart(2, '0');
      document.getElementById('xorDec').textContent = k;
      const dec = encBytes.map(b => String.fromCharCode(b ^ k)).join('');
      const box = document.getElementById('xorResult');
      box.textContent = dec;
      if (dec.startsWith('picoCTF{')) {
        box.style.background = '#ecfdf5';
        box.style.color = '#047857';
        box.style.borderColor = '#a7f3d0';
      } else {
        box.style.background = 'white';
        box.style.color = '#0f172a';
        box.style.borderColor = '#cbd5e1';
      }
    }
    testByteXor(0);
  </script>
</body>
</html>`);
    return;
  }

  // 20. Wireshark Packet Analysis
  if (pathname === '/pico/forensics-pcap') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:24px 32px; max-width:860px; margin:0 auto;">
  ${renderHeader('Wireshark Packet Analysis', 'Forensics', [{ label: 'traffic.pcap', file: 'traffic.pcap' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    An intercepted packet capture (.pcap) contains unencrypted network communications. Apply a Wireshark display filter (e.g. <code>http</code> or <code>post</code>) and inspect packet payloads to find submitted credentials.
  </p>

  <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:10px 14px; margin:16px 0; display:flex; gap:8px; align-items:center;">
    <span style="font-size:12px; font-weight:700; color:#475569;">Display Filter:</span>
    <input type="text" id="pcapFilter" placeholder="Apply a display filter (e.g. http, post, ip.addr == 192.168.1.50)..." oninput="applyFilter(this.value)" style="flex:1; padding:6px 10px; font-family:monospace; font-size:12.5px; border:1px solid #cbd5e1; border-radius:4px;" />
    <button onclick="applyFilter(document.getElementById('pcapFilter').value)" style="padding:6px 14px; background:#047857; color:white; border:none; border-radius:4px; font-weight:700; font-size:12px; cursor:pointer;">Apply</button>
  </div>

  <table style="width:100%; border-collapse:collapse; font-size:12px; font-family:monospace; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
    <thead>
      <tr style="background:#047857; color:white; text-align:left;">
        <th style="padding:8px;">No.</th><th style="padding:8px;">Time</th><th style="padding:8px;">Source</th><th style="padding:8px;">Destination</th><th style="padding:8px;">Proto</th><th style="padding:8px;">Info</th>
      </tr>
    </thead>
    <tbody id="packetList">
      <tr data-proto="dns" onclick="inspectPkt(1)" style="border-bottom:1px solid #e2e8f0; cursor:pointer;"><td style="padding:6px 8px;">1</td><td>0.000</td><td>192.168.1.10</td><td>192.168.1.1</td><td>DNS</td><td>Standard query 0x12a4 A meridian.local</td></tr>
      <tr data-proto="dns" onclick="inspectPkt(2)" style="border-bottom:1px solid #e2e8f0; cursor:pointer;"><td style="padding:6px 8px;">2</td><td>0.012</td><td>192.168.1.1</td><td>192.168.1.10</td><td>DNS</td><td>Standard query response 192.168.1.50</td></tr>
      <tr data-proto="arp" onclick="inspectPkt(3)" style="border-bottom:1px solid #e2e8f0; cursor:pointer;"><td style="padding:6px 8px;">3</td><td>0.045</td><td>00:11:22:33:44:55</td><td>Broadcast</td><td>ARP</td><td>Who has 192.168.1.50? Tell 192.168.1.10</td></tr>
      <tr data-proto="tcp" onclick="inspectPkt(4)" style="border-bottom:1px solid #e2e8f0; cursor:pointer;"><td style="padding:6px 8px;">4</td><td>0.088</td><td>192.168.1.10</td><td>192.168.1.50</td><td>TCP</td><td>52410 → 80 [SYN] Seq=0 Win=64240</td></tr>
      <tr data-proto="tcp" onclick="inspectPkt(5)" style="border-bottom:1px solid #e2e8f0; cursor:pointer;"><td style="padding:6px 8px;">5</td><td>0.092</td><td>192.168.1.50</td><td>192.168.1.10</td><td>TCP</td><td>80 → 52410 [SYN, ACK] Seq=0 Ack=1</td></tr>
      <tr data-proto="tcp" onclick="inspectPkt(6)" style="border-bottom:1px solid #e2e8f0; cursor:pointer;"><td style="padding:6px 8px;">6</td><td>0.093</td><td>192.168.1.10</td><td>192.168.1.50</td><td>TCP</td><td>52410 → 80 [ACK] Seq=1 Ack=1</td></tr>
      <tr data-proto="http" onclick="inspectPkt(14)" style="border-bottom:1px solid #e2e8f0; cursor:pointer; background:#ecfdf5;"><td style="padding:6px 8px;">14</td><td>0.318</td><td>192.168.1.10</td><td>192.168.1.50</td><td>HTTP</td><td><strong>POST /api/v1/auth HTTP/1.1 (application/x-www-form-urlencoded)</strong></td></tr>
      <tr data-proto="http" onclick="inspectPkt(15)" style="border-bottom:1px solid #e2e8f0; cursor:pointer;"><td style="padding:6px 8px;">15</td><td>0.345</td><td>192.168.1.50</td><td>192.168.1.10</td><td>HTTP</td><td>HTTP/1.1 200 OK (text/json)</td></tr>
    </tbody>
  </table>

  <div id="inspectPanel" style="display:none; margin-top:20px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
    <div style="background:#f1f5f9; padding:8px 16px; font-size:12px; font-weight:700; color:#475569;">Packet Details & Stream Inspector</div>
    <pre id="inspectContent" style="margin:0; padding:16px; background:#0f172a; color:#38bdf8; font-family:monospace; font-size:12px; line-height:1.5;"></pre>
  </div>

  <script>
    function applyFilter(f) {
      f = f.toLowerCase().trim();
      const rows = document.querySelectorAll('#packetList tr');
      rows.forEach(r => {
        const proto = r.getAttribute('data-proto');
        const text = r.textContent.toLowerCase();
        if (!f || proto.includes(f) || text.includes(f)) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    }

    function inspectPkt(n) {
      const panel = document.getElementById('inspectPanel');
      const content = document.getElementById('inspectContent');
      panel.style.display = 'block';

      if (n === 14) {
        content.textContent = \`Frame 14: 130 bytes on wire
Transmission Control Protocol, Src Port: 52410, Dst Port: 80, Seq: 1, Ack: 1
Hypertext Transfer Protocol
POST /api/v1/auth HTTP/1.1\\r\\n
Host: meridian.local\\r\\n
User-Agent: Mozilla/5.0 (X11; Linux x86_64)\\r\\n
Content-Type: application/x-www-form-urlencoded\\r\\n
Content-Length: 76\\r\\n
\\r\\n
[Full Request Body]
user=auditor&secret_auth_flag=picoCTF{p4ck3t_sn1ff1ng_w1r3sh4rk_92af401e}\`;
      } else {
        content.textContent = \`Packet #\${n} details: Standard network protocol negotiation without payload flags.\`;
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 21. Corrupted File Header
  if (pathname === '/pico/forensics-magic-bytes') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Corrupted File Header', 'Forensics', [{ label: 'flag_corrupted.png', file: 'flag_corrupted.png' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    An attacker damaged the first 4 bytes (magic bytes / file signature) of this PNG file by zeroing them to <code>00 00 00 00</code>. Look up standard PNG magic bytes, patch the header, and restore the file.
  </p>

  <div style="background:#0f172a; color:#e2e8f0; font-family:monospace; padding:16px; border-radius:8px; font-size:13px; line-height:1.6; margin:20px 0;">
    00000000: <span id="b0" style="color:#ef4444; font-weight:bold;">00</span> <span id="b1" style="color:#ef4444; font-weight:bold;">00</span> <span id="b2" style="color:#ef4444; font-weight:bold;">00</span> <span id="b3" style="color:#ef4444; font-weight:bold;">00</span>  0D 0A 1A 0A  00 00 00 0D  49 48 44 52  ........IHDR<br/>
    00000010: 00 00 00 01  00 00 00 01  08 02 00 00  00 90 77 53  ..............wS
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
    <h4 style="margin:0 0 10px; font-size:13px; color:#334155;">Hex Header Patcher</h4>
    <div style="display:flex; gap:10px; align-items:center; margin-bottom:16px;">
      <span style="font-size:12px; font-weight:700; color:#64748b;">Magic Bytes:</span>
      <input type="text" id="byte0" maxlength="2" placeholder="89" style="width:40px; padding:6px; font-family:monospace; text-align:center; font-weight:bold; border:1px solid #cbd5e1; border-radius:4px; text-transform:uppercase;" />
      <input type="text" id="byte1" maxlength="2" placeholder="50" style="width:40px; padding:6px; font-family:monospace; text-align:center; font-weight:bold; border:1px solid #cbd5e1; border-radius:4px; text-transform:uppercase;" />
      <input type="text" id="byte2" maxlength="2" placeholder="4E" style="width:40px; padding:6px; font-family:monospace; text-align:center; font-weight:bold; border:1px solid #cbd5e1; border-radius:4px; text-transform:uppercase;" />
      <input type="text" id="byte3" maxlength="2" placeholder="47" style="width:40px; padding:6px; font-family:monospace; text-align:center; font-weight:bold; border:1px solid #cbd5e1; border-radius:4px; text-transform:uppercase;" />
      <button onclick="applyPatch()" style="padding:8px 16px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Apply Hex Patch</button>
    </div>
    <div id="patchFeedback" style="display:none; padding:12px; border-radius:6px; font-size:13px; font-family:monospace; font-weight:bold;"></div>
  </div>

  <script>
    function applyPatch() {
      const b0 = document.getElementById('byte0').value.trim().toUpperCase();
      const b1 = document.getElementById('byte1').value.trim().toUpperCase();
      const b2 = document.getElementById('byte2').value.trim().toUpperCase();
      const b3 = document.getElementById('byte3').value.trim().toUpperCase();

      const fb = document.getElementById('patchFeedback');
      fb.style.display = 'block';

      if (b0 === '89' && b1 === '50' && b2 === '4E' && b3 === '47') {
        document.getElementById('b0').textContent = '89'; document.getElementById('b0').style.color = '#34d399';
        document.getElementById('b1').textContent = '50'; document.getElementById('b1').style.color = '#34d399';
        document.getElementById('b2').textContent = '4E'; document.getElementById('b2').style.color = '#34d399';
        document.getElementById('b3').textContent = '47'; document.getElementById('b3').style.color = '#34d399';

        fb.style.background = '#ecfdf5';
        fb.style.borderColor = '#a7f3d0';
        fb.style.color = '#047857';
        fb.innerHTML = '★ PNG File Header Restored! Image Rendered.<br/>Flag: picoCTF{m4g1c_byt3s_r3st0r3d_f1l3_4c81a92e}';
      } else {
        fb.style.background = '#fef2f2';
        fb.style.borderColor = '#fecaca';
        fb.style.color = '#b91c1c';
        fb.textContent = '✖ Invalid signature. PNG magic bytes must be 89 50 4E 47 (.PNG).';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 22. Static Analysis: Strings
  if (pathname === '/pico/reverse-strings') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:monospace; background:#0b1311; color:#e2e8f0; padding:32px;">
  <div style="max-width:760px; margin:0 auto;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <div style="color:#34d399; font-size:14px; font-weight:bold;">picoCTF · Static Analysis (strings)</div>
      <a href="/pico/download?file=mystery_bin" download="mystery_bin" style="background:#16241f; border:1px solid #2e473e; color:#34d399; padding:4px 10px; border-radius:4px; font-size:12px; text-decoration:none; font-weight:bold;">⬇ Download mystery_bin</a>
    </div>
    <p style="color:#94a3b8; font-size:12.5px; line-height:1.5;">Extract printable strings from the compiled binary <code>mystery_bin</code> using the standard Linux <code>strings</code> utility.</p>

    <div id="strTerminal" style="background:#16241f; border:1px solid #2e473e; padding:16px; border-radius:8px; font-size:12.5px; line-height:1.5; min-height:120px;">
      <span style="color:#94a3b8;">$ file mystery_bin</span><br/>
      mystery_bin: ELF 64-bit LSB executable, x86-64, dynamically linked<br/>
      <span style="color:#94a3b8;">Type <code>strings mystery_bin</code> or <code>strings mystery_bin | grep pico</code></span><br/>
    </div>

    <div style="margin-top:14px; display:flex; gap:8px;">
      <span style="color:#34d399; line-height:34px; font-weight:bold;">$</span>
      <input type="text" id="strInput" placeholder="strings mystery_bin | grep pico" onkeydown="if(event.key==='Enter') runStrCmd()" style="flex:1; background:#16241f; border:1px solid #2e473e; color:#38bdf8; font-family:inherit; padding:6px 12px; border-radius:4px;" autofocus />
      <button onclick="runStrCmd()" style="padding:6px 14px; background:#059669; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Run</button>
    </div>
  </div>

  <script>
    function runStrCmd() {
      const input = document.getElementById('strInput');
      const val = input.value.trim();
      input.value = '';
      const box = document.getElementById('strTerminal');
      box.innerHTML += '<span style="color:#38bdf8;">$ ' + val + '</span><br/>';

      if (val.includes('grep')) {
        box.innerHTML += '<span style="color:#34d399; font-weight:bold;">picoCTF{str1ngs_3xtr4ct10n_b1n4ry_31a9fd20}</span><br/>';
      } else if (val.includes('strings')) {
        box.innerHTML += '/lib64/ld-linux-x86-64.so.2<br/>libc.so.6<br/>puts<br/>printf<br/>__libc_start_main<br/>Usage: ./mystery_bin &lt;password&gt;<br/><span style="color:#34d399; font-weight:bold;">picoCTF{str1ngs_3xtr4ct10n_b1n4ry_31a9fd20}</span><br/>Access denied.<br/>mystery_bin: debug symbols verified<br/>';
      } else {
        box.innerHTML += 'Command executed. Try: strings mystery_bin | grep pico<br/>';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 23. Crackme: Keygen Logic
  if (pathname === '/pico/reverse-crackme') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Crackme: Keygen Logic', 'Reverse Engineering', [{ label: 'crackme.c', file: 'crackme.c' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    Decompile the key verification routine below. Calculate a 9-character registration key satisfying all mathematical constraints to unlock the flag.
  </p>

  <pre style="background:#0f172a; color:#38bdf8; padding:16px; border-radius:8px; font-size:12px; font-family:monospace; line-height:1.5;">int check_key(char *key) {
  // 1. Must be 9 characters long
  if (strlen(key) != 9) return 0;
  // 2. Sum of ASCII values of first 4 characters must equal 348
  int sum = key[0] + key[1] + key[2] + key[3];
  if (sum != 348) return 0;
  // 3. Delimiter must be '-'
  if (key[4] != '-') return 0;
  // 4. Suffix must match "2026"
  if (strcmp(key + 5, "2026") != 0) return 0;
  return 1; // Valid key!
}</pre>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin-top:20px;">
    <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Enter Registration Key</label>
    <div style="display:flex; gap:8px;">
      <input type="text" id="crackmeInput" placeholder="e.g. WWWW-2026 (since 87*4 = 348)" style="flex:1; padding:8px 12px; font-family:monospace; border:1px solid #cbd5e1; border-radius:6px; font-size:13px;" />
      <button onclick="checkCrackme()" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Check Key</button>
    </div>
    <div id="crackmeFeedback" style="display:none; margin-top:14px; padding:14px; border-radius:6px; font-family:monospace; font-weight:bold; font-size:13px;"></div>
  </div>

  <script>
    function checkCrackme() {
      const k = document.getElementById('crackmeInput').value.trim();
      const fb = document.getElementById('crackmeFeedback');
      fb.style.display = 'block';

      if (k.length === 9 && (k.charCodeAt(0) + k.charCodeAt(1) + k.charCodeAt(2) + k.charCodeAt(3)) === 348 && k[4] === '-' && k.slice(5) === '2026') {
        fb.style.background = '#ecfdf5';
        fb.style.borderColor = '#a7f3d0';
        fb.style.color = '#047857';
        fb.textContent = '★ Key Verified! Registration Flag: picoCTF{cr4ckm3_k3y_r3v3rs3d_99b01ae4}';
      } else {
        fb.style.background = '#fef2f2';
        fb.style.borderColor = '#fecaca';
        fb.style.color = '#b91c1c';
        fb.textContent = '✖ Invalid key. Sum of first 4 characters must be 348, followed by -2026.';
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 24. Stack Buffer Overflow
  if (pathname === '/pico/binary-bof') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Stack Buffer Overflow', 'Binary Exploitation', [{ label: 'vuln.c', file: 'vuln_bof.c' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    The function reads into <code>char buf[64]</code> using <code>gets()</code>. Overflow the 64-byte boundary to overwrite the adjacent stack variable <code>int modified</code>.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Payload Input String</label>
    <div style="display:flex; gap:8px;">
      <input type="text" id="bofPayload" placeholder="Enter payload string (e.g. 64 'A's + 'BBBB')..." oninput="updateStack(this.value)" style="flex:1; padding:8px 12px; font-family:monospace; border:1px solid #cbd5e1; border-radius:6px; font-size:13px;" />
      <button onclick="injectBof()" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Inject Payload</button>
    </div>
  </div>

  <div style="background:#0f172a; color:#e2e8f0; font-family:monospace; padding:16px; border-radius:8px; font-size:12px; line-height:1.6;">
    <div style="color:#38bdf8; font-weight:bold; margin-bottom:6px;">Live Stack Layout Diagram:</div>
    [0x7fffffffe000] char buf[64] : <span id="bufHex" style="color:#94a3b8;">[empty 0 bytes]</span><br/>
    [0x7fffffffe040] int modified : <span id="modHex" style="color:#ef4444; font-weight:bold;">0x00000000</span>
  </div>

  <div id="bofWin" style="display:none; margin-top:16px; padding:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; font-family:monospace; font-weight:bold; font-size:13.5px; color:#047857;">
    ★ modified != 0! Win condition triggered: picoCTF{st4ck_sm4sh_v4r_0v3rwr1tt3n_68f1a29d}
  </div>

  <script>
    function updateStack(v) {
      document.getElementById('bufHex').textContent = v.length + ' bytes (' + v.slice(0, 32) + (v.length > 32 ? '...' : '') + ')';
      if (v.length > 64) {
        document.getElementById('modHex').textContent = '0x42424242 (OVERWRITTEN!)';
        document.getElementById('modHex').style.color = '#34d399';
      } else {
        document.getElementById('modHex').textContent = '0x00000000';
        document.getElementById('modHex').style.color = '#ef4444';
      }
    }

    function injectBof() {
      const v = document.getElementById('bofPayload').value;
      if (v.length > 64) {
        document.getElementById('bofWin').style.display = 'block';
      } else {
        alert("Payload did not overflow the 64-byte buffer. Supply more than 64 characters.");
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  // 25. Binary Exploitation: Format String
  if (pathname === '/pico/binary-format-string') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; color:#0f172a; padding:32px; max-width:680px; margin:0 auto;">
  ${renderHeader('Format String Memory Leak', 'Binary Exploitation', [{ label: 'vuln.c', file: 'vuln_format.c' }])}
  <p style="color:#475569; font-size:14px; line-height:1.6;">
    The C program prints user input directly using <code>printf(user_input)</code> without format specifiers. Pass format specifiers (e.g. <code>%x</code>, <code>%p</code>, <code>%s</code>) to leak stack variables and read the flag pointer.
  </p>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin:20px 0;">
    <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Format Specifier Input</label>
    <div style="display:flex; gap:8px;">
      <input type="text" id="fmtInput" placeholder="e.g. %x.%x.%x.%s" style="flex:1; padding:8px 12px; font-family:monospace; border:1px solid #cbd5e1; border-radius:6px; font-size:13px;" />
      <button onclick="callPrintf()" style="padding:8px 18px; background:#047857; color:white; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Call printf()</button>
    </div>
  </div>

  <div id="fmtBox" style="display:none; background:#0f172a; color:#38bdf8; font-family:monospace; padding:16px; border-radius:8px; font-size:12.5px; line-height:1.5;">
    Output: <span id="fmtOutput" style="color:#34d399; font-weight:bold;"></span>
  </div>

  <script>
    function callPrintf() {
      const val = document.getElementById('fmtInput').value.trim();
      const box = document.getElementById('fmtBox');
      const out = document.getElementById('fmtOutput');
      box.style.display = 'block';

      if (val.includes('%s')) {
        out.textContent = '7ffde820.64.401126.picoCTF{f0rm4t_str1ng_m3m0ry_l34k_22a10be8}';
      } else if (val.includes('%x') || val.includes('%p')) {
        out.textContent = '7ffde820.64.401126';
      } else {
        out.textContent = val;
      }
    }
  </script>
</body>
</html>`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`<h3>picoCTF challenge endpoint not found</h3>`);
}
