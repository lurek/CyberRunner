/**
 * AccountProfileManager.js
 * Centralized management for user account operations and profile updates
 */

import { authManager } from './AuthManager.js';
import { getCloudSaveManager } from './CloudSaveManager.js';

class AccountProfileManager {
  constructor() {
    this.profileListeners = [];
    console.log('✅ AccountProfileManager initialized');
  }

  onProfileChange(callback) {
    this.profileListeners.push(callback);
    return () => {
      this.profileListeners = this.profileListeners.filter(l => l !== callback);
    };
  }

  notifyProfileChange(profile) {
    this.profileListeners.forEach(listener => {
      try {
        listener(profile);
      } catch (error) {
        console.error('Error in profile listener:', error);
      }
    });
  }

  getUserProfile() {
    const profile = authManager.getUserProfile();
    if (profile) {
      console.log('👤 User Profile Retrieved:', {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        isAnonymous: profile.isAnonymous,
        emailVerified: profile.emailVerified
      });
    }
    return profile;
  }

  validateUsername(username) {
    const errors = [];
    
    if (!username || username.trim().length === 0) {
      errors.push('Username cannot be empty');
    }
    
    if (username.length > 30) {
      errors.push('Username must be 30 characters or less');
    }
    
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async updateUsername(newName) {
    try {
      const validation = this.validateUsername(newName);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const trimmedName = newName.trim();
      const currentProfile = this.getUserProfile();
      
      if (!currentProfile) {
        throw new Error('No user is currently signed in');
      }
      
      if (trimmedName === currentProfile.displayName) {
        console.log('ℹ️ Username is the same, no update needed');
        return currentProfile;
      }
      
      console.log('👤 Updating username from', currentProfile.displayName, 'to', trimmedName);
      
      await authManager.updateUserProfile({
        displayName: trimmedName
      });
      
      try {
        const cloudManager = getCloudSaveManager();
        if (cloudManager && cloudManager.isConnected) {
          await cloudManager.updateUserProfile({ 
            displayName: trimmedName,
            lastUpdated: new Date().toISOString()
          });
          console.log('☁️ Profile synced to cloud');
        }
      } catch (cloudError) {
        console.warn('⚠️ Cloud sync failed, but profile updated locally:', cloudError);
      }
      
      const updatedProfile = this.getUserProfile();
      this.notifyProfileChange(updatedProfile);
      
      console.log('✅ Username updated successfully');
      return updatedProfile;
      
    } catch (error) {
      console.error('❌ Username update failed:', error);
      throw error;
    }
  }

  validatePassword(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Password cannot be empty');
    }
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async changePassword(currentPassword, newPassword) {
    try {
      if (!currentPassword) {
        throw new Error('Current password is required');
      }
      
      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }
      
      const currentProfile = this.getUserProfile();
      if (!currentProfile) {
        throw new Error('No user is currently signed in');
      }
      
      console.log('🔑 Initiating password change for user:', currentProfile.email);
      
      await authManager.updatePassword(currentPassword, newPassword);
      
      console.log('✅ Password changed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Password change failed:', error);
      
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      }
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Please sign in again to change your password');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Use a stronger password');
      }
      
      throw error;
    }
  }

  canChangePassword() {
    const profile = this.getUserProfile();
    return profile && !profile.isAnonymous && !!profile.email;
  }

  async sendPasswordResetEmail(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      console.log('📧 Sending password reset email to:', email);
      
      await authManager.sendPasswordReset(email);
      
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const profile = this.getUserProfile();
      console.log('👋 Logging out user:', profile?.email || 'Anonymous');
      
      try {
        localStorage.removeItem('cyberrunner_profile');
        localStorage.removeItem('cyberrunner_session');
      } catch (e) {
        console.warn('⚠️ localStorage not available');
      }
      
      this.profileListeners = [];
      
      await authManager.signOut();
      
      console.log('✅ Logged out successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  getAccountStats() {
    const profile = this.getUserProfile();
    
    if (!profile) return null;
    
    return {
      accountType: profile.isAnonymous ? 'guest' : 'verified',
      email: profile.email || 'Not linked',
      username: profile.displayName || 'Player',
      emailVerified: profile.emailVerified,
      createdAt: profile.metadata?.creationTime,
      lastSignIn: profile.metadata?.lastSignInTime,
      uid: profile.uid
    };
  }

  async linkAnonymousWithEmail(email, password) {
    try {
      const profile = this.getUserProfile();
      
      if (!profile) {
        throw new Error('No user is currently signed in');
      }
      
      if (!profile.isAnonymous) {
        throw new Error('Account is already linked');
      }
      
      console.log('🔗 Linking anonymous account with email:', email);
      
      await authManager.linkAnonymousAccountWithEmail(email, password);
      
      const updatedProfile = this.getUserProfile();
      this.notifyProfileChange(updatedProfile);
      
      console.log('✅ Account linked successfully');
      return updatedProfile;
      
    } catch (error) {
      console.error('❌ Account linking failed:', error);
      throw error;
    }
  }

  async linkAnonymousWithGoogle() {
    try {
      const profile = this.getUserProfile();
      
      if (!profile) {
        throw new Error('No user is currently signed in');
      }
      
      if (!profile.isAnonymous) {
        throw new Error('Account is already linked');
      }
      
      console.log('🔗 Linking anonymous account with Google');
      
      await authManager.linkAnonymousAccountWithGoogle();
      
      const updatedProfile = this.getUserProfile();
      this.notifyProfileChange(updatedProfile);
      
      console.log('✅ Account linked with Google successfully');
      return updatedProfile;
      
    } catch (error) {
      console.error('❌ Google linking failed:', error);
      throw error;
    }
  }
}

const accountProfileManager = new AccountProfileManager();

export { accountProfileManager };

export function getAccountProfileManager() {
  return accountProfileManager;
}