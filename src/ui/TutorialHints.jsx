import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './TutorialHints.css';

const TutorialHints = ({ menuState, distance = 0 }) => {
  const [visible, setVisible] = useState(false);
  const [displayHint, setDisplayHint] = useState('');
  const [icon, setIcon] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const hideTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  // Initialize hints from localStorage
  const shownHintsRef = useRef(null);
  if (shownHintsRef.current === null) {
    try {
      const saved = localStorage.getItem('cyberrunner_tutorial_hints');
      shownHintsRef.current = new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      shownHintsRef.current = new Set();
    }
  }

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      setIsMobile(isTouchDevice || isSmallScreen || isMobileUA);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show tutorial hints based on distance milestones
  useEffect(() => {
    if (menuState !== 'playing') return;

    const showHint = (hintKey, text, iconSymbol, duration = 5000) => {
      if (shownHintsRef.current.has(hintKey)) return;

      console.log(`[TutorialHint] Showing hint: ${hintKey}`);
      shownHintsRef.current.add(hintKey);

      // Persist to localStorage
      try {
        localStorage.setItem('cyberrunner_tutorial_hints', JSON.stringify([...shownHintsRef.current]));
      } catch (e) {
        console.error('Failed to save tutorial hints', e);
      }

      setDisplayHint(text);
      setIcon(iconSymbol);
      setVisible(true);

      // Clear any existing timers before setting new ones
      if (hideTimerRef.current) {
        console.log('[TutorialHint] Clearing previous hide timer');
        clearTimeout(hideTimerRef.current);
      }
      if (clearTimerRef.current) {
        console.log('[TutorialHint] Clearing previous clear timer');
        clearTimeout(clearTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        console.log(`[TutorialHint] Hide timer fired for: ${hintKey}`);
        setVisible(false);
        // Clear the hint content after fade animation completes
        clearTimerRef.current = setTimeout(() => {
          console.log(`[TutorialHint] Clear timer fired for: ${hintKey}`);
          setDisplayHint('');
          setIcon('');
          hideTimerRef.current = null;
          clearTimerRef.current = null;
        }, 500); // Match the CSS transition duration
      }, duration);
    };

    // Tutorial hint progression based on distance
    if (distance >= 0 && distance < 50) {
      if (isMobile) {
        showHint('swipe-left', 'Swipe Left to Move', '←');
      } else {
        showHint('key-a', 'Press [A] to Move Left', '←');
      }
    } else if (distance >= 50 && distance < 100) {
      if (isMobile) {
        showHint('swipe-right', 'Swipe Right to Move', '→');
      } else {
        showHint('key-d', 'Press [D] to Move Right', '→');
      }
    } else if (distance >= 100 && distance < 200) {
      if (isMobile) {
        showHint('swipe-up', 'Swipe Up or Tap to Jump', '↑');
      } else {
        showHint('key-space', 'Press [SPACE] to Jump', '↑');
      }
    } else if (distance >= 200 && distance < 300) {
      if (isMobile) {
        showHint('swipe-down', 'Swipe Down to Slide', '↓');
      } else {
        showHint('key-ctrl', 'Press [CTRL] to Slide', '↓');
      }
    }

    // NO cleanup return here - let timers complete naturally
    // This effect re-runs on every distance change, but we don't want to cancel timers
  }, [distance, menuState, isMobile]);

  // Reset hints when game restarts - THIS is where we clean up
  useEffect(() => {
    if (menuState !== 'playing') {
      console.log('[TutorialHint] Game not playing - clearing display');
      // shownHintsRef.current.clear(); // REMOVED: Do not clear seen hints
      setVisible(false);
      setDisplayHint('');
      setIcon('');
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    }
  }, [menuState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[TutorialHint] Component unmounting - clearing timers');
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  if (!displayHint || menuState !== 'playing') return null;

  const content = (
    <div
      className={`tutorial-hint-container ${visible ? 'visible' : 'hidden'} ${isMobile ? 'mobile-mode' : ''}`}
    >
      <div className="tutorial-hint-content">
        {icon && <span className="tutorial-icon">{icon}</span>}
        <span className="tutorial-text">{displayHint}</span>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default TutorialHints;
