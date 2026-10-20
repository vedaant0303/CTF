import React from 'react';
import { Shield, Lock, Search, Flag, Award, ArrowRight } from 'lucide-react';

export const MeridianPreviewCard: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#eef6f2',
        borderRadius: 16,
        padding: '28px',
        border: '1px solid #d4ded8',
        boxShadow: '0 4px 20px rgba(0, 89, 68, 0.04)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#005944', letterSpacing: '0.04em' }}>
          <Shield size={13} />
          <span>YOUR SAFE LEARNING SPACE</span>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#4b5a54', backgroundColor: '#e2eae5', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em' }}>
          LOCAL-ONLY
        </span>
      </div>

      {/* Main Inner Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #d4ded8',
          padding: '24px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005944" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111a16' }}>Meridian Market</span>
        </div>
        <div style={{ fontSize: 11, color: '#72827a', fontWeight: 600, marginBottom: 16 }}>
          VULNERABLE VM · MERIDIAN-01
        </div>

        {/* Browser Mock Window */}
        <div style={{ backgroundColor: '#f8faf9', border: '1px solid #e3eae6', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#72827a', marginBottom: 12, backgroundColor: '#ffffff', border: '1px solid #e3eae6', padding: '3px 10px', borderRadius: 6 }}>
            <Lock size={11} color="#005944" />
            <span>meridian.local</span>
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111a16', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Small shop. Big discoveries.
          </h3>
          <p style={{ fontSize: 12.5, color: '#72827a', margin: '0 0 16px' }}>
            A deliberately vulnerable app built for learning.
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, backgroundColor: '#ffffff', border: '1px solid #d4ded8', fontWeight: 600, color: '#111a16' }}>
              Storefront
            </span>
            <span style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, backgroundColor: '#ffffff', border: '1px solid #d4ded8', fontWeight: 600, color: '#111a16' }}>
              Accounts
            </span>
            <span style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, backgroundColor: '#ffffff', border: '1px solid #d4ded8', fontWeight: 600, color: '#111a16' }}>
              Admin
            </span>
          </div>

          {/* 3 Step Pill Chain */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11.5, color: '#4b5a54', fontWeight: 600 }}>
            <span>🔍 Explore</span>
            <ArrowRight size={12} color="#005944" />
            <span>🚩 Find a flag</span>
            <ArrowRight size={12} color="#005944" />
            <span>🛡️ Build skills</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#4b5a54', fontWeight: 500, margin: '0 0 4px' }}>
          🛡️ No public targets. No external traffic. Reset anytime.
        </p>
        <span style={{ fontSize: 11, color: '#72827a' }}>
          One fictional shop. Seven lessons. Skills that connect.
        </span>
      </div>
    </div>
  );
};
