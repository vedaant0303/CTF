import React from 'react';
import { Activity, Flag, Lightbulb, Play, RotateCcw, UserPlus } from 'lucide-react';
import { ActivityLog } from '../../types';

interface ActivityTimelineProps {
  logs: ActivityLog[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'FLAG_CAPTURED_SUCCESS':
        return <Flag size={15} color="#10b981" />;
      case 'CHALLENGE_STARTED':
        return <Play size={15} color="#0d9488" />;
      case 'HINT_UNLOCKED':
        return <Lightbulb size={15} color="#f59e0b" />;
      case 'PROFILE_CREATED':
      case 'ASSESSMENT_COMPLETED':
        return <UserPlus size={15} color="#0284c7" />;
      case 'VM_RESET_ACTION':
      case 'PROGRESS_RESET':
        return <RotateCcw size={15} color="#ef4444" />;
      default:
        return <Activity size={15} color="#64748b" />;
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
        Activity History Log
      </h3>

      {logs.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
          No recorded activity yet. Start a challenge to record events.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.slice(0, 10).map((log) => {
            const timeStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ padding: 6, borderRadius: 6, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex' }}>
                  {getEventIcon(log.event_type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: '#0f172a', margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.message}
                  </p>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {log.event_type.replace(/_/g, ' ')}
                  </span>
                </div>

                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  {timeStr}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
