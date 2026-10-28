import React, { useState, useEffect } from 'react';
import { PageView, Challenge, UserProfile, VmStatus, Badge, ActivityLog, DashboardStats, FlagSubmitResult } from './types';
import { api } from './services/apiBridge';
import { TopNav } from './components/Layout/TopNav';
import { Sidebar } from './components/Layout/Sidebar';
import { LaunchSetup } from './pages/01_LaunchSetup';
import { WelcomeLab } from './pages/02_WelcomeLab';
import { Registration } from './pages/03_Registration';
import { Assessment } from './pages/04_Assessment';
import { TrainingHome } from './pages/05_TrainingHome';
import { ChallengeExplanation } from './pages/06_ChallengeExplanation';
import { ActiveSandbox } from './pages/07_ActiveSandbox';
import { SuccessModal } from './pages/08_SuccessModal';
import { Dashboard } from './pages/09_Dashboard';
import { LabManager } from './pages/10_LabManager';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>('welcome-lab');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vmStatus, setVmStatus] = useState<VmStatus | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Success Celebration Modal
  const [successResult, setSuccessResult] = useState<FlagSubmitResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Detect if running in Electron Desktop App (.exe) vs Web Browser
  const isElectron = typeof window !== 'undefined' && Boolean((window as any).electronAPI);

  // Load Initial Data
  const loadData = async () => {
    try {
      let p = await api.getActiveProfile();
      if (!p) {
        const all = await api.getAllProfiles();
        if (all && all.length > 0) {
          p = await api.switchProfile(all[0].id);
        }
      }
      setProfile(p);

      const vm = await api.getVmStatus();
      setVmStatus(vm);

      const chs = await api.getChallenges();
      setChallenges(chs);

      const bg = await api.getBadges();
      setBadges(bg);

      const lg = await api.getActivityLogs();
      setLogs(lg);

      const st = await api.getDashboardStats();
      setStats(st);

      if (!selectedChallenge && chs.length > 0) {
        const firstUnlocked = chs.find(c => c.unlocked && c.status !== 'completed') || chs[0];
        setSelectedChallenge(firstUnlocked);
      }

      // Initial View Routing:
      // If returning from a reload, restore saved view & challenge
      const savedView = typeof window !== 'undefined' ? (sessionStorage.getItem('ctf_current_view') as PageView | null) : null;
      const savedChallengeId = typeof window !== 'undefined' ? sessionStorage.getItem('ctf_selected_challenge_id') : null;
      if (savedChallengeId) {
        const found = chs.find(c => c.id === savedChallengeId);
        if (found) setSelectedChallenge(found);
      }

      if (p) {
        setCurrentView(savedView || 'training-home');
      } else {
        setCurrentView(isElectron ? 'welcome-lab' : 'launch-setup');
      }
    } catch (err) {
      console.error('[App] Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to live VM state updates
    const unsubscribe = api.onVmStateChange((status) => {
      setVmStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Onboarding Handlers
  const handleStartLab = async () => {
    await api.startLab();
    const updatedStatus = await api.getVmStatus();
    setVmStatus(updatedStatus);

    // From Welcome Lab (02) -> Basic Registration (03)
    setCurrentView('registration');
  };

  const handleRegistered = (newProfile: UserProfile) => {
    setProfile(newProfile);
    // From Basic Registration (03) -> Skill Assessment (04)
    setCurrentView('assessment');
  };

  const handleAssessmentComplete = async () => {
    await loadData();
    // From Skill Assessment (04) -> Training Home (05)
    setCurrentView('training-home');
  };

  const handleSelectChallenge = async (challengeId: string) => {
    const ch = await api.getChallengeById(challengeId);
    if (ch) {
      setSelectedChallenge(ch);
      setCurrentView('challenge-explanation');
    }
  };

  const handleStartAttack = async () => {
    if (selectedChallenge) {
      await api.startChallenge(selectedChallenge.id);
      const ch = await api.getChallengeById(selectedChallenge.id);
      if (ch) setSelectedChallenge(ch);
      setCurrentView('active-sandbox');
    }
  };

  const handleFlagCaptured = async (result: FlagSubmitResult) => {
    setSuccessResult(result);
    setShowSuccessModal(true);

    // Refresh state in background
    const chs = await api.getChallenges();
    setChallenges(chs);
    const bg = await api.getBadges();
    setBadges(bg);
    const lg = await api.getActivityLogs();
    setLogs(lg);
    const p = await api.getActiveProfile();
    setProfile(p);
  };

  const handleNextChallenge = async (nextId: string) => {
    setShowSuccessModal(false);
    const ch = await api.getChallengeById(nextId);
    if (ch) {
      setSelectedChallenge(ch);
      setCurrentView('challenge-explanation');
    } else {
      setCurrentView('training-home');
    }
  };

  const handleResetLab = async () => {
    try {
      if (typeof window !== 'undefined') {
        if (currentView) sessionStorage.setItem('ctf_current_view', currentView);
        if (selectedChallenge) sessionStorage.setItem('ctf_selected_challenge_id', selectedChallenge.id);
        sessionStorage.setItem('ctf_vm_reset_toast', 'true');
      }
      await api.resetLab();
    } catch (err) {
      console.error('[App] Failed to reset VM:', err);
    }
    // Fully refresh and reload the entire application window
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleResetAllProgress = async () => {
    await api.resetAllProgress();
    await loadData();
    setCurrentView('training-home');
  };

  const handleLogout = () => {
    setCurrentView('welcome-lab');
  };

  const isFullFlowPage = currentView === 'registration' || currentView === 'assessment' || currentView === 'launch-setup' || currentView === 'welcome-lab';

  const earnedXp = challenges.reduce((sum, c) => sum + (c.score_awarded || (c.status === 'completed' ? c.xp_reward : 0)), 0);
  const dynamicProfile = profile ? {
    ...profile,
    total_xp: Math.max(profile.total_xp || 0, earnedXp),
  } : null;

  const handleProfileChanged = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    try {
      const chs = await api.getChallenges();
      setChallenges(chs);
      const bg = await api.getBadges();
      setBadges(bg);
      const st = await api.getDashboardStats();
      setStats(st);
      const lg = await api.getActivityLogs();
      setLogs(lg);
    } catch (err) {
      console.error('[App] Failed to reload data for switched profile:', err);
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Top Navigation (shown on workspace views) */}
      {!isFullFlowPage && (
        <TopNav
          profile={dynamicProfile}
          vmStatus={vmStatus}
          currentView={currentView}
          onResetLab={handleResetLab}
          onNavigate={setCurrentView}
          onLogout={handleLogout}
        />
      )}

      {/* Main Workspace Body */}
      <div className="main-body">
        {/* Sidebar (shown once past onboarding) */}
        {!isFullFlowPage && (
          <Sidebar
            currentView={currentView}
            profile={dynamicProfile}
            onNavigate={(view) => {
              if (view === 'active-sandbox' && !selectedChallenge && challenges.length > 0) {
                setSelectedChallenge(challenges[0]);
              }
              setCurrentView(view);
            }}
            onProfileChanged={handleProfileChanged}
            onLogout={handleLogout}
            completedCount={challenges.filter((c) => c.status === 'completed').length}
            totalCount={challenges.length}
          />
        )}

        {/* Dynamic Screen Content */}
        <main
          className="content-area"
          style={{
            padding: currentView === 'active-sandbox' ? 0 : '24px 32px',
            overflowY: currentView === 'active-sandbox' ? 'hidden' : 'auto',
          }}
        >
          {currentView === 'launch-setup' && (
            <LaunchSetup onProceed={() => setCurrentView('welcome-lab')} />
          )}

          {currentView === 'welcome-lab' && (
            <WelcomeLab onStartLab={handleStartLab} hasProfile={!!dynamicProfile} />
          )}

          {currentView === 'registration' && (
            <Registration onRegistered={handleRegistered} />
          )}

          {currentView === 'assessment' && (
            <Assessment onComplete={handleAssessmentComplete} />
          )}

          {currentView === 'training-home' && (
            <TrainingHome
              challenges={challenges}
              profile={dynamicProfile}
              onSelectChallenge={handleSelectChallenge}
              onNavigateToDashboard={() => setCurrentView('progress-dashboard')}
              onRefreshChallenges={loadData}
            />
          )}

          {currentView === 'challenge-explanation' && selectedChallenge && (
            <ChallengeExplanation
              challenge={selectedChallenge}
              onStartAttack={handleStartAttack}
              onBack={() => setCurrentView('training-home')}
            />
          )}

          {currentView === 'active-sandbox' && selectedChallenge && (
            <ActiveSandbox
              challenge={selectedChallenge}
              onFlagCaptured={handleFlagCaptured}
              onBack={() => setCurrentView('training-home')}
              onResetLab={handleResetLab}
            />
          )}

          {currentView === 'progress-dashboard' && (
            <Dashboard
              stats={stats}
              challenges={challenges}
              badges={badges}
              logs={logs}
              profile={dynamicProfile}
              vmStatus={vmStatus}
              onSelectChallenge={handleSelectChallenge}
              onResetProgress={handleResetAllProgress}
              onResetLab={handleResetLab}
            />
          )}

          {currentView === 'lab-manager' && (
            <LabManager
              vmStatus={vmStatus}
              onRefreshStatus={async () => {
                const s = await api.getVmStatus();
                setVmStatus(s);
              }}
              onResetLab={handleResetLab}
            />
          )}
        </main>
      </div>

      {/* Flag Captured Success & Remediation Modal (Screenshot 09) */}
      <SuccessModal
        isOpen={showSuccessModal}
        result={successResult}
        onNextChallenge={handleNextChallenge}
        onViewDashboard={() => {
          setShowSuccessModal(false);
          setCurrentView('progress-dashboard');
        }}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};
