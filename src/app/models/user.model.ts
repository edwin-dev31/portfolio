/**
 * User Model
 * Represents an authenticated user in the system
 */

/**
 * User roles
 */
export type UserRole = 'admin' | 'viewer';

/**
 * User information
 */
export interface User {
  /** Firebase user ID */
  uid: string;
  
  /** User email address */
  email: string;
  
  /** Display name (optional) */
  displayName?: string;
  
  /** Profile photo URL (optional) */
  photoURL?: string;
  
  /** User role for authorization */
  role: UserRole;
  
  /** Account creation date */
  createdAt: Date;
  
  /** Last login date (optional) */
  lastLogin?: Date;
}
