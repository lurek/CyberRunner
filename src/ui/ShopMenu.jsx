/**
 * ✅ PHASE 2: Economy & Shop System - FIXED VERSION
 * Bug fixes: Better alignment, mobile responsiveness, clickable buttons
 */

import React, { useState } from 'react';
import {
  ArrowLeft, Shield, Zap, Magnet, Coins, Heart, Clock,
  User, Palette, Package, Wrench, Lock, Check, Star, Gem
} from 'lucide-react';
import { SHOP_CONFIG, CHARACTERS } from '../utils/constants.js';
import DiamondShop from './DiamondShop.jsx';

const getCost = (type, level) => {
  const config = SHOP_CONFIG[type];
  if (!config) return Infinity;
  return config.baseCost + (level * config.costIncrease);
};

const SKINS = [
  { id: 'default', name: 'Neon Blue', color: '#5b8fc7', cost: 0, unlocked: true },
  { id: 'fire', name: 'Fire Trail', color: '#ff4400', cost: 2000, unlocked: false },
  { id: 'rainbow', name: 'Rainbow', color: 'linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #5b8fc7, #9b7fc7)', cost: 5000, unlocked: false },
  { id: 'lightning', name: 'Lightning', color: '#ffff00', cost: 8000, unlocked: false },
];

const BOOSTERS = [
  {
    id: 'shield_start',
    name: 'Shield Start',
    icon: <Shield size={18} />,
    cost: 500,
    description: 'Start with shield active',
    color: '#5b8fc7',
    emoji: '🛡️'
  },
  {
    id: 'speed_start',
    name: 'Speed Start',
    icon: <Zap size={18} />,
    cost: 800,
    description: 'Start with 2x multiplier',
    color: '#ffaa00',
    emoji: '⚡'
  },
  {
    id: 'magnet_start',
    name: 'Magnet Start',
    icon: <Magnet size={18} />,
    cost: 600,
    description: 'Start with coin magnet',
    color: '#00ff00',
    emoji: '🧲'
  },
  {
    id: 'score_2x',
    name: '2x Score',
    icon: <Star size={18} />,
    cost: 1000,
    description: 'Double score for the run',
    color: '#9b7fc7',
    emoji: '⭐'
  },
  {
    id: 'lightning_ready',
    name: '⚡ Lightning Ready',
    icon: <Zap size={18} style={{ color: '#9b7fc7' }} />,
    cost: 1000,
    description: 'Start with Lightning Dash charged',
    color: '#9b7fc7',
    emoji: '⚡'
  },
  {
    id: 'health_pack',
    name: '❤️ Health Pack',
    icon: <Heart size={18} />,
    cost: 400,
    description: 'Restore health during run',
    color: '#ff4444',
    emoji: '❤️'
  },
  {
    id: 'time_slow',
    name: '⏰ Time Slow',
    icon: <Clock size={18} />,
    cost: 900,
    description: 'Slow down time briefly',
    color: '#aaaaff',
    emoji: '⏰'
  }
];

