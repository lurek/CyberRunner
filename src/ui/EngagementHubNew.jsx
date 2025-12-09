/**
 * ✅ PHASE 3: Comprehensive Engagement Hub - FIXED
 * * Fixed: Wheel rotation logic now syncs perfectly with rewards (integer spins)
 * * Fixed: Text contrast on yellow segments
 * * Fixed: Wheel stops exactly on target
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft, Gift, Target, Trophy, Sparkles,
  Coins, Calendar, Check, Lock, Play, Star,
  ChevronRight, Zap, TrendingUp
} from 'lucide-react';
import { getDailyMissionManager } from '../game/systems/engagement/DailyMissionManager.js';
import { getLoginRewardsManager } from '../game/systems/engagement/LoginRewardsManager.js';
import { getLuckyWheelManager } from '../game/systems/engagement/LuckyWheelManager.js';
import { getCloudSaveManager } from '../utils/cloud/CloudSaveManager.js';
import { getPerformanceManager } from '../utils/performance/PerformanceManager.js';  // ✅ NEW
import './EngagementHubNew.css';

export default function EngagementHub({
  visible,
  onBack,
  totalCoins,
  totalGems = 0, // ✅ Gems display
  onRewardClaimed
}) {
  console.log('🎁 EngagementHub RENDER:', { visible, totalCoins });

  const [activeTab, setActiveTab] = useState('missions');
  const [calendarSubTab, setCalendarSubTab] = useState('weekly');  // 🆕 Weekly/Monthly toggle
  const [missions, setMissions] = useState([]);
  const [loginRewards, setLoginRewards] = useState([]);
  const [monthlyRewards, setMonthlyRewards] = useState([]);  // 🆕 Monthly calendar rewards
  const [currentLoginDay, setCurrentLoginDay] = useState(0);
  const [monthlyCurrentDay, setMonthlyCurrentDay] = useState(0);  // 🆕 Monthly progress
  const [streak, setStreak] = useState(0);
  const [wheelSegments, setWheelSegments] = useState([]);
  const [freeSpins, setFreeSpins] = useState(0);
  const [adSpins, setAdSpins] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWinSegment, setLastWinSegment] = useState(null);
  const [targetSegment, setTargetSegment] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const cloudManager = useRef(getCloudSaveManager());
  const dailyMissionManager = useRef(getDailyMissionManager());
  const loginRewardsManager = useRef(getLoginRewardsManager());
  const luckyWheelManager = useRef(getLuckyWheelManager());

  // ✅ Performance-aware UI settings
  const uiSettings = useMemo(() => {
    const perfManager = getPerformanceManager();
    return perfManager.getUISettings();
  }, []);

  useEffect(() => {
    if (visible) {
      // ✅ Connect all managers to cloud when hub opens
      const cloudMgr = cloudManager.current;
      if (cloudMgr && cloudMgr.initialized) {
        dailyMissionManager.current.setCloudSaveManager(cloudMgr);
        loginRewardsManager.current.setCloudSaveManager(cloudMgr);
        luckyWheelManager.current.setCloudSaveManager(cloudMgr);  // ✅ NEW
        console.log('✅ All managers connected to cloud');
      }

      loadEngagementData();
    }
  }, [visible]);

  const loadEngagementData = async () => {  // ✅ NEW: Made async
    try {
      setIsSyncing(true);

      // ✅ Sync ALL managers from cloud first
      if (cloudManager.current && cloudManager.current.initialized) {
        await dailyMissionManager.current.syncFromCloud();
        await loginRewardsManager.current.syncFromCloud();
        await luckyWheelManager.current.syncFromCloud();  // ✅ NEW
        console.log('✅ All engagement data synced from cloud');
      }

      // Daily Missions
      if (dailyMissionManager.current) {
        const missionData = dailyMissionManager.current.getMissions();
        setMissions(missionData);
      }

      // Login Rewards (Weekly)
      if (loginRewardsManager.current) {
        const rewardData = loginRewardsManager.current.getRewardStatus ?
          loginRewardsManager.current.getRewardStatus() : [];
        const currentDay = loginRewardsManager.current.getCurrentDay();
        const streakCount = loginRewardsManager.current.getStreak();

        // 🆕 Monthly rewards
        const monthlyData = loginRewardsManager.current.getMonthlyRewardStatus ?
          loginRewardsManager.current.getMonthlyRewardStatus() : [];
        const monthlyDay = loginRewardsManager.current.getMonthlyCurrentDay ?
          loginRewardsManager.current.getMonthlyCurrentDay() : new Date().getDate();

        setLoginRewards(rewardData);
        setCurrentLoginDay(currentDay);
        setStreak(streakCount);
        setMonthlyRewards(monthlyData);
        setMonthlyCurrentDay(monthlyDay);
      }

      // Lucky Wheel
      if (luckyWheelManager.current) {
        const segments = luckyWheelManager.current.getSegments();
        const freeSpinsCount = luckyWheelManager.current.getFreeSpinsRemaining();
        const adSpinsCount = luckyWheelManager.current.getAdSpinsRemaining();
        setWheelSegments(segments);
        setFreeSpins(freeSpinsCount);
        setAdSpins(adSpinsCount);
      }

      setIsSyncing(false);
    } catch (error) {
      console.error('❌ Error loading engagement data:', error);
      setIsSyncing(false);
    }
  };

  const handleClaimMission = async (missionId) => {  // ✅ NEW: Made async
    const reward = await dailyMissionManager.current.collectReward(missionId);  // ✅ NEW: await
    if (reward && onRewardClaimed) {
      onRewardClaimed({ coins: reward });
      await loadEngagementData();  // ✅ NEW: Reload after sync
    }
  };

  const handleClaimLoginReward = async () => {  // ✅ NEW: Made async
    const hasClaimedToday = loginRewardsManager.current.hasClaimedToday ?
      loginRewardsManager.current.hasClaimedToday() : false;

    if (hasClaimedToday) return;

    const reward = await loginRewardsManager.current.claimTodayReward();
    if (reward && onRewardClaimed) {
      onRewardClaimed(reward);
      await loadEngagementData();
    }
  };

  // 🆕 Handler for claiming monthly rewards
  const handleClaimMonthlyReward = async (day) => {
    const reward = await loginRewardsManager.current.claimMonthlyReward(day);
    if (reward && onRewardClaimed) {
      onRewardClaimed(reward);
      await loadEngagementData();
    }
  };

  const handleSpin = async (type = 'free') => {
    if (isSpinning) return;

    // 1. Determine result immediately (now awaits async spin)
    const result = await luckyWheelManager.current.spin(type);  // ✅ FIXED: await async call

    if (result.success) {
      // 2. Start animation targeting the specific segment
      setTargetSegment(result.segment);
      setIsSpinning(true);
      setLastWinSegment(null);

      // 3. Wait for animation (uses performance-based duration)
      const spinDuration = uiSettings.wheelAnimationDuration * 1000; // Convert to ms
      await new Promise(resolve => setTimeout(resolve, spinDuration));

      // 4. Show win state and update data
      setLastWinSegment(result.segment);
      setFreeSpins(result.remainingFreeSpins);
      setAdSpins(result.remainingAdSpins);
      setIsSpinning(false);

      // 5. Give rewards
      if (onRewardClaimed) {
        const rewardData = {};
        if (result.segment.type === 'coins') rewardData.coins = result.segment.amount;
        if (result.segment.type === 'gems') rewardData.gems = result.segment.amount;
        if (result.segment.type === 'token') rewardData.tokens = result.segment.amount;
        if (result.segment.type === 'skin') rewardData.item = 'skin';
        onRewardClaimed(rewardData);
      }
    }
  };

  const handleWatchAdForSpin = async () => {  // ✅ FIXED: Made async
    await luckyWheelManager.current.watchAdForSpin();  // ✅ FIXED: await async call
    await loadEngagementData();  // ✅ FIXED: await reload
  };

  const isLoginRewardClaimed = loginRewardsManager.current &&
    loginRewardsManager.current.hasClaimedToday &&
    loginRewardsManager.current.hasClaimedToday();

  return (
    <div className="engagement-hub neon-panel" style={{ position: 'relative', margin: 0 }}>
      {/* Header */}
      <div className="hub-header">
        <button className='icon-btn' onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className='neon-title' style={{ fontSize: 22 }}>DAILY REWARDS</div>
        <div className='neon-sub' style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coins size={16} color="#ffd700" />
            <span style={{ color: '#ffd700', fontSize: 14 }}>{totalCoins.toLocaleString()}</span>
          </div>

          {/* Gems Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>💎</span>
            <span style={{ color: '#e0b0ff', fontSize: 14 }}>{totalGems.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="hub-tabs">
        <TabButton
          icon={<Target size={18} />}
          label="Missions"
          badge={missions.filter(m => m.completed && !m.rewardCollected).length}
          active={activeTab === 'missions'}
          onClick={() => setActiveTab('missions')}
        />
        <TabButton
          icon={<Calendar size={18} />}
          label="Calendar"
          badge={!isLoginRewardClaimed ? 1 : 0}
          active={activeTab === 'rewards'}
          onClick={() => setActiveTab('rewards')}
        />
        <TabButton
          icon={<Sparkles size={18} />}
          label="Wheel"
          badge={freeSpins + adSpins}
          active={activeTab === 'wheel'}
          onClick={() => setActiveTab('wheel')}
        />
      </div>

      {/* Content */}
      <div className="hub-content">
        {activeTab === 'missions' && (
          <MissionsTab missions={missions} onClaimReward={handleClaimMission} />
        )}
        {activeTab === 'rewards' && (
          <CalendarTab
            calendarSubTab={calendarSubTab}
            setCalendarSubTab={setCalendarSubTab}
            weeklyRewards={loginRewards}
            monthlyRewards={monthlyRewards}
            currentLoginDay={currentLoginDay}
            monthlyCurrentDay={monthlyCurrentDay}
            streak={streak}
            isLoginRewardClaimed={isLoginRewardClaimed}
            onClaimWeeklyReward={handleClaimLoginReward}
            onClaimMonthlyReward={handleClaimMonthlyReward}
          />
        )}
        {activeTab === 'wheel' && (
          <LuckyWheelTab
            segments={wheelSegments}
            freeSpins={freeSpins}
            adSpins={adSpins}
            isSpinning={isSpinning}
            targetSegment={targetSegment}
            lastWinSegment={lastWinSegment}
            onSpin={handleSpin}
            onWatchAd={handleWatchAdForSpin}
            wheelAnimationDuration={uiSettings.wheelAnimationDuration}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ icon, label, badge, active, onClick }) {
  return (
    <button onClick={onClick} className={`hub-tab-btn ${active ? 'active' : ''}`}>
      <div className="tab-icon">
        {icon}
        {badge > 0 && <span className="tab-badge">{badge}</span>}
      </div>
      <span className="tab-label">{label}</span>
    </button>
  );
}

