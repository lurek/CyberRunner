// ARCHIVED - Use CharacterPreviewPage_COMPLETE_FIX.jsx instead
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { GLBCharacterPreview } from '../game/models/GLBCharacterPreview';
import { CHARACTERS } from '../utils/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CharacterPreviewPage.css';

// ============================================
// STAT BAR COMPONENT
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
// MAIN CHARACTER PREVIEW PAGE - FIXED
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

  // Get all character keys for navigation
  const characterKeys = Object.keys(CHARACTERS);
  const currentIndex = characterKeys.indexOf(currentCharacter);

  // Character stats mapping
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

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + characterKeys.length) % characterKeys.length;
    setCurrentCharacter(characterKeys[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % characterKeys.length;
    setCurrentCharacter(characterKeys[nextIndex]);
  };

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
          backdropFilter: 'blur(10px)',
          minHeight: '48px',
          minWidth: '80px'
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
            color: '#00D4FF',
            marginBottom: '20px',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
          }}>
            STATS
          </h3>
          
          <StatBar label="SPEED" value={stats.speed} icon="⚡" />
          <StatBar label="BOOST DURATION" value={stats.boostDuration} icon="🔥" />
          <StatBar label="HANDLING" value={stats.handling} icon="🎯" />
          <StatBar label="WEIGHT" value={stats.weight} icon="⚙️" />
        </div>

        {/* CENTER PANEL - 3D MODEL WITH ARROWS */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 153, 51, 0.5)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(255, 153, 51, 0.3)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          order: isMobile ? 1 : 2,
          height: isMobile ? '400px' : '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          
          {/* 3D CANVAS WITH CHARACTER */}
          <Canvas
            shadows
            dpr={[1, 2]}
            style={{ 
              width: '100%', 
              height: '100%',
              borderRadius: '14px'
            }}
          >
            <PerspectiveCamera makeDefault position={[0, 1.2, 4]} fov={40} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
            <pointLight position={[-3, 3, 3]} intensity={0.8} color="#ff9933" />
            <pointLight position={[3, 3, 3]} intensity={0.8} color="#00d4ff" />
            <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.6} penumbra={1} castShadow />
            
            <Suspense fallback={null}>
              <GLBCharacterPreview
                characterId={currentCharacter}
                rotating={rotating}
                floatEnabled={true}
                scale={0.85}
                showPlatform={true}
                platformColor={char.color || '#ff9933'}
              />
            </Suspense>
            
            <Environment preset="city" />
            <fog attach="fog" args={['#0a0e27', 8, 20]} />
          </Canvas>

          {/* LEFT ARROW */}
          <button
            onClick={handlePrevious}
            style={{
              position: 'absolute',
              left: isMobile ? '10px' : '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 212, 255, 0.2)',
              border: '2px solid rgba(0, 212, 255, 0.6)',
              borderRadius: '50%',
              width: isMobile ? '50px' : '60px',
              height: isMobile ? '50px' : '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              zIndex: 5,
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ChevronLeft size={isMobile ? 28 : 32} color="#00D4FF" strokeWidth={3} />
          </button>

          {/* RIGHT ARROW */}
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: isMobile ? '10px' : '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 153, 51, 0.2)',
              border: '2px solid rgba(255, 153, 51, 0.6)',
              borderRadius: '50%',
              width: isMobile ? '50px' : '60px',
              height: isMobile ? '50px' : '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              zIndex: 5,
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 153, 51, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 153, 51, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 153, 51, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ChevronRight size={isMobile ? 28 : 32} color="#ff9933" strokeWidth={3} />
          </button>

          {/* ROTATION TOGGLE */}
          <button
            onClick={() => setRotating(!rotating)}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              padding: '8px 16px',
              background: rotating ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${rotating ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'}`,
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 5,
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              textTransform: 'uppercase',
              minHeight: '40px'
            }}
          >
            {rotating ? '⟳ Rotating' : '○ Static'}
          </button>
        </div>

        {/* RIGHT PANEL - ABILITY & ACTIONS */}
        <div style={{
          order: isMobile ? 3 : 3,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* ABILITY CARD */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '2px solid rgba(255, 153, 51, 0.4)',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 8px 32px rgba(255, 153, 51, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              {stats.abilityIcon}
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#ff9933',
              marginBottom: '12px',
              textAlign: 'center',
              letterSpacing: '2px',
              textShadow: '0 0 10px rgba(255, 153, 51, 0.5)'
            }}>
              {stats.ability}
            </h3>
            <p style={{
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center'
            }}>
              {stats.description}
            </p>
          </div>

          {/* PRICE/STATUS CARD */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: `2px solid ${isOwned ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 215, 0, 0.4)'}`,
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: `0 8px 32px ${isOwned ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 215, 0, 0.2)'}`,
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            {isOwned ? (
              <div>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '12px' 
                }}>
                  ✅
                </div>
                <p style={{ 
                  color: '#00ff00', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                }}>
                  OWNED
                </p>
              </div>
            ) : (
              <div>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '12px' 
                }}>
                  🪙
                </div>
                <p style={{ 
                  color: '#ffd700', 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                }}>
                  {char.cost.toLocaleString()}
                </p>
                {!canAfford && (
                  <p style={{ 
                    color: '#ff6666', 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Not Enough Coins
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={isOwned ? handleEquip : handlePurchase}
            disabled={!isOwned && !canAfford}
            style={{
              padding: isMobile ? '16px' : '20px',
              fontSize: isMobile ? '16px' : '20px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderRadius: '12px',
              border: 'none',
              cursor: (!isOwned && !canAfford) ? 'not-allowed' : 'pointer',
              background: isOwned 
                ? 'linear-gradient(135deg, #00ff00, #00cc00)' 
                : canAfford 
                  ? 'linear-gradient(135deg, #ff9933, #ff6600)' 
                  : 'rgba(100, 100, 100, 0.5)',
              color: '#fff',
              boxShadow: isOwned 
                ? '0 8px 32px rgba(0, 255, 0, 0.4)' 
                : canAfford 
                  ? '0 8px 32px rgba(255, 153, 51, 0.4)' 
                  : 'none',
              transition: 'all 0.3s ease',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: '2px',
              opacity: (!isOwned && !canAfford) ? 0.5 : 1,
              minHeight: isMobile ? '56px' : '64px'
            }}
            onMouseEnter={(e) => {
              if (isOwned || canAfford) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = isOwned 
                  ? '0 12px 40px rgba(0, 255, 0, 0.6)' 
                  : '0 12px 40px rgba(255, 153, 51, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = isOwned 
                ? '0 8px 32px rgba(0, 255, 0, 0.4)' 
                : canAfford 
                  ? '0 8px 32px rgba(255, 153, 51, 0.4)' 
                  : 'none';
            }}
          >
            {isOwned ? '✓ EQUIP' : canAfford ? '💰 PURCHASE' : '🔒 LOCKED'}
          </button>
        </div>
      </div>
    </div>
  );
}