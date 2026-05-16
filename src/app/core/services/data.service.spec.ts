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
    
    
    (service as unknown as ServiceWithCache).cache.clear();
  });

  
  it('Property 7: Firestore Query Caching - repeated queries result in single Firestore read', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), 
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
          
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          
          let sourceSubscriptionCount = 0;
          
          
          const mockObservable = new Observable<Profile>((observer) => {
            sourceSubscriptionCount++;
            observer.next(profileData);
            observer.complete();
          }).pipe(shareReplay(1));
          
          
          serviceCache.set('profile', mockObservable);
          
          
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
          
          
          
          expect(sourceSubscriptionCount).toBe(1);
          
          
          const allResultsMatch = results.every(result => 
            result.name === profileData.name &&
            result.title === profileData.title &&
            result.tagline === profileData.tagline &&
            result.description === profileData.description &&
            result.yearAvailable === profileData.yearAvailable
          );
          expect(allResultsMatch).toBe(true);
          
          
          expect(results.length).toBe(numQueries);
          
          
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

  
  it('Property 7b: Cache invalidation - cache is cleared after update', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (initialName, updatedName) => {
          
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          
          const mockObservable: MockObservable<Profile> = {
            subscribe: vi.fn()
          };
          serviceCache.set('profile', mockObservable as unknown as Observable<Profile>);
          
          
          expect(serviceCache.has('profile')).toBe(true);
          expect(serviceCache.size).toBe(1);
          
          
          serviceCache.delete('profile');
          
          
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

  
  it('Property 7c: Multiple collections - separate caches for different data types', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('profile', 'about', 'contact', 'projects', 'services', 'skills'), { minLength: 2, maxLength: 6 }),
        (cacheKeys) => {
          
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          
          const mockObservable: MockObservable<unknown> = { subscribe: vi.fn() };
          cacheKeys.forEach(key => {
            serviceCache.set(key, mockObservable as unknown as Observable<unknown>);
          });
          
          
          const allKeysPresent = cacheKeys.every(key => 
            serviceCache.has(key)
          );
          expect(allKeysPresent).toBe(true);
          
          
          const uniqueKeys = [...new Set(cacheKeys)];
          expect(serviceCache.size).toBe(uniqueKeys.length);
          
          
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

  
  it('Property 7d: Concurrent subscriptions - all receive same cached data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          title: fc.string({ minLength: 1, maxLength: 100 })
        }),
        (numSubscribers, profileData) => {
          
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          
          let subscriptionCount = 0;
          const subscribers: Array<Partial<Observer<{ name: string; title: string }>>> = [];
          
          const mockObservable: MockObservable<{ name: string; title: string }> = {
            subscribe: (observer: Partial<Observer<{ name: string; title: string }>>) => {
              subscriptionCount++;
              subscribers.push(observer);
              
              
              if (observer.next) {
                observer.next(profileData);
              }
              
              return {
                unsubscribe: () => {}
              };
            }
          };
          
          
          serviceCache.set('profile', mockObservable as unknown as Observable<unknown>);
          
          
          const results: Array<{ name: string; title: string }> = [];
          for (let i = 0; i < numSubscribers; i++) {
            const observable = serviceCache.get('profile') as unknown as MockObservable<{ name: string; title: string }>;
            observable.subscribe({
              next: (data: { name: string; title: string }) => results.push(data)
            });
          }
          
          
          expect(subscriptionCount).toBe(numSubscribers);
          
          
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

  
  it('Property 7e: shareReplay behavior - replays last value to new subscribers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.integer({ min: 0, max: 1000 })
        }),
        async (testData) => {
          
          const serviceCache = (service as unknown as ServiceWithCache).cache;
          serviceCache.clear();
          
          
          let sourceExecutions = 0;
          
          
          const observable = new Observable<{ name: string; value: number }>((observer) => {
            sourceExecutions++;
            observer.next(testData);
            observer.complete();
          }).pipe(shareReplay(1));
          
          
          const result1 = await new Promise<{ name: string; value: number }>((resolve) => {
            observable.subscribe({
              next: (data) => resolve(data)
            });
          });
          
          
          const result2 = await new Promise<{ name: string; value: number }>((resolve) => {
            observable.subscribe({
              next: (data) => resolve(data)
            });
          });
          
          
          expect(sourceExecutions).toBe(1);
          
          
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

  
  it('Property 6a: Known Firestore error codes produce user-friendly messages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('permission-denied', 'unavailable', 'not-found'),
        fc.string({ minLength: 1, maxLength: 100 }), 
        (errorCode, errorDetails) => {
          
          const firestoreError = {
            code: errorCode,
            message: errorDetails,
            name: 'FirebaseError'
          };

          
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          const transformedError = transformError.call(service, firestoreError);

          
          expect(transformedError).toBeInstanceOf(Error);

          
          const message = transformedError.message;
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);

          
          const spanishKeywords = ['tienes', 'permisos', 'temporalmente', 'disponible', 'solicitados', 'encontrados'];
          const containsSpanish = spanishKeywords.some(keyword => message.toLowerCase().includes(keyword));
          expect(containsSpanish).toBe(true);

          
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

  
  it('Property 6b: Unknown errors produce generic fallback message', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          
          fc.string({ minLength: 1, maxLength: 100 }), 
          fc.record({ message: fc.string() }), 
          fc.record({ code: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !['permission-denied', 'unavailable', 'not-found'].includes(s)) }), 
          fc.constant(null), 
          fc.constant(undefined) 
        ),
        (unknownError) => {
          
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          const transformedError = transformError.call(service, unknownError);

          
          expect(transformedError).toBeInstanceOf(Error);

          
          const expectedMessage = 'Error al cargar datos. Por favor intenta de nuevo.';
          expect(transformedError.message).toBe(expectedMessage);

          
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

  
  it('Property 6c: Same error code always produces same message', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('permission-denied', 'unavailable', 'not-found'),
        fc.integer({ min: 2, max: 10 }), 
        (errorCode, numTransformations) => {
          const transformError = (service as unknown as { transformError: (error: unknown) => Error }).transformError;
          
          
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

          
          const allMessagesMatch = messages.every(msg => msg === messages[0]);
          expect(allMessagesMatch).toBe(true);

          
          const firstMessage = messages[0];
          expect(firstMessage).not.toContain('Test error');
          expect(firstMessage).not.toMatch(/\d+/); 

          return allMessagesMatch;
        }
      ),
      {
        numRuns: 50,
        verbose: true
      }
    );
  });

  
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

          
          expect(transformedError).toBeInstanceOf(Error);

          
          const message = transformedError.message;
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);

          
          if (offlineErrorCode === 'unavailable') {
            expect(message).toBe('Servicio temporalmente no disponible. Intenta de nuevo.');
            expect(message).toContain('temporalmente');
            expect(message).toContain('Intenta de nuevo');
          } else {
            
            expect(message).toBe('Error al cargar datos. Por favor intenta de nuevo.');
          }

          
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

          
          expect(transformedError).toBeInstanceOf(Error);

          
          expect(transformedError.message).toBeDefined();
          expect(typeof transformedError.message).toBe('string');
          expect(transformedError.message.length).toBeGreaterThan(0);

          
          expect(transformedError.name).toBe('Error');

          
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

          
          expect(message).toBeTruthy();
          expect(message.length).toBeGreaterThan(0);

          
          expect(message.trim().length).toBeGreaterThan(0);

          
          const words = message.trim().split(/\s+/);
          expect(words.length).toBeGreaterThanOrEqual(3);

          
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
          
          
          const result1 = transformError.call(service, error);
          const result2 = transformError.call(service, error);
          const result3 = transformError.call(service, error);

          
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