function MissionsTab({ missions, onClaimReward }) {
  const completedCount = missions.filter(m => m.completed).length;
  return (
    <div className="missions-tab">
      <div className="missions-header">
        <div className="missions-title"><Target size={20} color="#5b8fc7" /><span>Daily Missions</span></div>
        <div className="missions-progress">{completedCount}/{missions.length} Complete</div>
      </div>
      <div className="missions-info">Complete missions to earn bonus coins! Resets at midnight.</div>
      <div className="missions-list">
        {missions.map(mission => (
          <MissionCard key={mission.id} mission={mission} onClaim={() => onClaimReward(mission.id)} />
        ))}
      </div>
    </div>
  );
}

function MissionCard({ mission, onClaim }) {
  const progress = Math.min((mission.progress / mission.target) * 100, 100);
  const isComplete = mission.completed;
  const isClaimed = mission.rewardCollected;
  return (
    <div className={`mission-card ${isComplete ? 'complete' : ''} ${isClaimed ? 'claimed' : ''}`}>
      <div className="mission-icon">{mission.icon}</div>
      <div className="mission-details">
        <div className="mission-title">{mission.title}</div>
        <div className="mission-description">{mission.description}</div>
        <div className="mission-progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        <div className="mission-stats">
          <span className="mission-progress-text">{Math.floor(mission.progress)}/{mission.target}</span>
          <span className="mission-reward"><Coins size={12} /> {mission.reward}</span>
        </div>
      </div>
      <button className={`mission-claim-btn ${isComplete && !isClaimed ? 'can-claim' : ''}`} onClick={onClaim} disabled={!isComplete || isClaimed}>
        {isClaimed ? <><Check size={16} /> Claimed</> : isComplete ? <><Gift size={16} /> Claim</> : <><Lock size={16} /> Locked</>}
      </button>
    </div>
  );
}

