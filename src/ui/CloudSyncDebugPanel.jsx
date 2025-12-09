/**
 * Cloud Sync Debug Panel
 * Shows cloud sync status in real-time for debugging
 */

import React, { useState, useEffect } from 'react';
import { getCloudSaveManager } from '../utils/cloud/CloudSaveManager.js';
import { getDailyMissionManager } from '../game/systems/engagement/DailyMissionManager.js';
import { getLoginRewardsManager } from '../game/systems/engagement/LoginRewardsManager.js';
import { getLuckyWheelManager } from '../game/systems/engagement/LuckyWheelManager.js';
import { auth } from '../utils/cloud/firebase-config.js';

export default function CloudSyncDebugPanel({ visible, onClose }) {
    const [debugInfo, setDebugInfo] = useState({});
    const [cloudData, setCloudData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => {
        setLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const refreshDebugInfo = async () => {
        const cloudManager = getCloudSaveManager();
        const missionsManager = getDailyMissionManager();
        const rewardsManager = getLoginRewardsManager();
        const wheelManager = getLuckyWheelManager();

        const info = {
            // Firebase Auth
            firebaseUser: auth?.currentUser?.email || 'Anonymous',
            firebaseUid: auth?.currentUser?.uid || 'No user',

            // Cloud Manager
            cloudManagerUserId: cloudManager?.userId || 'Not set',
            cloudManagerInitialized: cloudManager?.initialized || false,
            cloudManagerEnabled: cloudManager?.firebaseEnabled || false,

            // Managers connected
            missionsHasCloud: !!missionsManager?.cloudSaveManager,
            rewardsHasCloud: !!rewardsManager?.cloudSaveManager,
            wheelHasCloud: !!wheelManager?.cloudSaveManager,

            // Current data
            missionsCount: missionsManager?.missions?.length || 0,
            currentLoginDay: rewardsManager?.currentDay || 0,
            freeSpins: wheelManager?.freeSpinsRemaining || 0
        };

        setDebugInfo(info);
        addLog('Debug info refreshed');
    };

    const loadCloudData = async () => {
        setLoading(true);
        addLog('Loading cloud data...');

        try {
            const cloudManager = getCloudSaveManager();
            if (cloudManager && cloudManager.initialized) {
                const data = await cloudManager.loadProgress();
                setCloudData(data);
                addLog(data ? 'Cloud data loaded successfully' : 'No cloud data found');
            } else {
                addLog('Cloud manager not initialized');
            }
        } catch (e) {
            addLog(`Error: ${e.message}`);
        }

        setLoading(false);
    };

    const forceSyncFromCloud = async () => {
        setLoading(true);
        addLog('Force syncing from cloud...');

        try {
            const missionsManager = getDailyMissionManager();
            const rewardsManager = getLoginRewardsManager();
            const wheelManager = getLuckyWheelManager();

            await missionsManager?.syncFromCloud();
            addLog('Missions synced');

            await rewardsManager?.syncFromCloud();
            addLog('Login rewards synced');

            await wheelManager?.syncFromCloud();
            addLog('Lucky wheel synced');

            await refreshDebugInfo();
            addLog('✅ Force sync complete');
        } catch (e) {
            addLog(`❌ Sync error: ${e.message}`);
        }

        setLoading(false);
    };

    const forceSaveToCloud = async () => {
        setLoading(true);
        addLog('Force saving to cloud...');

        try {
            const cloudManager = getCloudSaveManager();
            if (cloudManager && cloudManager.initialized) {
                // Save current local data
                const localData = localStorage.getItem('cyberrunner_save');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    await cloudManager.saveProgress(parsed);
                    addLog('✅ Local data pushed to cloud');
                }
            }
        } catch (e) {
            addLog(`❌ Save error: ${e.message}`);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (visible) {
            refreshDebugInfo();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 99999,
            padding: '20px',
            overflow: 'auto',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#5b8fc7' }}>☁️ Cloud Sync Debug Panel</h2>
                <button onClick={onClose} style={{ background: '#ff4444', border: 'none', color: '#fff', padding: '8px 16px', cursor: 'pointer' }}>
                    Close
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left: Status */}
                <div>
                    <h3 style={{ color: '#ffd700' }}>🔐 Auth Status</h3>
                    <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                        <p>Firebase User: <b style={{ color: '#00ff00' }}>{debugInfo.firebaseUser}</b></p>
                        <p>Firebase UID: <b style={{ color: '#ffaa00' }}>{debugInfo.firebaseUid}</b></p>
                    </div>

                    <h3 style={{ color: '#ffd700' }}>☁️ Cloud Manager</h3>
                    <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                        <p>User ID: <b style={{ color: debugInfo.cloudManagerUserId ? '#00ff00' : '#ff4444' }}>{debugInfo.cloudManagerUserId}</b></p>
                        <p>Initialized: <b style={{ color: debugInfo.cloudManagerInitialized ? '#00ff00' : '#ff4444' }}>{String(debugInfo.cloudManagerInitialized)}</b></p>
                        <p>Firebase Enabled: <b style={{ color: debugInfo.cloudManagerEnabled ? '#00ff00' : '#ff4444' }}>{String(debugInfo.cloudManagerEnabled)}</b></p>
                    </div>

                    <h3 style={{ color: '#ffd700' }}>🔗 Manager Connections</h3>
                    <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                        <p>Missions → Cloud: <b style={{ color: debugInfo.missionsHasCloud ? '#00ff00' : '#ff4444' }}>{String(debugInfo.missionsHasCloud)}</b></p>
                        <p>Login Rewards → Cloud: <b style={{ color: debugInfo.rewardsHasCloud ? '#00ff00' : '#ff4444' }}>{String(debugInfo.rewardsHasCloud)}</b></p>
                        <p>Lucky Wheel → Cloud: <b style={{ color: debugInfo.wheelHasCloud ? '#00ff00' : '#ff4444' }}>{String(debugInfo.wheelHasCloud)}</b></p>
                    </div>

                    <h3 style={{ color: '#ffd700' }}>📊 Current Local Data</h3>
                    <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '8px' }}>
                        <p>Missions Count: {debugInfo.missionsCount}</p>
                        <p>Current Login Day: {debugInfo.currentLoginDay}</p>
                        <p>Free Spins: {debugInfo.freeSpins}</p>
                    </div>
                </div>

                {/* Right: Cloud Data & Actions */}
                <div>
                    <h3 style={{ color: '#ffd700' }}>🛠️ Actions</h3>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button onClick={refreshDebugInfo} disabled={loading} style={{ padding: '8px 12px', cursor: 'pointer' }}>
                            🔄 Refresh
                        </button>
                        <button onClick={loadCloudData} disabled={loading} style={{ padding: '8px 12px', cursor: 'pointer' }}>
                            📥 Load Cloud Data
                        </button>
                        <button onClick={forceSyncFromCloud} disabled={loading} style={{ padding: '8px 12px', cursor: 'pointer' }}>
                            ⬇️ Force Sync From Cloud
                        </button>
                        <button onClick={forceSaveToCloud} disabled={loading} style={{ padding: '8px 12px', cursor: 'pointer' }}>
                            ⬆️ Force Save To Cloud
                        </button>
                    </div>

                    <h3 style={{ color: '#ffd700' }}>📋 Cloud Data</h3>
                    <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '8px', maxHeight: '200px', overflow: 'auto', marginBottom: '20px' }}>
                        {cloudData ? (
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(cloudData, null, 2)}
                            </pre>
                        ) : (
                            <p style={{ color: '#888' }}>Click "Load Cloud Data" to view</p>
                        )}
                    </div>

                    <h3 style={{ color: '#ffd700' }}>📝 Logs</h3>
                    <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '8px', maxHeight: '200px', overflow: 'auto' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ color: log.includes('❌') ? '#ff4444' : log.includes('✅') ? '#00ff00' : '#ccc' }}>
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && <p style={{ color: '#888' }}>No logs yet</p>}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px', padding: '10px', background: '#332200', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#ffaa00' }}>
                    ⚠️ <b>Important:</b> For cloud sync to work between devices, both devices must be logged in with the <u>same email/password account</u>.
                    Anonymous users get unique IDs per device and won't sync.
                </p>
            </div>
        </div>
    );
}
