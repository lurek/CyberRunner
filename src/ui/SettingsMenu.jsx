import React, { useState, useEffect } from 'react';
import { ArrowLeft, Music, Volume2, Gauge, Battery, Info } from 'lucide-react';
import NeonButton from './NeonButton';
import { getPerformanceManager } from '../utils/performance/PerformanceManager';

export default function SettingsMenu({
  visible,
  musicOn,
  sfxOn,
  isHighQuality,
  toggleMusic,
  toggleSfx,
  musicVolume = 50,
  sfxVolume = 80,
  onMusicVolumeChange,
  onSfxVolumeChange,
  toggleHighQuality,
  performanceTier = 'medium',
  onPerformanceTierChange,
  batterySaverMode = false,
  onBatterySaverToggle,
  onBack
}) {
  const [perfManager, setPerfManager] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const manager = getPerformanceManager();
    setPerfManager(manager);
    setDeviceInfo(manager.getDeviceInfo());
  }, []);

  const getTierDescription = (tier) => {
    const descriptions = {
      high: 'Full effects, shadows, 60 FPS',
      medium: 'Balanced visuals, good performance',
      low: 'Best performance, basic visuals'
    };
    return descriptions[tier] || '';
  };

  const getTierColor = (tier) => {
    const colors = {
      high: '#00ff99',
      medium: '#ffd700',
      low: '#ff9966'
    };
    return colors[tier] || '#5b8fc7';
  };

  const handleButtonClick = (callback) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (callback) callback();
  };

  if (!visible) return null;

  return (
    <div
      className="neon-panel"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: 'min(420px, 90vw)',
        maxWidth: 'min(500px, 95vw)',
        width: '90vw',
        fontFamily: "'Orbitron', sans-serif",
        maxHeight: '85vh',
        overflowY: 'auto',
        zIndex: 1000,
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto',
        padding: 'clamp(16px, 4vw, 20px)',
        boxSizing: 'border-box'
      }}
    >
      <button
        className='icon-btn'
        onClick={handleButtonClick(onBack)}
        style={{
          position: 'absolute',
          left: 'clamp(12px, 3vw, 16px)',
          top: 'clamp(12px, 3vw, 16px)',
          zIndex: 10,
          background: 'rgba(91, 143, 199, 0.1)',
          border: '2px solid rgba(91, 143, 199, 0.4)',
          borderRadius: '50%',
          width: 'clamp(36px, 9vw, 40px)',
          height: 'clamp(36px, 9vw, 40px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          touchAction: 'manipulation',
          transition: 'all 0.2s ease'
        }}
      >
        <ArrowLeft size={20} color="#5b8fc7" />
      </button>

      <div className='neon-title' style={{
        fontSize: 'clamp(22px, 5vw, 28px)',
        marginBottom: 'clamp(16px, 4vw, 20px)',
        textAlign: 'center',
        color: '#5b8fc7',
        fontWeight: 'bold',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        Settings
      </div>

      <div style={{ display: 'grid', gap: 'clamp(12px, 3vw, 16px)', textAlign: 'left' }}>

        {/* Audio Settings */}
        <SectionTitle>Audio</SectionTitle>
        {/* ✅ FIXED: Removed handleButtonClick wrapper as SettingItem handles the event internally */}
        <SettingItem
          icon={<Music size={20} color="#5b8fc7" />}
          name="Music"
          value={musicOn ? "On" : "Off"}
          color={musicOn ? "#00ff99" : "#ff3366"}
          onClick={toggleMusic}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={0}
            max={100}
            value={musicVolume}
            onChange={(e) => onMusicVolumeChange && onMusicVolumeChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <div style={{ minWidth: 48, textAlign: 'right', color: '#aaa' }}>{musicVolume}%</div>
        </div>

        <SettingItem
          icon={<Volume2 size={20} color="#5b8fc7" />}
          name="Sound Effects"
          value={sfxOn ? "On" : "Off"}
          color={sfxOn ? "#00ff99" : "#ff3366"}
          onClick={toggleSfx}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={0}
            max={100}
            value={sfxVolume}
            onChange={(e) => onSfxVolumeChange && onSfxVolumeChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <div style={{ minWidth: 48, textAlign: 'right', color: '#aaa' }}>{sfxVolume}%</div>
        </div>

        {/* Performance Settings */}
        <SectionTitle>Performance</SectionTitle>

        {/* Battery Saver Mode */}
        <SettingItem
          icon={<Battery size={20} color="#00ff99" />}
          name="Battery Saver"
          description="30 FPS cap, minimal effects"
          value={batterySaverMode ? "On" : "Off"}
          color={batterySaverMode ? "#00ff99" : "#666"}
          onClick={onBatterySaverToggle}
        />

        {/* Performance Tier - FULLY RESPONSIVE */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.1)',
          borderRadius: 'clamp(10px, 2.5vw, 12px)',
          padding: 'clamp(12px, 3vw, 14px) clamp(14px, 3.5vw, 16px)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 2.5vw, 12px)',
            marginBottom: 'clamp(10px, 2.5vw, 12px)',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 8,
              padding: 'clamp(6px, 1.5vw, 8px)',
              display: 'inline-flex',
              flexShrink: 0
            }}>
              <Gauge size={20} color="#ffd700" />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.3
              }}>
                Graphics Quality
              </div>
              <div style={{
                fontSize: 'clamp(10px, 3vw, 12px)',
                color: '#aaa',
                marginTop: 4,
                lineHeight: 1.4
              }}>
                {getTierDescription(performanceTier)}
              </div>
            </div>
          </div>

          {/* RESPONSIVE GRID FOR TIER BUTTONS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(6px, 1.5vw, 8px)'
          }}>
            {['low', 'medium', 'high'].map(tier => (
              <button
                key={tier}
                onClick={handleButtonClick(() => onPerformanceTierChange?.(tier))}
                style={{
                  width: '100%',
                  minHeight: 'clamp(40px, 10vw, 44px)',
                  background: performanceTier === tier
                    ? 'rgba(91, 143, 199, 0.2)'
                    : 'rgba(255,255,255,0.05)',
                  color: performanceTier === tier ? getTierColor(tier) : '#888',
                  padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)',
                  fontSize: 'clamp(11px, 3vw, 13px)',
                  border: performanceTier === tier
                    ? `2px solid ${getTierColor(tier)}`
                    : '2px solid rgba(255,255,255,0.1)',
                  textTransform: 'capitalize',
                  fontWeight: performanceTier === tier ? 700 : 400,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  transition: 'all 0.2s ease',
                  borderRadius: '8px',
                  fontFamily: "'Orbitron', sans-serif",
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  boxSizing: 'border-box'
                }}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Device Info (Advanced) */}
        <button
          onClick={handleButtonClick(() => setShowAdvanced(!showAdvanced))}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: 'clamp(10px, 2.5vw, 12px)',
            padding: 'clamp(10px, 2.5vw, 12px) clamp(14px, 3.5vw, 16px)',
            color: '#5b8fc7',
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 8px)',
            cursor: 'pointer',
            width: '100%',
            minHeight: 'clamp(40px, 10vw, 44px)',
            touchAction: 'manipulation',
            transition: 'all 0.2s ease',
            fontFamily: "'Orbitron', sans-serif",
            boxSizing: 'border-box'
          }}
        >
          <Info size={16} />
          <span>{showAdvanced ? 'Hide' : 'Show'} Device Info</span>
        </button>

        {showAdvanced && deviceInfo && (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: 'clamp(10px, 2.5vw, 12px)',
            padding: 'clamp(14px, 3.5vw, 16px)',
            fontSize: 'clamp(10px, 3vw, 12px)',
            color: '#aaa',
            lineHeight: 1.6,
            boxSizing: 'border-box'
          }}>
            <div><strong style={{ color: '#5b8fc7' }}>CPU Cores:</strong> {deviceInfo.cores}</div>
            <div><strong style={{ color: '#5b8fc7' }}>RAM:</strong> {deviceInfo.memory} GB</div>
            <div><strong style={{ color: '#5b8fc7' }}>Device Type:</strong> {
              deviceInfo.isMobile ? (deviceInfo.isTablet ? 'Tablet' : 'Phone') : 'Desktop'
            }</div>
            <div><strong style={{ color: '#5b8fc7' }}>Screen:</strong> {deviceInfo.width}x{deviceInfo.height}</div>
            <div><strong style={{ color: '#5b8fc7' }}>Pixel Ratio:</strong> {deviceInfo.dpr}x</div>
            {deviceInfo.isAndroid && (
              <div><strong style={{ color: '#5b8fc7' }}>Android:</strong> v{deviceInfo.androidVersion}</div>
            )}
            {perfManager && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <strong style={{ color: '#ffd700' }}>Recommended:</strong> {perfManager.getCurrentTier()} quality
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div style={{
        marginTop: 'clamp(16px, 4vw, 20px)',
        padding: 'clamp(10px, 2.5vw, 12px)',
        background: 'rgba(91, 143, 199, 0.05)',
        borderRadius: 8,
        fontSize: 'clamp(9px, 2.5vw, 11px)',
        color: '#888',
        lineHeight: 1.6,
        border: '1px solid rgba(91, 143, 199, 0.1)',
        boxSizing: 'border-box'
      }}>
        <strong style={{ color: '#5b8fc7' }}>💡 Tip:</strong> If the game feels laggy, try lowering the graphics quality
        or enabling Battery Saver mode. Performance is automatically optimized based on your device.
      </div>


    </div>
  );
}

