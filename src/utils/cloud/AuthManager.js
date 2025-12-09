/**
 * AuthManager.js
 * Centralized authentication management for Cyber Runner 3D
 * 
 * Supported Sign-In Methods:
 * - Email/Password
 * - Google
 * - Apple (requires iOS setup)
 * - Game Center (requires iOS setup)
 * - Anonymous
 */

import { 
  auth,
  signInAnonymously,
  onAuthStateChanged,
  isFirebaseReady,
  getFirebaseError
} from './firebase-config.js';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    
    // ✅ FIX: Check if Firebase is ready before initializing
    if (!isFirebaseReady()) {
      console.error('❌ Firebase not ready, AuthManager disabled');
      const error = getFirebaseError();
      if (error) {
        console.error('Firebase error:', error);
      }
      // Notify listeners with null user
      setTimeout(() => this.notifyListeners(null), 0);
      return;
    }
    
    this.initializeAuthListener();
  }

  /**
   * Initialize authentication state listener
   */
  initializeAuthListener() {
    // ✅ FIX: Check auth exists
    if (!auth || !auth.onAuthStateChanged) {
      console.error('❌ Auth not available');
      return;
    }
    
    try {
      onAuthStateChanged(auth, (user) => {
        console.log('🔐 Auth state changed:', user ? `User ${user.uid}` : 'No user');
        this.currentUser = user;
        this.notifyListeners(user);
      });
    } catch (error) {
      console.error('❌ Failed to set up auth listener:', error);
    }
  }

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Called when auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    if (this.currentUser !== null) {
      callback(this.currentUser);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  notifyListeners(user) {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  /**
   * Get current user
   * @returns {Object|null} Current Firebase user
   */
  getCurrentUser() {
    return this.currentUser || auth.currentUser;
  }

  /**
   * Check if user is signed in
   * @returns {boolean}
   */
  isSignedIn() {
    return !!this.getCurrentUser();
  }

  /**
   * Check if current user is anonymous
   * @returns {boolean}
   */
  isAnonymous() {
    const user = this.getCurrentUser();
    return user ? user.isAnonymous : false;
  }

  // ==================== ANONYMOUS SIGN-IN ====================
  
  /**
   * Sign in anonymously
   * @returns {Promise<Object>} User credential
   */
  async signInAnonymously() {
    try {
      console.log('🎭 Signing in anonymously...');
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Anonymous sign-in successful:', userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== EMAIL/PASSWORD ====================
  
  /**
   * Create account with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - Optional display name
   * @returns {Promise<Object>} User credential
   */
  async signUpWithEmail(email, password, displayName = null) {
    try {
      console.log('📧 Creating account with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      console.log('✅ Email sign-up successful:', userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('❌ Email sign-up failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User credential
   */
  async signInWithEmail(email, password) {
    try {
      console.log('📧 Signing in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Email sign-in successful:', userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('❌ Email sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async sendPasswordReset(email) {
    try {
      console.log('🔑 Sending password reset to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== GOOGLE SIGN-IN ====================
  
  /**
   * Sign in with Google
   * @returns {Promise<Object>} User credential
   */
  async signInWithGoogle() {
    try {
      console.log('🔍 Signing in with Google...');
      const provider = new GoogleAuthProvider();
      
      // Optional: Add custom parameters
      provider.addScope('profile');
      provider.addScope('email');
      
      const userCredential = await signInWithPopup(auth, provider);
      console.log('✅ Google sign-in successful:', userCredential.user.uid);
      
      // Get Google access token if needed
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      const token = credential?.accessToken;
      
      return { userCredential, token };
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== APPLE SIGN-IN ====================
  
  /**
   * Sign in with Apple
   * Note: Requires proper iOS setup and domain verification
   * @returns {Promise<Object>} User credential
   */
  async signInWithApple() {
    try {
      console.log('🍎 Signing in with Apple...');
      const provider = new OAuthProvider('apple.com');
      
      // Optional: Request additional scopes
      provider.addScope('email');
      provider.addScope('name');
      
      const userCredential = await signInWithPopup(auth, provider);
      console.log('✅ Apple sign-in successful:', userCredential.user.uid);
      
      return userCredential;
    } catch (error) {
      console.error('❌ Apple sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== GAME CENTER (iOS) ====================
  
  /**
   * Sign in with Game Center
   * Note: This requires native iOS integration via Capacitor/Cordova
   * This is a placeholder for web - actual implementation needs native bridge
   * @returns {Promise<void>}
   */
  async signInWithGameCenter() {
    console.warn('🎮 Game Center sign-in requires native iOS implementation');
    console.warn('This will only work in a native iOS app, not in web browser');
    
    // For web, we can show a message or redirect to another method
    throw new Error('Game Center sign-in is only available on iOS devices');
    
    // Native implementation would use:
    // 1. Capacitor plugin: @capacitor/game-center
    // 2. Get Game Center credentials
    // 3. Create custom token on backend
    // 4. Sign in with custom token
  }

  // ==================== ACCOUNT LINKING ====================
  
  /**
   * Link anonymous account with email/password
   * This preserves the user's progress when upgrading from anonymous
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User credential
   */
  async linkAnonymousAccountWithEmail(email, password) {
    try {
      const user = this.getCurrentUser();
      
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      if (!user.isAnonymous) {
        throw new Error('Current user is not anonymous');
      }
      
      console.log('🔗 Linking anonymous account with email...');
      const credential = EmailAuthProvider.credential(email, password);
      const userCredential = await linkWithCredential(user, credential);
      
      console.log('✅ Account linked successfully');
      return userCredential;
    } catch (error) {
      console.error('❌ Account linking failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Link anonymous account with Google
   * @returns {Promise<Object>} User credential
   */
  async linkAnonymousAccountWithGoogle() {
    try {
      const user = this.getCurrentUser();
      
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      if (!user.isAnonymous) {
        throw new Error('Current user is not anonymous');
      }
      
      console.log('🔗 Linking anonymous account with Google...');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      console.log('✅ Account linked successfully with Google');
      return userCredential;
    } catch (error) {
      console.error('❌ Google account linking failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== SIGN OUT ====================
  
  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      console.log('👋 Signing out...');
      await firebaseSignOut(auth);
      console.log('✅ Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== USER PROFILE ====================
  
  /**
   * Update user profile
   * @param {Object} updates - Profile updates (displayName, photoURL)
   * @returns {Promise<void>}
   */
  async updateUserProfile(updates) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      console.log('👤 Updating user profile...');
      await updateProfile(user, updates);
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user password
   * ⚠️ IMPORTANT: Requires user to be recently authenticated (within ~5 minutes)
   * If auth/requires-recent-login error occurs, user must sign in again
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updatePassword(currentPassword, newPassword) {
    try {
      const user = this.getCurrentUser();
      
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      if (!user.email) {
        throw new Error('User does not have an email associated');
      }
      
      if (user.isAnonymous) {
        throw new Error('Cannot update password for anonymous accounts');
      }
      
      console.log('🔑 Updating password for user:', user.email);
      
      // Step 1: Re-authenticate user with current password
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        console.log('✅ Re-authentication successful');
      } catch (reAuthError) {
        console.error('❌ Re-authentication failed:', reAuthError.code);
        if (reAuthError.code === 'auth/wrong-password') {
          throw new Error('Current password is incorrect');
        }
        throw reAuthError;
      }
      
      // Step 2: Update password
      try {
        await firebaseUpdatePassword(user, newPassword);
        console.log('✅ Password updated successfully');
      } catch (updateError) {
        console.error('❌ Password update failed:', updateError.code);
        if (updateError.code === 'auth/weak-password') {
          throw new Error('New password is too weak');
        }
        throw updateError;
      }
      
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get user profile data
   * @returns {Object|null} User profile data
   */
  getUserProfile() {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    };
  }

  // ==================== ERROR HANDLING ====================
  
  /**
   * Handle Firebase auth errors and return user-friendly messages
   * @param {Error} error - Firebase error
   * @returns {Error} Error with friendly message
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'This sign-in method is not enabled',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many failed attempts. Try again later',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/popup-closed-by-user': 'Sign-in cancelled',
      'auth/cancelled-popup-request': 'Sign-in cancelled',
      'auth/popup-blocked': 'Popup blocked by browser. Please allow popups',
      'auth/account-exists-with-different-credential': 'Account exists with different sign-in method',
      'auth/credential-already-in-use': 'This credential is already linked to another account'
    };
    
    const friendlyMessage = errorMessages[error.code] || error.message;
    const friendlyError = new Error(friendlyMessage);
    friendlyError.code = error.code;
    friendlyError.originalError = error;
    
    return friendlyError;
  }

  // ==================== AUTO SIGN-IN ====================
  
  /**
   * Automatically sign in user (anonymous if no existing session)
   * Call this on app startup
   * @returns {Promise<Object|null>} User credential or null if already signed in
   */
  async autoSignIn() {
    try {
      // Check if user is already signed in
      if (this.isSignedIn()) {
        console.log('👤 User already signed in:', this.getCurrentUser().uid);
        return null;
      }
      
      // Sign in anonymously for new users
      console.log('🎭 No existing session, signing in anonymously...');
      return await this.signInAnonymously();
    } catch (error) {
      console.error('❌ Auto sign-in failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authManager = new AuthManager();
