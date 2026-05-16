export type UserRole = 'admin' | 'viewer';

export interface User {
  
  uid: string;
  
  
  email: string;
  
  
  displayName?: string;
  
  
  photoURL?: string;
  
  
  role: UserRole;
  
  
  createdAt: Date;
  
  
  lastLogin?: Date;
}