function LoginRewardsTab({ rewards, currentDay, streak, hasClaimedToday, onClaimReward }) {
  return (
    <div className="login-rewards-tab">
      <div className="rewards-header">
        <div className="rewards-title"><Calendar size={20} color="#5b8fc7" /><span>7-Day Weekly Calendar</span></div>
        <div className="rewards-streak"><Zap size={16} color="#ffd700" /><span>{streak} Day Streak</span></div>
      </div>
      <div className="rewards-info">Log in every day to claim amazing rewards! Miss a day and your streak resets. Weekly rewards rotate automatically!</div>
      <div className="rewards-calendar">
        {rewards.map((reward, index) => (
          <RewardCard
            key={reward.day}
            reward={reward}
            isToday={index === currentDay}
            isClaimed={index < currentDay || (index === currentDay && hasClaimedToday)}
            canClaim={index === currentDay && !hasClaimedToday}
            onClaim={onClaimReward}
          />
        ))}
      </div>
    </div>
  );
}

// 🆕 Monthly Rewards Tab Component
function MonthlyRewardsTab({ rewards, currentDay, onClaimReward }) {
  const claimedCount = rewards.filter(r => r.isClaimed).length;
  const daysInMonth = rewards.length;

  return (
    <div className="monthly-rewards-tab">
      <div className="rewards-header">
        <div className="rewards-title"><Calendar size={20} color="#ff6b9d" /><span>Monthly Calendar</span></div>
        <div className="rewards-streak" style={{ background: 'rgba(255,107,157,0.15)', borderColor: 'rgba(255,107,157,0.4)', color: '#ff6b9d' }}>
          <Check size={16} color="#ff6b9d" /><span>{claimedCount}/{daysInMonth} Claimed</span>
        </div>
      </div>
      <div className="rewards-info" style={{ borderColor: 'rgba(255,107,157,0.3)', background: 'rgba(255,107,157,0.08)', color: '#ffb3cc' }}>
        Claim today's reward! Missed days cannot be claimed later. Resets monthly with new rewards!
      </div>
      <div className="monthly-calendar-grid">
        {rewards.map((reward) => (
          <MonthlyRewardCard
            key={reward.day}
            reward={reward}
            isToday={reward.isToday}
            isClaimed={reward.isClaimed}
            canClaim={reward.isAvailable}
            isFuture={reward.isFuture}
            isMissed={reward.isMissed}
            onClaim={() => onClaimReward(reward.day)}
          />
        ))}
      </div>
    </div>
  );
}

