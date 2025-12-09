import React, { useState, useEffect } from 'react';

/**
 * 🔧 LOGIN CALENDAR DEBUG PANEL
 * Temporary admin panel to test and verify login calendar fixes
 * Add this to your main menu or settings for testing
 */
export default function LoginCalendarDebugPanel({ loginRewardsManager }) {
  const [debugInfo, setDebugInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }].slice(-10)); // Keep last 10
  };

  const refreshDebugInfo = () => {
    if (!loginRewardsManager) {
      addLog('❌ Manager not available', 'error');
      return;
    }
    const info = loginRewardsManager.getDebugInfo();
    setDebugInfo(info);
    addLog('✅ State refreshed', 'success');
  };

  useEffect(() => {
    if (loginRewardsManager && isOpen) {
      refreshDebugInfo();
    }
  }, [loginRewardsManager, isOpen]);

  const handleForceSync = async () => {
    if (!loginRewardsManager) return;
    addLog('🔄 Forcing cloud sync...', 'info');
    try {
      const result = await loginRewardsManager.forceSyncNow();
      setDebugInfo(result);
      addLog('✅ Sync complete!', 'success');
    } catch (e) {
      addLog(`❌ Sync failed: ${e.message}`, 'error');
    }
  };

  const handleReset = async () => {
    if (!loginRewardsManager) return;
    if (!confirm('⚠️ Reset login calendar? This will delete all progress!')) return;
    
    addLog('🔄 Resetting calendar...', 'info');
    try {
      await loginRewardsManager.reset();
      refreshDebugInfo();
      addLog('✅ Reset complete!', 'success');
    } catch (e) {
      addLog(`❌ Reset failed: ${e.message}`, 'error');
    }
  };

  const handleSimulateNextDay = async () => {
    if (!loginRewardsManager) return;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    loginRewardsManager.lastLoginDate = dateStr;
    loginRewardsManager.rewardsClaimed.clear();
    await loginRewardsManager.saveProgress();
    loginRewardsManager.checkLoginStreak();
    
    refreshDebugInfo();
    addLog(`✅ Simulated next day (from ${dateStr})`, 'success');
  };

  const handleSimulateStreakBreak = async () => {
    if (!loginRewardsManager) return;
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateStr = `${threeDaysAgo.getFullYear()}-${String(threeDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(threeDaysAgo.getDate()).padStart(2, '0')}`;
    
    loginRewardsManager.lastLoginDate = dateStr;
    loginRewardsManager.currentDay = 5;
    await loginRewardsManager.saveProgress();
    loginRewardsManager.checkLoginStreak();
    
    refreshDebugInfo();
    addLog(`⚠️ Simulated streak break (from day 5, 3 days ago)`, 'warning');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: '#0f0',
          border: '1px solid #0f0',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}
      >
        🔧 Debug Calendar
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #0f0',
      borderRadius: '8px',
      padding: '16px',
      color: '#0f0',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#0f0' }}>🔧 Login Calendar Debug</h3>
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f00',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ×
        </button>
      </div>

      {/* Current State */}
      <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0, 255, 0, 0.1)', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#0ff' }}>📊 Current State</h4>
        {debugInfo ? (
          <div style={{ lineHeight: '1.6' }}>
            <div>📅 Current Day: <strong>{debugInfo.currentDay}</strong>/7</div>
            <div>🔥 Streak: <strong>{debugInfo.streak}</strong> days</div>
            <div>📆 Last Login: <strong>{debugInfo.lastLoginDate || 'Never'}</strong></div>
            <div>🗓️ Today: <strong>{debugInfo.todayDate}</strong></div>
            <div>✅ Claimed: <strong>{debugInfo.rewardsClaimed.join(', ') || 'None'}</strong></div>
            <div>🎁 Can Claim: <strong>{debugInfo.canClaimToday ? '✅ Yes' : '❌ No'}</strong></div>
            <div>☁️ Cloud: <strong>{debugInfo.cloudInitialized ? '✅ Connected' : '❌ Offline'}</strong></div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#0ff' }}>⚡ Actions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={refreshDebugInfo} style={buttonStyle}>
            🔄 Refresh State
          </button>
          <button onClick={handleForceSync} style={buttonStyle}>
            ☁️ Force Cloud Sync
          </button>
          <button onClick={handleSimulateNextDay} style={{ ...buttonStyle, background: 'rgba(255, 165, 0, 0.2)' }}>
            ⏭️ Simulate Next Day
          </button>
          <button onClick={handleSimulateStreakBreak} style={{ ...buttonStyle, background: 'rgba(255, 165, 0, 0.2)' }}>
            💔 Simulate Streak Break
          </button>
          <button onClick={handleReset} style={{ ...buttonStyle, background: 'rgba(255, 0, 0, 0.2)' }}>
            🗑️ Reset Calendar
          </button>
        </div>
      </div>

      {/* Logs */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: '#0ff' }}>📋 Recent Logs</h4>
        <div style={{ 
          maxHeight: '150px', 
          overflow: 'auto',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '8px',
          borderRadius: '4px'
        }}>
          {logs.length === 0 ? (
            <div style={{ opacity: 0.5 }}>No logs yet...</div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={i} 
                style={{ 
                  marginBottom: '4px',
                  color: log.type === 'error' ? '#f00' : log.type === 'success' ? '#0f0' : log.type === 'warning' ? '#fa0' : '#fff'
                }}
              >
                <span style={{ opacity: 0.5 }}>[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ 
        marginTop: '12px', 
        padding: '8px', 
        background: 'rgba(0, 100, 255, 0.1)', 
        borderRadius: '4px',
        fontSize: '10px',
        opacity: 0.7
      }}>
        💡 This panel is for testing only. Remove before production!
      </div>
    </div>
  );
}

const buttonStyle = {
  background: 'rgba(0, 255, 0, 0.1)',
  border: '1px solid #0f0',
  color: '#0f0',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  width: '100%',
  textAlign: 'left',
  transition: 'all 0.2s'
};
