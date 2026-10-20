import React, { useState, useEffect } from 'react';
import { Flag, Clock, Award, Lightbulb, ChevronDown, ChevronUp, AlertCircle, HelpCircle, Check } from 'lucide-react';
import { Challenge } from '../../types';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';

interface FlagSubmissionPanelProps {
  challenge: Challenge;
  hintsRevealed: number;
  attempts: number;
  onUnlockHint: (level: number) => Promise<string | undefined>;
  onSubmitFlag: (flag: string, timeSpentSeconds: number) => Promise<{ success: boolean; message: string }>;
  isSubmitting?: boolean;
}

export const FlagSubmissionPanel: React.FC<FlagSubmissionPanelProps> = ({
  challenge,
  hintsRevealed,
  attempts,
  onUnlockHint,
  onSubmitFlag,
  isSubmitting = false,
}) => {
  const [flagInput, setFlagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [confirmHintLevel, setConfirmHintLevel] = useState<number | null>(null);
  const [unlockedHints, setUnlockedHints] = useState<{ [level: number]: string }>({});
  const [openHintAccordion, setOpenHintAccordion] = useState<number | null>(null);

  // Initialize unlocked hints from challenge props
  useEffect(() => {
    const map: { [level: number]: string } = {};
    if (challenge.hint_1) map[1] = challenge.hint_1;
    if (challenge.hint_2) map[2] = challenge.hint_2;
    if (challenge.hint_3) map[3] = challenge.hint_3;
    setUnlockedHints(map);
  }, [challenge]);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate current available XP
  const calculateAvailableXp = () => {
    let penalty = 0;
    if (hintsRevealed === 1) penalty = 10;
    else if (hintsRevealed === 2) penalty = 30; // 10 + 20
    else if (hintsRevealed >= 3) penalty = 60; // 10 + 20 + 30
    return Math.max(Math.floor(challenge.xp_reward * 0.4), challenge.xp_reward - penalty);
  };

  const handleUnlockHintConfirm = async () => {
    if (confirmHintLevel !== null) {
      const text = await onUnlockHint(confirmHintLevel);
      if (text) {
        setUnlockedHints((prev) => ({ ...prev, [confirmHintLevel]: text }));
        setOpenHintAccordion(confirmHintLevel);
      }
      setConfirmHintLevel(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmed = flagInput.trim();

    if (!trimmed) {
      setErrorMessage('Please enter a flag before submitting.');
      return;
    }

    if (!trimmed.startsWith('FLAG{') || !trimmed.endsWith('}')) {
      setErrorMessage('Standard flag format is: FLAG{...}. Please include the FLAG{...} wrapper.');
      return;
    }

    const result = await onSubmitFlag(trimmed, secondsElapsed);
    if (!result.success) {
      setErrorMessage(result.message || 'Incorrect flag. Try again or unlock a progressive hint.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header with Timer and XP Status */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 600 }}>
          <Clock size={15} color="#0d9488" />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(secondsElapsed)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
          <Award size={16} color="#0d9488" />
          <span>{calculateAvailableXp()} / {challenge.xp_reward} XP</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
        {/* Progressive Hint Drawer */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb size={16} color="#f59e0b" />
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Progressive Hints
              </h4>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {hintsRevealed} of 3 unlocked
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((level) => {
              const isUnlocked = hintsRevealed >= level;
              const isOpen = openHintAccordion === level;
              const penalty = level === 1 ? 10 : level === 2 ? 20 : 30;
              const hintText = unlockedHints[level];

              return (
                <div
                  key={level}
                  style={{
                    border: `1px solid ${isUnlocked ? '#cbd5e1' : '#e2e8f0'}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: isUnlocked ? '#ffffff' : '#f8fafc',
                  }}
                >
                  <div
                    onClick={() => {
                      if (isUnlocked) {
                        setOpenHintAccordion(isOpen ? null : level);
                      } else if (hintsRevealed === level - 1) {
                        setConfirmHintLevel(level);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      cursor: isUnlocked || hintsRevealed === level - 1 ? 'pointer' : 'not-allowed',
                      backgroundColor: isUnlocked ? '#f8fafc' : '#f1f5f9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: isUnlocked ? '#e0f2fe' : '#e2e8f0',
                          color: isUnlocked ? '#0369a1' : '#64748b',
                        }}
                      >
                        Hint {level}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: isUnlocked ? '#0f172a' : '#64748b' }}>
                        {level === 1 ? 'General Direction' : level === 2 ? 'Syntax & Payload Guidance' : 'Walkthrough & Exploit Code'}
                      </span>
                    </div>

                    <div>
                      {isUnlocked ? (
                        isOpen ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />
                      ) : (
                        <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                          -{penalty} XP
                        </span>
                      )}
                    </div>
                  </div>

                  {isUnlocked && isOpen && (
                    <div style={{ padding: '12px 14px', backgroundColor: '#ffffff', fontSize: 12.5, color: '#334155', lineHeight: 1.5, borderTop: '1px solid #e2e8f0' }}>
                      {hintText || 'Loading hint...'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Flag Submission Form */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flag size={16} color="#0d9488" />
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Submit Flag
              </h4>
            </div>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Attempts: {attempts}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="FLAG{...}"
                disabled={challenge.status === 'completed'}
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  borderRadius: 8,
                  border: `1px solid ${errorMessage ? '#ef4444' : '#cbd5e1'}`,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 12,
                  color: '#991b1b',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={challenge.status === 'completed'}
              style={{ width: '100%', padding: '11px' }}
              icon={<Flag size={15} />}
            >
              {challenge.status === 'completed' ? 'Challenge Completed' : 'Verify Flag'}
            </Button>
          </form>

          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
            Flags are verified with secure timing-safe local validation.
          </p>
        </div>
      </div>

      {/* Hint Unlock Confirmation Modal */}
      <Modal
        isOpen={confirmHintLevel !== null}
        onClose={() => setConfirmHintLevel(null)}
        title={`Unlock Progressive Hint Level ${confirmHintLevel}?`}
      >
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.5, margin: '0 0 12px' }}>
            Revealing this hint will apply an educational score deduction of{' '}
            <strong style={{ color: '#b45309' }}>
              -{confirmHintLevel === 1 ? 10 : confirmHintLevel === 2 ? 20 : 30} XP
            </strong>{' '}
            from your maximum available reward for this challenge.
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Do you wish to proceed and reveal the guidance?
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={() => setConfirmHintLevel(null)}>Keep Trying</Button>
          <Button variant="primary" onClick={handleUnlockHintConfirm}>
            Confirm & Reveal Hint
          </Button>
        </div>
      </Modal>
    </div>
  );
};
