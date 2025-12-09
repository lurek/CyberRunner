import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import { Play, ShoppingCart, User, Settings, Sparkles, Trophy, LayoutGrid, Users } from 'lucide-react';
import { CHARACTERS } from '../utils/constants';
import { GLBCharacterPreview } from '../game/models/GLBCharacterPreview';

export default function CyberRunnerHomeScreen({
  onStart, onOpenSettings, onOpenShop, onOpenCharacters,
  onOpenEngagement, onOpenAuth, onOpenAccountProfile, 
  currentUser, bestScore = 0, totalCoins = 0, totalGems = 0, selectedCharacter = 'default'
}) {
  const characterColor = CHARACTERS[selectedCharacter]?.color || '#5b8fc7';
  const [pulse, setPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pressedButton, setPressedButton] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getButtonStyle = (type = 'default', isPressed = false) => {
    const baseStyle = {
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderRadius: '16px', 
      color: '#fff', 
      cursor: 'pointer',
      backdropFilter: 'blur(16px)', 
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: "'Orbitron', sans-serif", 
      textTransform: 'uppercase',
      position: 'relative', 
      overflow: 'hidden',
      minHeight: '48px',
      touchAction: 'manipulation',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      border: 'none'
    };

    const styles = {
      primary: {
        ...baseStyle,
        background: 'linear-gradient(135deg, #ff0080 0%, #7928ca 50%, #ff0080 100%)',
        backgroundSize: '200% 100%',
        boxShadow: isPressed 
          ? `0 4px 20px ${characterColor}60, inset 0 2px 10px rgba(0,0,0,0.3)` 
          : `0 8px 32px ${characterColor}80, 0 4px 16px rgba(255, 0, 128, 0.4)`,
        transform: isPressed ? 'translateY(2px) scale(0.98)' : pulse ? 'scale(1.02)' : 'scale(1)',
        fontWeight: '900',
        fontSize: 'clamp(18px, 2.6vw, 22px)',
        padding: 'clamp(12px, 1.5vw, 20px) clamp(20px, 2.5vw, 32px)',
        maxWidth: '720px',
        letterSpacing: '0.08em',
        minHeight: '64px'
      },
      secondary: {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(91, 143, 199, 0.15) 0%, rgba(155, 127, 199, 0.2) 100%)',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        boxShadow: isPressed 
          ? 'inset 0 2px 8px rgba(0,0,0,0.3)' 
          : '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        transform: isPressed ? 'translateY(2px) scale(0.96)' : 'scale(1)',
        fontWeight: '700',
        fontSize: 'clamp(13px, 1.8vw, 15px)',
        padding: 'clamp(10px, 1.2vw, 16px) clamp(12px, 1.5vw, 20px)',
        maxWidth: '420px',
        letterSpacing: '0.05em'
      },
      gold: {
        ...baseStyle,
        background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ff8c00 100%)',
        backgroundSize: '200% 100%',
        boxShadow: isPressed 
          ? 'inset 0 2px 10px rgba(0,0,0,0.3)' 
          : '0 6px 28px rgba(255, 215, 0, 0.5), 0 3px 12px rgba(255, 140, 0, 0.3)',
        color: '#1a1a2e',
        transform: isPressed ? 'translateY(2px) scale(0.98)' : 'scale(1)',
        fontWeight: 'bold',
        fontSize: 'clamp(15px, 2.2vw, 17px)',
        padding: 'clamp(12px, 1.4vw, 18px) clamp(16px, 1.8vw, 28px)',
        maxWidth: '560px',
        letterSpacing: '0.06em',
        minHeight: '56px'
      },
      icon: {
        ...baseStyle,
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        padding: '12px',
        minWidth: '48px',
        minHeight: '48px',
        boxShadow: isPressed 
          ? 'inset 0 2px 6px rgba(0,0,0,0.3)' 
          : '0 4px 15px rgba(0, 0, 0, 0.2)',
        transform: isPressed ? 'translateY(2px) scale(0.92)' : 'scale(1)'
      },
      iconActive: {
        ...baseStyle,
        background: `linear-gradient(135deg, ${characterColor}40 0%, ${characterColor}20 100%)`,
        border: `2px solid ${characterColor}`,
        borderRadius: '14px',
        padding: '12px',
        minWidth: '48px',
        minHeight: '48px',
        boxShadow: isPressed 
          ? `inset 0 2px 8px rgba(0,0,0,0.3)` 
          : `0 6px 24px ${characterColor}40, 0 0 0 1px ${characterColor}30`,
        transform: isPressed ? 'translateY(2px) scale(0.92)' : 'scale(1)'
      }
    };

    return styles[type] || styles.secondary;
  };

  const handlePress = (id) => setPressedButton(id);
  const handleRelease = () => setPressedButton(null);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      background: 'radial-gradient(circle at 50% 40%, #581c87 0%, #1e1b4b 60%, #020617 100%)', 
      overflow: 'hidden', 
      color: 'white', 
      fontFamily: "'Inter', sans-serif" 
    }}>
      
      {/* 3D CHARACTER - NO PLATFORM */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.8, 4.5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 10]} intensity={1.5} color="#ffffff" castShadow />
          <pointLight position={[-5, 2, 5]} intensity={1.2} color={characterColor} />
          <pointLight position={[5, 2, 5]} intensity={1.0} color="#9b7fc7" />
          <spotLight position={[0, 5, 0]} intensity={1} angle={0.6} penumbra={1} color="#ffffff" />
          <Environment preset="city" />
          
          <Suspense fallback={null}>
            <GLBCharacterPreview 
              characterId={selectedCharacter}
              rotating={false}
              floatEnabled={true}
The above content continues...