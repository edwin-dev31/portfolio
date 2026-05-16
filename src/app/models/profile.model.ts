export interface Profile {
  
  name: string;
  
  
  title: string;
  
  
  tagline: string;
  
  
  description: string;
  
  
  yearAvailable: number;

  
  image?: string;
  
  
  stats: ProfileStats;
}

export interface ProfileStats {
  
  deployments: number;
  
  
  awards: number;
  
  
  social: SocialLinks;
}

export interface SocialLinks {
  
  github: string;
  
  
  linkedin: string;
  
  
  email: string;
}