// Section Title Component - RESPONSIVE
function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 'clamp(12px, 3.5vw, 14px)',
      fontWeight: 700,
      color: '#5b8fc7',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 'clamp(6px, 1.5vw, 8px)',
      marginBottom: 'clamp(-6px, -1.5vw, -8px)'
    }}>
      {children}
    </div>
  );
}

// Setting Item Component - FULLY RESPONSIVE
function SettingItem({ icon, name, description, value, color, onClick }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '2px solid rgba(255,255,255,0.1)',
      borderRadius: 'clamp(10px, 2.5vw, 12px)',
      padding: 'clamp(10px, 2.5vw, 12px) clamp(14px, 3.5vw, 16px)',
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(10px, 2.5vw, 12px)',
      flexWrap: 'wrap',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        padding: 'clamp(6px, 1.5vw, 8px)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: '120px' }}>
        <div style={{
          fontSize: 'clamp(14px, 4vw, 16px)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.3,
          wordBreak: 'break-word'
        }}>
          {name}
        </div>
        {description && (
          <div style={{
            fontSize: 'clamp(9px, 2.5vw, 11px)',
            color: '#666',
            marginTop: 2,
            lineHeight: 1.4
          }}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        style={{
          background: 'rgba(255,255,255,0.05)',
          color: color,
          padding: 'clamp(6px, 1.5vw, 8px) clamp(14px, 3.5vw, 16px)',
          fontSize: 'clamp(12px, 3.5vw, 14px)',
          minWidth: 'clamp(70px, 18vw, 80px)',
          minHeight: 'clamp(40px, 10vw, 44px)',
          border: '2px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          touchAction: 'manipulation',
          transition: 'all 0.2s ease',
          borderRadius: '8px',
          flexShrink: 0,
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 600,
          boxSizing: 'border-box'
        }}
      >
        {value}
      </button>
    </div>
  );
}