// ARCHIVED - Use CyberRunnerHomeScreen_ENHANCED_FIXED.jsx instead
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
              scale={isMobile ? 0.45 : 0.6}
              showPlatform={false}
            />
          </Suspense>
          
          <fog attach="fog" args={['#020617', 6, 15]} />
        </Canvas>
      </div>

      {/* UI OVERLAY */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 10, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 'max(env(safe-area-inset-top), 20px) max(env(safe-area-inset-right), 16px) max(env(safe-area-inset-bottom), 20px) max(env(safe-area-inset-left), 16px)', 
        justifyContent: 'space-between', 
        pointerEvents: 'none' 
      }}>
        
        {/* HEADER */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pointerEvents: 'auto', 
          zIndex: 20,
          gap: '12px'
        }}>
          <button 
            onClick={() => window.location.reload()} 
            style={getButtonStyle('icon', pressedButton === 'menu')}
            onMouseDown={() => handlePress('menu')}
            onMouseUp={handleRelease}
            onMouseLeave={handleRelease}
            onTouchStart={() => handlePress('menu')}
            onTouchEnd={handleRelease}
          >
            <LayoutGrid size={20} color="#fff" />
          </button>
          
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            background: 'rgba(0, 0, 0, 0.75)', 
            borderRadius: '24px', 
            padding: '10px 18px', 
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${characterColor}30`,
            backdropFilter: 'blur(16px)',
            flex: '1',
            maxWidth: '200px',
            justifyContent: 'center'
          }}>
            <span style={{ 
              color: '#ffd700', 
              fontWeight: 'bold', 
              fontSize: 'clamp(13px, 3vw, 15px)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🪙 {totalCoins.toLocaleString()}
            </span>
            <span style={{ 
              color: '#c084fc', 
              fontWeight: 'bold', 
              fontSize: 'clamp(13px, 3vw, 15px)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              💎 {totalGems}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={onOpenSettings} 
              style={getButtonStyle('icon', pressedButton === 'settings')}
              onMouseDown={() => handlePress('settings')}
              onMouseUp={handleRelease}
              onTouchStart={() => handlePress('settings')}
              onTouchEnd={handleRelease}
            >
              <Settings size={20} color="white"/>
            </button>
            
            {currentUser && !currentUser.isAnonymous ? (
              <button 
                onClick={onOpenAccountProfile} 
                style={getButtonStyle('iconActive', pressedButton === 'profile')}
                onMouseDown={() => handlePress('profile')}
                onMouseUp={handleRelease}
                onTouchStart={() => handlePress('profile')}
                onTouchEnd={handleRelease}
              >
                <User size={20} color="white"/>
              </button>
            ) : (
              <button 
                onClick={onOpenAuth} 
                style={getButtonStyle('icon', pressedButton === 'auth')}
                onMouseDown={() => handlePress('auth')}
                onMouseUp={handleRelease}
                onTouchStart={() => handlePress('auth')}
                onTouchEnd={handleRelease}
              >
                <User size={20} color="white"/>
              </button>
            )}
          </div>
        </div>

        {/* CENTER - TITLE & BEST SCORE */}
        <div style={{ textAlign: 'center', pointerEvents: 'none', marginTop: '-10vh' }}>
          <h1 style={{ 
            fontFamily: "'Orbitron', sans-serif", 
            fontSize: 'clamp(28px, 9vw, 44px)', 
            fontWeight: '900', 
            background: `linear-gradient(180deg, #ffffff, ${characterColor})`, 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            filter: `drop-shadow(0 0 24px ${characterColor}70)`,
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: '0.06em',
            textShadow: `0 0 40px ${characterColor}40`
          }}>
            CYBER RUNNER
          </h1>
          
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: 'rgba(0, 0, 0, 0.75)', 
            borderRadius: '28px', 
            padding: '10px 20px', 
            marginTop: '12px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${characterColor}30`,
            backdropFilter: 'blur(16px)'
          }}>
            <Trophy size={22} color={characterColor} style={{ filter: `drop-shadow(0 0 8px ${characterColor})` }} />
            <span style={{ 
              fontSize: 'clamp(16px, 3.5vw, 22px)', 
              fontWeight: 'bold', 
              color: '#fff',
              letterSpacing: '0.02em'
            }}>
              {bestScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* BOTTOM BUTTONS */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          pointerEvents: 'auto', 
          maxWidth: '420px', 
          margin: '0 auto', 
          width: '100%' 
        }}>
          
          {/* PRIMARY PLAY BUTTON */}
          <button
            onClick={onStart}
            style={getButtonStyle('primary', pressedButton === 'play')}
            onMouseDown={() => handlePress('play')}
            onMouseUp={handleRelease}
            onTouchStart={() => handlePress('play')}
            onTouchEnd={handleRelease}
          >
            <Play size={26} fill="white" strokeWidth={0} /> START RUNNING
          </button>

          {/* SECONDARY BUTTONS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button 
              onClick={() => onOpenCharacters?.()} 
              style={getButtonStyle('secondary', pressedButton === 'runners')}
              onMouseDown={() => handlePress('runners')}
              onMouseUp={handleRelease}
              onTouchStart={() => handlePress('runners')}
              onTouchEnd={handleRelease}
            >
              <Users size={18} /> RUNNERS
            </button>
            
            <button 
              onClick={onOpenShop} 
              style={getButtonStyle('secondary', pressedButton === 'shop')}
              onMouseDown={() => handlePress('shop')}
              onMouseUp={handleRelease}
              onTouchStart={() => handlePress('shop')}
              onTouchEnd={handleRelease}
            >
              <ShoppingCart size={18} /> SHOP
            </button>
          </div>

          {/* GOLD BUTTON */}
          <button
            onClick={onOpenEngagement}
            style={getButtonStyle('gold', pressedButton === 'rewards')}
            onMouseDown={() => handlePress('rewards')}
            onMouseUp={handleRelease}
            onTouchStart={() => handlePress('rewards')}
            onTouchEnd={handleRelease}
          >
            <Sparkles size={20} /> DAILY REWARDS
          </button>
        </div>
      </div>
    </div>
  );
}
