export interface Contact {
  
  email: string;
  
  
  callToAction: CallToAction;
}

export interface CallToAction {
  
  title: string;
  
  
  description: string;
  
  
  primaryButton: string;
  
  
  secondaryButton: string;
}
