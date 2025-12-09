import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GLBCharacterPreview } from '../game/models/GLBCharacterPreview';
import { CHARACTERS } from '../utils/constants';

console.log('🎭 Using CharacterPreviewPage_FIXED - All issues resolved!');

// StatBar Component
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

export default function CharacterPreviewPage({
  selectedCharacter = 'default',
  onEquip,
  onBack,
  totalCoins = 0,
  ownedCharacters = ['default'],
  onCharacterPurchase
}) {
  const [currentCharacter, setCurrentCharacter] = useState(selectedCharacter);
  const [rotating, setRotating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const characterIds = Object.keys(CHARACTERS);
  const currentIndex = characterIds.indexOf(currentCharacter);
  
  const char = CHARACTERS[currentCharacter] || CHARACTERS.default;
  const isOwned = ownedCharacters.includes(currentCharacter);
  const canAfford = totalCoins >= char.cost;

  // ✅ FIXED: Updated character stats to match constants.js
  const characterStats = {
    default: { 
      speed: 75, boostDuration: 75, handling: 80, weight: 70,
      ability: 'BALANCED RUNNER',
      abilityIcon: '⚡',
      description: 'Versatile runner perfect for beginners. Balanced stats for consistent performance.'
    },
    eve: { 
      speed: 80, boostDuration: 78, handling: 85, weight: 68,
      ability: 'SWIFT MOVES',
      abilityIcon: '💨',
      description: 'Enhanced speed and agility. Perfect for fast-paced gameplay.'
    },
    kachujin: { 
      speed: 76, boostDuration: 80, handling: 78, weight: 82,
      ability: 'HIGH JUMPER',
      abilityIcon: '🦘',
      description: 'Increased jump height for better obstacle clearance.'
    },
    swat: { 
      speed: 75, boostDuration: 77, handling: 80, weight: 75,
      ability: 'COIN MAGNET',
      abilityIcon: '🧲',
      description: 'Enhanced coin collection radius. Tactical advantage.'
    },
    vanguard: { 
      speed: 82, boostDuration: 82, handling: 83, weight: 80,
      ability: 'ELITE SOLDIER',
      abilityIcon: '⚔️',
      description: 'Balanced powerhouse with superior stats across the board.'
    }
  };

  const stats = characterStats[currentCharacter] || characterStats.default;

  const handlePrevCharacter = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : characterIds.length - 1;
    setCurrentCharacter(characterIds[newIndex]);
  };

  const handleNextCharacter = () => {
    const newIndex = currentIndex < characterIds.length - 1 ? currentIndex + 1 : 0;
    setCurrentCharacter(characterIds[newIndex]);
  };

  // ✅ FIXED: Purchase handler passes only character ID
  const handlePurchase = () => {
    if (canAfford && !isOwned) {
      if (window.confirm(`Purchase ${char.name} for ${char.cost.toLocaleString()} coins?`)) {
        console.log(`🛒 Purchasing character: ${currentCharacter}`);
        onCharacterPurchase?.(currentCharacter);  // ✅ Pass ID string only
      }
    }
  };

  const handleEquip = () => {
    if (isOwned) {
      console.log(`✅ Equipping character: ${currentCharacter}`);
      onEquip?.(currentCharacter);
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
      paddingBottom: isMobile ? 'max(100px, env(safe-area-inset-bottom))' : '100px'
    }}>
      
      {/* Back Button */}
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

      {/* Title */}
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
        CHARACTER SELECTION
      </h1>

      {/* Character Name with Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '30px',
        marginTop: '4px'
      }}>
        <button
          onClick={handlePrevCharacter}
          style={{
            background: 'rgba(255, 153, 51, 0.2)',
            border: '2px solid rgba(255, 153, 51, 0.5)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#ff9933'
          }}
        >
          <ChevronLeft size={28} />
        </button>

        <h2 style={{
          textAlign: 'center',
          fontSize: isMobile ? '28px' : '38px',
          color: '#ff9933',
          fontFamily: "'Orbitron', sans-serif",
          margin: 0,
          textShadow: '0 0 30px rgba(255, 153, 51, 0.8)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          minWidth: isMobile ? '200px' : '300px'
        }}>
          {char.name}
        </h2>

        <button
          onClick={handleNextCharacter}
          style={{
            background: 'rgba(255, 153, 51, 0.2)',
            border: '2px solid rgba(255, 153, 51, 0.5)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#ff9933'
          }}
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Main Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr 1fr',
        gap: isMobile ? '20px' : '30px',
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '30px',
        alignItems: 'start'
      }}>

        {/* Left Panel - Stats */}
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

        {/* Center - Character Preview */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          order: isMobile ? 1 : 2
        }}>
          {/* ✅ FIXED: 3D Character View */}
          <div style={{
            width: '100%',
            height: isMobile ? '400px' : '500px',
            position: 'relative',
            background: 'radial-gradient(ellipse at center, rgba(255, 153, 51, 0.1), transparent)',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 153, 51, 0.3)',
            boxShadow: '0 8px 32px rgba(255, 153, 51, 0.2)'
          }}>
            <Canvas style={{ width: '100%', height: '100%' }}>
              {/* ✅ FIXED: Better camera position and FOV */}
              <PerspectiveCamera 
                makeDefault 
                position={[0, 1.8, 5.5]}
                fov={50}
              />
              
              {/* ✅ FIXED: Brighter lighting */}
              <ambientLight intensity={0.7} />
              <pointLight position={[5, 5, 5]} intensity={1.8} color="#ff9933" />
              <pointLight position={[-5, 5, 5]} intensity={1.5} color="#00d4ff" />
              <spotLight 
                position={[0, 10, 0]}
                intensity={2.5}
                angle={0.8}
                penumbra={1} 
                color="#ffffff"
                castShadow
              />
              
              <Suspense fallback={null}>
                {/* ✅ FIXED: Proper scaling and positioning */}
                <GLBCharacterPreview 
                  characterId={currentCharacter} 
                  rotating={rotating}
                  floatEnabled={false}
                  scale={isMobile ? 1.0 : 1.2}
                  position={[0, 0, 0]}
                  showPlatform={false}
                />
              </Suspense>
              
              <Environment preset="city" />
              <fog attach="fog" args={['#0a0e27', 10, 25]} />
            </Canvas>

            {/* Ground Glow Effect */}
            <div style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: isMobile ? '300px' : '350px',
              height: '80px',
              background: 'radial-gradient(ellipse, rgba(255, 153, 51, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
              filter: 'blur(20px)'
            }} />
          </div>

          {/* Rotation Toggle */}
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
          >
            {rotating ? '🔄 ROTATING' : '⏸ PAUSED'}
          </button>
        </div>

        {/* Right Panel - Ability */}
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

      {/* Character Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {characterIds.map((id) => (
          <div
            key={id}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: currentCharacter === id ? '#ff9933' : 'rgba(255, 255, 255, 0.2)',
              boxShadow: currentCharacter === id ? '0 0 10px rgba(255, 153, 51, 0.8)' : 'none',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Action Button */}
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
            <button
              onClick={handlePurchase}
              disabled={!canAfford}
              style={{
                padding: isMobile ? '12px 28px' : '16px 50px',
                background: canAfford 
                  ? 'linear-gradient(135deg, rgba(255, 153, 51, 0.6), rgba(255, 102, 0, 0.4))'
                  : 'rgba(100, 100, 100, 0.4)',
                border: `3px solid ${canAfford ? '#ff9933' : '#666'}`,
                color: canAfford ? '#ff9933' : '#999',
                borderRadius: '50px',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1.6px',
                transition: 'all 0.3s ease',
                opacity: canAfford ? 1 : 0.6,
                boxShadow: canAfford ? '0 8px 32px rgba(255, 153, 51, 0.6)' : 'none',
                fontFamily: "'Orbitron', sans-serif",
                minWidth: isMobile ? '220px' : '320px',
                textShadow: canAfford ? '0 0 10px rgba(255, 153, 51, 0.8)' : 'none'
              }}
            >
              💰 {char.cost.toLocaleString()} COINS
            </button>
            
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
          <button
            onClick={handleEquip}
            style={{
              padding: isMobile ? '14px 36px' : '18px 60px',
              background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.6), rgba(0, 212, 255, 0.4))',
              border: '3px solid #ff9933',
              color: '#fff',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(255, 153, 51, 0.8)',
              fontFamily: "'Orbitron', sans-serif",
              minWidth: isMobile ? '220px' : '380px',
              textShadow: '0 0 15px rgba(255, 153, 51, 1)'
            }}
          >
            &lt;&lt; EQUIP &gt;&gt;
          </button>
        )}
      </div>

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