export default function ShopMenu({
  visible,
  totalCoins,
  totalGems = 0,
  upgradeLevels,
  onPurchase,
  onDiamondPurchase,
  onBack,
  ownedCharacters = ['default'],
  selectedCharacter = 'default',
  onCharacterPurchase,
  onCharacterSelect
}) {
  const [activeTab, setActiveTab] = useState('upgrades');
  const [showDiamondShop, setShowDiamondShop] = useState(false);

  const shieldLevel = upgradeLevels.shield || 0;
  const multiplierLevel = upgradeLevels.multiplier || 0;
  const magnetLevel = upgradeLevels.magnet || 0;
  const healthLevel = upgradeLevels.health || 0;
  const timeLevel = upgradeLevels.time || 0;

  const shieldCost = getCost('shield', shieldLevel);
  const multiplierCost = getCost('multiplier', multiplierLevel);
  const magnetCost = getCost('magnet', magnetLevel);
  const healthCost = getCost('health', healthLevel);
  const timeCost = getCost('time', timeLevel);

  if (!visible) return null;

  return (
    <div
      className="neon-panel"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: 'min(480px, 90vw)',
        maxWidth: 'min(600px, 95vw)',
        width: '90vw',
        maxHeight: '85vh',
        fontFamily: "'Orbitron', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        background: 'rgba(10, 10, 26, 0.98)',
        border: '2px solid rgba(91, 143, 199, 0.4)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(91, 143, 199, 0.3)',
        pointerEvents: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        position: 'relative',
        padding: '20px',
        borderBottom: '2px solid rgba(91, 143, 199, 0.3)',
        flexShrink: 0
      }}>
        <button
          className='icon-btn'
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(91, 143, 199, 0.1)',
            border: '2px solid rgba(91, 143, 199, 0.4)',
            borderRadius: '50%',
            width: 40,
            height: 40,
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
          fontSize: 'clamp(20px, 5vw, 26px)',
          marginBottom: 10,
          textAlign: 'center',
          color: '#5b8fc7',
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(91, 143, 199, 0.5)'
        }}>
          CYBER SHOP
        </div>

        <div className='neon-sub' style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 'clamp(14px, 4vw, 18px)'
        }}>
          <Coins size={20} color="#ffd700" />
          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
            {totalCoins.toLocaleString()}
          </span>
        </div>
        <div className='neon-sub' style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 'clamp(14px, 4vw, 18px)'
        }}>
          <span style={{ fontSize: 18 }}>💎</span>
          <span style={{ color: '#e0b0ff', fontWeight: 'bold' }}>
            {totalGems.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '14px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderBottom: '2px solid rgba(91, 143, 199, 0.2)',
        overflowX: 'auto',
        flexShrink: 0,
        scrollbarWidth: 'thin',
        scrollbarColor: '#5b8fc7 #0a0a1a'
      }}>
        <TabButton
          icon={<Wrench size={16} />}
          label="Upgrades"
          active={activeTab === 'upgrades'}
          onClick={() => setActiveTab('upgrades')}
        />
        <TabButton
          icon={<Package size={16} />}
          label="Boosters"
          active={activeTab === 'boosters'}
          onClick={() => setActiveTab('boosters')}
        />
        <TabButton
          icon={<Gem size={16} />}
          label="Diamonds"
          active={activeTab === 'diamonds'}
          onClick={() => setActiveTab('diamonds')}
        />
      </div>

      {/* Content Area with Scroll */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#5b8fc7 #0a0a1a'
      }}>
        {activeTab === 'upgrades' && (
          <UpgradesTab
            shieldLevel={shieldLevel}
            shieldCost={shieldCost}
            multiplierLevel={multiplierLevel}
            multiplierCost={multiplierCost}
            magnetLevel={magnetLevel}
            magnetCost={magnetCost}
            healthLevel={healthLevel}
            healthCost={healthCost}
            timeLevel={timeLevel}
            timeCost={timeCost}
            totalCoins={totalCoins}
            onPurchase={onPurchase}
          />
        )}

        {activeTab === 'diamonds' && (
          <DiamondsTab
            totalGems={totalGems}
            totalCoins={totalCoins}
            onPurchase={onDiamondPurchase}
          />
        )}

        {activeTab === 'boosters' && (
          <BoostersTab boosters={BOOSTERS} totalCoins={totalCoins} onPurchase={onPurchase} />
        )}
      </div>
    </div>
  );
}

// ============= TAB BUTTON - FIXED =============
function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '10px 16px',
        minHeight: 44,
        background: active
          ? 'linear-gradient(135deg, rgba(91, 143, 199, 0.3), rgba(0, 200, 255, 0.3))'
          : 'rgba(0, 0, 0, 0.4)',
        border: active ? '2px solid #5b8fc7' : '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '10px',
        color: active ? '#5b8fc7' : '#888',
        fontSize: 'clamp(12px, 3.5vw, 14px)',
        fontWeight: active ? 'bold' : '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        boxShadow: active ? '0 0 20px rgba(91, 143, 199, 0.4)' : 'none',
        touchAction: 'manipulation',
        flex: '1 1 auto'
      }}
    >
      {icon}
      <span style={{ display: 'inline' }}>{label}</span>
    </button>
  );
}

