import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Circle,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  BookOpen,
  Terminal,
  Info,
  ChevronRight,
  ExternalLink,
  Target,
  Sparkles
} from 'lucide-react';
import { Challenge, FlagSubmitResult } from '../types';
import { api } from '../services/apiBridge';
import { EmbeddedVulnBrowser } from '../components/Sandbox/EmbeddedVulnBrowser';
import { Button } from '../components/Common/Button';
import { getAttackTutorial, AttackTutorialData } from '../utils/attackTutorials';

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
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [resetToast, setResetToast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tutorial' | 'info'>('tutorial');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [focusedStepNumber, setFocusedStepNumber] = useState<number>(1);
  const [copiedPayloadIndex, setCopiedPayloadIndex] = useState<number | null>(null);

  useEffect(() => {
    // Ensure the isolated local lab environment is actively running
    api.startLab();
    setFocusedStepNumber(1);
    setCompletedSteps([]);
  }, [challenge.id]);

  const tutorial: AttackTutorialData = getAttackTutorial(
    challenge.id,
    challenge.title,
    challenge.category,
    challenge.description,
    challenge.target_url,
    challenge.flag_plain
  );

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const isAlreadyDone = prev.includes(stepNumber);
      const nextDone = isAlreadyDone ? prev.filter(s => s !== stepNumber) : [...prev, stepNumber];
      if (!isAlreadyDone && stepNumber === focusedStepNumber && focusedStepNumber < tutorial.tutorialSteps.length) {
        setFocusedStepNumber(prevNum => prevNum + 1);
      }
      return nextDone;
    });
  };

  const handleCopyPayload = (payload: string, index: number) => {
    navigator.clipboard.writeText(payload);
    setCopiedPayloadIndex(index);
    setTimeout(() => {
      setCopiedPayloadIndex(null);
    }, 2000);
  };

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
    try {
      await onResetLab();
      setReloadKey(prev => prev + 1);
      setResetToast(true);
      setTimeout(() => setResetToast(false), 3500);
    } catch (err) {
      console.error('[ActiveSandbox] Reset failed:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#070b12', overflow: 'hidden', position: 'relative' }}>
      {/* Toast Notification for Reset VM */}
      {resetToast && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#064e3b',
            color: '#a7f3d0',
            border: '1px solid #10b981',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <RotateCcw size={15} color="#34d399" />
          <span>✓ Target VM cleanly reset to initial state. Modified sandbox files restored.</span>
        </div>
      )}

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
            <span className={`badge badge-${challenge.difficulty === 'Easy' ? 'emerald' : challenge.difficulty === 'Hard' ? 'rose' : 'amber'}`} style={{ fontSize: 10 }}>
              {challenge.difficulty}
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
              padding: '5px 12px',
              borderRadius: 6,
            }}
          >
            <ShieldCheck size={14} />
            <span>LOCAL SECURED SANDBOX // LOOPBACK ONLY</span>
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>VM: MERIDIAN-01</span>
        </div>
      </div>

      {/* 3-Column Split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '14px', gap: '14px', backgroundColor: '#070b12' }}>
        
        {/* Left Column: Attack Information & Step-by-Step Tutorial (~330px) */}
        <div
          className="ui-card"
          style={{
            width: 330,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flexShrink: 0,
            padding: '16px',
            backgroundColor: 'rgba(13, 21, 34, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div>
            {/* Tab Switcher: Tutorial vs Short Info */}
            <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 10, marginBottom: 14 }}>
              <button
                onClick={() => setActiveTab('tutorial')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: activeTab === 'tutorial' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: activeTab === 'tutorial' ? '#34d399' : '#94a3b8',
                  fontWeight: activeTab === 'tutorial' ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BookOpen size={13} />
                <span>Step-by-Step Guide</span>
              </button>
              <button
                onClick={() => setActiveTab('info')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: activeTab === 'info' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: activeTab === 'info' ? '#38bdf8' : '#94a3b8',
                  fontWeight: activeTab === 'info' ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Info size={13} />
                <span>Attack Intel</span>
              </button>
            </div>

            {/* TAB 1: STEP-BY-STEP TUTORIAL */}
            {activeTab === 'tutorial' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    ATTACK TUTORIAL
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {completedSteps.length} / {tutorial.tutorialSteps.length} STEPS
                  </span>
                </div>

                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.45 }}>
                  Follow this guided tutorial step-by-step to execute the attack in the center sandbox.
                </p>

                {/* Numbered Tutorial Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tutorial.tutorialSteps.map((step, idx) => {
                    const isDone = completedSteps.includes(step.stepNumber);
                    const isFocused = step.stepNumber === focusedStepNumber;
                    const isCopied = copiedPayloadIndex === idx;

                    return (
                      <div
                        key={step.stepNumber}
                        onClick={() => setFocusedStepNumber(step.stepNumber)}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: isFocused
                            ? 'rgba(16, 185, 129, 0.12)'
                            : isDone
                            ? 'rgba(16, 185, 129, 0.05)'
                            : 'rgba(15, 23, 42, 0.7)',
                          border: isFocused
                            ? '2px solid #10b981'
                            : isDone
                            ? '1px solid rgba(16, 185, 129, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 8,
                          boxShadow: isFocused ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                      >
                        {/* Step Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStep(step.stepNumber);
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: isDone ? '#34d399' : '#64748b', display: 'flex' }}
                              title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              {isDone ? <CheckCircle2 size={16} color="#34d399" /> : <Circle size={16} />}
                            </button>
                            <span style={{ fontSize: 12.5, fontWeight: isFocused ? 800 : 700, color: isFocused ? '#34d399' : isDone ? '#a7f3d0' : '#f8fafc' }}>
                              0{step.stepNumber} · {step.title}
                            </span>
                          </div>
                          {isFocused ? (
                            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                              👉 OBJECTIVE
                            </span>
                          ) : (
                            <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                              {step.actionType}
                            </span>
                          )}
                        </div>

                        {/* Step Guidance Pointer Callout */}
                        {isFocused && (
                          <div style={{ margin: '6px 0 8px 23px', padding: '6px 10px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 6, fontSize: 11, color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🎯</span>
                            <span>Direct Action: Perform this step in the center sandbox!</span>
                          </div>
                        )}

                        {/* Step Instructions */}
                        <div style={{ fontSize: 11.5, color: isFocused ? '#f1f5f9' : '#94a3b8', lineHeight: 1.45, paddingLeft: 23, marginBottom: step.payload ? 8 : 0 }}>
                          {step.instructions}
                        </div>

                        {/* Interactive Payload Box with One-Click Copy */}
                        {step.payload && (
                          <div style={{ marginLeft: 23, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                              <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                {step.payloadLabel || 'PAYLOAD'}:
                              </span>
                              <button
                                onClick={() => handleCopyPayload(step.payload!, idx)}
                                style={{
                                  background: isCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                  border: `1px solid ${isCopied ? '#10b981' : 'rgba(255, 255, 255, 0.12)'}`,
                                  color: isCopied ? '#34d399' : '#f8fafc',
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <div
                              style={{
                                backgroundColor: '#070b12',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 5,
                                padding: '6px 8px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                color: '#38bdf8',
                                wordBreak: 'break-all',
                                userSelect: 'all',
                              }}
                            >
                              {step.payload}
                            </div>
                          </div>
                        )}

                        {/* Tactical Hint */}
                        {step.hint && (
                          <div style={{ marginLeft: 23, marginTop: 6, fontSize: 10.5, color: '#64748b', fontStyle: 'italic', lineHeight: 1.35 }}>
                            💡 {step.hint}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SHORT ATTACK INFORMATION & VULNERABILITY INTEL */}
            {activeTab === 'info' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                  ATTACK OVERVIEW & INTEL
                </div>

                {/* CWE & OWASP Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '5px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
                    🛡️ {tutorial.cwe}
                  </div>
                  <div style={{ fontSize: 11, color: '#38bdf8', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '5px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
                    ⚡ {tutorial.owasp}
                  </div>
                </div>

                {/* Attack Short Information Blocks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                      What is this Vulnerability?
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.45 }}>
                      {tutorial.shortInfo.overview}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                      Technical Mechanism
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.45 }}>
                      {tutorial.shortInfo.mechanism}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                      Exploit Impact & Risk
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.45 }}>
                      {tutorial.shortInfo.impact}
                    </div>
                  </div>

                  {/* Target Endpoint Info */}
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 2 }}>
                      Target Endpoint
                    </div>
                    <div style={{ fontSize: 11, color: '#f8fafc', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                      {tutorial.targetEndpoint}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Back Button */}
          <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={onBack}
              style={{ background: 'transparent', border: 'none', color: '#34d399', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <ArrowLeft size={13} />
              <span>Back to Arena</span>
            </button>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              +{challenge.xp_reward} XP
            </span>
          </div>
        </div>

        {/* Center Column: Embedded Target Browser */}
        <div style={{ flex: 1, minWidth: 440, height: '100%' }}>
          <EmbeddedVulnBrowser
            initialUrl={targetUrl}
            reloadKey={reloadKey}
            key={`${targetUrl}-${reloadKey}`}
            activeStep={tutorial.tutorialSteps.find(s => s.stepNumber === focusedStepNumber) || tutorial.tutorialSteps[0]}
            totalSteps={tutorial.tutorialSteps.length}
            onAdvanceStep={() => {
              toggleStep(focusedStepNumber);
              if (focusedStepNumber < tutorial.tutorialSteps.length) {
                setFocusedStepNumber(prev => prev + 1);
              }
            }}
            onSelectStep={(sNum) => setFocusedStepNumber(sNum)}
          />
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
                <span>Examine payload & tutorial</span>
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
