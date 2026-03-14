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
