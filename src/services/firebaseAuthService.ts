// AptIQ Firebase Email Verification & Authentication Service
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload,
  applyActionCode,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
  ActionCodeSettings
} from 'firebase/auth';
import { UserProfile, storageService } from './storageService.ts';
import { authService, RegistrationParams, RegisteredAccount } from './authService.ts';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'aptiq_firebase_config',
  PENDING_VERIFY_EMAIL: 'aptiq_pending_verify_email'
};

class FirebaseAuthService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;

  constructor() {
    this.init();
  }

  // Get active config from env or localStorage
  getConfig(): FirebaseConfig | null {
    // 1. Check runtime localStorage override (configured via Admin Console)
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.authDomain && parsed.projectId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[AptIQ Firebase] Failed to parse stored Firebase config', e);
    }

    // 2. Check import.meta.env variables
    const envConfig: Partial<FirebaseConfig> = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    if (envConfig.apiKey && envConfig.authDomain && envConfig.projectId) {
      return envConfig as FirebaseConfig;
    }

    return null;
  }

  // Save config at runtime
  saveConfig(config: FirebaseConfig): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
      this.init();
      return true;
    } catch (e) {
      console.error('[AptIQ Firebase] Failed to save Firebase config', e);
      return false;
    }
  }

  // Clear runtime config
  clearConfig(): void {
    localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
    this.app = null;
    this.auth = null;
  }

  // Initialize or retrieve Firebase App and Auth instance
  init(): boolean {
    const config = this.getConfig();
    if (!config) {
      return false;
    }

    try {
      if (getApps().length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = getApp();
      }
      this.auth = getAuth(this.app);
      return true;
    } catch (err) {
      console.error('[AptIQ Firebase] Initialization error:', err);
      return false;
    }
  }

  isConfigured(): boolean {
    const config = this.getConfig();
    return Boolean(config && config.apiKey && config.authDomain && config.projectId);
  }

  getAuth(): Auth | null {
    if (!this.auth) {
      this.init();
    }
    return this.auth;
  }

  getCurrentFirebaseUser(): FirebaseUser | null {
    const auth = this.getAuth();
    return auth ? auth.currentUser : null;
  }

  // Get action code settings returning to deployed AptIQ website
  getActionCodeSettings(): ActionCodeSettings {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    return {
      url: `${origin}${pathname}?mode=verifyEmail`,
      handleCodeInApp: true
    };
  }

  // Register student with Email & Password (direct signup without verification)
  async registerStudent(
    params: RegistrationParams
  ): Promise<{
    success: boolean;
    user?: UserProfile;
    error?: string;
  }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const auth = this.getAuth();

    if (auth && this.isConfigured()) {
      try {
        await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
      } catch (err: any) {
        if (err.code !== 'auth/email-already-in-use') {
          console.error('[AptIQ Firebase] Registration failed:', err);
          let errorMsg = err.message || 'Failed to create account.';
          if (err.code === 'auth/invalid-email') {
            errorMsg = 'The email address is invalid.';
          } else if (err.code === 'auth/weak-password') {
            errorMsg = 'Password is too weak. Please use at least 6 characters.';
          }
          return { success: false, error: errorMsg };
        }
      }
    }

    const localReg = await authService.registerStudent(params, true);
    if (!localReg.success || !localReg.user) {
      return {
        success: false,
        error: localReg.error || 'Failed to register student.'
      };
    }

    return {
      success: true,
      user: localReg.user
    };
  }

  // Backward compatibility alias: no verification needed
  async registerStudentWithVerification(
    params: RegistrationParams
  ): Promise<{
    success: boolean;
    user?: UserProfile;
    requiresVerification: boolean;
    error?: string;
  }> {
    const res = await this.registerStudent(params);
    return {
      success: res.success,
      user: res.user,
      requiresVerification: false,
      error: res.error
    };
  }

  // Send test or direct verification link
  async sendVerificationLink(_email: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  // Resend Verification Email to currently registered student
  async resendVerificationEmail(email?: string): Promise<{ success: boolean; error?: string }> {
    const targetEmail = (email || localStorage.getItem(STORAGE_KEYS.PENDING_VERIFY_EMAIL) || '').trim().toLowerCase();
    const auth = this.getAuth();

    if (!auth || !this.isConfigured()) {
      return {
        success: false,
        error: 'Firebase Authentication is not configured. Please configure VITE_FIREBASE_* in your environment.'
      };
    }

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, this.getActionCodeSettings());
        return { success: true };
      }

      // If user session is not actively held in memory, prompt sign in or reload
      return {
        success: false,
        error: 'Please sign in with your email and password to resend the verification link.'
      };
    } catch (err: any) {
      console.error('[AptIQ Firebase] Error resending verification email:', err);
      let errorMsg = err.message || 'Failed to resend verification email.';
      if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a moment before requesting another verification email.';
      }
      return { success: false, error: errorMsg };
    }
  }

  // Refresh user's Firebase authentication state to verify if email is now verified
  async checkEmailVerified(email?: string): Promise<{ verified: boolean; user?: UserProfile; error?: string }> {
    const targetEmail = (email || localStorage.getItem(STORAGE_KEYS.PENDING_VERIFY_EMAIL) || '').trim().toLowerCase();
    const auth = this.getAuth();

    if (auth && auth.currentUser) {
      try {
        // Reload user to fetch latest token and verification status from Firebase servers
        await reload(auth.currentUser);

        if (auth.currentUser.emailVerified) {
          // Update persistent student record
          const verifiedEmail = auth.currentUser.email || targetEmail;
          authService.setUserVerificationStatus(verifiedEmail, true);

          const activeUser = storageService.getUser();
          if (activeUser && activeUser.email.toLowerCase() === verifiedEmail.toLowerCase()) {
            activeUser.isEmailVerified = true;
            storageService.setUser(activeUser);
          }

          localStorage.removeItem(STORAGE_KEYS.PENDING_VERIFY_EMAIL);
          return { verified: true, user: activeUser || undefined };
        } else {
          return { verified: false };
        }
      } catch (err: any) {
        console.warn('[AptIQ Firebase] Error checking email verification state:', err);
        return { verified: false, error: err.message };
      }
    }

    // Check local database status if Firebase user is not loaded
    if (targetEmail) {
      const users = authService.getRegisteredUsers();
      const student = users.find(u => u.email.toLowerCase() === targetEmail);
      if (student && student.isEmailVerified) {
        return { verified: true };
      }
    }

    return { verified: false };
  }

  // Handle incoming verification link via URL oobCode
  async handleVerificationCode(oobCode: string): Promise<{ success: boolean; error?: string }> {
    const auth = this.getAuth();
    if (!auth) {
      return { success: false, error: 'Firebase is not initialized.' };
    }

    try {
      await applyActionCode(auth, oobCode);
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.email) {
          authService.setUserVerificationStatus(auth.currentUser.email, true);
          const activeUser = storageService.getUser();
          if (activeUser && activeUser.email.toLowerCase() === auth.currentUser.email.toLowerCase()) {
            activeUser.isEmailVerified = true;
            storageService.setUser(activeUser);
          }
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error('[AptIQ Firebase] Failed to apply action code:', err);
      return {
        success: false,
        error: err.message || 'Verification link is invalid or has expired.'
      };
    }
  }

  // Sign in student with Firebase and verify credentials
  async signInWithEmailPassword(
    email: string,
    pass: string
  ): Promise<{ success: boolean; isEmailVerified: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const auth = this.getAuth();

    if (auth && this.isConfigured()) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        await reload(userCredential.user);

        const isVerified = userCredential.user.emailVerified;
        if (isVerified) {
          authService.setUserVerificationStatus(cleanEmail, true);
        }

        return { success: true, isEmailVerified: isVerified };
      } catch (err: any) {
        console.warn('[AptIQ Firebase] Firebase signIn error, falling back to local credentials:', err);
      }
    }

    // Fallback or local check
    const localRes = await authService.login(cleanEmail, pass, 'student');
    if (!localRes.success || !localRes.user) {
      return { success: false, isEmailVerified: false, error: localRes.error };
    }

    return {
      success: true,
      isEmailVerified: Boolean(localRes.user.isEmailVerified)
    };
  }

  // Sign out from Firebase
  async signOut(): Promise<void> {
    const auth = this.getAuth();
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn('[AptIQ Firebase] Sign out error', e);
      }
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
