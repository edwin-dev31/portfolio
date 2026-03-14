/**
 * Skill Model
 * Represents a technical skill or competency
 */

/**
 * Skill categories
 */
export type SkillCategory = 
  | 'language' 
  | 'frontend' 
  | 'backend' 
  | 'framework' 
  | 'tool' 
  | 'other';

/**
 * Skill information
 */
export interface Skill {
  /** Skill name (e.g., "TypeScript", "React") */
  name: string;
  
  /** Category of the skill */
  category: SkillCategory;
  
  /** Display order (lower numbers appear first) */
  order: number;
}