// ============= UPGRADES TAB - FIXED =============
function UpgradesTab({
  shieldLevel, shieldCost,
  multiplierLevel, multiplierCost,
  magnetLevel, magnetCost,
  healthLevel, healthCost,
  timeLevel, timeCost,
  totalCoins,
  onPurchase
}) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <UpgradeItem
        icon={<Shield size={20} color="#5b8fc7" />}
        name="Shield Duration"
        level={shieldLevel}
        maxLevel={10}
        description="+1.0s per level"
        cost={shieldCost}
        canAfford={totalCoins >= shieldCost}
        onPurchase={() => onPurchase('shield')}
      />

      <UpgradeItem
        icon={<Zap size={20} color="#ffd700" />}
        name="Multiplier Duration"
        level={multiplierLevel}
        maxLevel={10}
        description="+1.5s per level"
        cost={multiplierCost}
        canAfford={totalCoins >= multiplierCost}
        onPurchase={() => onPurchase('multiplier')}
      />

      <UpgradeItem
        icon={<Magnet size={20} color="#00ff00" />}
        name="Magnet Duration"
        level={magnetLevel}
        maxLevel={10}
        description="+1.0s per level"
        cost={magnetCost}
        canAfford={totalCoins >= magnetCost}
        onPurchase={() => onPurchase('magnet')}
      />

      <UpgradeItem
        icon={<Heart size={20} color="#ff4d4d" />}
        name="Starting Health"
        level={healthLevel}
        maxLevel={10}
        description="+10 HP per level"
        cost={healthCost}
        canAfford={totalCoins >= healthCost}
        onPurchase={() => onPurchase('health')}
      />

      <UpgradeItem
        icon={<Clock size={20} color="#aaaaff" />}
        name="Time Slow Duration"
        level={timeLevel}
        maxLevel={10}
        description="+0.5s per level"
        cost={timeCost}
        canAfford={totalCoins >= timeCost}
        onPurchase={() => onPurchase('time')}
      />
    </div>
  );
}

