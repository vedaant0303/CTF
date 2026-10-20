import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Flag, CheckCircle2, ArrowRight, ShieldCheck, ArrowLeft, Lock, Award, BarChart2 } from 'lucide-react';
import { FlagSubmitResult } from '../types';
import { Button } from '../components/Common/Button';

interface SuccessModalProps {
  isOpen: boolean;
  result: FlagSubmitResult | null;
  onNextChallenge: (nextId: string) => void;
  onViewDashboard: () => void;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  result,
  onNextChallenge,
  onViewDashboard,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#005944', '#34d399', '#059669', '#10b981'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen || !result) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#070b12',
        zIndex: 1000,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(13, 21, 34, 0.95)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            fontSize: 12.5,
            color: '#34d399',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={14} />
          <span>Return to Training Arena</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: 9999 }}>
          <Lock size={11} />
          <span>LOCAL SANDBOX SECURE // CAPTURE VERIFIED</span>
        </div>
      </header>

      {/* Main Success Container */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px 24px', flex: 1, width: '100%' }}>
        {/* Flag Icon & Badges */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Flag size={26} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <span className="badge badge-emerald" style={{ padding: '4px 12px', fontSize: 12 }}>
              ✔ CORRECT FLAG EXFILTRATED · MISSION COMPLETED
            </span>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#f8fafc',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            Tactical Success. Flag Captured!
          </h1>

          <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 540, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Vulnerability successfully exploited in the local sandbox. Exploit token validated against database.
          </p>

          {/* Captured Flag Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              padding: '8px 20px',
              borderRadius: 9999,
              color: '#34d399',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
            }}
          >
            <span>✔</span>
            <span>TOKEN ACCEPTED</span>
          </div>
        </div>

        {/* 3 Stats Row */}
        <div
          className="ui-card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            padding: '20px 24px',
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
              +{result.xpEarned || 100} XP
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Bounty Earned
            </div>
          </div>

          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
              100 pts
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Challenge Score
            </div>
          </div>

          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
              VERIFIED
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Exploit Status
            </div>
          </div>
        </div>

        {/* 2 Cards: What you learned & Next in your chain */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Card 1: What you learned */}
          <div className="ui-card" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💡</span> Security Insights & Lessons
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px' }}>
              {result.remediationSummary || 'Unsafe input handling allows attackers to alter query structures or bypass authentication boundaries. Parameterized requests enforce clear separation between data and instructions.'}
            </p>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399', marginBottom: 2 }}>
                Next Link Clue
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                Review discovered secrets and application logs to locate vectors into the next vulnerable target.
              </p>
            </div>
          </div>

          {/* Card 2: Next in your chain */}
          <div className="ui-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  NEXT TARGET READY
                </span>
                <span className="badge badge-emerald">Available</span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>
                Continue Your Training
              </h3>
              <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.4 }}>
                Proceed to the next challenge in your curriculum or inspect your updated operator score in the telemetry dashboard.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight size={14} />}
                onClick={() => onNextChallenge(result.nextChallengeId || 'ch-info-02')}
                style={{ flex: 1, padding: '10px 14px' }}
              >
                Proceed to Next
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onViewDashboard}
                style={{ padding: '10px 14px' }}
              >
                View Telemetry
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