// 🆕 Monthly Reward Card (smaller, for grid display)
function MonthlyRewardCard({ reward, isToday, isClaimed, canClaim, isFuture, isMissed, onClaim }) {
  const getCardClass = () => {
    let cls = 'monthly-reward-card';
    if (isToday) cls += ' today';
    if (isClaimed) cls += ' claimed';
    if (isFuture) cls += ' future';
    if (isMissed) cls += ' missed';  // 🆕 Missed styling
    if (reward.isMega) cls += ' mega';
    if (reward.isBonus) cls += ' bonus';
    if (reward.isWeekly) cls += ' weekly';
    return cls;
  };

  const getRewardIcon = () => {
    if (isMissed) return '❌';  // 🆕 Show X for missed days
    if (reward.coins > 0 && reward.gems > 0) return '🎁';
    if (reward.coins > 0) return '🪙';
    if (reward.gems > 0) return '💎';
    if (reward.tokens > 0) return '💫';
    return '🎁';
  };

  return (
    <div className={getCardClass()} onClick={canClaim ? onClaim : undefined}>
      <div className="monthly-day">{reward.day}</div>
      <div className="monthly-icon">{getRewardIcon()}</div>
      {isClaimed && <div className="monthly-check"><Check size={12} /></div>}
      {canClaim && <div className="monthly-claim-indicator">TAP</div>}
      {isFuture && <div className="monthly-lock"><Lock size={10} /></div>}
      {isMissed && <div className="monthly-missed">MISSED</div>}
    </div>
  );
}

