/**
 * Service Model
 * Represents a professional service offered in the portfolio
 */

/**
 * Service information
 */
export interface Service {
  /** Unique identifier for the service */
  id: string;
  
  /** Service title */
  title: string;
  
  /** Detailed description of the service */
  description: string;
  
  /** Display order (lower numbers appear first) */
  order: number;
}
