/**
 * FIXED: Simple EngagementHubNew Component for Testing
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function EngagementHubNew({ 
  visible, 
  onBack,
  totalCoins,
  onRewardClaimed 
}) {
  console.log('🎁 EngagementHubNew RENDERING!', { visible, totalCoins });
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#0f0f1e',
      color: 'white',
      padding: '20px',
      borderRadius: '12px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid rgba(91,143,199,0.3)'
      }}>
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(91,143,199,0.2)',
            border: '2px solid #5b8fc7',
            borderRadius: '8px',
            padding: '10px 15px',
            color: '#5b8fc7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          <ArrowLeft size={20} /> Back
        </button>
        
        <h2 style={{
          fontSize: '28px',
          color: '#5b8fc7',
          textShadow: '0 0 20px #5b8fc7',
          margin: 0
        }}>
          DAILY REWARDS
        </h2>
        
        <div style={{
          background: 'rgba(255,215,0,0.2)',
          border: '2px solid #ffd700',
          borderRadius: '8px',
          padding: '8px 16px',
          color: '#ffd700',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          💰 {totalCoins?.toLocaleString() || 0}
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#9b7fc7', fontSize: '24px', marginBottom: '15px' }}>
          🎉 Daily Rewards System
        </h3>
        
        <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '20px' }}>
          Complete daily missions, claim login rewards, and spin the lucky wheel!
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginTop: '30px'
        }}>
          {/* Daily Missions */}
          <div style={{
            background: 'rgba(91,143,199,0.1)',
            border: '2px solid rgba(91,143,199,0.4)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎯</div>
            <h4 style={{ color: '#5b8fc7', marginBottom: '8px' }}>Daily Missions</h4>
            <p style={{ fontSize: '14px', color: '#888' }}>Complete tasks for bonus coins</p>
          </div>

          {/* Login Rewards */}
          <div style={{
            background: 'rgba(255,100,255,0.1)',
            border: '2px solid rgba(255,100,255,0.4)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📅</div>
            <h4 style={{ color: '#9b7fc7', marginBottom: '8px' }}>Login Calendar</h4>
            <p style={{ fontSize: '14px', color: '#888' }}>7-day reward streak</p>
          </div>

          {/* Lucky Wheel */}
          <div style={{
            background: 'rgba(255,215,0,0.1)',
            border: '2px solid rgba(255,215,0,0.4)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎡</div>
            <h4 style={{ color: '#ffd700', marginBottom: '8px' }}>Lucky Wheel</h4>
            <p style={{ fontSize: '14px', color: '#888' }}>Spin for instant rewards</p>
          </div>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: 'rgba(255,255,0,0.1)',
          border: '2px solid rgba(255,255,0,0.3)',
          borderRadius: '8px',
          color: '#ff0'
        }}>
          ⚠️ <strong>Note:</strong> Full engagement system coming soon! This is a placeholder to test rendering.
        </div>
      </div>
    </div>
  );
}
