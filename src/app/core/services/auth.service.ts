import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, UserCredential, User as FirebaseUser } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { User } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  
  currentUser = this.currentUserSignal.asReadonly();

  
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  constructor() {
    
    this.initAuthStateListener();
  }

  
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

  
  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      role: 'admin', 
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      lastLogin: new Date(firebaseUser.metadata.lastSignInTime || Date.now())
    };
  }

  
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential;
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSignal.set(null);
      this.isAuthenticatedSignal.set(false);
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  
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

      
      return () => unsubscribe();
    });
  }

  
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
