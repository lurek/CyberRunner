// ARCHIVED - Use CharacterPreviewPage_COMPLETE_FIX.jsx instead
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { GLBCharacterPreview } from '../game/models/GLBCharacterPreview';
import { CHARACTERS } from '../utils/constants';
import * as THREE from 'three';
import './CharacterPreviewPage.css';

// ============================================
// ANIMATED CIRCULAR PLATFORM
// ============================================
function CircularPlatform() {
  const meshRef = React.useRef();
  const glowRef = React.useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      glowRef.current.material.opacity = pulse;
    }
  });

  return (
    <group position={[0, -1.5, 0]}>
      {/* Main platform */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2, 2, 0.1, 64]} />
        <meshStandardMaterial 
          color="#ff9933"
          emissive="#ff6600"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Grid lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.5, 2, 32, 1]} />
        <meshBasicMaterial 
          color="#ffaa33"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[1.8, 2.1, 32]} />
        <meshBasicMaterial 
          color="#ff9933"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Holographic effect */}
      <pointLight position={[0, 0.5, 0]} intensity={1.5} color="#ff9933" distance={5} />
    </group>
  );
}

// ============================================
// STAT BAR COMPONENT (Enhanced)
// ============================================
function StatBar({ label, value, icon, maxValue = 100 }) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: '#fff'
      }}>
        <span>{icon} {label}</span>
        <span style={{ color: '#ff9933' }}>{value}%</span>
      </div>
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        border: '2px solid rgba(255, 153, 51, 0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '10px',
        position: 'relative'
      }}>
        <div style={{
          background: `linear-gradient(90deg, #ff6600, #ff9933)`,
          width: `${percentage}%`,
          height: '100%',
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(255, 153, 51, 0.8)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '20px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
            animation: 'shimmer 2s infinite'
          }} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN CHARACTER PREVIEW PAGE