function UpgradeItem({ icon, name, level, maxLevel, description, cost, canAfford, onPurchase }) {
  const isMaxLevel = level >= maxLevel;
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: '2px solid rgba(91, 143, 199, 0.3)',
      borderRadius: 'clamp(12px, 3vw, 14px)',
      padding: 'clamp(12px, 3vw, 16px)',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: 'clamp(12px, 3vw, 14px)',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      boxSizing: 'border-box'
    }}>
      {/* Icon and Info Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(10px, 2.5vw, 14px)',
        flex: isMobile ? 'none' : 1,
        minWidth: 0
      }}>
        <div style={{
          background: 'rgba(91, 143, 199, 0.15)',
          borderRadius: 'clamp(8px, 2vw, 10px)',
          padding: 'clamp(10px, 2.5vw, 12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '700',
            color: '#fff',
            marginBottom: 'clamp(4px, 1vw, 6px)',
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}>
            {name}
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: 'clamp(6px, 1.5vw, 8px)',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 'clamp(4px, 1vw, 6px)',
            border: '1px solid rgba(91, 143, 199, 0.2)'
          }}>
            <div style={{
              width: `${(level / maxLevel) * 100}%`,
              height: '100%',
              background: isMaxLevel
                ? 'linear-gradient(90deg, #ffd700, #ffaa00)'
                : 'linear-gradient(90deg, #5b8fc7, #0088ff)',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px rgba(91, 143, 199, 0.5)'
            }} />
          </div>

          <div style={{
            fontSize: 'clamp(10px, 3vw, 12px)',
            color: '#cfefff',
            opacity: 0.85,
            lineHeight: 1.4
          }}>
            Level: <strong>{level}/{maxLevel}</strong> • {description}
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canAfford && !isMaxLevel) onPurchase();
        }}
        disabled={!canAfford || isMaxLevel}
        style={{
          padding: 'clamp(10px, 2.5vw, 12px) clamp(14px, 3.5vw, 16px)',
          fontSize: 'clamp(12px, 3.5vw, 13px)',
          minWidth: isMobile ? '100%' : 'clamp(90px, 22vw, 100px)',
          minHeight: 'clamp(44px, 11vw, 48px)',
          fontWeight: 'bold',
          fontFamily: "'Orbitron', sans-serif",
          opacity: (canAfford && !isMaxLevel) ? 1 : 0.5,
          cursor: (canAfford && !isMaxLevel) ? 'pointer' : 'not-allowed',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(4px, 1vw, 6px)',
          background: isMaxLevel
            ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
            : canAfford
              ? 'linear-gradient(135deg, rgba(91, 143, 199, 0.3), rgba(0, 200, 255, 0.3))'
              : 'rgba(60, 60, 60, 0.4)',
          border: isMaxLevel
            ? '2px solid #ffd700'
            : canAfford
              ? '2px solid rgba(91, 143, 199, 0.5)'
              : '2px solid rgba(100, 100, 100, 0.3)',
          borderRadius: 'clamp(8px, 2vw, 10px)',
          color: isMaxLevel ? '#0a0a0a' : canAfford ? '#5b8fc7' : '#666',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          flexShrink: 0,
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {isMaxLevel ? (
          <>
            <Check size={14} />
            <span>MAX</span>
          </>
        ) : (
          <>
            <Coins size={14} />
            <span>{cost.toLocaleString()}</span>
          </>
        )}
      </button>
    </div>
  );
}

// ============= SKINS TAB =============
function SkinsTab({ skins, totalCoins }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{
        fontSize: 'clamp(11px, 3.5vw, 13px)',
        color: '#88ccee',
        marginBottom: 8,
        padding: '12px',
        background: 'rgba(91, 143, 199, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(91, 143, 199, 0.1)'
      }}>
        🎨 Customize your trail! Make your runner stand out.
      </div>

      {skins.map(skin => (
        <SkinCard key={skin.id} skin={skin} totalCoins={totalCoins} />
      ))}
    </div>
  );
}

function SkinCard({ skin, totalCoins }) {
  const canAfford = totalCoins >= skin.cost;
  const isOwned = skin.unlocked;

  return (
    <div style={{
      background: isOwned ? 'rgba(91, 143, 199, 0.1)' : 'rgba(0, 0, 0, 0.4)',
      border: isOwned ? '2px solid rgba(91, 143, 199, 0.5)' : '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'all 0.2s ease',
      boxShadow: isOwned ? '0 4px 12px rgba(91, 143, 199, 0.2)' : 'none'
    }}>
      <div style={{
        width: 60,
        height: 60,
        minWidth: 60,
        borderRadius: '10px',
        background: skin.color,
        border: '2px solid rgba(255, 255, 255, 0.4)',
        filter: isOwned ? 'none' : 'grayscale(80%)',
        opacity: isOwned ? 1 : 0.5,
        boxShadow: isOwned ? '0 0 15px rgba(91, 143, 199, 0.3)' : 'none'
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'clamp(14px, 4vw, 16px)',
          fontWeight: 'bold',
          color: isOwned ? '#5b8fc7' : '#fff',
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {skin.name}
        </div>
        <div style={{
          fontSize: 'clamp(10px, 3vw, 12px)',
          color: '#cfefff',
          opacity: 0.8
        }}>
          Trail Effect
        </div>
      </div>

      <button
        onClick={(e) => e.stopPropagation()}
        disabled={!canAfford || isOwned}
        style={{
          padding: '10px 16px',
          fontSize: 'clamp(11px, 3.5vw, 13px)',
          minWidth: 95,
          minHeight: 44,
          fontWeight: 'bold',
          opacity: isOwned ? 0.8 : (canAfford ? 1 : 0.5),
          background: isOwned
            ? 'rgba(0, 255, 0, 0.2)'
            : 'rgba(91, 143, 199, 0.15)',
          border: isOwned
            ? '2px solid #00ff00'
            : '2px solid rgba(91, 143, 199, 0.4)',
          borderRadius: '10px',
          cursor: (canAfford && !isOwned) ? 'pointer' : 'not-allowed',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: isOwned ? '#00ff00' : canAfford ? '#5b8fc7' : '#666',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          flexShrink: 0
        }}
      >
        {isOwned ? (
          <>
            <Check size={14} />
            <span>OWNED</span>
          </>
        ) : (
          <>
            <Coins size={14} />
            <span>{skin.cost.toLocaleString()}</span>
          </>
        )}
      </button>
    </div>
  );
}

// ============= BOOSTERS TAB =============
function BoostersTab({ boosters, totalCoins, onPurchase }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{
        fontSize: 'clamp(11px, 3.5vw, 13px)',
        color: '#88ccee',
        marginBottom: 8,
        padding: '12px',
        background: 'rgba(91, 143, 199, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(91, 143, 199, 0.1)'
      }}>
        🎁 Pre-run consumables! Use them before starting a run for an edge.
      </div>

      {boosters.map(booster => (
        <BoosterCard key={booster.id} booster={booster} totalCoins={totalCoins} onPurchase={onPurchase} />
      ))}
    </div>
  );
}

function BoosterCard({ booster, totalCoins, onPurchase }) {
  const canAfford = totalCoins >= booster.cost;
  const [ownedCount, setOwnedCount] = React.useState(() => {
    try {
      const boosterData = JSON.parse(localStorage.getItem('cyberrunner_boosters') || '{}');
      return boosterData[booster.id] || 0;
    } catch {
      return 0;
    }
  });

  // 🆕 Detect mobile for responsive layout
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 500);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 500);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePurchase = (e) => {
    e.stopPropagation();
    if (!canAfford) return;

    try {
      // Update local booster count
      const boosterData = JSON.parse(localStorage.getItem('cyberrunner_boosters') || '{}');
      boosterData[booster.id] = (boosterData[booster.id] || 0) + 1;
      localStorage.setItem('cyberrunner_boosters', JSON.stringify(boosterData));
      setOwnedCount(boosterData[booster.id]);

      // Call parent handler to deduct coins and sync to cloud
      if (onPurchase) {
        onPurchase('booster', { boosterId: booster.id, cost: booster.cost });
      }
      console.log(`✅ Purchased ${booster.name}! Total owned: ${boosterData[booster.id]}`);
    } catch (e) {
      console.error('❌ Failed to purchase booster:', e);
    }
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      border: `2px solid ${booster.color}44`,
      borderRadius: 'clamp(12px, 3vw, 16px)',
      padding: 'clamp(12px, 3vw, 20px)',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 'clamp(10px, 3vw, 18px)',
      alignItems: isMobile ? 'stretch' : 'center',
      transition: 'all 0.3s ease',
      boxShadow: `0 0 20px ${booster.color}20`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glowing background effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${booster.color}10, transparent)`,
        pointerEvents: 'none'
      }} />

      {/* Top row on mobile: Icon + Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(10px, 3vw, 16px)',
        flex: 1,
        minWidth: 0
      }}>
        {/* ICON */}
        <div style={{
          background: `linear-gradient(135deg, ${booster.color}30, ${booster.color}10)`,
          border: `2px solid ${booster.color}60`,
          borderRadius: 'clamp(10px, 2.5vw, 14px)',
          padding: 'clamp(10px, 2.5vw, 16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: booster.color,
          flexShrink: 0,
          fontSize: 'clamp(22px, 6vw, 32px)',
          position: 'relative',
          zIndex: 1,
          width: 'clamp(50px, 14vw, 70px)',
          height: 'clamp(50px, 14vw, 70px)',
          boxShadow: `inset 0 0 15px ${booster.color}30, 0 0 15px ${booster.color}30`
        }}>
          {booster.emoji}
        </div>

        {/* CONTENT */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'clamp(13px, 3.5vw, 16px)',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 'clamp(4px, 1vw, 6px)',
            textShadow: `0 0 10px ${booster.color}60`,
            letterSpacing: '0.5px',
            wordBreak: 'break-word'
          }}>
            {booster.name}
          </div>
          <div style={{
            fontSize: 'clamp(10px, 2.8vw, 13px)',
            color: '#b0d4ff',
            lineHeight: 1.4,
            marginBottom: ownedCount > 0 ? 'clamp(4px, 1vw, 6px)' : 0
          }}>
            {booster.description}
          </div>
          {ownedCount > 0 && (
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              color: '#ffd700',
              fontWeight: 'bold',
              textShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              ✓ Owned: <strong>{ownedCount}</strong>
            </div>
          )}
        </div>
      </div>

      {/* PURCHASE BUTTON - Full width on mobile */}
      <button
        onClick={handlePurchase}
        disabled={!canAfford}
        style={{
          padding: 'clamp(10px, 2.5vw, 14px) clamp(14px, 4vw, 20px)',
          fontSize: 'clamp(11px, 3vw, 13px)',
          minWidth: isMobile ? '100%' : 'clamp(90px, 22vw, 110px)',
          minHeight: 'clamp(44px, 10vw, 52px)',
          fontWeight: 'bold',
          fontFamily: "'Orbitron', sans-serif",
          opacity: canAfford ? 1 : 0.5,
          cursor: canAfford ? 'pointer' : 'not-allowed',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(4px, 1vw, 6px)',
          background: canAfford
            ? `linear-gradient(135deg, ${booster.color}35, ${booster.color}15)`
            : 'rgba(50, 50, 70, 0.4)',
          border: canAfford
            ? `2px solid ${booster.color}70`
            : '2px solid rgba(100, 100, 120, 0.3)',
          borderRadius: 'clamp(8px, 2vw, 12px)',
          color: canAfford ? '#fff' : '#888',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
          boxShadow: canAfford ? `0 0 20px ${booster.color}40` : 'none',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          if (canAfford) {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 4px 24px ${booster.color}60`;
          }
        }}
        onMouseLeave={(e) => {
          if (canAfford) {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 0 20px ${booster.color}40`;
          }
        }}
      >
        <Coins size={14} />
        <strong>{booster.cost}</strong>
      </button>
    </div>
  );
}

