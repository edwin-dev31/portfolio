import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, UserCredential, User as FirebaseUser } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { User } from '../../models';

/**
 * AuthService manages authentication with Firebase Authentication
 * using signal-based state management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  /**
   * Readonly signal exposing the current user
   */
  currentUser = this.currentUserSignal.asReadonly();

  /**
   * Readonly signal exposing authentication status
   */
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  constructor() {
    // Initialize auth state listener
    this.initAuthStateListener();
  }

  /**
   * Initialize Firebase auth state listener
   * Updates signals when auth state changes
   */
  private initAuthStateListener(): void {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        const user: User = this.mapFirebaseUserToUser(firebaseUser);
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      } else {
        this.currentUserSignal.set(null);
        this.isAuthenticatedSignal.set(false);
      }
    });
  }

  /**
   * Map Firebase User to application User model
   * @param firebaseUser - Firebase user object
   * @returns User model
   */
  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      role: 'admin', // Default role - could be fetched from Firestore custom claims
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      lastLogin: new Date(firebaseUser.metadata.lastSignInTime || Date.now())
    };
  }

  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise of UserCredential
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSignal.set(null);
      this.isAuthenticatedSignal.set(false);
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  /**
   * Refresh the current user's token
   * Firebase handles token refresh automatically, but this method
   * can be used to force a token refresh if needed
   * @returns Promise that resolves when token is refreshed
   */
  async refreshToken(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        await currentUser.getIdToken(true);
      }
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  /**
   * Wait for the initial authentication state to be resolved.
   * Useful for router guards during page reload.
   * @returns Promise that resolves with User or null
   */
  async waitForAuth(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          resolve(this.mapFirebaseUserToUser(firebaseUser));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get an observable of auth state changes
   * @returns Observable of User or null
   */
  checkAuthState(): Observable<User | null> {
    return new Observable(observer => {
      const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
        if (firebaseUser) {
          observer.next(this.mapFirebaseUserToUser(firebaseUser));
        } else {
          observer.next(null);
        }
      }, (error) => {
        observer.error(this.transformAuthError(error));
      });

      // Cleanup function
      return () => unsubscribe();
    });
  }

  /**
   * Transform Firebase auth errors to user-friendly messages
   * @param error - Firebase auth error
   * @returns Error with user-friendly message
   */
  private transformAuthError(error: any): Error {
    console.error('Firebase Auth error:', error);

    switch (error.code) {
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/user-disabled':
        return new Error('This account has been disabled');
      case 'auth/user-not-found':
        return new Error('No account found with this email');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/invalid-credential':
        return new Error('Invalid credentials. Check your email and password');
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Try again later');
      case 'auth/network-request-failed':
        return new Error('Connection error. Check your internet connection');
      case 'auth/email-already-in-use':
        return new Error('An account already exists with this email');
      case 'auth/weak-password':
        return new Error('Password must be at least 6 characters');
      case 'auth/operation-not-allowed':
        return new Error('Operation not allowed. Contact the administrator');
      case 'auth/requires-recent-login':
        return new Error('Security requirement: Please log in again');
      default:
        return new Error('Authentication error. Please try again');
    }
  }
}
