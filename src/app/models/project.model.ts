/**
 * Project Model
 * Represents a portfolio project with details and links
 */

/**
 * Project information
 */
export interface Project {
  /** Unique identifier for the project */
  id: string;
  
  /** Project title */
  title: string;
  
  /** Project category (e.g., "ecommerce", "ai-tools") */
  category: string;
  
  /** Detailed project description */
  description: string;
  
  /** Main project image URL */
  image: string;
  
  /** Technologies and tools used in the project */
  tools: string[];
  
  /** Project links (repository, live demo) */
  links: ProjectLinks;
}

/**
 * Project external links
 */
export interface ProjectLinks {
  /** GitHub repository URL */
  repository: string;
  
  /** Live demo URL */
  liveDemo: string;
}
