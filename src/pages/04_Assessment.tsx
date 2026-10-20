import React, { useState } from 'react';
import { OnboardingHeader } from '../components/Common/OnboardingHeader';
import { Sprout, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/apiBridge';
import { Button } from '../components/Common/Button';
import { Card } from '../components/Common/Card';

interface AssessmentProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const Assessment: React.FC<AssessmentProps> = ({ onComplete, onBack }) => {
  const [experience, setExperience] = useState('new');
  const [goal, setGoal] = useState('skills');
  const [q1, setQ1] = useState('weakness');
  const [q2, setQ2] = useState('authorized');
  const [q3, setQ3] = useState('not_yet');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitAssessment({
        cyberExperience: experience === 'new' ? 'beginner' : 'intermediate',
        ctfExperience: 'first_time',
        learningGoal: goal === 'skills' ? 'pentest' : 'web_sec',
        webKnowledge: q3 === 'not_yet' ? 'basic' : 'moderate',
      });
      onComplete();
    } catch (err) {
      console.error(err);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b12', display: 'flex', flexDirection: 'column' }}>
      <OnboardingHeader currentStep={3} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 32px', flex: 1, width: '100%' }}>
        {/* Title Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              STEP 03 // LEARNING PROFILE ASSESSMENT
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Find your starting point.
          </h1>
          <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0 }}>
            A few quick answers help us recommend tailored CTF challenge categories and hint assistance.
          </p>
        </div>

        {/* 2-Column Split: Questions (Left) vs Recommended Path (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 32, alignItems: 'flex-start' }}>
          {/* Left Column Questions */}
          <form onSubmit={handleSubmit}>
            {/* Top 2 Side-by-Side Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
              {/* Experience Card */}
              <div className="ui-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', margin: '0 0 14px' }}>
                  How much cybersecurity experience do you have?
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'new', label: "I'm new to cybersecurity" },
                    { id: 'basics', label: 'I know a few security basics' },
                    { id: 'labs', label: "I've practiced CTF labs before" },
                  ].map((opt) => {
                    const sel = experience === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setExperience(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${sel ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                          backgroundColor: sel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: sel ? 700 : 500,
                          color: sel ? '#34d399' : '#94a3b8',
                        }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sel ? '#10b981' : '#64748b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Goal Card */}
              <div className="ui-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', margin: '0 0 14px' }}>
                  What is your primary goal?
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'skills', label: 'Build offensive pentesting skills' },
                    { id: 'curiosity', label: 'Learn vulnerability analysis' },
                    { id: 'lessons', label: 'Solve picoCTF challenges' },
                  ].map((opt) => {
                    const sel = goal === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setGoal(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1.5px solid ${sel ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                          backgroundColor: sel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: sel ? 700 : 500,
                          color: sel ? '#34d399' : '#94a3b8',
                        }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sel ? '#10b981' : '#64748b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Card: A quick check-in */}
            <div className="ui-card" style={{ padding: '20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  A quick check-in
                </h4>
                <span style={{ fontSize: 11.5, color: '#06b6d4' }}>It's okay if you're just starting</span>
              </div>

              {/* Q1 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
                  1. What does a security vulnerability mean?
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { id: 'weakness', label: 'A weakness in code that can be exploited' },
                    { id: 'update', label: 'Any software update' },
                    { id: 'unsure', label: "I'm not sure yet" },
                  ].map((opt) => {
                    const sel = q1 === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setQ1(opt.id)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${sel ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                          backgroundColor: sel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                          color: sel ? '#34d399' : '#94a3b8',
                          fontSize: 12,
                          fontWeight: sel ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q2 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
                  2. Where should you practice pentesting attacks?
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { id: 'any', label: 'Any public website' },
                    { id: 'authorized', label: 'An authorized local sandbox lab' },
                    { id: 'unsure', label: "I'm not sure yet" },
                  ].map((opt) => {
                    const sel = q2 === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setQ2(opt.id)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${sel ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                          backgroundColor: sel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                          color: sel ? '#34d399' : '#94a3b8',
                          fontSize: 12,
                          fontWeight: sel ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q3 */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
                  3. Have you worked with web databases or SQL before?
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { id: 'not_yet', label: 'Not yet' },
                    { id: 'little', label: 'A little bit' },
                    { id: 'regularly', label: 'Yes, regularly' },
                  ].map((opt) => {
                    const sel = q3 === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setQ3(opt.id)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${sel ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                          backgroundColor: sel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                          color: sel ? '#34d399' : '#94a3b8',
                          fontSize: 12,
                          fontWeight: sel ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onBack}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
              >
                Back
              </button>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={<ArrowRight size={15} />}
                style={{ padding: '12px 28px', borderRadius: 10, fontSize: 14 }}
              >
                Save Profile & Enter Training Arena ➔
              </Button>
            </div>
          </form>

          {/* Right Column: Path Summary Card */}
          <div>
            <div className="ui-card" style={{ padding: '24px' }}>
              <div style={{ color: '#34d399', marginBottom: 10 }}>
                <Sprout size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>
                Your Custom Training Track
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
                Start with guided explanations and progressive hints. Learn at your own pace inside local sandbox targets.
              </p>

              {/* Inset Recommended Card */}
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 2 }}>
                  🎯 Recommended Starting Mission: SQL Injection
                </div>
                <div style={{ fontSize: 11.5, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  Beginner · 15 minutes · +100 XP
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>
                  Zero pressure environment.
                </div>
                <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Answers customize hint recommendations and starting challenges. You can adjust your profile anytime.
                </p>
              </div>
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
        <span>Learn safely. Everything stays inside your local isolated lab environment.</span>
        <span>Relay Lab Security Workstation · Windows x64</span>
      </footer>
    </div>
  );
};
