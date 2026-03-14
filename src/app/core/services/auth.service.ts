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
        await currentUser.getIdToken(true); // Force refresh
      }
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
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
        return new Error('El correo electrónico no es válido');
      case 'auth/user-disabled':
        return new Error('Esta cuenta ha sido deshabilitada');
      case 'auth/user-not-found':
        return new Error('No existe una cuenta con este correo electrónico');
      case 'auth/wrong-password':
        return new Error('Contraseña incorrecta');
      case 'auth/invalid-credential':
        return new Error('Credenciales inválidas. Verifica tu correo y contraseña');
      case 'auth/too-many-requests':
        return new Error('Demasiados intentos fallidos. Intenta de nuevo más tarde');
      case 'auth/network-request-failed':
        return new Error('Error de conexión. Verifica tu conexión a internet');
      case 'auth/email-already-in-use':
        return new Error('Ya existe una cuenta con este correo electrónico');
      case 'auth/weak-password':
        return new Error('La contraseña debe tener al menos 6 caracteres');
      case 'auth/operation-not-allowed':
        return new Error('Operación no permitida. Contacta al administrador');
      case 'auth/requires-recent-login':
        return new Error('Por seguridad, debes iniciar sesión nuevamente');
      default:
        return new Error('Error de autenticación. Por favor intenta de nuevo');
    }
  }
}
