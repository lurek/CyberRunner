import React from 'react';

export function CloudConflictDialog({ localData, cloudData, onResolve }) {
  const handleUseLocal = () => onResolve('local');
  const handleUseCloud = () => onResolve('cloud');

  return (
    <div className="modal-overlay">
      <div className="neon-panel" style={{ maxWidth: '400px', padding: '2rem' }}>
        <h2>☁️ Cloud Conflict Detected</h2>

        <div style={{ marginBottom: '1rem' }}>
          <strong>Local Save:</strong>
          <div>Coins: {localData.totalCoins}</div>
          <div>Score: {localData.bestScore}</div>
          <div>Last played: {new Date(localData.lastPlayed).toLocaleString()}</div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <strong>Cloud Save:</strong>
          <div>Coins: {cloudData.totalCoins}</div>
          <div>Score: {cloudData.bestScore}</div>
          <div>Last saved: {new Date(cloudData.lastSaved).toLocaleString()}</div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleUseLocal} className="neon-button">
            Use Local
          </button>
          <button onClick={handleUseCloud} className="neon-button-secondary">
            Use Cloud
          </button>
        </div>
      </div>
    </div>
  );
}
