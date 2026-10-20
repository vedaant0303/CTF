import React, { useState } from 'react';
import { OnboardingHeader } from '../components/Common/OnboardingHeader';
import { Eye, EyeOff, Lock, ArrowRight, Sprout, Database, CheckCircle2, Cloud } from 'lucide-react';
import { api } from '../services/apiBridge';
import { UserProfile } from '../types';
import { Button } from '../components/Common/Button';
import { Card } from '../components/Common/Card';
import { MongoConfigModal } from '../components/Database/MongoConfigModal';

interface RegistrationProps {
  onRegistered: (profile: UserProfile) => void;
}

export const Registration: React.FC<RegistrationProps> = ({ onRegistered }) => {
  const [displayName, setDisplayName] = useState('Alex Lee');
  const [email, setEmail] = useState('alex.lee@example.com');
  const [password, setPassword] = useState('RelayLab#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mongoModalOpen, setMongoModalOpen] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);

  React.useEffect(() => {
    api.getMongoStatus()
      .then((s) => setMongoConnected(s.connected))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please agree to practice only inside the provided local sandbox.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const username = email.split('@')[0] || displayName.toLowerCase().replace(/\s+/g, '_');
      const profile = await api.createProfile({
        username,
        displayName: displayName.trim() || 'Alex Lee',
        avatar: 'Shield',
      });
      onRegistered(profile);
    } catch (err: any) {
      setError(err.message || 'Failed to create local profile.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b12', display: 'flex', flexDirection: 'column' }}>
      <OnboardingHeader currentStep={2} />

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 32px', flex: 1, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 56, alignItems: 'center' }}>
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
              <span>STEP 02 // OPERATIVE IDENTITY</span>
            </div>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#f8fafc',
                lineHeight: 1.25,
                margin: '0 0 16px',
                letterSpacing: '-0.03em',
              }}
            >
              Initialize your operative profile.
            </h1>

            <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 28px' }}>
              Create your CTF operative callsign to track your XP, completed vulnerability exploits, and captured flags offline.
            </p>

            {/* Inset Cyber Card */}
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 12,
                padding: '20px',
                marginBottom: 28,
              }}
            >
              <div style={{ color: '#34d399', marginBottom: 8 }}>
                <Sprout size={24} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
                Your learning path starts here.
              </h4>
              <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Follow guided vulnerability chains from basic SQL injections to advanced command execution in your isolated sandbox.
              </p>
            </div>

            {/* Dynamic Database Status Card */}
            <div
              style={{
                backgroundColor: mongoConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${mongoConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: mongoConnected ? '#34d399' : '#f8fafc' }}>
                  <Database size={15} color={mongoConnected ? '#34d399' : '#38bdf8'} />
                  <span>{mongoConnected ? 'Connected to MongoDB Atlas' : 'Local SQLite Storage'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMongoModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: mongoConnected ? '#34d399' : '#38bdf8',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {mongoConnected ? 'Manage MongoDB ⚙️' : 'Connect MongoDB Cloud →'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>
                {mongoConnected
                  ? 'Cloud database sync active. Your profile, skill assessment, and captured flags are synchronized directly to your MongoDB Atlas Project.'
                  : 'Your profile data is stored locally in your SQLite database. You can connect MongoDB Atlas to sync progress across machines.'}
              </div>
            </div>
          </div>

          {/* Right Column: Account Form Card */}
          <div>
            <div className="ui-card" style={{ padding: '36px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Create Operative Callsign
              </h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px' }}>
                Just the basics. You'll be in the training arena in minutes.
              </p>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12.5, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                    Operative Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="form-input"
                  />
                  <div style={{ fontSize: 11.5, color: '#72827a', marginTop: 4 }}>
                    This is how you'll appear in your workspace.
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                    Email Address / Contact
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter at least 8 characters..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: showPassword ? '#34d399' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        borderRadius: 4,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                    At least 8 characters. Make it unique to Relay Lab.
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5, color: '#94a3b8', cursor: 'pointer', lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginTop: 2, accentColor: '#10b981' }}
                    />
                    <span>
                      I agree to the Terms & Safety Policy and will practice only inside the provided local sandbox.
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  icon={<ArrowRight size={15} />}
                  style={{ width: '100%', padding: '12px', fontSize: 14, borderRadius: 8 }}
                >
                  Create Operative Profile & Continue ➔
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

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
        <span>Learn safely. Everything stays inside your local lab.</span>
        <span>Relay Lab · Windows desktop</span>
      </footer>

      <MongoConfigModal
        isOpen={mongoModalOpen}
        onClose={() => setMongoModalOpen(false)}
        onStatusChange={(connected) => setMongoConnected(connected)}
      />
    </div>
  );
};
