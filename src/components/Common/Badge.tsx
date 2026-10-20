import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'teal', className = '', style }) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {children}
    </span>
  );
};
