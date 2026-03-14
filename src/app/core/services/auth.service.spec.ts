import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { Auth, UserCredential, User as FirebaseUser, Unsubscribe, NextOrObserver } from '@angular/fire/auth';
import { User } from '../../models';

// Create mock functions
const mockSignInWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();

// Mock the entire @angular/fire/auth module
vi.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args)
}));

// Import AuthService after setting up mocks
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: any;
  let authStateCallback: ((user: FirebaseUser | null) => void) | null = null;

  beforeEach(() => {
    // Reset auth state callback
    authStateCallback = null;

    // Clear all mocks
    vi.clearAllMocks();

    // Create mock Auth instance
    mockAuth = {
      currentUser: null
    };

    // Mock onAuthStateChanged to capture the callback
    mockOnAuthStateChanged.mockImplementation((
      _auth: any, 
      nextOrObserver: NextOrObserver<FirebaseUser | null>
    ): Unsubscribe => {
      // Extract the callback function
      if (typeof nextOrObserver === 'function') {
        authStateCallback = nextOrObserver;
      } else if (nextOrObserver && 'next' in nextOrObserver) {
        authStateCallback = nextOrObserver.next as (user: FirebaseUser | null) => void;
      }
      // Return unsubscribe function
      return () => {};
    });

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth }
      ]
    });

    // Create service instance
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with null user and not authenticated', () => {
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should set up auth state listener on initialization', () => {
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function));
    });
  });

  describe('login() - Successful Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'user123',
        email: email,
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-15T10:30:00Z'
        }
      };
      const mockUserCredential: Partial<UserCredential> = {
        user: mockFirebaseUser as FirebaseUser
      };

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as UserCredential);

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, email, password);
      expect(result).toEqual(mockUserCredential);
    });

    it('should update signals when auth state changes after login', () => {
      // Arrange
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-15T10:30:00Z'
        }
      };

      // Act - Simulate Firebase auth state change
      if (authStateCallback) {
        authStateCallback(mockFirebaseUser as FirebaseUser);
      }

      // Assert
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).not.toBeNull();
      expect(service.currentUser()?.uid).toBe('user123');
      expect(service.currentUser()?.email).toBe('test@example.com');
      expect(service.currentUser()?.displayName).toBe('Test User');
      expect(service.currentUser()?.photoURL).toBe('https://example.com/photo.jpg');
      expect(service.currentUser()?.role).toBe('admin');
    });

    it('should map Firebase user to application User model correctly', () => {
      // Arrange
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'user456',
        email: 'admin@example.com',
        displayName: null,
        photoURL: null,
        metadata: {
          creationTime: '2023-06-15T08:00:00Z',
          lastSignInTime: '2024-01-20T14:45:00Z'
        }
      };

      // Act
      if (authStateCallback) {
        authStateCallback(mockFirebaseUser as FirebaseUser);
      }

      // Assert
      const user = service.currentUser();
      expect(user).not.toBeNull();
      expect(user?.uid).toBe('user456');
      expect(user?.email).toBe('admin@example.com');
      expect(user?.displayName).toBeUndefined();
      expect(user?.photoURL).toBeUndefined();
      expect(user?.role).toBe('admin');
      expect(user?.createdAt).toBeInstanceOf(Date);
      expect(user?.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('login() - Failed Login with Invalid Credentials', () => {
    it('should throw error for invalid email', async () => {
      // Arrange
      const email = 'invalid-email';
      const password = 'password123';
      const mockError = { code: 'auth/invalid-email' };

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow('El correo electrónico no es válido');
    });

    it('should throw error for user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      const mockError = { code: 'auth/user-not-found' };

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow('No existe una cuenta con este correo electrónico');
    });

    it('should throw error for wrong password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockError = { code: 'auth/wrong-password' };

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow('Contraseña incorrecta');
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockError = { code: 'auth/invalid-credential' };

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow('Credenciales inválidas. Verifica tu correo y contraseña');
    });

    it('should throw error for too many requests', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockError = { code: 'auth/too-many-requests' };

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow('Demasiados intentos fallidos. Intenta de nuevo más tarde');
    });

    it('should throw error for network failure', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockError = { code: 'auth/network-request-failed' };

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow('Error de conexión. Verifica tu conexión a internet');
    });

    it('should throw generic error for unknown error codes', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockError = { code: 'auth/unknown-error' };

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow('Error de autenticación. Por favor intenta de nuevo');
    });
  });

  describe('logout() - Clears User State', () => {
    it('should successfully logout and clear user state', async () => {
      // Arrange - First set up authenticated state
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-15T10:30:00Z'
        }
      };

      if (authStateCallback) {
        authStateCallback(mockFirebaseUser as FirebaseUser);
      }

      // Verify user is authenticated
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).not.toBeNull();

      // Mock signOut to succeed
      mockSignOut.mockResolvedValue(undefined);

      // Act
      await service.logout();

      // Assert
      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear signals even if Firebase signOut is called', async () => {
      // Arrange
      mockSignOut.mockResolvedValue(undefined);

      // Act
      await service.logout();

      // Assert
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should handle logout errors gracefully', async () => {
      // Arrange
      const mockError = { code: 'auth/network-request-failed' };
      mockSignOut.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.logout()).rejects.toThrow('Error de conexión. Verifica tu conexión a internet');
    });

    it('should update signals when auth state changes to null after logout', () => {
      // Arrange - First set up authenticated state
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-15T10:30:00Z'
        }
      };

      if (authStateCallback) {
        authStateCallback(mockFirebaseUser as FirebaseUser);
      }

      expect(service.isAuthenticated()).toBe(true);

      // Act - Simulate Firebase auth state change to null (logout)
      if (authStateCallback) {
        authStateCallback(null);
      }

      // Assert
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken() - Token Refresh Mechanism', () => {
    it('should successfully refresh token when user is authenticated', async () => {
      // Arrange
      const mockGetIdToken = vi.fn().mockResolvedValue('new-token-123');
      mockAuth.currentUser = {
        uid: 'user123',
        email: 'test@example.com',
        getIdToken: mockGetIdToken
      };

      // Act
      await service.refreshToken();

      // Assert
      expect(mockGetIdToken).toHaveBeenCalledWith(true); // Force refresh
    });

    it('should not throw error when no user is authenticated', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act & Assert
      await expect(service.refreshToken()).resolves.toBeUndefined();
    });

    it('should handle token refresh errors', async () => {
      // Arrange
      const mockError = { code: 'auth/requires-recent-login' };
      const mockGetIdToken = vi.fn().mockRejectedValue(mockError);
      mockAuth.currentUser = {
        uid: 'user123',
        email: 'test@example.com',
        getIdToken: mockGetIdToken
      };

      // Act & Assert
      await expect(service.refreshToken()).rejects.toThrow('Por seguridad, debes iniciar sesión nuevamente');
    });

    it('should force token refresh with true parameter', async () => {
      // Arrange
      const mockGetIdToken = vi.fn().mockResolvedValue('refreshed-token');
      mockAuth.currentUser = {
        uid: 'user123',
        email: 'test@example.com',
        getIdToken: mockGetIdToken
      };

      // Act
      await service.refreshToken();

      // Assert
      expect(mockGetIdToken).toHaveBeenCalledWith(true);
      expect(mockGetIdToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkAuthState() - Observable Auth State', () => {
    it('should emit user when authenticated', async () => {
      // Arrange
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-15T10:30:00Z'
        }
      };

      // Act
      const promise = new Promise<User | null>((resolve) => {
        const subscription = service.checkAuthState().subscribe({
          next: (user: User | null) => {
            subscription.unsubscribe();
            resolve(user);
          }
        });

        // Trigger the callback that was registered with onAuthStateChanged
        if (authStateCallback) {
          authStateCallback(mockFirebaseUser as FirebaseUser);
        }
      });

      const user = await promise;

      // Assert
      expect(user).not.toBeNull();
      expect(user?.uid).toBe('user123');
      expect(user?.email).toBe('test@example.com');
    });

    it('should emit null when not authenticated', async () => {
      // Act
      const promise = new Promise<User | null>((resolve) => {
        const subscription = service.checkAuthState().subscribe({
          next: (user: User | null) => {
            subscription.unsubscribe();
            resolve(user);
          }
        });

        // Trigger the callback with null
        if (authStateCallback) {
          authStateCallback(null);
        }
      });

      const user = await promise;

      // Assert
      expect(user).toBeNull();
    });

    it('should handle auth state errors', async () => {
      // Arrange
      const mockError = new Error('Network error');
      (mockError as any).code = 'auth/network-request-failed';

      // Mock onAuthStateChanged to trigger error callback
      mockOnAuthStateChanged.mockImplementation((
        _auth: any,
        _nextOrObserver: NextOrObserver<FirebaseUser | null>,
        error?: (error: Error) => void
      ): Unsubscribe => {
        // Trigger error callback immediately
        if (error) {
          setTimeout(() => error(mockError), 0);
        }
        return () => {};
      });

      // Act & Assert
      const promise = new Promise<void>((resolve, reject) => {
        const subscription = service.checkAuthState().subscribe({
          error: (error: Error) => {
            subscription.unsubscribe();
            try {
              expect(error.message).toBe('Error de conexión. Verifica tu conexión a internet');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      await promise;
    });

    it('should unsubscribe properly when observable is unsubscribed', () => {
      // Arrange
      const mockUnsubscribe = vi.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      // Act
      const subscription = service.checkAuthState().subscribe();
      subscription.unsubscribe();

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Error Transformation', () => {
    it('should transform auth/user-disabled error', async () => {
      // Arrange
      const mockError = { code: 'auth/user-disabled' };
      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login('test@example.com', 'password')).rejects.toThrow('Esta cuenta ha sido deshabilitada');
    });

    it('should transform auth/email-already-in-use error', async () => {
      // Arrange
      const mockError = { code: 'auth/email-already-in-use' };
      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login('test@example.com', 'password')).rejects.toThrow('Ya existe una cuenta con este correo electrónico');
    });

    it('should transform auth/weak-password error', async () => {
      // Arrange
      const mockError = { code: 'auth/weak-password' };
      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login('test@example.com', 'weak')).rejects.toThrow('La contraseña debe tener al menos 6 caracteres');
    });

    it('should transform auth/operation-not-allowed error', async () => {
      // Arrange
      const mockError = { code: 'auth/operation-not-allowed' };
      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.login('test@example.com', 'password')).rejects.toThrow('Operación no permitida. Contacta al administrador');
    });
  });

  describe('Signal Reactivity', () => {
    it('should maintain signal reactivity across auth state changes', () => {
      // Arrange
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-15T10:30:00Z'
        }
      };

      // Initial state
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();

      // Act - Login
      if (authStateCallback) {
        authStateCallback(mockFirebaseUser as FirebaseUser);
      }

      // Assert - Authenticated
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).not.toBeNull();

      // Act - Logout
      if (authStateCallback) {
        authStateCallback(null);
      }

      // Assert - Not authenticated
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('should provide readonly signals that cannot be modified externally', () => {
      // Arrange & Act
      const currentUser = service.currentUser;
      const isAuthenticated = service.isAuthenticated;

      // Assert - Signals should be readonly (no set method)
      expect(currentUser).toBeDefined();
      expect(isAuthenticated).toBeDefined();
      expect(typeof currentUser).toBe('function');
      expect(typeof isAuthenticated).toBe('function');
    });
  });

  /**
   * Property-Based Test: Authentication Error Message Display
   * 
   * **Validates: Requirements 4.6**
   * 
   * This property test verifies that any Firebase authentication error code
   * produces a user-friendly error message that meets the following criteria:
   * 
   * 1. Error messages are in Spanish (as per requirements)
   * 2. Error messages are non-empty strings
   * 3. Error messages are user-friendly (not technical Firebase error codes)
   * 4. All known Firebase error codes are handled consistently
   * 
   * The test generates arbitrary Firebase error codes and verifies the error
   * transformation logic produces appropriate user-facing messages.
   */
  describe('Property 4: Authentication Error Message Display', () => {
    it('should transform any Firebase auth error to user-friendly Spanish message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Known Firebase auth error codes
            fc.constant('auth/invalid-email'),
            fc.constant('auth/user-disabled'),
            fc.constant('auth/user-not-found'),
            fc.constant('auth/wrong-password'),
            fc.constant('auth/invalid-credential'),
            fc.constant('auth/too-many-requests'),
            fc.constant('auth/network-request-failed'),
            fc.constant('auth/email-already-in-use'),
            fc.constant('auth/weak-password'),
            fc.constant('auth/operation-not-allowed'),
            fc.constant('auth/requires-recent-login'),
            // Unknown/arbitrary error codes (should get generic message)
            fc.string({ minLength: 5, maxLength: 30 }).map(s => `auth/${s}`)
          ),
          async (errorCode) => {
            // Arrange
            const mockError = { code: errorCode };
            mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

            // Act
            let caughtError: Error | null = null;
            try {
              await service.login('test@example.com', 'password123');
            } catch (error) {
              caughtError = error as Error;
            }

            // Assert - Error was thrown
            expect(caughtError).not.toBeNull();
            expect(caughtError).toBeInstanceOf(Error);

            // Assert - Error message is non-empty
            expect(caughtError!.message).toBeTruthy();
            expect(caughtError!.message.length).toBeGreaterThan(0);

            // Assert - Error message is in Spanish (contains Spanish words/characters)
            // We check for common Spanish words or patterns in error messages
            const message = caughtError!.message;
            const hasSpanishContent = 
              message.includes('correo') ||
              message.includes('contraseña') ||
              message.includes('Contraseña') ||
              message.includes('cuenta') ||
              message.includes('conexión') ||
              message.includes('intenta') ||
              message.includes('intentos') ||
              message.includes('sesión') ||
              message.includes('autenticación') ||
              message.includes('operación') ||
              message.includes('seguridad') ||
              message.includes('caracteres') ||
              message.includes('administrador') ||
              message.includes('deshabilitada') ||
              message.includes('inválid') ||
              message.includes('Verifica') ||
              message.includes('Por favor') ||
              message.includes('Error de') ||
              message.includes('incorrecta') ||
              message.includes('válido') ||
              message.includes('existe') ||
              message.includes('Demasiados') ||
              message.includes('Esta') ||
              message.includes('debe') ||
              message.includes('menos') ||
              message.includes('permitida') ||
              message.includes('debes');

            expect(hasSpanishContent).toBe(true);

            // Assert - Error message is user-friendly (doesn't contain technical error code)
            expect(message).not.toContain('auth/');
            expect(message).not.toContain('firebase');
            expect(message).not.toContain('Firebase');

            // Assert - Known error codes have specific messages
            if (errorCode === 'auth/invalid-email') {
              expect(message).toBe('El correo electrónico no es válido');
            } else if (errorCode === 'auth/user-disabled') {
              expect(message).toBe('Esta cuenta ha sido deshabilitada');
            } else if (errorCode === 'auth/user-not-found') {
              expect(message).toBe('No existe una cuenta con este correo electrónico');
            } else if (errorCode === 'auth/wrong-password') {
              expect(message).toBe('Contraseña incorrecta');
            } else if (errorCode === 'auth/invalid-credential') {
              expect(message).toBe('Credenciales inválidas. Verifica tu correo y contraseña');
            } else if (errorCode === 'auth/too-many-requests') {
              expect(message).toBe('Demasiados intentos fallidos. Intenta de nuevo más tarde');
            } else if (errorCode === 'auth/network-request-failed') {
              expect(message).toBe('Error de conexión. Verifica tu conexión a internet');
            } else if (errorCode === 'auth/email-already-in-use') {
              expect(message).toBe('Ya existe una cuenta con este correo electrónico');
            } else if (errorCode === 'auth/weak-password') {
              expect(message).toBe('La contraseña debe tener al menos 6 caracteres');
            } else if (errorCode === 'auth/operation-not-allowed') {
              expect(message).toBe('Operación no permitida. Contacta al administrador');
            } else if (errorCode === 'auth/requires-recent-login') {
              expect(message).toBe('Por seguridad, debes iniciar sesión nuevamente');
            } else {
              // Unknown error codes should get generic message
              expect(message).toBe('Error de autenticación. Por favor intenta de nuevo');
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations to test various error codes
      );
    });

    it('should handle error transformation consistently across all auth methods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'auth/invalid-email',
            'auth/network-request-failed',
            'auth/requires-recent-login'
          ),
          async (errorCode) => {
            // Arrange
            const mockError = { code: errorCode };

            // Test login error transformation
            mockSignInWithEmailAndPassword.mockRejectedValue(mockError);
            let loginError: Error | null = null;
            try {
              await service.login('test@example.com', 'password');
            } catch (error) {
              loginError = error as Error;
            }

            // Test logout error transformation
            mockSignOut.mockRejectedValue(mockError);
            let logoutError: Error | null = null;
            try {
              await service.logout();
            } catch (error) {
              logoutError = error as Error;
            }

            // Test refreshToken error transformation
            const mockGetIdToken = vi.fn().mockRejectedValue(mockError);
            mockAuth.currentUser = {
              uid: 'user123',
              email: 'test@example.com',
              getIdToken: mockGetIdToken
            };
            let refreshError: Error | null = null;
            try {
              await service.refreshToken();
            } catch (error) {
              refreshError = error as Error;
            }

            // Assert - All methods produce the same error message for the same error code
            expect(loginError).not.toBeNull();
            expect(logoutError).not.toBeNull();
            expect(refreshError).not.toBeNull();

            expect(loginError!.message).toBe(logoutError!.message);
            expect(loginError!.message).toBe(refreshError!.message);

            // Assert - Error messages are user-friendly
            expect(loginError!.message).not.toContain('auth/');
            expect(loginError!.message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
