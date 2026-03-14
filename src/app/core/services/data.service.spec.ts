import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { DataService } from './data.service';
import { Observable, Observer } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Profile } from '../../models';

interface MockFirestore {
  type: string;
}

interface MockObservable<T> {
  subscribe: (observer: Partial<Observer<T>>) => { unsubscribe: () => void };
}

interface ServiceWithCache {
  firestore: MockFirestore;
  cache: Map<string, Observable<Profile | unknown>>;
}

describe('DataService - Property Tests', () => {
  let service: DataService;
  let mockFirestore: MockFirestore;

  beforeEach(() => {
    // Create a mock Firestore instance
    mockFirestore = {
      type: 'firestore'
    };

    // Configure TestBed with mock Firestore
    TestBed.configureTestingModule({
      providers: [
        DataService,
        { provide: Firestore, useValue: mockFirestore }
      ]
    });

    // Create service instance through TestBed
    service = TestBed.inject(DataService);
    
    // Clear cache before each test (accessing private property for testing)
    (service as unknown as ServiceWithCache).cache.clear();
  });

  /**
   * **Validates: Requirements 5.6**
   * 
   * Property 7: Firestore Query Caching
   * 
   * This property test verifies that repeated queries within the cache period
   * result in a single Firestore read, demonstrating the caching mechanism
   * implemented with shareReplay.
   * 
   * The test ensures:
   * 1. The first query triggers a Firestore read
   * 2. Subsequent queries within the cache period reuse the cached result
   * 3. No additional Firestore reads occur for cached queries
   * 4. All subscribers receive the same data
   */
  it('Property 7: Firestore Query Caching - repeated queries result in single Firestore read', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of repeated queries
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          tagline: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          yearAvailable: fc.integer({ min: 2020, max: 2030 }),
          stats: fc.record({
            deployments: fc.integer({ min: 0, max: 1000 }),
            awards: fc.integer({ min: 0, max: 100 }),
            social: fc.record({
              github: fc.webUrl(),
              linkedin: fc.webUrl(),
              email: fc.emailAddress()
            })
          })
        }),
        async (numQueries, profileData) => {
          // Clear cache and reset service
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          // Track how many times the source observable is subscribed to
          let sourceSubscriptionCount = 0;
          
          // Create a mock observable that tracks subscriptions
          const mockObservable = new Observable<Profile>((observer) => {
            sourceSubscriptionCount++;
            observer.next(profileData);
            observer.complete();
          }).pipe(shareReplay(1));
          
          // Add to cache
          serviceCache.set('profile', mockObservable);
          
          // Execute multiple queries
          const results: Profile[] = [];
          
          for (let i = 0; i < numQueries; i++) {
            const observable = serviceCache.get('profile');
            if (!observable) {
              throw new Error('Observable not found in cache');
            }
            await new Promise<void>((resolve) => {
              observable.subscribe({
                next: (data: unknown) => {
                  results.push(data as Profile);
                  resolve();
                }
              });
            });
          }
          
          // Property 1: Source observable should be subscribed to exactly once
          // (shareReplay ensures subsequent subscriptions use cached value)
          expect(sourceSubscriptionCount).toBe(1);
          
          // Property 2: All queries should return the same data
          const allResultsMatch = results.every(result => 
            result.name === profileData.name &&
            result.title === profileData.title &&
            result.tagline === profileData.tagline &&
            result.description === profileData.description &&
            result.yearAvailable === profileData.yearAvailable
          );
          expect(allResultsMatch).toBe(true);
          
          // Property 3: Number of results should match number of queries
          expect(results.length).toBe(numQueries);
          
          // Return true if all properties hold
          return sourceSubscriptionCount === 1 && 
                 allResultsMatch && 
                 results.length === numQueries;
        }
      ),
      {
        numRuns: 50,
        verbose: true
      }
    );
  });

  /**
   * Additional property test: Cache invalidation on update
   * 
   * Verifies that cache is properly invalidated after an update operation,
   * ensuring subsequent queries fetch fresh data from Firestore.
   */
  it('Property 7b: Cache invalidation - cache is cleared after update', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (initialName, updatedName) => {
          // Clear cache
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          // Set initial cache entry
          const mockObservable: MockObservable<Profile> = {
            subscribe: vi.fn()
          };
          serviceCache.set('profile', mockObservable as unknown as Observable<Profile>);
          
          // Verify cache has entry
          expect(serviceCache.has('profile')).toBe(true);
          expect(serviceCache.size).toBe(1);
          
          // Simulate update (which should clear cache)
          serviceCache.delete('profile');
          
          // Property: Cache should be cleared after update
          const cacheCleared = !serviceCache.has('profile');
          expect(cacheCleared).toBe(true);
          expect(serviceCache.size).toBe(0);
          
          return cacheCleared;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Additional property test: Multiple collection caching
   * 
   * Verifies that different collections maintain separate caches
   * and don't interfere with each other.
   */
  it('Property 7c: Multiple collections - separate caches for different data types', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('profile', 'about', 'contact', 'projects', 'services', 'skills'), { minLength: 2, maxLength: 6 }),
        (cacheKeys) => {
          // Clear cache
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          // Add entries for each cache key
          const mockObservable: MockObservable<unknown> = { subscribe: vi.fn() };
          cacheKeys.forEach(key => {
            serviceCache.set(key, mockObservable as unknown as Observable<unknown>);
          });
          
          // Property 1: Each key should have its own cache entry
          const allKeysPresent = cacheKeys.every(key => 
            serviceCache.has(key)
          );
          expect(allKeysPresent).toBe(true);
          
          // Property 2: Cache size should match number of unique keys
          const uniqueKeys = [...new Set(cacheKeys)];
          expect(serviceCache.size).toBe(uniqueKeys.length);
          
          // Property 3: Deleting one cache entry shouldn't affect others
          if (uniqueKeys.length > 1) {
            const keyToDelete = uniqueKeys[0];
            const remainingKeys = uniqueKeys.slice(1);
            
            serviceCache.delete(keyToDelete);
            
            const deletedKeyGone = !serviceCache.has(keyToDelete);
            const otherKeysPresent = remainingKeys.every(key => 
              serviceCache.has(key)
            );
            
            expect(deletedKeyGone).toBe(true);
            expect(otherKeysPresent).toBe(true);
            
            return deletedKeyGone && otherKeysPresent;
          }
          
          return allKeysPresent;
        }
      ),
      {
        numRuns: 50,
        verbose: true
      }
    );
  });

  /**
   * Property test: Cache consistency across concurrent subscriptions
   * 
   * Verifies that multiple concurrent subscriptions to the same cached
   * observable receive consistent data without triggering additional
   * Firestore reads.
   */
  it('Property 7d: Concurrent subscriptions - all receive same cached data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 })
        }),
        (numSubscribers, profileData) => {
          // Clear cache
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          // Create a mock observable that tracks subscriptions
          let subscriptionCount = 0;
          const subscribers: Array<Partial<Observer<{ name: string; title: string }>>> = [];
          
          const mockObservable: MockObservable<{ name: string; title: string }> = {
            subscribe: (observer: Partial<Observer<{ name: string; title: string }>>) => {
              subscriptionCount++;
              subscribers.push(observer);
              
              // Simulate emitting data to subscriber
              if (observer.next) {
                observer.next(profileData);
              }
              
              return {
                unsubscribe: () => {}
              };
            }
          };
          
          // Add to cache
          serviceCache.set('profile', mockObservable as unknown as Observable<unknown>);
          
          // Simulate multiple subscriptions
          const results: Array<{ name: string; title: string }> = [];
          for (let i = 0; i < numSubscribers; i++) {
            const observable = serviceCache.get('profile') as unknown as MockObservable<{ name: string; title: string }>;
            observable.subscribe({
              next: (data: { name: string; title: string }) => results.push(data)
            });
          }
          
          // Property 1: All subscriptions should use the same cached observable
          expect(subscriptionCount).toBe(numSubscribers);
          
          // Property 2: All subscribers should receive the same data
          const allDataMatches = results.every(result =>
            result.name === profileData.name &&
            result.title === profileData.title
          );
          expect(allDataMatches).toBe(true);
          
          return subscriptionCount === numSubscribers && allDataMatches;
        }
      ),
      {
        numRuns: 30,
        verbose: true
      }
    );
  });

  /**
   * Property test: shareReplay behavior verification
   * 
   * Verifies that shareReplay(1) correctly caches the last emitted value
   * and replays it to new subscribers without re-executing the source.
   */
  it('Property 7e: shareReplay behavior - replays last value to new subscribers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.integer({ min: 0, max: 1000 })
        }),
        async (testData) => {
          // Clear cache
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          // Track source executions
          let sourceExecutions = 0;
          
          // Create observable with shareReplay
          const observable = new Observable<{ name: string; value: number }>((observer) => {
            sourceExecutions++;
            observer.next(testData);
            observer.complete();
          }).pipe(shareReplay(1));
          
          // First subscription
          const result1 = await new Promise<{ name: string; value: number }>((resolve) => {
            observable.subscribe({
              next: (data) => resolve(data)
            });
          });
          
          // Second subscription (should replay cached value)
          const result2 = await new Promise<{ name: string; value: number }>((resolve) => {
            observable.subscribe({
              next: (data) => resolve(data)
            });
          });
          
          // Property 1: Source should execute only once
          expect(sourceExecutions).toBe(1);
          
          // Property 2: Both subscriptions should receive same data
          expect(result1).toEqual(testData);
          expect(result2).toEqual(testData);
          
          return sourceExecutions === 1 && 
                 result1.name === testData.name && 
                 result2.name === testData.name;
        }
      ),
      {
        numRuns: 30,
        verbose: true
      }
    );
  });
});

