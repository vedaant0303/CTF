import React from 'react';
import { RelayLogo } from './RelayLogo';
import { Check } from 'lucide-react';

interface OnboardingHeaderProps {
  currentStep: 1 | 2 | 3;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Welcome' },
    { number: 2, label: 'Your account' },
    { number: 3, label: 'Learning profile' },
  ];

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        backgroundColor: '#070b12',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <RelayLogo size={28} textColor="#f8fafc" />

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {steps.map((s) => {
          const isPassed = s.number < currentStep;
          const isActive = s.number === currentStep;

          return (
            <div key={s.number} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: isPassed || isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isPassed || isActive ? '#34d399' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  border: `1.5px solid ${isPassed || isActive ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
                  boxShadow: isActive ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
                }}
              >
                {isPassed ? <Check size={13} strokeWidth={3} /> : s.number}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#f8fafc' : '#64748b',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: '#06b6d4', fontWeight: 600, letterSpacing: '0.05em' }}>
        SECURE LAB ENCLAVE
      </div>
    </header>
  );
};
