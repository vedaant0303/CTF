import React from 'react';
import { RelayLogo } from '../components/Common/RelayLogo';
import { MeridianPreviewCard } from '../components/Common/MeridianPreviewCard';
import { Download, ArrowRight, ShieldCheck, HardDrive, Cpu, Laptop, Lock } from 'lucide-react';
import { Button } from '../components/Common/Button';

interface LaunchSetupProps {
  onProceed: () => void;
}

export const LaunchSetup: React.FC<LaunchSetupProps> = ({ onProceed }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b12', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 48px',
          backgroundColor: '#070b12',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <RelayLogo size={28} textColor="#f8fafc" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Isolated Local Enclave</span>
          <Button variant="primary" size="sm" onClick={onProceed} style={{ borderRadius: 8, padding: '8px 20px' }}>
            Download Relay-Lab.exe (284 MB)
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '44px 32px', flex: 1, width: '100%' }}>
        {/* Hero 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 60 }}>
          {/* Left Hero */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '5px 14px',
                borderRadius: 9999,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: 16,
              }}
            >
              <span className="pulse-dot" />
              <span>OFFENSIVE CYBER SECURITY TRAINING WORKSTATION</span>
            </div>

            <h1
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: '#f8fafc',
                lineHeight: 1.15,
                margin: '0 0 16px',
                letterSpacing: '-0.03em',
              }}
            >
              Your first security lab.<br />
              <span style={{ background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A safe place to learn.</span>
            </h1>

            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 480 }}>
              Explore a vulnerable virtual machine, connect the clues, and capture your first flag. Guided practice makes every discovery a lesson.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <Button
                variant="primary"
                size="lg"
                icon={<Download size={18} />}
                onClick={onProceed}
                style={{ padding: '14px 28px', fontSize: 15, borderRadius: 10 }}
              >
                Download Relay-Lab.exe
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<ArrowRight size={16} />}
                onClick={onProceed}
                style={{ padding: '14px 22px', fontSize: 14, borderRadius: 10 }}
              >
                Launch Web Playground
              </Button>
            </div>

            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 28, fontFamily: 'var(--font-mono)' }}>
              Windows 10 / 11 · 64-bit · v1.0 · Standalone Local Executable
            </div>

            {/* Feature Pills */}
            <div style={{ display: 'flex', gap: 18, fontSize: 12.5, fontWeight: 600, color: '#34d399' }}>
              <span>✦ Beginner-friendly</span>
              <span>✦ Local-only labs</span>
              <span>✦ Real PicoCTF Tasks</span>
            </div>
          </div>

          {/* Right Hero: Meridian Market Preview Card */}
          <div>
            <MeridianPreviewCard />
          </div>
        </div>

        {/* Bottom Section: From Download to Discovery */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: '#10b981' }} />
            From Download to Flag Discovery
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 28 }}>
            <div className="ui-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#06b6d4' }}><Laptop size={22} /></span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', fontFamily: 'var(--font-mono)' }}>01</span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>Open the EXE</h4>
              <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Run Relay-Lab.exe and follow the short setup. Launches isolated local environment instantly.
              </p>
            </div>

            <div className="ui-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#10b981' }}><ShieldCheck size={22} /></span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', fontFamily: 'var(--font-mono)' }}>02</span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>Create Operative Callsign</h4>
              <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Register and complete quick skill assessment to personalize your CTF training path.
              </p>
            </div>

            <div className="ui-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#f59e0b' }}><HardDrive size={22} /></span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', fontFamily: 'var(--font-mono)' }}>03</span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>Start Live Exploits</h4>
              <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Access live target sandbox on loopback with zero external traffic or LAN risk.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
            <span>Requirements: 8 GB RAM · 4 GB free disk space · Local loopback enabled</span>
            <a href="#" onClick={(e) => { e.preventDefault(); onProceed(); }} style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
              Enter CTF Setup ➔
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
