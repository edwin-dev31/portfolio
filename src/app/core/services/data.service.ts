import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { Profile, About, Service, Skill, Project, Contact } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private firestore = inject(Firestore);
  private cache = new Map<string, Observable<Profile | About | Service[] | Skill[] | Project[] | Contact>>();

  

  
  getProfile(): Observable<Profile> {
    if (!this.cache.has('profile')) {
      const profileRef = doc(this.firestore, 'portfolio', 'profile');
      this.cache.set('profile',
        from(getDoc(profileRef)).pipe(
          map(docSnap => {
            if (!docSnap.exists()) {
              throw new Error('Profile document not found');
            }
            const data = docSnap.data();
            
            return {
              name: data['name'],
              title: data['title'],
              tagline: data['tagline'],
              description: data['description'],
              yearAvailable: data['yearAvailable'],
              image: data['image'] || null,
              stats: {
                deployments: data['stats']?.['deployments'] || 0,
                awards: data['stats']?.['awards'] || 0,
                social: data['stats']?.['social'] || { github: '', linkedin: '', email: '' }
              }
            } as Profile;
          }),
          catchError(this.handleError),
          shareReplay(1)
        )
      );
    }
    return this.cache.get('profile')! as Observable<Profile>;
  }

  
  async updateProfile(profile: Partial<Profile>): Promise<void> {
    try {
      const profileRef = doc(this.firestore, 'portfolio', 'profile');
      
      const firestoreData: Record<string, unknown> = {};
      
      if (profile.name !== undefined) firestoreData['name'] = profile.name;
      if (profile.title !== undefined) firestoreData['title'] = profile.title;
      if (profile.tagline !== undefined) firestoreData['tagline'] = profile.tagline;
      if (profile.description !== undefined) firestoreData['description'] = profile.description;
      if (profile.yearAvailable !== undefined) firestoreData['yearAvailable'] = profile.yearAvailable;
      if (profile.image !== undefined) firestoreData['image'] = profile.image;
      
      if (profile.stats) {
        firestoreData['stats'] = {
          deployments: profile.stats.deployments,
          awards: profile.stats.awards,
          social: profile.stats.social
        };
      }
      
      await updateDoc(profileRef, firestoreData);
      this.cache.delete('profile'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  

  
  getAbout(): Observable<About> {
    if (!this.cache.has('about')) {
      const aboutRef = doc(this.firestore, 'portfolio', 'about');
      this.cache.set('about',
        from(getDoc(aboutRef)).pipe(
          map(docSnap => {
            if (!docSnap.exists()) {
              throw new Error('About document not found');
            }
            return docSnap.data() as About;
          }),
          catchError(this.handleError),
          shareReplay(1)
        )
      );
    }
    return this.cache.get('about')! as Observable<About>;
  }

  
  async updateAbout(about: Partial<About>): Promise<void> {
    try {
      const aboutRef = doc(this.firestore, 'portfolio', 'about');
      await updateDoc(aboutRef, about as any);
      this.cache.delete('about'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  

  
  getServices(): Observable<Service[]> {
    if (!this.cache.has('services')) {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      this.cache.set('services',
        from(getDoc(infoRef)).pipe(
          map(docSnap => {
            if (!docSnap.exists()) {
              throw new Error('Info document not found');
            }
            const data = docSnap.data();
            const services = data['services'] || [];
            
            return services.sort((a: Service, b: Service) => a.order - b.order);
          }),
          catchError(this.handleError),
          shareReplay(1)
        )
      );
    }
    return this.cache.get('services')! as Observable<Service[]>;
  }

  
  getServiceById(id: string): Observable<Service> {
    return this.getServices().pipe(
      map(services => {
        const service = services.find(s => s.id === id);
        if (!service) {
          throw new Error(`Service with id ${id} not found`);
        }
        return service;
      })
    );
  }

  
  async createService(service: Partial<Service>): Promise<Service> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const services = data['services'] || [];
      
      const newService: Service = {
        id: service.id || `service-${Date.now()}`,
        title: service.title || '',
        description: service.description || '',
        order: service.order || services.length + 1
      };
      
      services.push(newService);
      await updateDoc(infoRef, { services });
      
      this.cache.delete('services'); 
      return newService;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  
  async updateService(id: string, updates: Partial<Service>): Promise<void> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const services = data['services'] || [];
      
      const index = services.findIndex((s: Service) => s.id === id);
      if (index === -1) {
        throw new Error(`Service with id ${id} not found`);
      }
      
      services[index] = { ...services[index], ...updates };
      await updateDoc(infoRef, { services });
      
      this.cache.delete('services'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  
  async deleteService(id: string): Promise<void> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const services = data['services'] || [];
      
      const filteredServices = services.filter((s: Service) => s.id !== id);
      await updateDoc(infoRef, { services: filteredServices });
      
      this.cache.delete('services'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  

  
  getSkills(): Observable<Skill[]> {
    if (!this.cache.has('skills')) {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      this.cache.set('skills',
        from(getDoc(infoRef)).pipe(
          map(docSnap => {
            if (!docSnap.exists()) {
              throw new Error('Info document not found');
            }
            const data = docSnap.data();
            const skills = data['skills'] || [];
            
            return skills.sort((a: Skill, b: Skill) => a.order - b.order);
          }),
          catchError(this.handleError),
          shareReplay(1)
        )
      );
    }
    return this.cache.get('skills')! as Observable<Skill[]>;
  }

  
  async createSkill(skill: Partial<Skill>): Promise<Skill> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const skills = data['skills'] || [];
      
      const newSkill: Skill = {
        name: skill.name || '',
        category: skill.category || 'other',
        order: skill.order || skills.length + 1
      };
      
      skills.push(newSkill);
      await updateDoc(infoRef, { skills });
      
      this.cache.delete('skills'); 
      return newSkill;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  
  async updateSkill(name: string, updates: Partial<Skill>): Promise<void> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const skills = data['skills'] || [];
      
      const index = skills.findIndex((s: Skill) => s.name === name);
      if (index === -1) {
        throw new Error(`Skill with name ${name} not found`);
      }
      
      skills[index] = { ...skills[index], ...updates };
      await updateDoc(infoRef, { skills });
      
      this.cache.delete('skills'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  
  async deleteSkill(name: string): Promise<void> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const skills = data['skills'] || [];
      
      const filteredSkills = skills.filter((s: Skill) => s.name !== name);
      await updateDoc(infoRef, { skills: filteredSkills });
      
      this.cache.delete('skills'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  

  
  getProjects(): Observable<Project[]> {
    if (!this.cache.has('projects')) {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      this.cache.set('projects',
        from(getDoc(infoRef)).pipe(
          map(docSnap => {
            if (!docSnap.exists()) {
              throw new Error('Info document not found');
            }
            const data = docSnap.data();
            return data['projects'] || [];
          }),
          catchError(this.handleError),
          shareReplay(1)
        )
      );
    }
    return this.cache.get('projects')! as Observable<Project[]>;
  }

  
  getProjectById(id: string): Observable<Project> {
    return this.getProjects().pipe(
      map(projects => {
        const project = projects.find(p => p.id === id);
        if (!project) {
          throw new Error(`Project with id ${id} not found`);
        }
        return project;
      })
    );
  }

  
  async createProject(project: Partial<Project>): Promise<Project> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const projects = data['projects'] || [];
      
      const newProject: Project = {
        id: project.id || `project-${Date.now()}`,
        title: project.title || '',
        category: project.category || '',
        description: project.description || '',
        image: project.image || '',
        tools: project.tools || [],
        links: project.links || { repository: '', liveDemo: '' }
      };
      
      projects.push(newProject);
      await updateDoc(infoRef, { projects });
      
      this.cache.delete('projects'); 
      return newProject;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const projects = data['projects'] || [];
      
      const index = projects.findIndex((p: Project) => p.id === id);
      if (index === -1) {
        throw new Error(`Project with id ${id} not found`);
      }
      
      projects[index] = { ...projects[index], ...updates };
      await updateDoc(infoRef, { projects });
      
      this.cache.delete('projects'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  
  async deleteProject(id: string): Promise<void> {
    try {
      const infoRef = doc(this.firestore, 'portfolio', 'info');
      const infoSnap = await getDoc(infoRef);
      
      if (!infoSnap.exists()) {
        throw new Error('Info document not found');
      }
      
      const data = infoSnap.data();
      const projects = data['projects'] || [];
      
      const filteredProjects = projects.filter((p: Project) => p.id !== id);
      await updateDoc(infoRef, { projects: filteredProjects });
      
      this.cache.delete('projects'); 
    } catch (error) {
      throw this.transformError(error);
    }
  }

  

  
  getContact(): Observable<Contact> {
    
    return of({
      email: 'edwin_dev@hotmail.com',
      callToAction: {
        title: 'Let\'s Build Something Amazing',
        description: 'Ready to bring your vision to life?',
        primaryButton: 'Get in Touch',
        secondaryButton: 'View Projects'
      }
    });
  }

  
  async updateContact(contact: Partial<Contact>): Promise<void> {
    
    console.warn('Contact update not implemented - no contact document in Firestore');
  }

  

  
  private handleError = (error: unknown): Observable<never> => {
    console.error('Firestore error:', error);
    return throwError(() => this.transformError(error));
  };

  
  private transformError(error: unknown): Error {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const errorCode = (error as { code: string }).code;

      switch (errorCode) {
        case 'permission-denied':
          return new Error('No tienes permisos para acceder a estos datos');
        case 'unavailable':
          return new Error('Servicio temporalmente no disponible. Intenta de nuevo.');
        case 'not-found':
          return new Error('Los datos solicitados no fueron encontrados');
        case 'unauthenticated':
          return new Error('Debes iniciar sesión para realizar esta acción');
        case 'resource-exhausted':
          return new Error('Límite de solicitudes alcanzado. Intenta de nuevo más tarde.');
        case 'deadline-exceeded':
          return new Error('La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.');
        case 'cancelled':
          return new Error('La operación fue cancelada. Por favor intenta de nuevo.');
        case 'already-exists':
          return new Error('El recurso ya existe');
        case 'failed-precondition':
          return new Error('Operación no permitida en el estado actual');
        case 'internal':
          return new Error('Error interno del servidor. Por favor intenta de nuevo.');
      }
    }

    
    if (error instanceof Error) {
      return error;
    }

    return new Error('Error al cargar datos. Por favor intenta de nuevo.');
  }
}