// ============================================
export default function CharacterPreviewPage({
  selectedCharacter = 'default',
  onEquip,
  onBack,
  totalCoins = 0,
  ownedCharacters = ['default'],
  onCharacterPurchase
}) {
  const [currentCharacter, setCurrentCharacter] = useState(selectedCharacter);
  const [rotating, setRotating] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const char = CHARACTERS[currentCharacter] || CHARACTERS.default;
  const isOwned = ownedCharacters.includes(currentCharacter);
  const canAfford = totalCoins >= char.cost;

  // ✅ FIXED: Character stats mapping (removed anime_girl)
  const characterStats = {
    default: { 
      speed: 75, boostDuration: 75, handling: 80, weight: 70,
      ability: 'BALANCED RUNNER',
      abilityIcon: '⚡⚡',
      description: 'Versatile runner perfect for beginners. Balanced stats for consistent performance.'
    },
    cyberpunk_yiqi: { 
      speed: 85, boostDuration: 80, handling: 88, weight: 72,
      ability: 'CYBER REFLEX',
      abilityIcon: '🤖',
      description: 'Enhanced neural processing for perfect timing. Maximum control.'
    },
    space_police: { 
      speed: 78, boostDuration: 85, handling: 82, weight: 75,
      ability: 'LAW ENFORCER',
      abilityIcon: '🚨',
      description: 'Tactical boost management and obstacle prediction. Reliable authority.'
    },
    space_soldier: { 
      speed: 80, boostDuration: 82, handling: 84, weight: 80,
      ability: 'COMBAT READY',
      abilityIcon: '🛡️',
      description: 'Battle-tested durability with defensive capabilities. Tank build.'
    },
    war_hero: { 
      speed: 88, boostDuration: 85, handling: 86, weight: 78,
      ability: 'LEGENDARY',
      abilityIcon: '⚔️',
      description: 'Peak performance across all metrics. Ultimate warrior status.'
    }
  };

  const stats = characterStats[currentCharacter] || characterStats.default;

  const handlePurchase = () => {
    if (canAfford && !isOwned) {
      if (window.confirm(`Purchase ${char.name} for ${char.cost.toLocaleString()} coins?`)) {
        onCharacterPurchase?.(char);
      }
    }
  };

  const handleEquip = () => {
    if (isOwned) {
      onEquip?.(currentCharacter);
      if (onBack) onBack();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'linear-gradient(180deg, rgba(10, 14, 39, 0.98) 0%, rgba(20, 25, 60, 0.98) 50%, rgba(10, 14, 39, 0.98) 100%)',
      overflow: 'auto',
      padding: isMobile ? '16px' : '20px',
      paddingTop: isMobile ? 'max(16px, env(safe-area-inset-top))' : '20px',
      paddingBottom: isMobile ? 'max(80px, env(safe-area-inset-bottom))' : '80px'
    }}>
      
      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: isMobile ? 'max(16px, env(safe-area-inset-top))' : '20px',
          left: '20px',
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          color: '#fff',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.boxShadow = 'none';
        }}
      >
        ← BACK
      </button>

      {/* TITLE */}
      <h1 style={{
        textAlign: 'center',
        fontSize: isMobile ? '22px' : '28px',
        color: '#00D4FF',
        fontFamily: "'Orbitron', sans-serif",
        marginBottom: '8px',
        marginTop: isMobile ? '50px' : '10px',
        textShadow: '0 0 20px rgba(0, 212, 255, 0.6)',
        letterSpacing: '3px',
        textTransform: 'uppercase'
      }}>
        CHARACTER PREVIEW
      </h1>

      {/* CHARACTER NAME */}
      <h2 style={{
        textAlign: 'center',
        fontSize: isMobile ? '32px' : '42px',
        color: '#ff9933',
        fontFamily: "'Orbitron', sans-serif",
        marginBottom: '30px',
        marginTop: '4px',
        textShadow: '0 0 30px rgba(255, 153, 51, 0.8)',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 'bold'
      }}>
        {char.name}
      </h2>

      {/* MAIN LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr 1fr',
        gap: isMobile ? '20px' : '30px',
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '30px',
        alignItems: 'start'
      }}>

        {/* LEFT PANEL - STATS */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '2px solid rgba(0, 212, 255, 0.4)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          order: isMobile ? 2 : 1
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: '#00d4ff',
            marginTop: 0,
            marginBottom: '20px',
            letterSpacing: '2px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
          }}>
            STATS
          </h3>
          <StatBar label="SPEED" value={stats.speed} icon="⚡" />
          <StatBar label="BOOST DURATION" value={stats.boostDuration} icon="🚀" />
          <StatBar label="HANDLING" value={stats.handling} icon="🎮" />
          <StatBar label="WEIGHT" value={stats.weight} icon="⚖️" />
        </div>

        {/* CENTER - CHARACTER PREVIEW */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          order: isMobile ? 1 : 2
        }}>
          {/* 3D CHARACTER VIEW - FIXED: Better model scaling and positioning */}
          <div style={{
            width: '100%',
            height: isMobile ? '400px' : '500px',
            position: 'relative',
            background: 'radial-gradient(ellipse at center, rgba(255, 153, 51, 0.1), transparent)',
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            <Canvas 
              style={{ width: '100%', height: '100%' }}
            >
              <PerspectiveCamera makeDefault position={[0, 0.5, 4]} fov={50} />
              <ambientLight intensity={0.6} />
              <pointLight position={[5, 5, 5]} intensity={1.5} color="#ff9933" />
              <pointLight position={[-5, 5, 5]} intensity={1.2} color="#00d4ff" />
              <spotLight 
                position={[0, 8, 0]} 
                intensity={2} 
                angle={0.6} 
                penumbra={1} 
                color="#ffffff"
                castShadow
              />
              
              <Suspense fallback={null}>
                <CircularPlatform />
                {/* ✅ FIXED: Proper scaling and positioning for all characters */}
                <GLBCharacterPreview 
                  characterId={currentCharacter} 
                  rotating={rotating} 
                  floatEnabled={false}
                  scale={isMobile ? 0.7 : 0.9}
                  position={[0, -1.5, 0]}
                />
              </Suspense>
              
              <Environment preset="city" />
              <fog attach="fog" args={['#0a0e27', 8, 20]} />
            </Canvas>

            {/* OUTER GLOW RING */}
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: isMobile ? '320px' : '400px',
              height: isMobile ? '120px' : '150px',
              border: '3px solid rgba(255, 153, 51, 0.4)',
              borderRadius: '50%',
              boxShadow: `
                0 0 30px rgba(255, 153, 51, 0.5),
                inset 0 0 30px rgba(255, 153, 51, 0.2)
              `,
              pointerEvents: 'none'
            }} />
          </div>

          {/* ROTATION TOGGLE */}
          <button
            onClick={() => setRotating(!rotating)}
            style={{
              padding: '12px 24px',
              background: rotating ? 'rgba(255, 153, 51, 0.3)' : 'rgba(100, 100, 100, 0.3)',
              border: '2px solid rgba(255, 153, 51, 0.6)',
              color: rotating ? '#ff9933' : '#888',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 0 20px rgba(255, 153, 51, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = 'none';
            }}
          >
            {rotating ? '🔄 ROTATING' : '⏸ PAUSED'}
          </button>
        </div>

        {/* RIGHT PANEL - ABILITY */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '2px solid rgba(255, 153, 51, 0.4)',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 8px 32px rgba(255, 153, 51, 0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          order: isMobile ? 3 : 3
        }}>
          {/* Ability Icon */}
          <div style={{
            width: isMobile ? '100px' : '120px',
            height: isMobile ? '100px' : '120px',
            background: 'rgba(255, 153, 51, 0.2)',
            border: '3px solid rgba(255, 153, 51, 0.6)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '48px' : '56px',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(255, 153, 51, 0.4)',
            position: 'relative'
          }}>
            {stats.abilityIcon}
            
            {/* Pulse effect */}
            <div style={{
              position: 'absolute',
              inset: -10,
              border: '2px solid rgba(255, 153, 51, 0.3)',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
          </div>

          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: '#ff9933',
            margin: '0 0 16px 0',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(255, 153, 51, 0.5)'
          }}>
            {stats.ability}
          </h3>

          <p style={{
            fontSize: '13px',
            color: '#ccc',
            margin: 0,
            lineHeight: '1.6'
          }}>
            {stats.description}
          </p>
        </div>
      </div>

      {/* CHARACTER SELECTOR GRID */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 30px auto',
        padding: '0 10px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
          gap: isMobile ? '10px' : '12px'
        }}>
          {Object.entries(CHARACTERS).map(([id, data]) => {
            const owned = ownedCharacters.includes(id);
            const selected = currentCharacter === id;
            
            return (
              <button
                key={id}
                onClick={() => setCurrentCharacter(id)}
                disabled={!owned && id !== 'default'}
                style={{
                  padding: '12px',
                  background: selected 
                    ? 'linear-gradient(135deg, rgba(255, 153, 51, 0.4), rgba(255, 102, 0, 0.2))'
                    : owned 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(100, 100, 100, 0.2)',
                  border: selected 
                    ? '2px solid #ff9933' 
                    : owned 
                      ? '1px solid rgba(255, 255, 255, 0.2)' 
                      : '1px solid rgba(100, 100, 100, 0.3)',
                  borderRadius: '12px',
                  color: owned ? '#fff' : '#666',
                  cursor: (owned || id === 'default') ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  position: 'relative',
                  boxShadow: selected ? '0 0 20px rgba(255, 153, 51, 0.4)' : 'none',
                  opacity: owned ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (owned && !selected) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 153, 51, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (owned && !selected) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
              >
                <div style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '4px' }}>
                  {!owned && id !== 'default' && '🔒'}
                  {owned && characterStats[id]?.abilityIcon?.slice(0, 2)}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.7 }}>
                  {data.name.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 'max(20px, env(safe-area-inset-bottom))' : '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        {!isOwned && currentCharacter !== 'default' ? (
          <>
            {/* PURCHASE BUTTON */}
            <button
              onClick={handlePurchase}
              disabled={!canAfford}
              style={{
                padding: isMobile ? '16px 40px' : '20px 60px',
                background: canAfford 
                  ? 'linear-gradient(135deg, rgba(255, 153, 51, 0.6), rgba(255, 102, 0, 0.4))'
                  : 'rgba(100, 100, 100, 0.4)',
                border: `3px solid ${canAfford ? '#ff9933' : '#666'}`,
                color: canAfford ? '#ff9933' : '#999',
                borderRadius: '50px',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                fontSize: 'clamp(14px, 1.6vw, 20px)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1.6px',
                transition: 'all 0.3s ease',
                opacity: canAfford ? 1 : 0.6,
                boxShadow: canAfford ? '0 8px 32px rgba(255, 153, 51, 0.6)' : 'none',
                fontFamily: "'Orbitron', sans-serif",
                minWidth: isMobile ? '220px' : 'min(40vw, 420px)',
                maxWidth: '720px',
                textShadow: canAfford ? '0 0 10px rgba(255, 153, 51, 0.8)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (canAfford) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 12px 40px rgba(255, 153, 51, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (canAfford) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 8px 32px rgba(255, 153, 51, 0.6)';
                }
              }}
            >
              💰 {char.cost.toLocaleString()} COINS
            </button>
            
            {/* BALANCE DISPLAY */}
            <div style={{
              fontSize: '12px',
              color: canAfford ? '#00d4ff' : '#ff6666',
              fontWeight: 'bold',
              textShadow: canAfford ? '0 0 10px rgba(0, 212, 255, 0.6)' : '0 0 10px rgba(255, 102, 102, 0.6)'
            }}>
              Your Balance: {totalCoins.toLocaleString()} 🪙
              {!canAfford && ` (Need ${(char.cost - totalCoins).toLocaleString()} more)`}
            </div>
          </>
        ) : (
          /* EQUIP BUTTON */
          <button
            onClick={handleEquip}
              style={{
              padding: isMobile ? '14px 36px' : 'clamp(16px, 1.6vw, 22px) clamp(28px, 2.5vw, 70px)',
              background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.6), rgba(0, 212, 255, 0.4))',
              border: '3px solid #ff9933',
              color: '#fff',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: 'clamp(16px, 2.2vw, 24px)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(255, 153, 51, 0.8)',
              fontFamily: "'Orbitron', sans-serif",
              minWidth: isMobile ? '220px' : 'min(44vw, 520px)',
              maxWidth: '760px',
              textShadow: '0 0 15px rgba(255, 153, 51, 1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 12px 40px rgba(255, 153, 51, 1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 8px 32px rgba(255, 153, 51, 0.8)';
            }}
          >
            &lt;&lt; EQUIP &gt;&gt;
          </button>
        )}
      </div>

      {/* CSS ANIMATIONS */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.6;
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
