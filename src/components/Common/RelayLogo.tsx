import React from 'react';

interface RelayLogoProps {
  size?: number;
  textColor?: string;
  onClick?: () => void;
}

export const RelayLogo: React.FC<RelayLogoProps> = ({ size = 26, textColor = '#111a16', onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Relay Knot Symbol */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="32" height="32" rx="8" fill="#005944" />
        {/* Connected continuous loop knot */}
        <path
          d="M10 13C10 10.7909 11.7909 9 14 9H18C20.2091 9 22 10.7909 22 13V15C22 17.2091 20.2091 19 18 19H14C11.7909 19 10 20.7909 10 23"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="23" r="2" fill="#34d399" />
        <circle cx="22" cy="19" r="2" fill="#34d399" />
      </svg>

      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 800,
          fontSize: size * 0.72,
          letterSpacing: '-0.03em',
          color: textColor,
        }}
      >
        relay lab
      </span>
    </div>
  );
};
