import React from 'react';
import { Flag, Database, Key, Zap, Award, ShieldCheck, Lock } from 'lucide-react';
import { Badge as BadgeType } from '../../types';

interface BadgeGridProps {
  badges: BadgeType[];
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ badges }) => {
  const getBadgeIcon = (iconName: string, unlocked: boolean) => {
    const props = { size: 22, color: unlocked ? '#0d9488' : '#94a3b8' };
    switch (iconName) {
      case 'Flag': return <Flag {...props} />;
      case 'Database': return <Database {...props} />;
      case 'Key': return <Key {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Award': return <Award {...props} />;
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      default: return <Award {...props} />;
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
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
        Security Badges & Achievements ({badges.filter(b => b.unlocked).length}/{badges.length})
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {badges.map((badge) => {
          return (
            <div
              key={badge.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 10,
                backgroundColor: badge.unlocked ? '#f0fdfa' : '#f8fafc',
                border: `1px solid ${badge.unlocked ? '#ccfbf1' : '#e2e8f0'}`,
                opacity: badge.unlocked ? 1 : 0.65,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: badge.unlocked ? '#ffffff' : '#f1f5f9',
                  border: `1px solid ${badge.unlocked ? '#a7f3d0' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getBadgeIcon(badge.icon, badge.unlocked)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: badge.unlocked ? '#0f172a' : '#64748b' }}>
                    {badge.title}
                  </span>
                  {!badge.unlocked && <Lock size={12} color="#94a3b8" />}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', lineHeight: 1.3 }}>
                  {badge.description}
                </p>
                {badge.unlocked && badge.unlocked_at && (
                  <span style={{ fontSize: 10, color: '#0d9488', fontWeight: 600, display: 'block', marginTop: 4 }}>
                    Unlocked on {new Date(badge.unlocked_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
