import React, { useRef, Suspense, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Play, ShoppingCart, User, Settings, Sparkles, Trophy, Users, Download, Smartphone } from 'lucide-react';
import { CHARACTERS } from '../utils/constants';
import { GLBCharacterPreview } from '../game/models/GLBCharacterPreview';
import { getPerformanceManager } from '../utils/performance/PerformanceManager';

console.log('🏠 Using CyberRunnerHomeScreen_ENHANCED_FIXED - REDESIGNED V3 (Title at Bottom)');

export default function CyberRunnerHomeScreen({
  onStart, onOpenSettings, onOpenShop, onOpenCharacters,
  onOpenEngagement, onOpenAuth, onOpenAccountProfile,
  currentUser, bestScore = 0, totalCoins = 0, totalGems = 0, selectedCharacter = 'default'
}) {
  const characterColor = CHARACTERS[selectedCharacter]?.color || '#5b8fc7';
  const [pulse, setPulse] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const timer = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive breakpoints
  const isMobile = windowSize.width < 480;
  const isTablet = windowSize.width >= 480 && windowSize.width < 768;
  const isDesktop = windowSize.width >= 768;
  const isWideScreen = windowSize.width >= 1024;

  // ✅ Performance-aware UI settings
  const uiSettings = useMemo(() => {
    const perfManager = getPerformanceManager();
    const settings = perfManager.getUISettings();
    console.log('📱 UI Settings Tier:', perfManager.getCurrentTier(), settings);
    return settings;
  }, []);

  // Dynamic sizing based on screen
  const getResponsiveValue = (mobile, tablet, desktop) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      background: 'radial-gradient(ellipse at 50% 30%, #581c87 0%, #1e1b4b 50%, #020617 100%)',
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>

      {/* ============================================
          HEADER - Currency & Settings (Absolute positioned)
          ============================================ */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: getResponsiveValue('12px 16px', '16px 24px', '20px 32px'),
        zIndex: 100
      }}>
        {/* Currency Display */}
        <div style={{
          display: 'flex',
          gap: getResponsiveValue('6px', '10px', '12px'),
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
          padding: getResponsiveValue('6px 12px', '8px 16px', '10px 20px'),
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: uiSettings.backdropBlur ? `blur(${uiSettings.blurAmount})` : 'none'
        }}>
          <span style={{
            color: '#ffd700',
            fontWeight: 'bold',
            fontSize: getResponsiveValue('11px', '13px', '15px'),
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            🪙 {totalCoins.toLocaleString()}
          </span>
          <span style={{
            color: '#c084fc',
            fontWeight: 'bold',
            fontSize: getResponsiveValue('11px', '13px', '15px'),
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            💎 {totalGems}
          </span>
        </div>

        {/* Settings & Profile Buttons */}
        <div style={{ display: 'flex', gap: getResponsiveValue('6px', '8px', '10px') }}>
          <button
            onClick={onOpenSettings}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: getResponsiveValue('8px', '10px', '12px'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: uiSettings.backdropBlur ? `blur(${uiSettings.blurAmount})` : 'none',
              transition: `all ${uiSettings.animationDuration}s ease`
            }}
          >
            <Settings size={getResponsiveValue(16, 18, 20)} color="white" />
          </button>

          <button
            onClick={currentUser && !currentUser.isAnonymous ? onOpenAccountProfile : onOpenAuth}
            style={{
              background: currentUser && !currentUser.isAnonymous
                ? `linear-gradient(135deg, ${characterColor}30, ${characterColor}15)`
                : 'rgba(255, 255, 255, 0.08)',
              border: currentUser && !currentUser.isAnonymous
                ? `1px solid ${characterColor}80`
                : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: getResponsiveValue('8px', '10px', '12px'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={getResponsiveValue(16, 18, 20)} color="white" />
          </button>
        </div>
      </div>

      {/* ============================================
          MAIN CONTENT - Character + Title + Buttons
          ============================================ */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: getResponsiveValue('50px 16px 16px', '60px 24px 24px', '70px 32px 32px')
      }}>

        {/* 3D CHARACTER - Takes most of the space at top */}
        <div style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          marginTop: getResponsiveValue('5px', '10px', '10px')
        }}>
          <Canvas
            shadows={!uiSettings.disableShadows}
            dpr={uiSettings.menuDpr}
            gl={{
              antialias: !uiSettings.reduceMotion,
              powerPreference: 'high-performance'
            }}
            camera={{
              // Camera positioned to see character with feet near bottom of canvas
              position: [0, getResponsiveValue(0.8, 1.0, 1.2), getResponsiveValue(4.5, 5.5, 6.0)],
              fov: getResponsiveValue(42, 38, 36)
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[4, 6, 8]} intensity={1.3} color="#ffffff" castShadow={!uiSettings.disableShadows} />
            <pointLight position={[-3, 2, 4]} intensity={1.5} color={characterColor} />
            <pointLight position={[3, 2, 4]} intensity={1.0} color="#9b7fc7" />
            <spotLight position={[0, 5, 2]} intensity={0.8} angle={0.6} penumbra={1} color="#ffffff" />
            {uiSettings.useEnvironmentPreset && <Environment preset="city" />}

            <Suspense fallback={null}>
              <GLBCharacterPreview
                characterId={selectedCharacter}
                rotating={false}
                floatEnabled={false}
                scale={getResponsiveValue(1.0, 1.0, 1.0)}
                position={[0, getResponsiveValue(-1.8, -1.6, -1.4), 0]}
                showPlatform={false}
                playIdleAnimation={true}
              />
            </Suspense>

            <fog attach="fog" args={['#020617', 6, 18]} />
          </Canvas>
        </div>

        {/* TITLE + SCORE - Now between character and buttons */}
        <div style={{
          textAlign: 'center',
          zIndex: 50,
          marginBottom: getResponsiveValue('10px', '15px', '20px'),
          flexShrink: 0,
          // ✅ FIX: Create separate compositor layer to prevent WebGL interference
          isolation: 'isolate',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}>
          <h1 style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: getResponsiveValue('24px', '32px', '42px'),
            fontWeight: '900',
            background: `linear-gradient(180deg, #ffffff 20%, ${characterColor} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 0 20px ${characterColor}50)`,
            lineHeight: 1.0,
            margin: 0,
            letterSpacing: '0.03em',
            // ✅ FIX: Ensure text renders on its own layer
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}>
            CYBER RUNNER
          </h1>

          {/* Best Score Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '20px',
            padding: getResponsiveValue('4px 10px', '5px 14px', '6px 18px'),
            marginTop: getResponsiveValue('6px', '8px', '10px'),
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <Trophy size={getResponsiveValue(12, 14, 18)} color={characterColor} />
            <span style={{
              fontSize: getResponsiveValue('12px', '14px', '18px'),
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {bestScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* BUTTONS - At bottom */}
        <div style={{
          width: '100%',
          maxWidth: getResponsiveValue('340px', '400px', '460px'),
          display: 'flex',
          flexDirection: 'column',
          gap: getResponsiveValue('8px', '10px', '12px'),
          flexShrink: 0
        }}>

          {/* PRIMARY - Start Button */}
          <button
            onClick={onStart}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: getResponsiveValue('14px 20px', '16px 24px', '18px 28px'),
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #ff0080 0%, #7928ca 50%, #ff0080 100%)',
              backgroundSize: '200% 100%',
              color: 'white',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: getResponsiveValue('14px', '16px', '18px'),
              fontWeight: '800',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: `0 6px 25px rgba(255, 0, 128, 0.4)`,
              transition: 'all 0.3s ease',
              transform: pulse ? 'scale(1.02)' : 'scale(1)',
              textTransform: 'uppercase'
            }}
          >
            <Play size={getResponsiveValue(18, 20, 22)} fill="white" strokeWidth={0} />
            START RUNNING
          </button>

          {/* ✅ APK DOWNLOAD - Only visible on Netlify deployment */}
          {import.meta.env.VITE_NETLIFY_DEPLOY === 'true' && (
            <a
              href="/Cyber_Runner.apk"
              download="Cyber_Runner.apk"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: getResponsiveValue('10px 16px', '12px 20px', '14px 24px'),
                borderRadius: '12px',
                border: '1px solid rgba(0, 255, 136, 0.4)',
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 200, 100, 0.1))',
                color: '#00ff88',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: getResponsiveValue('11px', '12px', '14px'),
                fontWeight: '700',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(0, 255, 136, 0.2)',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
            >
              <Smartphone size={getResponsiveValue(14, 16, 18)} />
              <Download size={getResponsiveValue(14, 16, 18)} />
              DOWNLOAD APK
            </a>
          )}

          {/* SECONDARY - Runners & Shop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: getResponsiveValue('8px', '10px', '12px')
          }}>
            <button
              onClick={() => onOpenCharacters?.()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: getResponsiveValue('11px 14px', '13px 18px', '15px 22px'),
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'linear-gradient(135deg, rgba(91, 143, 199, 0.15), rgba(155, 127, 199, 0.1))',
                color: 'white',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: getResponsiveValue('11px', '12px', '13px'),
                fontWeight: '700',
                letterSpacing: '0.03em',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
            >
              <Users size={getResponsiveValue(14, 15, 16)} />
              RUNNERS
            </button>

            <button
              onClick={onOpenShop}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: getResponsiveValue('11px 14px', '13px 18px', '15px 22px'),
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'linear-gradient(135deg, rgba(91, 143, 199, 0.15), rgba(155, 127, 199, 0.1))',
                color: 'white',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: getResponsiveValue('11px', '12px', '13px'),
                fontWeight: '700',
                letterSpacing: '0.03em',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
            >
              <ShoppingCart size={getResponsiveValue(14, 15, 16)} />
              SHOP
            </button>
          </div>

          {/* TERTIARY - Daily Rewards */}
          <button
            onClick={onOpenEngagement}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: getResponsiveValue('11px 18px', '13px 22px', '15px 26px'),
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ff8c00 100%)',
              color: '#1a1a2e',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: getResponsiveValue('11px', '12px', '14px'),
              fontWeight: '700',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(255, 215, 0, 0.3)',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase'
            }}
          >
            <Sparkles size={getResponsiveValue(14, 15, 16)} />
            DAILY REWARDS
          </button>
        </div>
      </div>
    </div>
  );
}
