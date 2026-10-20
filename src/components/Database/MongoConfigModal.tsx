import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Database, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Globe, Shield, ExternalLink, Unlink } from 'lucide-react';
import { api } from '../../services/apiBridge';

interface MongoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (connected: boolean) => void;
}

export const MongoConfigModal: React.FC<MongoConfigModalProps> = ({ isOpen, onClose, onStatusChange }) => {
  const [status, setStatus] = useState<{
    connected: boolean;
    uri?: string;
    maskedUri?: string;
    database: string;
    error?: string | null;
  }>({
    connected: false,
    database: 'ctf_training',
    error: null,
  });

  const [inputUri, setInputUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const s = await api.getMongoStatus();
      setStatus(s);
      if (s.uri && !inputUri) {
        setInputUri(s.uri);
      }
      if (onStatusChange) onStatusChange(s.connected);
    } catch {
      // ignore
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUri.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid MongoDB connection string.' });
      return;
    }

    if (inputUri.includes('<password>')) {
      setTestResult({
        success: false,
        message: 'Please replace "<password>" with your actual MongoDB database user password.',
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const res = await api.connectMongo(inputUri.trim());
      if (res.success) {
        setTestResult({
          success: true,
          message: 'Connected successfully to MongoDB Atlas! Cloud database synchronization is now active.',
        });
        await loadStatus();
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Connection failed. Check your credentials and IP whitelist in Atlas.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection attempt failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.disconnectMongo();
      setTestResult({
        success: true,
        message: 'Disconnected from MongoDB Cloud. Operating in local SQLite mode.',
      });
      setInputUri('');
      await loadStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Disconnect failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MongoDB Atlas Cloud Integration" maxWidth={680}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Status Card */}
        <div
          style={{
            backgroundColor: status.connected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.6)',
            border: `1px solid ${status.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: status.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: status.connected ? '#34d399' : '#94a3b8',
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                  {status.connected ? 'MongoDB Cloud Sync Active' : 'Local SQLite Storage (Offline)'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: status.connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                    color: status.connected ? '#34d399' : '#facc15',
                  }}
                >
                  {status.connected ? 'LIVE ATLAS' : 'OFFLINE MODE'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {status.connected
                  ? `Database: "${status.database}" • URI: ${status.maskedUri || 'mongodb+srv://••••'}`
                  : 'Profiles, challenges, flags, and logs are stored in your local SQLite database.'}
              </div>
            </div>
          </div>

          {status.connected && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Unlink size={13} />
              <span>Disconnect</span>
            </button>
          )}
        </div>

        {/* Form to enter Connection String */}
        <form onSubmit={handleConnect}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
              MongoDB Connection String (URI)
            </label>
            <input
              type="text"
              required
              placeholder="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
              value={inputUri}
              onChange={(e) => setInputUri(e.target.value)}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: 12.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11.5, color: '#64748b' }}>
                Found in Atlas: <b>Database</b> → <b>Connect</b> → <b>Drivers</b> (Node.js)
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {showGuide ? 'Hide Atlas Instructions' : 'How to get this URI from Atlas?'}
              </button>
            </div>
          </div>

          {/* Test / Error Result Notice */}
          {testResult && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: testResult.success ? '#34d399' : '#f87171',
                fontSize: 12.5,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                backgroundColor: '#10b981',
                border: 'none',
                color: '#022c22',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading && <RefreshCw size={14} className="spin" />}
              <span>{loading ? 'Verifying & Connecting...' : status.connected ? 'Update Connection' : 'Connect to MongoDB'}</span>
            </button>
          </div>
        </form>

        {/* Step-by-Step Atlas Helper Guide */}
        {showGuide && (
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 10,
              padding: '18px',
              fontSize: 12.5,
              color: '#cbd5e1',
            }}
          >
            <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={15} />
              <span>Steps for your Atlas Project (CTF: 6ad46043566eef1b688e252e)</span>
            </div>
            <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                In the MongoDB Atlas sidebar, click <b>Database</b> under <i>Deployment</i>.
              </li>
              <li>
                If you haven't created a database cluster yet, click <b>"Create" / "Build a Database"</b> (choose the free <b>M0</b> tier).
              </li>
              <li>
                Click the <b>"Connect"</b> button on your cluster.
              </li>
              <li>
                <b>Setup Database User:</b> Enter a username (e.g. <code>ctf_admin</code>) and password (e.g. <code>MySecret123</code>).
              </li>
              <li>
                <b>Network Access:</b> In the Atlas sidebar under <i>Security → Network Access</i>, click <b>"Add IP Address"</b> and select <b>"Allow Access from Anywhere"</b> (<code>0.0.0.0/0</code>).
              </li>
              <li>
                In the Connect modal, select <b>"Drivers"</b> (Node.js). Copy the connection URI:
                <div
                  style={{
                    backgroundColor: '#090d16',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 11.5,
                    color: '#34d399',
                    marginTop: 6,
                    overflowX: 'auto',
                  }}
                >
                  mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
                </div>
              </li>
              <li>
                Replace <code>&lt;username&gt;</code> and <code>&lt;password&gt;</code> with your credentials, paste it into the box above, and click <b>Connect</b>!
              </li>
            </ol>
          </div>
        )}
      </div>
    </Modal>
  );
};
