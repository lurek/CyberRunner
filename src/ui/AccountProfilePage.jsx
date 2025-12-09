import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, Mail, Lock, LogOut, Eye, EyeOff, 
  Save, X, Check, AlertCircle, Loader
} from 'lucide-react';

export default function AccountProfilePage({
  visible,
  onBack,
  userProfile,
  onUpdateUsername,
  onChangePassword,
  onLogOut,
  authManager
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userProfile?.displayName || '');
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showLogOutConfirm, setShowLogOutConfirm] = useState(false);

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  const handleSaveUsername = async () => {
    clearMessages();
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }
    if (newUsername.trim() === userProfile?.displayName) {
      setMessage('No changes made');
      setEditingUsername(false);
      return;
    }
    setLoading(true);
    try {
      await onUpdateUsername?.(newUsername.trim());
      setMessage('✅ Username updated successfully');
      setEditingUsername(false);
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    clearMessages();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }
    setLoading(true);
    try {
      await onChangePassword?.(currentPassword, newPassword);
      setMessage('✅ Password changed successfully');
      setChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = async () => {
    clearMessages();
    setLoading(true);
    try {
      await onLogOut?.();
      setMessage('✅ Logged out successfully');
      setShowLogOutConfirm(false);
      setTimeout(onBack, 500);
    } catch (err) {
      setError(err.message || 'Failed to log out');
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onBack}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(40, 20, 60, 0.95))',
          border: '2px solid rgba(91, 143, 199, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(91, 143, 199, 0.2)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Orbitron', sans-serif",
          color: '#fff',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '2px solid rgba(91, 143, 199, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#5b8fc7',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
            ACCOUNT SETTINGS
          </h2>
          <div style={{ width: '40px' }} />
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            padding: '0',
            background: 'rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(91, 143, 199, 0.2)'
          }}
        >
          {[
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'security', label: 'Security', icon: '🔒' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                clearMessages();
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === tab.id ? 'rgba(91, 143, 199, 0.2)' : 'transparent',
                border: activeTab === tab.id ? '2px solid #5b8fc7' : '1px solid rgba(91, 143, 199, 0.1)',
                borderBottom: 'none',
                color: activeTab === tab.id ? '#5b8fc7' : '#888',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Orbitron', sans-serif"
              }}
            >
              <span style={{ marginRight: '6px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(0, 255, 100, 0.15)',
              border: '1px solid rgba(0, 255, 100, 0.3)',
              color: '#00ff88',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <Check size={16} />
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 50, 50, 0.15)',
              border: '1px solid rgba(255, 50, 50, 0.3)',
              color: '#ff7777',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* User Avatar */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '20px',
                  borderBottom: '1px solid rgba(91, 143, 199, 0.2)'
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(91, 143, 199, 0.4), rgba(91, 143, 199, 0.1))',
                    border: '3px solid #5b8fc7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px'
                  }}
                >
                  <User size={44} color="#5b8fc7" />
                </div>
              </div>

              {/* Username Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}>USERNAME</label>
                {editingUsername ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      maxLength={20}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '2px solid #5b8fc7',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        fontFamily: "'Orbitron', sans-serif"
                      }}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={loading}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(91, 143, 199, 0.3)',
                        border: '2px solid #5b8fc7',
                        borderRadius: '8px',
                        color: '#5b8fc7',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsername(false);
                        setNewUsername(userProfile?.displayName || '');
                        clearMessages();
                      }}
                      disabled={loading}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(255, 50, 50, 0.2)',
                        border: '2px solid rgba(255, 50, 50, 0.5)',
                        borderRadius: '8px',
                        color: '#ff7777',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(91, 143, 199, 0.2)',
                        borderRadius: '8px',
                        fontSize: '15px'
                      }}
                    >
                      {userProfile?.displayName || 'Guest Player'}
                    </div>
                    <button
                      onClick={() => setEditingUsername(true)}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(91, 143, 199, 0.2)',
                        border: '2px solid rgba(91, 143, 199, 0.4)',
                        borderRadius: '8px',
                        color: '#5b8fc7',
                        cursor: 'pointer',
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 'bold'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}>EMAIL</label>
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(91, 143, 199, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px'
                  }}
                >
                  <Mail size={16} color="#5b8fc7" />
                  {userProfile?.email || 'No email linked'}
                </div>
              </div>

              {/* Account Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}>ACCOUNT TYPE</label>
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(91, 143, 199, 0.2)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {userProfile?.isAnonymous ? '🎭 Guest Account' : '✅ Verified Account'}
                </div>
              </div>

              {/* Member Since */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#aaa', fontWeight: 'bold' }}>MEMBER SINCE</label>
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(91, 143, 199, 0.2)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {userProfile?.metadata?.creationTime 
                    ? new Date(userProfile.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!changePassword ? (
                <button
                  onClick={() => setChangePassword(true)}
                  style={{
                    padding: '14px',
                    background: 'rgba(91, 143, 199, 0.2)',
                    border: '2px solid #5b8fc7',
                    borderRadius: '8px',
                    color: '#5b8fc7',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: "'Orbitron', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Lock size={18} /> Change Password
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Current Password */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', display: 'block' }}>
                      CURRENT PASSWORD
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid rgba(91, 143, 199, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                        style={{ background: 'none', border: 'none', color: '#5b8fc7', cursor: 'pointer', padding: '4px' }}
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', display: 'block' }}>
                      NEW PASSWORD
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        minLength={6}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid rgba(91, 143, 199, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                        style={{ background: 'none', border: 'none', color: '#5b8fc7', cursor: 'pointer', padding: '4px' }}
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', display: 'block' }}>
                      CONFIRM PASSWORD
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid rgba(91, 143, 199, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                        style={{ background: 'none', border: 'none', color: '#5b8fc7', cursor: 'pointer', padding: '4px' }}
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={handleChangePassword}
                      disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(0, 255, 100, 0.2)',
                        border: '2px solid rgba(0, 255, 100, 0.5)',
                        borderRadius: '6px',
                        color: '#00ff88',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: "'Orbitron', sans-serif",
                        opacity: loading ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setChangePassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        clearMessages();
                      }}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(255, 50, 50, 0.2)',
                        border: '2px solid rgba(255, 50, 50, 0.5)',
                        borderRadius: '6px',
                        color: '#ff7777',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: "'Orbitron', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Log Out Button */}
        <div
          style={{
            padding: '16px',
            borderTop: '2px solid rgba(91, 143, 199, 0.2)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          {!showLogOutConfirm ? (
            <button
              onClick={() => setShowLogOutConfirm(true)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 50, 50, 0.2)',
                border: '2px solid rgba(255, 50, 50, 0.4)',
                borderRadius: '8px',
                color: '#ff7777',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Orbitron', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={18} /> Log Out
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '14px', color: '#fff', textAlign: 'center', marginBottom: '8px' }}>
                Are you sure you want to log out?
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleLogOut}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255, 50, 50, 0.3)',
                    border: '2px solid #ff5555',
                    borderRadius: '6px',
                    color: '#ff7777',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: "'Orbitron', sans-serif"
                  }}
                >
                  Yes, Log Out
                </button>
                <button
                  onClick={() => setShowLogOutConfirm(false)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(91, 143, 199, 0.2)',
                    border: '2px solid #5b8fc7',
                    borderRadius: '6px',
                    color: '#5b8fc7',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: "'Orbitron', sans-serif"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}