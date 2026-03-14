/**
 * About Model
 * Represents information about the professional journey and philosophy
 */

/**
 * About section containing journey information
 */
export interface About {
  /** Professional journey details */
  journey: Journey;
}

/**
 * Professional journey information
 */
export interface Journey {
  /** Title of the journey section */
  title: string;
  
  /** Detailed description of the professional journey */
  description: string;
}
