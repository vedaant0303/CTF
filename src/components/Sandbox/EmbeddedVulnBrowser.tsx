import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ExternalLink, Copy, Check, ShieldCheck, Globe } from 'lucide-react';
import { api } from '../../services/apiBridge';

interface EmbeddedVulnBrowserProps {
  initialUrl: string;
}

export const EmbeddedVulnBrowser: React.FC<EmbeddedVulnBrowserProps> = ({ initialUrl }) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCurrentUrl(initialUrl);
    setInputUrl(initialUrl);
  }, [initialUrl]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = inputUrl.trim();
    if (!target.startsWith('http://127.0.0.1:8888') && !target.startsWith('http://localhost:8888')) {
      // Keep strictly within local sandbox!
      target = `http://127.0.0.1:8888${target.startsWith('/') ? target : '/' + target}`;
      setInputUrl(target);
    }
    setCurrentUrl(target);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    api.openExternalUrl(currentUrl);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0d1522',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }}
    >
      {/* Browser Controls / Address Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={handleRefresh}
          title="Reload Sandbox Target"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            borderRadius: 6,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#34d399')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <RotateCw size={15} />
        </button>

        {/* Address Input Form */}
        <form onSubmit={handleNavigate} style={{ flex: 1, display: 'flex' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 13,
            }}
          >
            <Globe size={14} color="#06b6d4" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                color: '#38bdf8',
                backgroundColor: 'transparent',
              }}
            />
          </div>
        </form>

        <button
          onClick={handleCopy}
          title="Copy Sandbox Target URL"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            borderRadius: 6,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
        </button>

        <button
          onClick={handleOpenExternal}
          title="Open in External Browser"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            borderRadius: 6,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ExternalLink size={15} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            padding: '4px 10px',
            borderRadius: 9999,
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <span className="pulse-dot" />
          <span>ISOLATED SANDBOX</span>
        </div>
      </div>

      {/* Embedded Iframe pointing to local vulnerable sandbox */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#070b12' }}>
        <iframe
          ref={iframeRef}
          src={currentUrl}
          title="Vulnerable Machine Target"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#ffffff',
          }}
          sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
};
