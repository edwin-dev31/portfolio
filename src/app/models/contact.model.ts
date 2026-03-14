/**
 * Contact Model
 * Represents contact information and call-to-action
 */

/**
 * Contact information
 */
export interface Contact {
  /** Contact email address */
  email: string;
  
  /** Call-to-action section */
  callToAction: CallToAction;
}

/**
 * Call-to-action information for contact section
 */
export interface CallToAction {
  /** Main CTA title */
  title: string;
  
  /** CTA description text */
  description: string;
  
  /** Primary button text */
  primaryButton: string;
  
  /** Secondary button text */
  secondaryButton: string;
}
