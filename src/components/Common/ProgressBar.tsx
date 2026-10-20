import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = true,
  color = '#0d9488',
  height = 8,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div style={{ width: '100%' }}>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#334155' }}>
          {label && <span>{label}</span>}
          {showPercent && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{clamped}%</span>}
        </div>
      )}
      <div style={{ width: '100%', height, backgroundColor: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 9999,
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>
    </div>
  );
};
