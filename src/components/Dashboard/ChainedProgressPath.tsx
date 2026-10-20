import React from 'react';
import { CheckCircle2, Lock, ArrowRight, Play, Database, Search, Key, ShieldAlert, UploadCloud, Activity, Terminal } from 'lucide-react';
import { Challenge } from '../../types';

interface ChainedProgressPathProps {
  challenges: Challenge[];
  onSelectChallenge: (id: string) => void;
}

export const ChainedProgressPath: React.FC<ChainedProgressPathProps> = ({ challenges, onSelectChallenge }) => {
  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Web Exploitation': return <Database size={18} />;
      case 'Reconnaissance': return <Search size={18} />;
      case 'Web Security': return <Key size={18} />;
      case 'API & Web Security': return <ShieldAlert size={18} />;
      case 'System Compromise': return <UploadCloud size={18} />;
      case 'Resilience & Networking': return <Activity size={18} />;
      case 'System Exploitation': return <Terminal size={18} />;
      default: return <Database size={18} />;
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Chained Exploit Path: Web Entry to Host Takeover
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Realistic pedagogical attack chain where each breakthrough unlocks the subsequent pivot vector.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          position: 'relative',
        }}
      >
        {challenges.map((ch, idx) => {
          const isCompleted = ch.status === 'completed';
          const isInProgress = ch.status === 'in_progress';
          const isUnlocked = ch.unlocked;

          return (
            <div
              key={ch.id}
              onClick={() => isUnlocked && onSelectChallenge(ch.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '16px 10px',
                borderRadius: 10,
                backgroundColor: isCompleted ? '#f0fdfa' : isInProgress ? '#f8fafc' : isUnlocked ? '#ffffff' : '#f8fafc',
                border: `1px solid ${isCompleted ? '#a7f3d0' : isInProgress ? '#0d9488' : isUnlocked ? '#cbd5e1' : '#e2e8f0'}`,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.6,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {/* Node Icon */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  backgroundColor: isCompleted ? '#10b981' : isInProgress ? '#0d9488' : isUnlocked ? '#f1f5f9' : '#e2e8f0',
                  color: isCompleted || isInProgress ? '#ffffff' : '#475569',
                  boxShadow: isInProgress ? '0 0 0 4px rgba(13, 148, 136, 0.2)' : 'none',
                }}
              >
                {isCompleted ? <CheckCircle2 size={20} /> : !isUnlocked ? <Lock size={17} /> : getIconForCategory(ch.category)}
              </div>

              {/* Step Number */}
              <span style={{ fontSize: 10.5, fontWeight: 700, color: isCompleted ? '#059669' : '#64748b', textTransform: 'uppercase' }}>
                Stage {ch.order_index}
              </span>

              {/* Title */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isUnlocked ? '#0f172a' : '#94a3b8',
                  marginTop: 4,
                  lineHeight: 1.3,
                  minHeight: 32,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {ch.title.split(':')[0]}
              </span>

              {/* Status Badge */}
              <span
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 9999,
                  backgroundColor: isCompleted ? '#ecfdf5' : isInProgress ? '#e0f2fe' : isUnlocked ? '#f1f5f9' : '#e2e8f0',
                  color: isCompleted ? '#065f46' : isInProgress ? '#0369a1' : isUnlocked ? '#334155' : '#64748b',
                }}
              >
                {isCompleted ? 'CAPTURED' : isInProgress ? 'ACTIVE' : isUnlocked ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
