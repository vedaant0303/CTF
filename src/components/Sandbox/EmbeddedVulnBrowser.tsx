import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ExternalLink, Copy, Check, ShieldCheck, Globe, Zap, ArrowRight, Target } from 'lucide-react';
import { api } from '../../services/apiBridge';
import { TutorialStep } from '../../utils/attackTutorials';

interface EmbeddedVulnBrowserProps {
  initialUrl: string;
  reloadKey?: number;
  activeStep?: TutorialStep | null;
  totalSteps?: number;
  onAdvanceStep?: () => void;
  onSelectStep?: (stepNumber: number) => void;
}

export const EmbeddedVulnBrowser: React.FC<EmbeddedVulnBrowserProps> = ({
  initialUrl,
  reloadKey,
  activeStep,
  totalSteps,
  onAdvanceStep,
  onSelectStep,
}) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCurrentUrl(initialUrl);
    setInputUrl(initialUrl);
    if (iframeRef.current) {
      iframeRef.current.src = initialUrl;
    }
  }, [initialUrl, reloadKey]);

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

  const handleAutoFill = () => {
    if (!activeStep?.payload) return;
    // 1. Post message to iframe for universal guided listener
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'AUTOGUIDE_FILL', payload: activeStep.payload },
        '*'
      );
    }
    // 2. Also try direct DOM access if same-origin allows it
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const targetInput = doc.querySelector('input[name="username"], input[name="name"], input[name="user"], input[name="recipient"], input[type="text"], textarea') as HTMLInputElement;
        if (targetInput) {
          targetInput.value = activeStep.payload;
          targetInput.style.border = '2px solid #10b981';
          targetInput.style.backgroundColor = '#ecfdf5';
          targetInput.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.7)';
          targetInput.focus();
          targetInput.dispatchEvent(new Event('input', { bubbles: true }));
          targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const pass = doc.querySelector('input[type="password"]') as HTMLInputElement;
        if (pass && (!pass.value || pass.value === '••••••••')) {
          pass.value = 'testpass123';
          pass.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    } catch (e) {
      // Cross-origin handled safely via postMessage
    }
    // 3. Copy to clipboard
    navigator.clipboard.writeText(activeStep.payload);
    setAutoFilled(true);
    setTimeout(() => setAutoFilled(false), 2500);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
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

      {/* Dynamic Guided Attack HUD Banner (The Pointer) */}
      {activeStep && (
        <div
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.98)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
            position: 'relative',
            zIndex: 5,
          }}
        >
          {/* Top Row: Objective Indicator & Step Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  padding: '3px 9px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                <span className="pulse-dot" style={{ backgroundColor: '#10b981' }} />
                <span>STEP {activeStep.stepNumber} OF {totalSteps || 4} ACTIVE</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                {activeStep.title}
              </span>
            </div>

            {/* Quick Step Switcher Pills */}
            {totalSteps && totalSteps > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, marginRight: 4 }}>STEPS:</span>
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((sNum) => {
                  const isCurrent = sNum === activeStep.stepNumber;
                  return (
                    <button
                      key={sNum}
                      onClick={() => onSelectStep && onSelectStep(sNum)}
                      style={{
                        padding: '2px 8px',
                        fontSize: 10.5,
                        fontWeight: isCurrent ? 800 : 600,
                        borderRadius: 4,
                        border: isCurrent ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: isCurrent ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                        color: isCurrent ? '#042f2e' : '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`View Step ${sNum} guidance`}
                    >
                      {sNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Row: Direct Action Callout & Quick Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ color: '#38bdf8', fontSize: 15, flexShrink: 0 }}>👉</div>
              <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.45 }}>
                <strong style={{ color: '#38bdf8' }}>Perform now: </strong>
                {activeStep.instructions}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {activeStep.payload && (
                <>
                  <button
                    onClick={handleAutoFill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: autoFilled ? '#059669' : '#047857',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                      transition: 'all 0.15s ease',
                    }}
                    title="Automatically inject payload into the target form below"
                  >
                    <Zap size={13} />
                    <span>{autoFilled ? '✓ Injected!' : '⚡ Auto-Fill in Target'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(activeStep.payload!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Copy payload to clipboard"
                  >
                    {copiedPayload ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                    <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                  </button>
                </>
              )}

              {onAdvanceStep && (
                <button
                  onClick={onAdvanceStep}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    color: '#38bdf8',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Mark this step as complete and point to the next action"
                >
                  <span>Step Done</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
