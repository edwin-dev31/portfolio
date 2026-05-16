export interface Project {
  
  id: string;
  
  
  title: string;
  
  
  category: string;
  
  
  description: string;
  
  
  image: string;
  
  
  tools: string[];
  
  
  links: ProjectLinks;
}

export interface ProjectLinks {
  
  repository: string;
  
  
  liveDemo: string;
}
