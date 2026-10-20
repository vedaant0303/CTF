import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, ShieldCheck, CheckCircle2, Circle, AlertCircle, Lightbulb } from 'lucide-react';
import { Challenge, FlagSubmitResult } from '../types';
import { api } from '../services/apiBridge';
import { EmbeddedVulnBrowser } from '../components/Sandbox/EmbeddedVulnBrowser';
import { Button } from '../components/Common/Button';

interface ActiveSandboxProps {
  challenge: Challenge;
  onFlagCaptured: (result: FlagSubmitResult) => void;
  onBack: () => void;
  onResetLab: () => Promise<void>;
}

export const ActiveSandbox: React.FC<ActiveSandboxProps> = ({
  challenge,
  onFlagCaptured,
  onBack,
  onResetLab,
}) => {
  const [hintsRevealed, setHintsRevealed] = useState(challenge.hints_revealed || 0);
  const [flagInput, setFlagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // Ensure the isolated local lab environment is actively running
    api.startLab();
  }, []);

  // Dynamic progressive hints from database
  const hints = [
    { level: 1, title: 'Initial Observation', text: challenge.hint_1 || 'Inspect the target parameters, inputs, or source structure.' },
    { level: 2, title: 'Exploit Vector', text: challenge.hint_2 || 'Craft the required payload or analyze the asset format.' },
    { level: 3, title: 'Flag Location', text: challenge.hint_3 || 'Execute the exploit to recover the flag token.' },
  ];

  const handleRevealHint = async (level: number) => {
    try {
      await api.unlockHint(challenge.id, level);
      setHintsRevealed(level);
    } catch {
      setHintsRevealed(level);
    }
  };

  const isPico = challenge.track === 'picoctf' || challenge.id.startsWith('pico');
  const targetUrl = challenge.target_url || 'http://127.0.0.1:8888/login';

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmed = flagInput.trim();

    if (!trimmed) {
      setErrorMessage('Please enter a flag before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const chId = challenge?.id || 'ch-sqli-01';
      const result = await api.submitFlag(chId, trimmed, 60);
      if (result.success) {
        onFlagCaptured(result);
      } else {
        setErrorMessage(result.message || 'Incorrect flag token. Check the exploit output and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    await onResetLab();
    setResetting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#070b12', overflow: 'hidden' }}>
      {/* Top Header */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(13, 21, 34, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              MISSION // {challenge.order_index < 10 ? `0${challenge.order_index}` : challenge.order_index} · {challenge.category.toUpperCase()}
            </span>
            <span className="badge badge-cyan" style={{ fontSize: 10 }}>
              ● {isPico ? 'picoCTF Arena' : 'Meridian Chain'}
            </span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
            {challenge.title}
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            {challenge.description || 'Explore, observe, and capture the flag in this safe isolated environment.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            <ShieldCheck size={13} />
            <span>LOCAL SECURED SANDBOX // LOOPBACK ONLY</span>
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>VM: MERIDIAN-01</span>
        </div>
      </div>

      {/* 3-Column Split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '14px', gap: '14px', backgroundColor: '#070b12' }}>
        {/* Left Column: Mission Dossier (~270px) */}
        <div
          className="ui-card"
          style={{
            width: 270,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flexShrink: 0,
            padding: '18px',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
              TACTICAL DOSSIER
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>
              Mission Objectives
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.45 }}>
              {challenge.description}
            </p>

            {/* Mission Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>01 · Inspect Target Vector</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.35 }}>
                  Examine parameters, headers, and form inputs in the center browser.
                </div>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>02 · Execute Exploit</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.35 }}>
                  Apply the {challenge.category} vulnerability technique to bypass controls.
                </div>
              </div>

              <div style={{ padding: '8px 10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>03 · Exfiltrate Flag Token</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.35 }}>
                  Locate {isPico ? 'picoCTF{...}' : 'flag{...}'} and submit it into the console on the right.
                </div>
              </div>
            </div>

            {/* Callout note box */}
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 11.5, color: '#34d399', lineHeight: 1.4 }}>
              💡 <strong>Target:</strong> {challenge.learning_objectives || 'Observe behavior under unvalidated inputs.'}
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={onBack}
              style={{ background: 'transparent', border: 'none', color: '#34d399', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              ← Back to Mission Briefing
            </button>
          </div>
        </div>

        {/* Center Column: Embedded Target Browser */}
        <div style={{ flex: 1, minWidth: 440, height: '100%' }}>
          <EmbeddedVulnBrowser initialUrl={targetUrl} key={targetUrl} />
        </div>

        {/* Right Column: Progress, Hints, Submit Flag (~300px) */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flexShrink: 0 }}>
          {/* Card 1: Your Progress */}
          <div className="ui-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>Exploit Status</span>
              <span className="badge badge-emerald">{hintsRevealed > 0 ? 'Phase 2/3' : 'Phase 1/3'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 600 }}>
                <CheckCircle2 size={15} />
                <span>Sandbox target online (:8888)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: hintsRevealed > 0 ? '#34d399' : '#94a3b8' }}>
                {hintsRevealed > 0 ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                <span>Examine payload & hints</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                <Circle size={15} />
                <span>Submit flag token</span>
              </div>
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: 11.5, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>Bounty XP:</span>
              <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>+{challenge.xp_reward || 100} XP</strong>
            </div>
          </div>

          {/* Card 2: Progressive Hints */}
          <div className="ui-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>Progressive Intel</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{hintsRevealed}/3 Unlocked</span>
            </div>

            {hintsRevealed === 0 ? (
              <div>
                <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.4 }}>
                  Stuck? Unlock incremental technical clues. Zero XP penalty.
                </p>
                <button
                  onClick={() => handleRevealHint(1)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', fontSize: 12 }}
                >
                  💡 Unlock Hint 1: Observation
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hints.slice(0, hintsRevealed).map((h) => (
                  <div key={h.level} style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 11.5 }}>
                    <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>
                      INTEL #{h.level} · {h.title}
                    </div>
                    <div style={{ color: '#94a3b8', lineHeight: 1.35 }}>
                      {h.text}
                    </div>
                  </div>
                ))}

                {hintsRevealed < 3 && (
                  <button
                    onClick={() => handleRevealHint(hintsRevealed + 1)}
                    style={{
                      padding: '6px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      color: '#34d399',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    ➔ Unlock Intel #{hintsRevealed + 1} - Next Clue
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Submit Flag Console */}
          <div className="ui-card" style={{ padding: '16px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>
              Submit Captured Flag
            </h4>
            <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 10px' }}>
              Paste the extracted flag token below. Flags are case-sensitive.
            </p>

            <form onSubmit={handleSubmitFlag}>
              <input
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder={isPico ? "picoCTF{...}" : "flag{...}"}
                className="form-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  marginBottom: errorMessage ? 8 : 12,
                  borderColor: errorMessage ? 'rgba(239, 68, 68, 0.6)' : undefined,
                }}
              />

              {errorMessage && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 11.5, color: '#f87171', lineHeight: 1.4, marginBottom: 12 }}>
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 6 }}
              >
                Submit Flag Token
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                onClick={handleReset}
                disabled={resetting}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <RotateCcw size={12} />
                <span>Reset Sandbox to Snapshot</span>
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: '#64748b', textAlign: 'center', marginTop: 4 }}>
              Reverts VM to clean state. Your earned XP is preserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
