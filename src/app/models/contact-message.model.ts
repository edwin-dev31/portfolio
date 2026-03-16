/**
 * Contact Message Model
 * Represents the data sent via the contact form
 */
export interface ContactMessage {
  /** Sender's name */
  name: string;
  
  /** Sender's email address */
  email: string;
  
  /** Subject of the message */
  subject: string;
  
  /** Content of the message */
  message: string;
}