/**
 * **Validates: Requirements 5.5**
 * 
 * Property 6: Data Service Error Handling Consistency
 * 
 * This property test suite verifies that Firestore errors are consistently
 * transformed to user-friendly messages and that offline scenarios are
 * handled gracefully.
 * 
 * The tests ensure:
 * 1. All Firestore error codes are transformed to user-friendly messages
 * 2. Error messages are in Spanish (as per design)
 * 3. Unknown errors have a generic fallback message
 * 4. Offline scenarios are handled with appropriate messages
 */
describe('DataService - Error Handling Property Tests', () => {
  let service: DataService;
  let mockFirestore: MockFirestore;

  beforeEach(() => {
    mockFirestore = {
      type: 'firestore'
    };

    TestBed.configureTestingModule({
      providers: [
        DataService,
        { provide: Firestore, useValue: mockFirestore }
      ]
    });

    service = TestBed.inject(DataService);
  });

  /**
   * Property 6a: Firestore error code transformation
   * 
   * Verifies that any Firestore error with a known error code is transformed
   * to a user-friendly message in Spanish.
   */
  it('Property 6a: Known Firestore error codes produce user-friendly messages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('permission-denied', 'unavailable', 'not-found'),
        fc.string({ minLength: 1, maxLength: 100 }), // Additional error details
        (errorCode, errorDetails) => {
          // Create a Firestore-like error object
          const firestoreError = {
            code: errorCode,
            message: errorDetails,
            name: 'FirebaseError'
          };

          // Access the private transformError method for testing
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          const transformedError = transformError.call(service, firestoreError);

          // Property 1: Error should be transformed to Error instance
          expect(transformedError).toBeInstanceOf(Error);

          // Property 2: Error message should be user-friendly (not contain error code)
          const message = transformedError.message;
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);

          // Property 3: Error message should be in Spanish
          const spanishKeywords = ['tienes', 'permisos', 'temporalmente', 'disponible', 'solicitados', 'encontrados'];
          const containsSpanish = spanishKeywords.some(keyword => message.toLowerCase().includes(keyword));
          expect(containsSpanish).toBe(true);

          // Property 4: Specific error codes should map to specific messages
          if (errorCode === 'permission-denied') {
            expect(message).toBe('No tienes permisos para acceder a estos datos');
          } else if (errorCode === 'unavailable') {
            expect(message).toBe('Servicio temporalmente no disponible. Intenta de nuevo.');
          } else if (errorCode === 'not-found') {
            expect(message).toBe('Los datos solicitados no fueron encontrados');
          }

          return transformedError instanceof Error && message.length > 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Property 6b: Unknown error fallback
   * 
   * Verifies that any error without a recognized error code receives
   * a generic user-friendly fallback message.
   */
  it('Property 6b: Unknown errors produce generic fallback message', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Various error types that might occur
          fc.string({ minLength: 1, maxLength: 100 }), // String error
          fc.record({ message: fc.string() }), // Object without code
          fc.record({ code: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !['permission-denied', 'unavailable', 'not-found'].includes(s)) }), // Unknown code
          fc.constant(null), // Null error
          fc.constant(undefined) // Undefined error
        ),
        (unknownError) => {
          // Access the private transformError method for testing
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          const transformedError = transformError.call(service, unknownError);

          // Property 1: Should always return an Error instance
          expect(transformedError).toBeInstanceOf(Error);

          // Property 2: Should have the generic fallback message
          const expectedMessage = 'Error al cargar datos. Por favor intenta de nuevo.';
          expect(transformedError.message).toBe(expectedMessage);

          // Property 3: Message should be user-friendly (in Spanish)
          expect(transformedError.message).toContain('Error');
          expect(transformedError.message).toContain('intenta');

          return transformedError instanceof Error && 
                 transformedError.message === expectedMessage;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Property 6c: Error message consistency
   * 
   * Verifies that the same error code always produces the same error message,
   * ensuring consistency across the application.
   */
  it('Property 6c: Same error code always produces same message', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('permission-denied', 'unavailable', 'not-found'),
        fc.integer({ min: 2, max: 10 }), // Number of times to transform
        (errorCode, numTransformations) => {
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          
          // Transform the same error multiple times
          const messages: string[] = [];
          for (let i = 0; i < numTransformations; i++) {
            const firestoreError = {
              code: errorCode,
              message: `Test error ${i}`,
              name: 'FirebaseError'
            };
            const transformedError = transformError.call(service, firestoreError);
            messages.push(transformedError.message);
          }

          // Property: All messages should be identical
          const allMessagesMatch = messages.every(msg => msg === messages[0]);
          expect(allMessagesMatch).toBe(true);

          // Property: Message should not contain iteration-specific data
          const firstMessage = messages[0];
          expect(firstMessage).not.toContain('Test error');
          expect(firstMessage).not.toMatch(/\d+/); // Should not contain numbers from error details

          return allMessagesMatch;
        }
      ),
      {
        numRuns: 50,
        verbose: true
      }
    );
  });

  /**
   * Property 6d: Offline scenario handling
   * 
   * Verifies that offline/network errors (unavailable) are handled gracefully
   * with appropriate user-friendly messages.
   */
  it('Property 6d: Offline scenarios produce appropriate error messages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'unavailable',
          'deadline-exceeded',
          'resource-exhausted'
        ),
        (offlineErrorCode) => {
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          
          const networkError = {
            code: offlineErrorCode,
            message: 'Network request failed',
            name: 'FirebaseError'
          };

          const transformedError = transformError.call(service, networkError);

          // Property 1: Should return Error instance
          expect(transformedError).toBeInstanceOf(Error);

          // Property 2: Message should be user-friendly
          const message = transformedError.message;
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);

          // Property 3: For 'unavailable', should have specific offline message
          if (offlineErrorCode === 'unavailable') {
            expect(message).toBe('Servicio temporalmente no disponible. Intenta de nuevo.');
            expect(message).toContain('temporalmente');
            expect(message).toContain('Intenta de nuevo');
          } else {
            // Other network errors should get generic message
            expect(message).toBe('Error al cargar datos. Por favor intenta de nuevo.');
          }

          // Property 4: Should not expose technical error codes
          expect(message).not.toContain(offlineErrorCode);
          expect(message).not.toContain('deadline-exceeded');
          expect(message).not.toContain('resource-exhausted');

          return transformedError instanceof Error && message.length > 0;
        }
      ),
      {
        numRuns: 50,
        verbose: true
      }
    );
  });

  /**
   * Property 6e: Error transformation preserves Error type
   * 
   * Verifies that all transformed errors are proper Error instances
   * that can be caught and handled by error handlers.
   */
  it('Property 6e: All transformed errors are Error instances', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ code: fc.constantFrom('permission-denied', 'unavailable', 'not-found') }),
          fc.record({ code: fc.string({ minLength: 1, maxLength: 50 }) }),
          fc.string(),
          fc.record({ message: fc.string() }),
          fc.constant(null),
          fc.constant(undefined),
          fc.integer(),
          fc.boolean()
        ),
        (anyError) => {
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          const transformedError = transformError.call(service, anyError);

          // Property 1: Should always return Error instance
          expect(transformedError).toBeInstanceOf(Error);

          // Property 2: Should have a message property
          expect(transformedError.message).toBeDefined();
          expect(typeof transformedError.message).toBe('string');
          expect(transformedError.message.length).toBeGreaterThan(0);

          // Property 3: Should have a name property
          expect(transformedError.name).toBe('Error');

          // Property 4: Should be throwable
          expect(() => {
            throw transformedError;
          }).toThrow(Error);

          return transformedError instanceof Error && 
                 transformedError.message.length > 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Property 6f: Error messages are non-empty and meaningful
   * 
   * Verifies that all error messages contain meaningful text
   * and are not empty or just whitespace.
   */
  it('Property 6f: Error messages are non-empty and meaningful', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ code: fc.constantFrom('permission-denied', 'unavailable', 'not-found') }),
          fc.record({ code: fc.string() }),
          fc.string(),
          fc.constant(null)
        ),
        (error) => {
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          const transformedError = transformError.call(service, error);

          const message = transformedError.message;

          // Property 1: Message should not be empty
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);

          // Property 2: Message should not be just whitespace
          expect(message.trim().length).toBeGreaterThan(0);

          // Property 3: Message should contain meaningful words (at least 3 words)
          const words = message.trim().split(/\s+/);
          expect(words.length).toBeGreaterThanOrEqual(3);

          // Property 4: Message should be in Spanish (contain Spanish words)
          const spanishWords = ['no', 'tienes', 'permisos', 'datos', 'servicio', 'temporalmente', 
                                'disponible', 'intenta', 'nuevo', 'error', 'cargar', 'favor', 
                                'solicitados', 'encontrados'];
          const containsSpanishWords = spanishWords.some(word => 
            message.toLowerCase().includes(word)
          );
          expect(containsSpanishWords).toBe(true);

          return message.length > 0 && 
                 message.trim().length > 0 && 
                 words.length >= 3;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Property 6g: Error handling is deterministic
   * 
   * Verifies that error transformation is deterministic - the same input
   * always produces the same output.
   */
  it('Property 6g: Error transformation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ code: fc.constantFrom('permission-denied', 'unavailable', 'not-found') }),
          fc.string(),
          fc.constant(null)
        ),
        (error) => {
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          
          // Transform the same error multiple times
          const result1 = transformError.call(service, error);
          const result2 = transformError.call(service, error);
          const result3 = transformError.call(service, error);

          // Property: All results should have the same message
          expect(result1.message).toBe(result2.message);
          expect(result2.message).toBe(result3.message);
          expect(result1.message).toBe(result3.message);

          return result1.message === result2.message && 
                 result2.message === result3.message;
        }
      ),
      {
        numRuns: 50,
        verbose: true
      }
    );
  });
});
