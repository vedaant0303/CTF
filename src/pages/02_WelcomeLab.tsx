import React, { useState } from 'react';
import { OnboardingHeader } from '../components/Common/OnboardingHeader';
import { MeridianPreviewCard } from '../components/Common/MeridianPreviewCard';
import { ShieldCheck, Flag, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '../components/Common/Button';

interface WelcomeLabProps {
  onStartLab: () => Promise<void>;
  hasProfile: boolean;
}

export const WelcomeLab: React.FC<WelcomeLabProps> = ({ onStartLab, hasProfile }) => {
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    await onStartLab();
    setStarting(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b12', display: 'flex', flexDirection: 'column' }}>
      <OnboardingHeader currentStep={1} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 32px', flex: 1, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 52, alignItems: 'center' }}>
          {/* Left Column */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#34d399',
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              <span className="pulse-dot" />
              <span>ISOLATED LAB READY // LOCALHOST ENCLAVE</span>
            </div>

            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#f8fafc',
                lineHeight: 1.2,
                margin: '0 0 16px',
                letterSpacing: '-0.03em',
              }}
            >
              Welcome to your<br /><span style={{ background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cyber Security Playground</span>.
            </h1>

            <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 490 }}>
              You don't have to be an expert to begin. Learn how vulnerabilities work, try safe live exploits, and capture real flags.
            </p>

            {/* 3 Value Propositions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ color: '#38bdf8', marginTop: 2 }}><ShieldCheck size={20} /></div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 2px' }}>
                    Guided Pentesting Vectors
                  </h4>
                  <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    Clear objectives and progressive hint unlocks—never feel stuck without context.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ color: '#10b981', marginTop: 2 }}><Flag size={20} /></div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 2px' }}>
                    Learn by Exploiting Live Flags
                  </h4>
                  <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    Discover hidden tokens in our vulnerable Meridian Market web app and picoCTF tasks.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ color: '#f59e0b', marginTop: 2 }}><RotateCcw size={20} /></div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 2px' }}>
                    Instant Snapshot Rollback
                  </h4>
                  <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    Your isolated VM runs in a local sandbox. Reset clean state whenever you need.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div style={{ marginBottom: 14 }}>
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} />}
                loading={starting}
                onClick={handleStart}
                style={{ padding: '14px 32px', fontSize: 15, borderRadius: 10 }}
              >
                Enter CTF Training Setup ➔
              </Button>
            </div>

            <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 460, lineHeight: 1.5 }}>
              Next: Basic profile registration and skill assessment before entering the CTF Training Arena.
            </p>
          </div>

          {/* Right Column: Preview & Real Environment Disclaimer */}
          <div>
            <MeridianPreviewCard />

            <div style={{ marginTop: 20, padding: '16px 20px', backgroundColor: 'rgba(13, 21, 34, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                🔒 Isolated Security Sandbox
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                All target services run locally on loopback (<code style={{ color: '#38bdf8' }}>127.0.0.1:8888</code>). No external LAN traffic or public targets involved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Footer */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 12,
          color: '#64748b',
        }}
      >
        <span>Learn safely. Everything stays inside your local isolated lab environment.</span>
        <span>Relay Lab Security Workstation · Windows x64</span>
      </footer>
    </div>
  );
};
