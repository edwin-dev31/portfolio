import { Injectable, inject, signal, computed } from '@angular/core';
import { DataService } from './data.service';
import { Profile, About, Service, Skill, Project, Contact } from '../../models';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private dataService = inject(DataService);

  

  private profileSignal = signal<Profile | null>(null);
  private aboutSignal = signal<About | null>(null);
  private servicesSignal = signal<Service[]>([]);
  private skillsSignal = signal<Skill[]>([]);
  private projectsSignal = signal<Project[]>([]);
  private contactSignal = signal<Contact | null>(null);
  
  private isLoadingProfileSignal = signal<boolean>(false);
  private isLoadingAboutSignal = signal<boolean>(false);
  private isLoadingServicesSignal = signal<boolean>(false);
  private isLoadingSkillsSignal = signal<boolean>(false);
  private isLoadingProjectsSignal = signal<boolean>(false);
  private isLoadingContactSignal = signal<boolean>(false);

  private selectedProjectSignal = signal<Project | null>(null);

  

  profile = this.profileSignal.asReadonly();
  about = this.aboutSignal.asReadonly();
  services = this.servicesSignal.asReadonly();
  skills = this.skillsSignal.asReadonly();
  projects = this.projectsSignal.asReadonly();
  contact = this.contactSignal.asReadonly();
  
  isLoadingProfile = this.isLoadingProfileSignal.asReadonly();
  isLoadingAbout = this.isLoadingAboutSignal.asReadonly();
  isLoadingServices = this.isLoadingServicesSignal.asReadonly();
  isLoadingSkills = this.isLoadingSkillsSignal.asReadonly();
  isLoadingProjects = this.isLoadingProjectsSignal.asReadonly();
  isLoadingContact = this.isLoadingContactSignal.asReadonly();

  selectedProject = this.selectedProjectSignal.asReadonly();

  

  
  publishedProjects = computed(() => {
    
    return this.projects();
  });

  
  draftProjects = computed(() => {
    
    return [];
  });

  
  projectCount = computed(() => this.projects().length);

  
  serviceCount = computed(() => this.services().length);

  
  skillCount = computed(() => this.skills().length);

  
  skillsByCategory = computed(() => {
    const skills = this.skills();
    const grouped: Record<string, Skill[]> = {};
    
    skills.forEach(skill => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    });
    
    return grouped;
  });

  

  
  async loadProfile(): Promise<void> {
    this.isLoadingProfileSignal.set(true);
    try {
      const profile = await firstValueFrom(this.dataService.getProfile());
      this.profileSignal.set(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      throw error;
    } finally {
      this.isLoadingProfileSignal.set(false);
    }
  }

  
  async updateProfile(updates: Partial<Profile>): Promise<void> {
    try {
      await this.dataService.updateProfile(updates);
      const currentProfile = this.profileSignal();
      if (currentProfile) {
        this.profileSignal.set({ ...currentProfile, ...updates });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  

  
  async loadAbout(): Promise<void> {
    this.isLoadingAboutSignal.set(true);
    try {
      const about = await firstValueFrom(this.dataService.getAbout());
      this.aboutSignal.set(about);
    } catch (error) {
      console.error('Error loading about:', error);
      throw error;
    } finally {
      this.isLoadingAboutSignal.set(false);
    }
  }

  
  async updateAbout(updates: Partial<About>): Promise<void> {
    try {
      await this.dataService.updateAbout(updates);
      const currentAbout = this.aboutSignal();
      if (currentAbout) {
        this.aboutSignal.set({ ...currentAbout, ...updates });
      }
    } catch (error) {
      console.error('Error updating about:', error);
      throw error;
    }
  }

  

  
  async loadServices(): Promise<void> {
    this.isLoadingServicesSignal.set(true);
    try {
      const services = await firstValueFrom(this.dataService.getServices());
      this.servicesSignal.set(services);
    } catch (error) {
      console.error('Error loading services:', error);
      throw error;
    } finally {
      this.isLoadingServicesSignal.set(false);
    }
  }

  
  async addService(service: Partial<Service>): Promise<void> {
    try {
      const newService = await this.dataService.createService(service);
      this.servicesSignal.update(services => [...services, newService]);
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  }

  
  async updateService(id: string, updates: Partial<Service>): Promise<void> {
    try {
      await this.dataService.updateService(id, updates);
      this.servicesSignal.update(services =>
        services.map(s => s.id === id ? { ...s, ...updates } : s)
      );
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  
  async deleteService(id: string): Promise<void> {
    try {
      await this.dataService.deleteService(id);
      this.servicesSignal.update(services => services.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  

  
  async loadSkills(): Promise<void> {
    this.isLoadingSkillsSignal.set(true);
    try {
      const skills = await firstValueFrom(this.dataService.getSkills());
      this.skillsSignal.set(skills);
    } catch (error) {
      console.error('Error loading skills:', error);
      throw error;
    } finally {
      this.isLoadingSkillsSignal.set(false);
    }
  }

  
  async addSkill(skill: Partial<Skill>): Promise<void> {
    try {
      const newSkill = await this.dataService.createSkill(skill);
      this.skillsSignal.update(skills => [...skills, newSkill]);
    } catch (error) {
      console.error('Error adding skill:', error);
      throw error;
    }
  }

  
  async updateSkill(name: string, updates: Partial<Skill>): Promise<void> {
    try {
      await this.dataService.updateSkill(name, updates);
      this.skillsSignal.update(skills =>
        skills.map(s => s.name === name ? { ...s, ...updates } : s)
      );
    } catch (error) {
      console.error('Error updating skill:', error);
      throw error;
    }
  }

  
  async deleteSkill(name: string): Promise<void> {
    try {
      await this.dataService.deleteSkill(name);
      this.skillsSignal.update(skills => skills.filter(s => s.name !== name));
    } catch (error) {
      console.error('Error deleting skill:', error);
      throw error;
    }
  }

  

  
  async loadProjects(): Promise<void> {
    this.isLoadingProjectsSignal.set(true);
    try {
      const projects = await firstValueFrom(this.dataService.getProjects());
      this.projectsSignal.set(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
      throw error;
    } finally {
      this.isLoadingProjectsSignal.set(false);
    }
  }

  
  selectProject(id: string): void {
    const project = this.projects().find(p => p.id === id);
    this.selectedProjectSignal.set(project || null);
  }

  
  clearSelectedProject(): void {
    this.selectedProjectSignal.set(null);
  }

  
  async addProject(project: Partial<Project>): Promise<void> {
    try {
      const newProject = await this.dataService.createProject(project);
      this.projectsSignal.update(projects => [...projects, newProject]);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }

  
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    try {
      await this.dataService.updateProject(id, updates);
      this.projectsSignal.update(projects =>
        projects.map(p => p.id === id ? { ...p, ...updates } : p)
      );
      
      
      const selectedProject = this.selectedProjectSignal();
      if (selectedProject && selectedProject.id === id) {
        this.selectedProjectSignal.set({ ...selectedProject, ...updates });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  
  async deleteProject(id: string): Promise<void> {
    try {
      await this.dataService.deleteProject(id);
      this.projectsSignal.update(projects => projects.filter(p => p.id !== id));
      
      
      const selectedProject = this.selectedProjectSignal();
      if (selectedProject && selectedProject.id === id) {
        this.selectedProjectSignal.set(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  

  
  async loadContact(): Promise<void> {
    this.isLoadingContactSignal.set(true);
    try {
      const contact = await firstValueFrom(this.dataService.getContact());
      this.contactSignal.set(contact);
    } catch (error) {
      console.error('Error loading contact:', error);
      throw error;
    } finally {
      this.isLoadingContactSignal.set(false);
    }
  }

  
  async updateContact(updates: Partial<Contact>): Promise<void> {
    try {
      await this.dataService.updateContact(updates);
      const currentContact = this.contactSignal();
      if (currentContact) {
        this.contactSignal.set({ ...currentContact, ...updates });
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  

  
  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadProfile(),
      this.loadAbout(),
      this.loadServices(),
      this.loadSkills(),
      this.loadProjects(),
      this.loadContact()
    ]);
  }

  
  clearAll(): void {
    this.profileSignal.set(null);
    this.aboutSignal.set(null);
    this.servicesSignal.set([]);
    this.skillsSignal.set([]);
    this.projectsSignal.set([]);
    this.contactSignal.set(null);
    this.selectedProjectSignal.set(null);
  }
}
