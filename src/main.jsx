import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './refined-theme.css'; // ✅ FIRST: CSS Variables & Theme Base
import './index.css'; // ✅ SECOND: Global styles
import './mobile-safe.css'; // ✅ THIRD: Mobile-specific overrides

// ✅ PHASE 0.1 & 0.4: Initialize Mobile Responsiveness & Analytics
import { mobileResponsiveness } from './utils/mobile/MobileResponsivenessManager.js';
import { analytics } from './utils/analytics/AnalyticsManager.js';

// Initialize mobile responsiveness system
mobileResponsiveness.init();

// Log device info for debugging
const deviceInfo = mobileResponsiveness.getDeviceInfo();
console.log('🔧 Device Info:', deviceInfo);

// Track app launch
analytics.trackEvent('app_launch', {
  platform: deviceInfo.isMobile ? 'mobile' : 'desktop',
  performanceTier: deviceInfo.performanceTier,
  screenSize: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`
});

// Global error handler for analytics
window.addEventListener('error', (event) => {
  analytics.trackEvent('error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno
  });
});

// Track page visibility changes (backgrounding)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    analytics.trackEvent('app_backgrounded');
  } else {
    analytics.trackEvent('app_foregrounded');
  }
});

// Render app
createRoot(document.getElementById('root')).render(<App />);

// Expose analytics to console for debugging
if (import.meta.env.DEV) {
  window.analytics = analytics;
  window.mobileResponsiveness = mobileResponsiveness;
  console.log('🎮 Development mode: Access analytics via window.analytics');
  console.log('📱 Access mobile system via window.mobileResponsiveness');
}
