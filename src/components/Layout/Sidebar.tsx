import React, { useState, useEffect } from 'react';
import { RelayLogo } from '../Common/RelayLogo';
import { Home, BarChart2, BookOpen, HelpCircle, ArrowRight, ChevronDown, Check, UserPlus, User, X, Trash2, LogOut } from 'lucide-react';
import { PageView, UserProfile } from '../../types';
import { api } from '../../services/apiBridge';
import { Button } from '../Common/Button';

interface SidebarProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  profile: UserProfile | null;
  onProfileChanged?: (p: UserProfile) => void;
  onLogout?: () => void;
  completedCount?: number;
  totalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  profile,
  onProfileChanged,
  onLogout,
  completedCount = 0,
  totalCount = 7,
}) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newAvatar, setNewAvatar] = useState('Shield');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadAllProfiles = async () => {
    try {
      const list = await api.getAllProfiles();
      setAllProfiles(list);
    } catch (e) {
      console.error('Failed to load profiles:', e);
    }
  };

  useEffect(() => {
    if (showAccountMenu) {
      loadAllProfiles();
    }
  }, [showAccountMenu]);

  const handleSwitch = async (pId: string) => {
    try {
      const switched = await api.switchProfile(pId);
      if (onProfileChanged) onProfileChanged(switched);
      setShowAccountMenu(false);
    } catch (err: any) {
      console.error('Failed to switch profile:', err);
    }
  };

  const handleDeleteProfile = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await api.deleteProfile(profileId);
        await loadAllProfiles();
      } catch (err: any) {
        alert(err.message || 'Failed to delete profile');
      }
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newDisplayName.trim()) {
      setCreateError('Please enter a display name');
      return;
    }
    const user = newUsername.trim() || newDisplayName.toLowerCase().replace(/\s+/g, '_');
    setCreating(true);
    try {
      const created = await api.createProfile({
        displayName: newDisplayName.trim(),
        username: user,
        avatar: newAvatar,
      });
      if (onProfileChanged) onProfileChanged(created);
      setShowCreateModal(false);
      setShowAccountMenu(false);
      setNewDisplayName('');
      setNewUsername('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  const progressPercent = totalCount && totalCount > 0 ? Math.round(((completedCount || 0) / totalCount) * 100) : 0;

  return (
    <aside
      style={{
        width: 240,
        backgroundColor: 'rgba(13, 21, 34, 0.98)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div>
        {/* Brand */}
        <div style={{ padding: '0 8px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 18 }}>
          <RelayLogo size={26} textColor="#f8fafc" onClick={() => onNavigate('training-home')} />
        </div>

        {/* Section Label */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 10 }}>
          TACTICAL MODULES
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => onNavigate('training-home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              border: currentView === 'training-home' || currentView === 'challenge-explanation' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
              backgroundColor: currentView === 'training-home' || currentView === 'challenge-explanation' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: currentView === 'training-home' || currentView === 'challenge-explanation' ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              textAlign: 'left',
              width: '100%',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'training-home' && currentView !== 'challenge-explanation') {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'training-home' && currentView !== 'challenge-explanation') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <Home size={16} />
            <span>Training Arena</span>
          </button>

          <button
            onClick={() => onNavigate('progress-dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              border: currentView === 'progress-dashboard' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
              backgroundColor: currentView === 'progress-dashboard' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: currentView === 'progress-dashboard' ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              textAlign: 'left',
              width: '100%',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'progress-dashboard') {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'progress-dashboard') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <BarChart2 size={16} />
            <span>Telemetry & Stats</span>
          </button>

          <button
            onClick={() => onNavigate('lab-manager')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              border: currentView === 'lab-manager' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
              backgroundColor: currentView === 'lab-manager' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: currentView === 'lab-manager' ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              textAlign: 'left',
              width: '100%',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'lab-manager') {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'lab-manager') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <BookOpen size={16} />
            <span>Target Lab & VM</span>
          </button>
        </nav>

        {/* Live Arena Campaign Progress Meter */}
        <div
          style={{
            margin: '20px 0 14px',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ARENA PROGRESS
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar container */}
          <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 9999, overflow: 'hidden', marginBottom: 8 }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>Flags Captured:</span>
            <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {completedCount || 0} / {totalCount || 7}
            </span>
          </div>
        </div>

        {/* Target VM Status Monitor Widget */}
        <div
          onClick={() => onNavigate('lab-manager')}
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 10,
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-dot" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>SANDBOX ENGINE</span>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
              ONLINE
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
            MERIDIAN-01 :8888
          </div>
          <p style={{ fontSize: 10.5, color: '#64748b', margin: '0 0 6px', lineHeight: 1.3 }}>
            Isolated QEMU / Loopback only
          </p>
          <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
            Inspect VM status ➔
          </span>
        </div>
      </div>

      {/* Account Switcher Popover Menu */}
      {showAccountMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: 64,
            left: 12,
            right: 12,
            backgroundColor: '#0d1522',
            borderRadius: 10,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            zIndex: 1000,
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Switch Operator
            </span>
            <button
              onClick={() => setShowAccountMenu(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {allProfiles.map((p) => {
              const isActive = p.id === profile?.id;
              const initials = p.display_name ? p.display_name.slice(0, 2).toUpperCase() : 'OP';
              return (
                <div
                  key={p.id}
                  onClick={() => handleSwitch(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderRadius: 6,
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {p.display_name}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                        {p.total_xp || 0} XP
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isActive && <Check size={14} color="#34d399" />}
                    {!isActive && allProfiles.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteProfile(e, p.id)}
                        title="Delete profile"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          padding: 2,
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 4,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={() => {
                setShowAccountMenu(false);
                setShowCreateModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: '#34d399',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <UserPlus size={14} />
              <span>+ Add New Operator</span>
            </button>

            <button
              onClick={() => {
                setShowAccountMenu(false);
                onNavigate('progress-dashboard');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <User size={14} />
              <span>View Profile Dossier</span>
            </button>

            <button
              onClick={() => {
                setShowAccountMenu(false);
                if (onLogout) onLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 8px',
                borderRadius: 6,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: 4,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            >
              <LogOut size={14} />
              <span>Log Out & Exit Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Profile Chip (Click to toggle Switcher) */}
      <div
        onClick={() => setShowAccountMenu(!showAccountMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
          backgroundColor: showAccountMenu ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!showAccountMenu) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        }}
        onMouseLeave={(e) => {
          if (!showAccountMenu) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {profile?.display_name ? profile.display_name.slice(0, 2).toUpperCase() : 'AL'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.display_name || 'Operator Alex'}
          </div>
          <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
            {profile?.skill_level || 'Cyber Operative'}
          </div>
        </div>
        <ChevronDown size={14} color="#94a3b8" style={{ transform: showAccountMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {/* Create New Account Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: '#0d1522',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '24px',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Create New Operative Profile
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
              Each learning profile maintains its own independent challenges progress, XP score, and captured flags stored offline.
            </p>

            {createError && (
              <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12, marginBottom: 12 }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAccount}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                  Operative Name / Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                  Callsign / Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. cyber_jordan"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={creating}>
                  Initialize Operative
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

