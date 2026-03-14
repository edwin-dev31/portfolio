/**
 * Profile Model
 * Represents the main personal information displayed in the portfolio
 */

/**
 * Main profile information
 */
export interface Profile {
  /** Full name of the portfolio owner */
  name: string;
  
  /** Professional title or role */
  title: string;
  
  /** Short tagline or motto */
  tagline: string;
  
  /** Detailed professional description */
  description: string;
  
  /** Year available for new projects */
  yearAvailable: number;
  
  /** Professional statistics */
  stats: ProfileStats;
  
  /** Social media links */
  social: SocialLinks;
}

/**
 * Professional statistics to showcase achievements
 */
export interface ProfileStats {
  /** Number of successful deployments */
  deployments: number;
  
  /** Number of awards received */
  awards: number;
}

/**
 * Social media and contact links
 */
export interface SocialLinks {
  /** GitHub profile URL */
  github: string;
  
  /** LinkedIn profile URL */
  linkedin: string;
  
  /** Contact email address */
  email: string;
}
