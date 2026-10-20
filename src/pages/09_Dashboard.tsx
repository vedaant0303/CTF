import React from 'react';
import { Award, Flag, CheckCircle2, RotateCcw, Shield, Clock, ArrowRight, Server, Check } from 'lucide-react';
import { Challenge, DashboardStats, Badge, ActivityLog, UserProfile, VmStatus } from '../types';
import { Button } from '../components/Common/Button';

interface DashboardProps {
  stats: DashboardStats | null;
  challenges: Challenge[];
  badges: Badge[];
  logs: ActivityLog[];
  profile: UserProfile | null;
  vmStatus: VmStatus | null;
  onSelectChallenge: (id: string) => void;
  onResetProgress: () => Promise<void>;
  onResetLab: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  challenges,
  badges,
  logs,
  profile,
  vmStatus,
  onSelectChallenge,
  onResetProgress,
  onResetLab,
}) => {
  const completedCount = challenges.filter((c) => c.status === 'completed').length;
  const firstName = profile?.display_name?.split(' ')[0] || 'Alex';

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 28px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-emerald">
              <span className="pulse-dot" /> LIVE TELEMETRY
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>OPERATIVE: {firstName.toUpperCase()}</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Operative Progress & Telemetry
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Real-time tracking of captured flag tokens, vulnerability discoveries, and chain completions.
          </p>
        </div>

        <span className="badge badge-cyan" style={{ padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          RANK // {profile?.skill_level || 'Apprentice Operative'}
        </span>
      </div>

      {/* 3 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Card 1 */}
        <div className="ui-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Operative XP</span>
            <Award size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            {profile?.total_xp || 100} XP
          </div>
          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
            Verified bounty score earned
          </div>
        </div>

        {/* Card 2 */}
        <div className="ui-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Flags Captured</span>
            <Flag size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            {completedCount} / {challenges.length}
          </div>
          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
            Active targets compromised
          </div>
        </div>

        {/* Card 3 */}
        <div className="ui-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Curriculum Coverage</span>
            <span style={{ fontSize: 14 }}>📈</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
            {challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0}%
          </div>
          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
            {challenges.length - completedCount} challenges remaining
          </div>
        </div>
      </div>

      {/* Recommended Chain Horizontal Bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Multi-Stage Meridian Campaign
          </span>
          <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Chained exploit roadmap</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {[
            { id: 'ch-sqli-01', title: 'SQL Injection' },
            { id: 'ch-info-02', title: 'Info Disclosure' },
            { id: 'ch-auth-03', title: 'Authentication' },
            { id: 'ch-idor-04', title: 'XSS / IDOR' },
            { id: 'ch-upload-05', title: 'File Upload' },
            { id: 'ch-privesc-06', title: 'Priv Escalation' },
          ].map((item, idx) => {
            const ch = challenges.find((c) => c.id === item.id);
            const isCompleted = ch?.status === 'completed';
            const isNext = !isCompleted && ch?.unlocked;

            return (
              <div
                key={item.id}
                onClick={() => ch?.unlocked && onSelectChallenge(item.id)}
                style={{
                  backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.12)' : isNext ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                  border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.4)' : isNext ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: ch?.unlocked ? 'pointer' : 'default',
                  opacity: ch?.unlocked ? 1 : 0.5,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: isCompleted ? '#34d399' : isNext ? '#38bdf8' : '#64748b', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>
                  {isCompleted ? '✔ COMPLETED' : `STEP 0${idx+1}`}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column: Learning Path Table & VM Card */}
        <div>
          <div className="ui-card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Exploit Path Target Table
              </h3>
              <span style={{ fontSize: 11, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                {completedCount} COMPLETED
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>
              Connect one discovery to the next across all active curricula.
            </p>

            {/* Table Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {challenges.slice(0, 7).map((ch, i) => {
                const isDone = ch.status === 'completed';
                return (
                  <div
                    key={ch.id}
                    onClick={() => onSelectChallenge(ch.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 8px',
                      borderBottom: i < 6 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                      fontSize: 12.5,
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: isDone ? '#34d399' : '#64748b', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {isDone ? '✔' : `0${i+1}`}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{ch.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{ch.category}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                        +{ch.xp_reward} XP
                      </span>

                      <span className={isDone ? 'badge badge-emerald' : 'badge badge-slate'} style={{ minWidth: 80, justifyContent: 'center' }}>
                        {isDone ? 'Captured' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom VM Card */}
          <div className="ui-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                    Isolated Target Virtual Machine
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                    MERIDIAN-01 // PORT 8888 // LOCAL LOOPBACK ONLY
                  </div>
                </div>
              </div>

              <span className="badge badge-emerald">
                <span className="pulse-dot" /> ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card: Next Target Challenge */}
          <div className="ui-card" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
              ✦ RECOMMENDED ATTACK
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>
              {challenges.find(c => c.status !== 'completed')?.title || 'All Targets Solved!'}
            </h3>
            <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.4 }}>
              Launch mission into the isolated sandbox to test inputs and claim bounty points.
            </p>

            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight size={14} />}
              onClick={() => {
                const next = challenges.find(c => c.status !== 'completed') || challenges[0];
                if (next) onSelectChallenge(next.id);
              }}
              style={{ width: '100%', padding: '10px' }}
            >
              ➔ Deploy Sandbox Mission
            </Button>
          </div>

          {/* Reset Progress Card */}
          <div className="ui-card">
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
              Laboratory Maintenance
            </h4>
            <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.4 }}>
              Revert target machine back to initial snapshot state or restart testing.
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw size={13} />}
                onClick={onResetLab}
                style={{ flex: 1 }}
              >
                Reset VM Snapshot
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onResetProgress}
              >
                Reset Progress
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
