import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { Challenge } from '../../types';
import { Badge } from '../Common/Badge';

interface MissionPanelProps {
  challenge: Challenge;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ challenge }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    setCompletedSteps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const getObjectiveSteps = (ch: Challenge): string[] => {
    switch (ch.id) {
      case 'ch-sqli-01':
        return [
          'Navigate through the VulnShop product catalog',
          'Test string boundary character (\') in search bar',
          'Inject tautology payload (\' OR 1=1 --) to bypass WHERE filter',
          'Examine classified blueprint product card for flag'
        ];
      case 'ch-info-02':
        return [
          'Examine web server directory boundaries',
          'Check search engine directives at /robots.txt',
          'Discover unindexed /backups/ or /.git/ paths',
          'Extract flag from disclosed configuration dump'
        ];
      case 'ch-auth-03':
        return [
          'Navigate to Administrator Gateway login',
          'Observe SQL username evaluation behavior',
          'Enter injection bypass payload: admin\' --',
          'Access administrative dashboard and retrieve flag'
        ];
      case 'ch-idor-04':
        return [
          'Access initial student support ticket #104',
          'Inspect the query parameter (?id=104)',
          'Enumerate or decrement ticket ID (?id=100)',
          'Access confidential executive audit ticket and capture flag'
        ];
      case 'ch-upload-05':
        return [
          'Open Avatar Media Upload form',
          'Test file upload with executable extension (shell.php)',
          'Submit server-side execution payload',
          'Trigger command execution to retrieve flag'
        ];
      case 'ch-dos-06':
        return [
          'Open API Rate Limiting & Load Simulation monitor',
          'Trigger controlled local request burst (20 req)',
          'Observe circuit breaker threshold trip at 15 req',
          'Verify defensive HTTP 429 response and capture flag'
        ];
      case 'ch-privesc-07':
        return [
          'Access low-privilege www-data shell terminal',
          'Enumerate sudo permissions using sudo -l',
          'Identify NOPASSWD access for /usr/bin/find',
          'Execute breakout command to obtain root shell and read flag'
        ];
      default:
        return [
          'Explore target service features',
          'Identify input validation flaws',
          'Extract flag in format FLAG{...}'
        ];
    }
  };

  const steps = getObjectiveSteps(challenge);

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
      {/* Panel Header */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0d9488', letterSpacing: '0.04em' }}>
            Mission Briefing #{challenge.order_index}
          </span>
          <Badge variant={challenge.difficulty === 'Easy' ? 'emerald' : challenge.difficulty === 'Medium' ? 'amber' : 'rose'}>
            {challenge.difficulty}
          </Badge>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
          {challenge.title}
        </h2>
      </div>

      {/* Panel Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
        {/* Scenario Story */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
            Scenario Context
          </h4>
          <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0 }}>
            {challenge.description}
          </p>
        </div>

        {/* Target Objectives Checklist */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
              Target Objectives ({completedSteps.length}/{steps.length})
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, idx) => {
              const isDone = completedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: isDone ? '#f0fdfa' : '#f8fafc',
                    border: `1px solid ${isDone ? '#ccfbf1' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ marginTop: 2, color: isDone ? '#0d9488' : '#94a3b8' }}>
                    {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: isDone ? '#0f766e' : '#334155',
                      textDecoration: isDone ? 'line-through' : 'none',
                      lineHeight: 1.4,
                    }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chained Progression Context */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <ArrowRight size={14} color="#0d9488" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              Chained Exploit Pathway
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {challenge.order_index < 7 ? (
              <>
                Completing this stage unlocks <strong>Stage {challenge.order_index + 1}</strong> in the chained exploit path.
              </>
            ) : (
              'This is the culmination of the chained attack track (Root compromise).'
            )}
          </p>
        </div>

        {/* Educational Safety Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: '#eff6ff',
            border: '1px solid #dbeafe',
          }}
        >
          <Shield size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 11.5, color: '#1e40af', margin: 0, lineHeight: 1.4 }}>
            <strong>Educational Scope:</strong> Testing is authorized exclusively for this isolated host environment (127.0.0.1:8888).
          </p>
        </div>
      </div>
    </div>
  );
};
