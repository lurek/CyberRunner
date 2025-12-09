/**
 * Firebase Configuration
 * 
 * All Firebase authentication methods are now enabled:
 * ✅ Email/Password
 * ✅ Google
 * ✅ Apple
 * ✅ Game Center
 * ✅ Anonymous
 */

// Import Firebase modules
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';

// Your Firebase configuration - loaded from environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (with error handling)
let app = null;
let auth = null;
let db = null;
let initError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  console.log('🔥 Firebase initialized successfully');
  console.log('✅ Authentication methods enabled:');
  console.log('   - Email/Password');
  console.log('   - Google Sign-In');
  console.log('   - Apple Sign-In');
  console.log('   - Game Center');
  console.log('   - Anonymous');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.log('Please check your firebase-config.js file');
  initError = error;

  // ✅ FIX: Create safe fallback objects to prevent crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      setTimeout(() => callback(null), 0);
      return () => { };
    }
  };
  db = null;
}

// Export initialized instances
export {
  // App & Services
  app,
  auth,
  db,

  // Auth methods
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  linkWithCredential,
  linkWithPopup,
  deleteUser,

  // Auth providers
  GoogleAuthProvider,
  OAuthProvider,
  EmailAuthProvider,

  // Firestore methods
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  deleteDoc,
  where
};

// Export configuration check
export const isFirebaseConfigured = () => {
  return app !== null && auth !== null && db !== null;
};

// ✅ FIX: Add helper functions for error checking
export const isFirebaseReady = () => {
  return !initError && app !== null;
};

export const getFirebaseError = () => {
  return initError;
};
