import React, { useState } from 'react';
import { Shield, RotateCcw, Cpu, Award, Zap, BarChart2, LogOut } from 'lucide-react';
import { UserProfile, VmStatus, PageView } from '../../types';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { api } from '../../services/apiBridge';

interface TopNavProps {
  profile: UserProfile | null;
  vmStatus: VmStatus | null;
  currentView: PageView;
  onResetLab: () => Promise<void>;
  onNavigate: (view: PageView) => void;
  onLogout?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  profile,
  vmStatus,
  currentView,
  onResetLab,
  onNavigate,
  onLogout,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('ctf_vm_reset_toast') === 'true') {
      sessionStorage.removeItem('ctf_vm_reset_toast');
      return true;
    }
    return false;
  });

  React.useEffect(() => {
    if (resetSuccessToast) {
      const timer = setTimeout(() => setResetSuccessToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [resetSuccessToast]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await onResetLab();
    } catch (err) {
      console.error('[TopNav] Reset lab failed:', err);
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  const navItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'training-home', label: 'Challenge Arena', icon: <Shield size={14} /> },
    { id: 'active-sandbox', label: 'Live Sandbox', icon: <Zap size={14} /> },
    { id: 'progress-dashboard', label: 'Telemetry & Stats', icon: <BarChart2 size={14} /> },
    { id: 'lab-manager', label: 'Target VM', icon: <Cpu size={14} /> },
  ];

  return (
    <>
      <header
        style={{
          height: 52,
          backgroundColor: 'rgba(13, 21, 34, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 10,
        }}
      >
        {/* Left: Terminal Node & Current Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              color: '#34d399',
            }}
          >
            <span className="pulse-dot" />
            <span>NODE // LOCAL-SEC-VM</span>
          </div>
          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
            {currentView === 'training-home' && 'Cyber Training Matrix'}
            {currentView === 'challenge-explanation' && 'Mission Briefing Dossier'}
            {currentView === 'active-sandbox' && 'Active Pentest Sandbox'}
            {currentView === 'progress-dashboard' && 'Operator Telemetry'}
            {currentView === 'lab-manager' && 'Virtual Machine Controller'}
          </span>
        </div>

        {/* Center: Live Dynamic Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: isActive ? '#34d399' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Live Sandbox Status, XP Counter, Clean Snapshot Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* XP Pill */}
          <div
            onClick={() => onNavigate('progress-dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              padding: '5px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
            }}
            title="Click to view full operator progression & achievements"
          >
            <Award size={14} color="#38bdf8" />
            <span>{profile?.total_xp || 0} XP</span>
          </div>

          {/* Reset Lab Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#94a3b8',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              padding: '5px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            title="Reset sandbox VM back to clean initial snapshot"
          >
            <RotateCcw size={13} />
            <span>Reset VM</span>
          </button>

          {/* Log Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              }}
              title="Log out and return to welcome page"
            >
              <LogOut size={12} />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Reset Success Toast Banner */}
      {resetSuccessToast && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            right: 24,
            backgroundColor: '#064e3b',
            color: '#a7f3d0',
            border: '1px solid #10b981',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <RotateCcw size={15} color="#34d399" />
          <span>✓ Target VM snapshot cleanly restored & application reloaded!</span>
        </div>
      )}

      {/* Snapshot Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Restore Clean Target VM Snapshot"
      >
        <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px' }}>
          This will instantaneously revert the target VM (Port 8888) back to its clean starting state. Any uploaded shell files or modified database entries in the sandbox will be restored. Your earned operator XP and captured flags remain permanently saved.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
          <Button variant="primary" loading={resetting} onClick={handleReset}>
            {resetting ? 'Restarting VM & Reloading...' : 'Confirm Reset & Reload'}
          </Button>
        </div>
      </Modal>
    </>
  );
};
