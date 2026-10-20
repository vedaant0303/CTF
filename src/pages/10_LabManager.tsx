import React, { useState } from 'react';
import { Server, Play, Square, RotateCcw, ShieldCheck, Cpu, HardDrive, Wifi, Activity, Terminal, ExternalLink } from 'lucide-react';
import { VmStatus, VmDiagnostics } from '../types';
import { api } from '../services/apiBridge';
import { Button } from '../components/Common/Button';
import { Card } from '../components/Common/Card';
import { Badge } from '../components/Common/Badge';

interface LabManagerProps {
  vmStatus: VmStatus | null;
  onRefreshStatus: () => Promise<void>;
  onResetLab: () => Promise<void>;
}

export const LabManager: React.FC<LabManagerProps> = ({
  vmStatus,
  onRefreshStatus,
  onResetLab,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleStart = async () => {
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const ok = await api.startLab();
      await onRefreshStatus();
      setFeedbackMessage(ok ? 'Lab environment started successfully.' : 'Failed to start lab.');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Start error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      await api.stopLab();
      await onRefreshStatus();
      setFeedbackMessage('Lab environment stopped.');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Stop error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      await onResetLab();
      await onRefreshStatus();
      setFeedbackMessage('Lab environment restored to clean snapshot.');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Reset error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isRunning = vmStatus?.state === 'running';

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            HYPERVISOR CONTROL // NODE ISOLATION
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
          Virtual Machine & Isolated Lab Manager
        </h1>
        <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '4px 0 0' }}>
          Control QEMU process lifecycles, inspect isolated networking, and trigger instantaneous snapshot restoration.
        </p>
      </div>

      {feedbackMessage && (
        <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} />
          {feedbackMessage}
        </div>
      )}

      {/* Main Status & Controls Card */}
      <div className="ui-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: isRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: isRunning ? '#10b981' : '#64748b',
                border: `1px solid ${isRunning ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isRunning ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              <Server size={26} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {vmStatus?.vmName || 'Isolated Linux CTF Node'}
                </h3>
                <span className={isRunning ? 'badge-emerald' : vmStatus?.state === 'starting' ? 'badge-amber' : 'badge-slate'}>
                  {vmStatus?.state.toUpperCase() || 'STOPPED'}
                </span>
              </div>
              <span style={{ fontSize: 12.5, color: '#94a3b8' }}>
                Engine: <strong style={{ color: '#38bdf8' }}>{vmStatus?.engine === 'qemu-tcg' ? 'QEMU Hypervisor (Host-Only Network)' : 'High-Fidelity Embedded Local Isolated Sandbox'}</strong>
              </span>
            </div>
          </div>

          {/* VM Control Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {isRunning ? (
              <Button
                variant="secondary"
                size="md"
                icon={<Square size={14} />}
                loading={actionLoading}
                onClick={handleStop}
              >
                Stop Lab
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={<Play size={14} />}
                loading={actionLoading}
                onClick={handleStart}
              >
                Start Lab
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              icon={<RotateCcw size={14} />}
              loading={actionLoading}
              onClick={handleReset}
              title="Instant snapshot rollback"
            >
              Reset Clean Snapshot
            </Button>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Activity size={13} style={{ color: '#06b6d4' }} />
              <span>Lab Uptime</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
              {isRunning ? formatUptime(vmStatus?.uptimeSeconds || 0) : '00:00:00'}
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Wifi size={13} style={{ color: '#10b981' }} />
              <span>Host Target</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
              127.0.0.1:8888
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Cpu size={13} style={{ color: '#f59e0b' }} />
              <span>Resources</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
              {vmStatus?.memoryMb || 1024}MB / {vmStatus?.cpus || 1} vCPU
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <HardDrive size={13} style={{ color: '#a855f7' }} />
              <span>QCOW2 Disk</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginTop: 8 }}>
              Clean Snapshot Ready
            </div>
          </div>
        </div>
      </div>

      {/* Security Architecture & Isolation Card */}
      <div className="ui-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} style={{ color: '#10b981' }} />
          Network Isolation & Safety Enforcements
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: 13, color: '#cbd5e1' }}>
            <strong style={{ color: '#f8fafc' }}>1. Internal Host-Only Network Stack:</strong> The VM network driver uses <code style={{ color: '#38bdf8', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: 4 }}>-netdev user,id=net0,restrict=on</code>. The <code style={{ color: '#38bdf8' }}>restrict=on</code> parameter explicitly prevents guest software from establishing socket connections to any external LAN or internet gateway.
          </div>
          <div style={{ padding: 14, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: 13, color: '#cbd5e1' }}>
            <strong style={{ color: '#f8fafc' }}>2. Bound Local Port Forwarding:</strong> Only the internal HTTP training port is forwarded: <code style={{ color: '#38bdf8', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: 4 }}>hostfwd=tcp:127.0.0.1:8888-:80</code>. It binds solely to the loopback interface <code style={{ color: '#38bdf8' }}>127.0.0.1</code> and is unreachable from adjacent machines on your local Wi-Fi.
          </div>
          <div style={{ padding: 14, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: 13, color: '#cbd5e1' }}>
            <strong style={{ color: '#f8fafc' }}>3. Immutable Base QCOW2 Disk:</strong> All student exploit payloads and file system writes are trapped in a volatile copy-on-write overlay file (<code style={{ color: '#38bdf8' }}>ctf_overlay.qcow2</code>), keeping the underlying base image pristine forever.
          </div>
        </div>
      </div>
    </div>
  );
};