// 🆕 Calendar Tab Container with Weekly/Monthly toggle
function CalendarTab({
  calendarSubTab, setCalendarSubTab,
  weeklyRewards, monthlyRewards,
  currentLoginDay, monthlyCurrentDay,
  streak, isLoginRewardClaimed,
  onClaimWeeklyReward, onClaimMonthlyReward
}) {
  return (
    <div className="calendar-tab">
      {/* Sub-tab toggle */}
      <div className="calendar-subtabs">
        <button
          className={`calendar-subtab ${calendarSubTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setCalendarSubTab('weekly')}
        >
          <Calendar size={14} /> Weekly
        </button>
        <button
          className={`calendar-subtab ${calendarSubTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setCalendarSubTab('monthly')}
        >
          <Calendar size={14} /> Monthly
        </button>
      </div>

      {/* Render selected calendar */}
      {calendarSubTab === 'weekly' ? (
        <LoginRewardsTab
          rewards={weeklyRewards}
          currentDay={currentLoginDay}
          streak={streak}
          hasClaimedToday={isLoginRewardClaimed}
          onClaimReward={onClaimWeeklyReward}
        />
      ) : (
        <MonthlyRewardsTab
          rewards={monthlyRewards}
          currentDay={monthlyCurrentDay}
          onClaimReward={onClaimMonthlyReward}
        />
      )}
    </div>
  );
}

// Weekly Reward Card
function RewardCard({ reward, isToday, isClaimed, canClaim, onClaim }) {
  const getRewardIcon = () => {
    if (reward.coins > 0 && reward.gems > 0) return '🎁';
    if (reward.coins > 0) return '🪙';
    if (reward.gems > 0) return '💎';
    if (reward.tokens > 0) return '💫';
    if (reward.trail) return '✨';
    return '🎁';
  };

  return (
    <div className={`reward-card ${isToday ? 'today' : ''} ${isClaimed ? 'claimed' : ''}`}>
      <div className="reward-day">Day {reward.day}</div>
      <div className="reward-icon-container">
        <div className="reward-icon">{getRewardIcon()}</div>
        {isClaimed && <div className="reward-check"><Check size={20} /></div>}
      </div>
      <div className="reward-name">{reward.description}</div>
      {canClaim && (
        <button className="reward-claim-btn glow-btn btn-primary" onClick={onClaim}><Gift size={14} /> Claim</button>
      )}
      {isToday && !canClaim && !isClaimed && <div className="reward-pending">Today</div>}
    </div>
  );
}

// ============= LUCKY WHEEL TAB (FIXED ROTATION LOGIC) =============
function LuckyWheelTab({ segments, freeSpins, adSpins, isSpinning, targetSegment, lastWinSegment, onSpin, onWatchAd, wheelAnimationDuration = 4 }) {
  const [rotation, setRotation] = useState(0);
  const animDuration = wheelAnimationDuration || 4; // ✅ Use performance-based duration

  // Initialize rotation
  useEffect(() => {
    setRotation(Math.random() * 360);
  }, []);

  // Spin Logic
  useEffect(() => {
    if (isSpinning && targetSegment) {
      const segmentIndex = segments.findIndex(s => s.id === targetSegment.id);
      if (segmentIndex === -1) return;

      const count = segments.length;
      const anglePerSegment = 360 / count;

      // Calculate the angle required to place the target segment at -90 (top)
      // Center of segment i is at: -90 + (i + 0.5) * angle
      // To bring it to top (-90), we must subtract (i + 0.5) * angle
      const targetBaseAngle = -(segmentIndex + 0.5) * anglePerSegment;

      // Add small random noise within the segment (+/- 40%)
      const noise = (Math.random() - 0.5) * (anglePerSegment * 0.8);

      // Calculate total rotation:
      // Ensure we spin at least 5 full times (5 * 360)
      // And always spin FORWARD (increasing angle)
      const spinCount = 5;
      const rawTarget = targetBaseAngle + noise;

      // Find the next multiple of 360 + target that exceeds current rotation by at least min spins
      let nextRotation = rawTarget;
      while (nextRotation < rotation + (spinCount * 360)) {
        nextRotation += 360;
      }

      setRotation(nextRotation);
    }
  }, [isSpinning, targetSegment, segments]); // Removed rotation dependency to avoid loop

  // Helper for text color
  const isLightColor = (color) => {
    const lightColors = ['#ffd700', '#ffed4e', '#ffff00', '#ffffff', '#ccffcc'];
    return lightColors.includes(color.toLowerCase());
  };

  return (
    <div className="lucky-wheel-tab">
      <div className="wheel-header">
        <div className="wheel-title"><Sparkles size={20} color="#5b8fc7" /><span>Lucky Wheel</span></div>
        <div className="wheel-spins"><Star size={16} color="#ffd700" /><span>{freeSpins + adSpins} Spins</span></div>
      </div>
      <div className="wheel-info">Spin the wheel for instant rewards! Get 1 free spin daily or watch ads for more.</div>

      <div className="wheel-container">
        <div className="wheel-pointer"><div className="pointer-triangle"></div></div>

        <div className="wheel" style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? `transform ${animDuration}s cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none' }}>
          <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {segments.map((segment, index) => {
              const count = segments.length;
              const angle = 360 / count;
              const startAngle = (index * angle) - 90;
              const endAngle = ((index + 1) * angle) - 90;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const radius = 148;
              const center = 150;

              const x1 = center + radius * Math.cos(startRad);
              const y1 = center + radius * Math.sin(startRad);
              const x2 = center + radius * Math.cos(endRad);
              const y2 = center + radius * Math.sin(endRad);

              const largeArc = angle > 180 ? 1 : 0;
              const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

              const midAngle = startAngle + (angle / 2);
              const midRad = (midAngle * Math.PI) / 180;
              const textRadius = 100;
              const tx = center + textRadius * Math.cos(midRad);
              const ty = center + textRadius * Math.sin(midRad);

              // ✅ FIX: Dynamic text color based on background
              const textColor = isLightColor(segment.color) ? '#000000' : '#ffffff';
              const textShadow = isLightColor(segment.color) ? 'none' : '0 1px 2px rgba(0,0,0,0.8)';

              return (
                <g key={segment.id}>
                  <path d={d} fill={segment.color} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <text
                    x={tx}
                    y={ty}
                    fill={textColor}
                    fontSize="12"
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                    style={{ textShadow: textShadow }}
                  >
                    {segment.amount}
                  </text>
                  <text
                    x={tx}
                    y={ty + 12}
                    fill={textColor}
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                    style={{ textTransform: 'uppercase', opacity: 0.9 }}
                  >
                    {segment.type}
                  </text>
                </g>
              );
            })}

            <circle cx="150" cy="150" r="15" fill="#1a1a2e" stroke="#5b8fc7" strokeWidth="3" />
            <circle cx="150" cy="150" r="5" fill="#5b8fc7" />
          </svg>
        </div>
      </div>

      {lastWinSegment && !isSpinning && (
        <div className="wheel-win-display">
          <Trophy size={20} color="#ffd700" />
          <span>You won: {lastWinSegment.amount} {lastWinSegment.type}!</span>
        </div>
      )}

      <div className="wheel-buttons">
        <button className="glow-btn btn-primary" onClick={() => onSpin('free')} disabled={freeSpins === 0 || isSpinning} style={{ flex: 1 }}>
          <Play size={16} /> Free Spin ({freeSpins})
        </button>
        <button className="glow-btn" onClick={() => onSpin('ad')} disabled={adSpins === 0 || isSpinning} style={{ flex: 1, background: 'rgba(255, 100, 100, 0.1)' }}>
          <Play size={16} /> Ad Spin ({adSpins})
        </button>
      </div>

      <button className="wheel-watch-ad-btn" onClick={onWatchAd} disabled={adSpins >= 3}>
        <TrendingUp size={14} /> Watch Ad for Extra Spin (Max 3/day)
      </button>
    </div>
  );
}