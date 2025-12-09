import React, { useState, useEffect } from 'react';
import { authManager } from '../utils/cloud/AuthManager.js';
import './AuthPanel.css';

/**
 * AuthPanel Component
 * Handles all authentication UI and flows
 */
export default function AuthPanel({ onClose, onAuthSuccess }) {
  console.log('🔐 AuthPanel RENDER:', { onClose: !!onClose, onAuthSuccess: !!onAuthSuccess });
  
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'reset', 'link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authManager.getCurrentUser();
    setCurrentUser(user);

    // Auto-close panel if user is logged in and not anonymous
    if (user && !user.isAnonymous) {
      console.log('✅ User is logged in, closing auth panel');
      setTimeout(() => {
        onClose?.();
      }, 1000);
      return;
    }

    if (user && user.isAnonymous) {
      setMode('link');
    }

    const unsubscribe = authManager.onAuthStateChange((user) => {
      setCurrentUser(user);
      // Auto-close when user becomes authenticated (not anonymous)
      if (user && !user.isAnonymous) {
        console.log('✅ User authenticated, closing auth panel');
        setTimeout(() => {
          onClose?.();
        }, 1000);
      }
    });

    return unsubscribe;
  }, [onClose]);

  const clearMessages = () => {
    setError('');
    setMessage('');
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    try {
      await authManager.signInWithEmail(email, password);
      setMessage('Successfully signed in!');
      setTimeout(() => onAuthSuccess?.(), 1000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authManager.signUpWithEmail(email, password, displayName || null);
      setMessage('Account created successfully!');
      setTimeout(() => onAuthSuccess?.(), 1000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      await authManager.signInWithGoogle();
      setMessage('Successfully signed in with Google!');
      setTimeout(() => onAuthSuccess?.(), 1000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAppleSignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      await authManager.signInWithApple();
      setMessage('Successfully signed in with Apple!');
      setTimeout(() => onAuthSuccess?.(), 1000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true);
    try {
      await authManager.sendPasswordReset(email);
      setMessage('Password reset email sent! Check your inbox.');
      setTimeout(() => setMode('signin'), 3000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleLinkAccountWithEmail = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authManager.linkAnonymousAccountWithEmail(email, password);
      setMessage('Account linked successfully! Your progress is saved.');
      setTimeout(() => onAuthSuccess?.(), 1000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleLinkAccountWithGoogle = async () => {
    clearMessages();
    setLoading(true);
    try {
      await authManager.linkAnonymousAccountWithGoogle();
      setMessage('Account linked with Google! Your progress is saved.');
      setTimeout(() => onAuthSuccess?.(), 1000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const renderSignInForm = () => (
    <div className="auth-form">
      <h2 className="auth-title">Sign In</h2>
      <p className="auth-subtitle">Welcome back to Cyber Runner!</p>
      <form onSubmit={handleEmailSignIn}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading} autoComplete="email" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} autoComplete="current-password" />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <div className="auth-divider"><span>OR</span></div>
      <div className="social-buttons">
        <button onClick={handleGoogleSignIn} className="btn-google" disabled={loading}>Continue with Google</button>
        <button onClick={handleAppleSignIn} className="btn-apple" disabled={loading}>Continue with Apple</button>
      </div>
      <div className="auth-footer">
        <button onClick={() => setMode('reset')} className="link-button" disabled={loading}>Forgot password?</button>
        <span className="footer-divider">•</span>
        <button onClick={() => setMode('signup')} className="link-button" disabled={loading}>Create account</button>
      </div>
    </div>
  );

  const renderSignUpForm = () => (
    <div className="auth-form">
      <h2 className="auth-title">Create Account</h2>
      <p className="auth-subtitle">Join the Cyber Runner community!</p>
      <form onSubmit={handleEmailSignUp}>
        <div className="form-group">
          <label>Display Name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Runner123" disabled={loading} autoComplete="name" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading} autoComplete="email" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} autoComplete="new-password" minLength={6} />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} autoComplete="new-password" />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
      </form>
      <div className="auth-footer">
        <span>Already have an account?</span>
        <button onClick={() => setMode('signin')} className="link-button" disabled={loading}>Sign In</button>
      </div>
    </div>
  );

  const renderResetForm = () => (
    <div className="auth-form">
      <h2 className="auth-title">Reset Password</h2>
      <p className="auth-subtitle">Enter your email to receive a reset link</p>
      <form onSubmit={handlePasswordReset}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading} autoComplete="email" />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
      </form>
      <div className="auth-footer">
        <button onClick={() => setMode('signin')} className="link-button" disabled={loading}>Back to Sign In</button>
      </div>
    </div>
  );

  const renderLinkForm = () => (
    <div className="auth-form">
      <h2 className="auth-title">Save Your Progress</h2>
      <p className="auth-subtitle">Link your anonymous account to keep your progress forever!</p>

      {/* ✅ FIXED: Wrapped text in info-content for flexbox handling */}
      <div className="info-box">
        <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div className="info-content">
          <p>You're currently playing as a guest. Link your account to:</p>
          <ul>
            <li>Save your progress across devices</li>
            <li>Compete on global leaderboards</li>
            <li>Never lose your upgrades</li>
          </ul>
        </div>
      </div>

      <div className="social-buttons">
        <button onClick={handleLinkAccountWithGoogle} className="btn-google" disabled={loading}>Link with Google</button>
      </div>

      <div className="auth-divider"><span>OR</span></div>

      <form onSubmit={handleLinkAccountWithEmail}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading} autoComplete="email" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} autoComplete="new-password" minLength={6} />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} autoComplete="new-password" />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Linking account...' : 'Link with Email'}</button>
      </form>

      <div className="auth-footer">
        <button onClick={() => setMode('signin')} className="link-button" disabled={loading}>Already have an account? Sign In</button>
        <span className="footer-divider">•</span>
        <button onClick={onClose} className="link-button" disabled={loading}>Continue as Guest</button>
      </div>
    </div>
  );

  // Don't show panel if user is already authenticated (not anonymous)
  if (currentUser && !currentUser.isAnonymous) {
    console.log('⚠️ User already authenticated, not showing auth panel');
    return null;
  }

  return (
    <div className="auth-panel-overlay">
      <div className="auth-panel">
        <button className="close-button" onClick={onClose} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {error && (
          <div className="message-box error">
            <span>⚠️</span> {error}
          </div>
        )}

        {message && (
          <div className="message-box success">
             <span>✅</span> {message}
          </div>
        )}

        {mode === 'signin' && renderSignInForm()}
        {mode === 'signup' && renderSignUpForm()}
        {mode === 'reset' && renderResetForm()}
        {mode === 'link' && renderLinkForm()}
      </div>
    </div>
  );
}