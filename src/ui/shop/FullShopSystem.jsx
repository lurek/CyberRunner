/**
 * ✅ PHASE 2: Full Shop System with Character Purchase Logic (Part 2)
 */

        const maxLevel = 10;
        const canAfford = totalCoins >= cost;
        const isMaxLevel = level >= maxLevel;
        
        return (
          <UpgradeCard
            key={upgrade.type}
            icon={upgrade.icon}
            name={upgrade.name}
            description={upgrade.desc}
            level={level}
            maxLevel={maxLevel}
            cost={cost}
            canAfford={canAfford}
            isMaxLevel={isMaxLevel}
            onPurchase={() => onPurchase(upgrade.type)}
          />
        );
      })}
    </div>
  );
}

function UpgradeCard({ icon, name, description, level, maxLevel, cost, canAfford, isMaxLevel, onPurchase }) {
  const progress = (level / maxLevel) * 100;
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(91, 143, 199, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        background: 'rgba(91, 143, 199, 0.1)',
        borderRadius: '10px',
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 }}>
          {name}
        </div>
        
        {/* Progress bar */}
        <div style={{ 
          width: '100%', 
          height: 8, 
          background: 'rgba(0, 0, 0, 0.5)', 
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 6,
          border: '1px solid rgba(91, 143, 199, 0.1)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: isMaxLevel 
              ? 'linear-gradient(90deg, #ffd700, #ffaa00)'
              : 'linear-gradient(90deg, #5b8fc7, #0088ff)',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(91, 143, 199, 0.3)'
          }} />
        </div>
        
        <div style={{ fontSize: 12, color: '#cfefff', opacity: 0.85 }}>
          Level: <strong>{level}/{maxLevel}</strong> • {description}
        </div>
      </div>
      
      <button
        className='glow-btn btn-primary touch-target-sm'
        onClick={onPurchase}
        disabled={!canAfford || isMaxLevel}
        style={{
          padding: '10px 16px',
          fontSize: 13,
          minWidth: 100,
          fontWeight: 'bold',
          opacity: (canAfford && !isMaxLevel) ? 1 : 0.5,
          cursor: (canAfford && !isMaxLevel) ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: isMaxLevel 
            ? 'linear-gradient(135deg, #ffd700, #ffaa00)' 
            : canAfford 
              ? 'linear-gradient(135deg, rgba(91, 143, 199, 0.3), rgba(0, 200, 255, 0.3))'
              : 'rgba(100, 100, 100, 0.2)',
          border: isMaxLevel 
            ? '2px solid #ffd700' 
            : '2px solid rgba(91, 143, 199, 0.3)'
        }}
      >
        {isMaxLevel ? (
          <>
            <Star size={14} /> MAX
          </>
        ) : (
          <>
            <Coins size={14} /> {cost.toLocaleString()}
          </>
        )}
      </button>
    </div>
  );
}

// ============= BOOSTERS TAB =============
function BoostersTab({ inventory, totalCoins, onPurchase }) {
  const BOOSTERS = [
    { 
      id: 'shield_start', 
      name: 'Shield Start', 
      icon: <Shield size={20} />, 
      cost: 500, 
      description: 'Start your run with an active shield',
      color: '#5b8fc7'
    },
    { 
      id: 'speed_start', 
      name: 'Speed Boost', 
      icon: <Zap size={20} />, 
      cost: 800, 
      description: 'Start with 2x score multiplier',
      color: '#ffd700'
    },
    { 
      id: 'magnet_start', 
      name: 'Coin Magnet', 
      icon: <Magnet size={20} />, 
      cost: 600, 
      description: 'Start with coin magnet active',
      color: '#00ff00'
    },
    { 
      id: 'score_2x', 
      name: '2x Score', 
      icon: <Star size={20} />, 
      cost: 1000, 
      description: 'Double all points earned this run',
      color: '#9b7fc7'
    },
    { 
      id: 'revive_token', 
      name: 'Revive Token', 
      icon: <Heart size={20} />, 
      cost: 800, 
      description: 'Continue from where you died',
      color: '#ff4444'
    },
    // (Jetpack & Hoverboard starters removed)
    { 
      id: 'lightning_ready', 
      name: '⚡ Lightning Ready', 
      icon: <Zap size={20} style={{ color: '#9b7fc7' }} />, 
      cost: 1000, 
      description: 'Start with Lightning Dash charged',
      color: '#9b7fc7'
    }
  ];
  
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ 
        fontSize: 13, 
        color: '#88ccee', 
        padding: '12px',
        background: 'rgba(91, 143, 199, 0.05)',
        border: '1px solid rgba(91, 143, 199, 0.1)',
        borderRadius: '8px'
      }}>
        🎁 <strong>Consumable boosters!</strong> Use these before starting a run for an advantage.
      </div>
      
      {BOOSTERS.map(booster => {
        const owned = inventory[booster.id] || 0;
        const canAfford = totalCoins >= booster.cost;
        
        return (
          <BoosterCard
            key={booster.id}
            booster={booster}
            owned={owned}
            canAfford={canAfford}
            onPurchase={() => onPurchase(booster)}
          />
        );
      })}
    </div>
  );
}

function BoosterCard({ booster, owned, canAfford, onPurchase }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(91, 143, 199, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        background: `${booster.color}22`,
        border: `2px solid ${booster.color}44`,
        borderRadius: '10px',
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: booster.color,
        flexShrink: 0
      }}>
        {booster.icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: 16, 
          fontWeight: 'bold', 
          color: '#fff',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {booster.name}
          {owned > 0 && (
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              background: 'rgba(0, 255, 0, 0.2)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '6px',
              color: '#00ff00',
              fontWeight: 'bold'
            }}>
              x{owned} owned
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#cfefff', opacity: 0.85 }}>
          {booster.description}
        </div>
      </div>
      
      <button
        className='glow-btn btn-primary touch-target-sm'
        onClick={onPurchase}
        disabled={!canAfford}
        style={{
          padding: '10px 16px',
          fontSize: 13,
          minWidth: 100,
          fontWeight: 'bold',
          opacity: canAfford ? 1 : 0.4,
          cursor: canAfford ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: canAfford 
            ? `linear-gradient(135deg, ${booster.color}44, ${booster.color}22)`
            : 'rgba(100, 100, 100, 0.2)',
          border: `2px solid ${canAfford ? `${booster.color}66` : '#555'}`
        }}
      >
        <Coins size={14} /> {booster.cost.toLocaleString()}
      </button>
    </div>
  );
}

export { FullShopSystem };
