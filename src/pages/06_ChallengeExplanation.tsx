import React from 'react';
import { ArrowLeft, Play, Shield, Terminal, Code, Cpu, ShieldCheck, CheckCircle2, Clock, Award, Target, HelpCircle, ArrowRight, Laptop, Database, AlertCircle, Lock, FileCode, Check } from 'lucide-react';
import { Challenge } from '../types';
import { Button } from '../components/Common/Button';
import { getDetailedAttackInfo } from '../utils/challengeDetails';

interface ChallengeExplanationProps {
  challenge: Challenge;
  onStartAttack: () => void;
  onBack: () => void;
}

export const ChallengeExplanation: React.FC<ChallengeExplanationProps> = ({
  challenge,
  onStartAttack,
  onBack,
}) => {
  const isPico = challenge.track === 'picoctf' || challenge.id.startsWith('pico');
  const trackLabel = isPico ? 'PICOCTF ARENA' : 'MERIDIAN EXPLOIT CHAIN';

  // Retrieve rich attack-specific technical details
  const attackInfo = getDetailedAttackInfo(challenge.id, challenge.category, challenge.title);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px' }}>
      {/* Top Back Link */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={onBack}
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
      </div>

      {/* Challenge Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ flex: 1, paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              MISSION BRIEFING // {trackLabel} · {challenge.category.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {challenge.title}
          </h1>

          {/* CWE & OWASP Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
              {attackInfo.cwe}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
              {attackInfo.owasp}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="badge badge-emerald">{challenge.difficulty}</span>
          <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>+{challenge.xp_reward} XP</span>
        </div>
      </div>

      {/* 2-Column Split: Detailed Attack Analysis (Left) vs Action & Objectives (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.85fr 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column (Attack Details) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Card 1: Attack Mechanism & Technical Analysis */}
          <div className="ui-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              Vulnerability Mechanism & Root Cause
            </h3>
            <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 16px' }}>
              {attackInfo.technicalMechanism}
            </p>

            {/* Sample Payload Box */}
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                  TARGET EXPLOIT PAYLOAD SYNTAX
                </span>
                <span style={{ fontSize: 10.5, color: '#64748b', fontFamily: 'var(--font-mono)' }}>EXPLOIT VECTOR</span>
              </div>
              <pre style={{ margin: 0, fontSize: 13, fontFamily: 'var(--font-mono)', color: '#34d399', whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: 'transparent', padding: 0, border: 'none' }}>
                {attackInfo.samplePayload}
              </pre>
            </div>
          </div>

          {/* Card 2: 3-Stage Attack Vector Execution Flow */}
          <div className="ui-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={18} style={{ color: '#06b6d4' }} />
              Execution Flow & Attack Vectors
            </h3>

            {/* Dynamic 3-Stage Attack Vector Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {attackInfo.stages.map((stg) => (
                <div
                  key={stg.step}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: stg.step === 1 ? '#34d399' : stg.step === 2 ? '#fbbf24' : '#38bdf8', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                        STAGE 0{stg.step}
                      </span>
                      {stg.step === 1 && <Laptop size={14} color="#34d399" />}
                      {stg.step === 2 && <AlertCircle size={14} color="#fbbf24" />}
                      {stg.step === 3 && <Database size={14} color="#38bdf8" />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
                      {stg.label}
                    </div>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      {stg.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Learning Objectives */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
                Key Learning Objectives:
              </h4>
              <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                {challenge.learning_objectives}
              </p>
            </div>

            {/* Remediation Diff Snippet */}
            {challenge.remediation_diff && (
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                  🛡️ Secure Code Patch (Remediation Diff)
                </div>
                <pre style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {challenge.remediation_diff}
                </pre>
              </div>
            )}
          </div>

          {/* Card 3: Defensive Impact & Best Practices */}
          <div className="ui-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} style={{ color: '#a855f7' }} />
              Defensive Mitigation & Key Takeaways
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attackInfo.defensiveKeyTakeaways.map((tk, idx) => (
                <li key={idx} style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                  {tk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Objective Card & Start CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Main Action Card */}
          <div className="ui-card" style={{ borderColor: 'rgba(16, 185, 129, 0.35)', background: 'linear-gradient(135deg, rgba(13, 21, 34, 0.95) 0%, rgba(18, 29, 47, 0.9) 100%)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
              🎯 TACTICAL OBJECTIVE
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', margin: '0 0 8px', lineHeight: 1.3 }}>
              Capture the flag for {challenge.title}.
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
              Deploy the live sandbox session, execute the exploit against the target virtual machine, and submit the flag token to claim {challenge.xp_reward} XP.
            </p>

            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#94a3b8', marginBottom: 20, fontFamily: 'var(--font-mono)' }}>
              <span>⏱ Estimated: {challenge.estimated_time}</span>
              <span>💡 3 Hint Levels</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={<Play size={16} />}
              onClick={onStartAttack}
              style={{ width: '100%', padding: '13px', fontSize: 14.5, borderRadius: 8 }}
            >
              ➔ Deploy Live Sandbox
            </Button>
          </div>

          {/* Local Sandbox Safety Notice */}
          <div className="ui-card">
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f8fafc', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-dot" />
              <span>Isolated Local Sandbox</span>
            </div>
            <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {challenge.safety_notes || 'All exploit payloads are strictly contained within local sandbox loopback (127.0.0.1:8888). No live external network targets.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

