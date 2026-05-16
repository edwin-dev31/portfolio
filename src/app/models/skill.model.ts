export type SkillCategory = 
  | 'language' 
  | 'frontend' 
  | 'backend' 
  | 'framework' 
  | 'tool' 
  | 'other';

export interface Skill {
  
  name: string;
  
  
  category: SkillCategory;
  
  
  order: number;
}