// ============= DIAMONDS TAB =============
function DiamondsTab({ totalGems, totalCoins, onPurchase }) {
  const [purchaseAnimation, setPurchaseAnimation] = React.useState(null);
  const [error, setError] = React.useState(null);

  // Shop items available for purchase with diamonds
  const shopItems = [
    // Coins packages
    {
      id: 'coins_small',
      category: 'coins',
      name: '500 Coins',
      description: 'A small pile of gold',
      icon: '🪙',
      cost: 10,
      reward: { type: 'coins', amount: 500 }
    },
    {
      id: 'coins_medium',
      category: 'coins',
      name: '2,500 Coins',
      description: 'A bag of gold',
      icon: '💰',
      cost: 40,
      reward: { type: 'coins', amount: 2500 }
    },
    {
      id: 'coins_large',
      category: 'coins',
      name: '10,000 Coins',
      description: 'A treasure chest!',
      icon: '📦',
      cost: 150,
      reward: { type: 'coins', amount: 10000 },
      bestValue: true
    },

    // Revive tokens
    {
      id: 'revive_1',
      category: 'revives',
      name: '1 Revive',
      description: 'Continue your run once',
      icon: '❤️',
      cost: 15,
      reward: { type: 'revives', amount: 1 }
    },
    {
      id: 'revive_3',
      category: 'revives',
      name: '3 Revives',
      description: 'Triple the chances',
      icon: '💕',
      cost: 40,
      reward: { type: 'revives', amount: 3 }
    },
    {
      id: 'revive_10',
      category: 'revives',
      name: '10 Revives',
      description: 'Never give up!',
      icon: '💗',
      cost: 100,
      reward: { type: 'revives', amount: 10 },
      bestValue: true
    },

    // Boosters
    {
      id: 'booster_magnet',
      category: 'boosters',
      name: 'Magnet Start',
      description: 'Start with 30s magnet',
      icon: '🧲',
      cost: 8,
      reward: { type: 'booster', boosterType: 'magnet', duration: 30 }
    },
    {
      id: 'booster_shield',
      category: 'boosters',
      name: 'Shield Start',
      description: 'Start with 20s shield',
      icon: '🛡️',
      cost: 12,
      reward: { type: 'booster', boosterType: 'shield', duration: 20 }
    },
    {
      id: 'booster_multiplier',
      category: 'boosters',
      name: '2x Coins Start',
      description: 'Start with 45s coin multiplier',
      icon: '✨',
      cost: 10,
      reward: { type: 'booster', boosterType: 'multiplier', duration: 45 }
    },
    {
      id: 'booster_bundle',
      category: 'boosters',
      name: 'Ultimate Start',
      description: 'Magnet + Shield + 2x Coins',
      icon: '🚀',
      cost: 25,
      reward: { type: 'booster_bundle', boosters: ['magnet', 'shield', 'multiplier'] },
      bestValue: true
    }
  ];

  const handlePurchase = (item) => {
    if (totalGems < item.cost) {
      setError('Not enough diamonds!');
      setTimeout(() => setError(null), 2000);
      return;
    }

    setPurchaseAnimation(item.id);

    // Call the purchase handler
    if (onPurchase) {
      onPurchase(item.id, item.cost, item.reward);
    }

    setTimeout(() => {
      setPurchaseAnimation(null);
    }, 1000);
  };

  const categories = [
    { id: 'coins', name: '💰 Coins', description: 'Buy gold coins' },
    { id: 'revives', name: '❤️ Revives', description: 'Continue your run' },
    { id: 'boosters', name: '🚀 Boosters', description: 'Power-up starts' }
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{
        fontSize: 'clamp(11px, 3.5vw, 13px)',
        color: '#e0b0ff',
        marginBottom: 8,
        padding: '12px',
        background: 'rgba(138, 43, 226, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(138, 43, 226, 0.3)'
      }}>
        💎 Spend diamonds for premium rewards! Earn diamonds from daily rewards and lucky wheel.
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(255, 100, 100, 0.2)',
          color: '#ff6b6b',
          textAlign: 'center',
          fontWeight: 'bold',
          borderRadius: '8px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {categories.map(category => (
        <div key={category.id} style={{ marginBottom: 10 }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: 'clamp(14px, 4vw, 16px)',
            color: '#aaa',
            fontWeight: 'normal'
          }}>{category.name}</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12
          }}>
            {shopItems
              .filter(item => item.category === category.id)
              .map(item => (
                <div
                  key={item.id}
                  onClick={() => handlePurchase(item)}
                  style={{
                    position: 'relative',
                    background: item.bestValue
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))'
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: item.bestValue
                      ? '1px solid rgba(255, 215, 0, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    transform: purchaseAnimation === item.id ? 'scale(0.95)' : 'scale(1)',
                    opacity: purchaseAnimation === item.id ? 0.7 : 1
                  }}
                >
                  {item.bestValue && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
                      color: '#000',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '9px',
                      fontWeight: 'bold'
                    }}>BEST VALUE</div>
                  )}
                  <div style={{ fontSize: '32px', marginBottom: 8 }}>{item.icon}</div>
                  <div style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: 4
                  }}>{item.name}</div>
                  <div style={{
                    fontSize: 'clamp(10px, 2.8vw, 11px)',
                    color: '#888',
                    marginBottom: 10
                  }}>{item.description}</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    background: totalGems >= item.cost
                      ? 'rgba(138, 43, 226, 0.3)'
                      : 'rgba(255, 100, 100, 0.2)',
                    borderRadius: '20px',
                    color: totalGems >= item.cost ? '#e0b0ff' : '#ff6b6b',
                    fontWeight: 'bold',
                    fontSize: 'clamp(11px, 3vw, 13px)'
                  }}>
                    💎 {item.cost}
                  </div>
                  {purchaseAnimation === item.id && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0, 200, 100, 0.9)',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>✓ Purchased!</div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}