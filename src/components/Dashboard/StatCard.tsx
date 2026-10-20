import React from 'react';
import { Card } from '../Common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend }) => {
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 4, letterSpacing: '-0.02em' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: '#f0fdfa',
            color: '#0d9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};
