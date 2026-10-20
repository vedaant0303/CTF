import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false, style, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`ui-card ${hoverable ? 'ui-card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
