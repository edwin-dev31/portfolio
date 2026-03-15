import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { Profile, About, Service, Skill, Project, Contact } from '../../models';

/**
 * DataService provides a unified interface for data operations
 * with direct Firestore integration, caching, and error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private firestore = inject(Firestore);
  private cache = new Map<string, Observable<Profile | About | Service[] | Skill[] | Project[] | Contact>>();

  // ==================== Profile ====================

  /**
   * Get profile data from Firestore
   * @returns Observable of Profile data
   */
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
            // Firestore structure matches Profile model: stats.social
            return {
              name: data['name'],
              title: data['title'],
              tagline: data['tagline'],
              description: data['description'],
              yearAvailable: data['yearAvailable'],
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

  /**
   * Update profile data in Firestore
   * @param profile - Partial profile data to update
   */
  async updateProfile(profile: Partial<Profile>): Promise<void> {
    try {
      const profileRef = doc(this.firestore, 'portfolio', 'profile');
      // Firestore structure matches Profile model: stats.social
      const firestoreData: Record<string, unknown> = {};
      
      if (profile.name !== undefined) firestoreData['name'] = profile.name;
      if (profile.title !== undefined) firestoreData['title'] = profile.title;
      if (profile.tagline !== undefined) firestoreData['tagline'] = profile.tagline;
      if (profile.description !== undefined) firestoreData['description'] = profile.description;
      if (profile.yearAvailable !== undefined) firestoreData['yearAvailable'] = profile.yearAvailable;
      
      if (profile.stats) {
        firestoreData['stats'] = {
          deployments: profile.stats.deployments,
          awards: profile.stats.awards,
          social: profile.stats.social
        };
      }
      
      await updateDoc(profileRef, firestoreData);
      this.cache.delete('profile'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  // ==================== About ====================

  /**
   * Get about data from Firestore
   * @returns Observable of About data
   */
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

  /**
   * Update about data in Firestore
   * @param about - Partial about data to update
   */
  async updateAbout(about: Partial<About>): Promise<void> {
    try {
      const aboutRef = doc(this.firestore, 'portfolio', 'about');
      await updateDoc(aboutRef, about as any);
      this.cache.delete('about'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  // ==================== Services ====================

  /**
   * Get all services from Firestore
   * @returns Observable of Service array
   */
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
            // Sort by order
            return services.sort((a: Service, b: Service) => a.order - b.order);
          }),
          catchError(this.handleError),
          shareReplay(1)
        )
      );
    }
    return this.cache.get('services')! as Observable<Service[]>;
  }

  /**
   * Get a single service by ID
   * @param id - Service ID
   * @returns Observable of Service
   */
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

  /**
   * Create a new service
   * @param service - Partial service data
   * @returns Promise of created Service
   */
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
      
      this.cache.delete('services'); // Invalidate cache
      return newService;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Update an existing service
   * @param id - Service ID
   * @param updates - Partial service data to update
   */
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
      
      this.cache.delete('services'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Delete a service
   * @param id - Service ID
   */
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
      
      this.cache.delete('services'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  // ==================== Skills ====================

  /**
   * Get all skills from Firestore
   * @returns Observable of Skill array
   */
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
            // Sort by order
            return skills.sort((a: Skill, b: Skill) => a.order - b.order);
          }),
          catchError(this.handleError),
          shareReplay(1)
        )
      );
    }
    return this.cache.get('skills')! as Observable<Skill[]>;
  }

  /**
   * Create a new skill
   * @param skill - Partial skill data
   * @returns Promise of created Skill
   */
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
      
      this.cache.delete('skills'); // Invalidate cache
      return newSkill;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Update an existing skill
   * @param name - Skill name (used as ID)
   * @param updates - Partial skill data to update
   */
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
      
      this.cache.delete('skills'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Delete a skill
   * @param name - Skill name (used as ID)
   */
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
      
      this.cache.delete('skills'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  // ==================== Projects ====================

  /**
   * Get all projects from Firestore
   * @returns Observable of Project array
   */
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

  /**
   * Get a single project by ID
   * @param id - Project ID
   * @returns Observable of Project
   */
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

  /**
   * Create a new project
   * @param project - Partial project data
   * @returns Promise of created Project
   */
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
      
      this.cache.delete('projects'); // Invalidate cache
      return newProject;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Update an existing project
   * @param id - Project ID
   * @param updates - Partial project data to update
   */
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
      
      this.cache.delete('projects'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Delete a project
   * @param id - Project ID
   */
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
      
      this.cache.delete('projects'); // Invalidate cache
    } catch (error) {
      throw this.transformError(error);
    }
  }

  // ==================== Contact ====================

  /**
   * Get contact data from Firestore
   * Note: Contact is not in the current Firestore structure
   * This is a placeholder for future implementation
   * @returns Observable of Contact data
   */
  getContact(): Observable<Contact> {
    // Placeholder - contact data not in current Firestore structure
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

  /**
   * Update contact data in Firestore
   * Note: Contact is not in the current Firestore structure
   * This is a placeholder for future implementation
   * @param contact - Partial contact data to update
   */
  async updateContact(contact: Partial<Contact>): Promise<void> {
    // Placeholder - contact data not in current Firestore structure
    console.warn('Contact update not implemented - no contact document in Firestore');
  }

  // ==================== Error Handling ====================

  /**
   * Handle Firestore errors and transform to user-friendly messages.
   * Bound as an arrow function so `this` is preserved when used in catchError.
   * @param error - The error to handle
   * @returns Observable that throws a user-friendly error
   */
  private handleError = (error: unknown): Observable<never> => {
    console.error('Firestore error:', error);
    return throwError(() => this.transformError(error));
  };

  /**
   * Transform Firestore / Firebase errors to user-friendly messages.
   * Handles specific error codes: permission-denied, unavailable, not-found,
   * unauthenticated, resource-exhausted, deadline-exceeded, cancelled.
   * @param error - The error to transform
   * @returns Error with user-friendly message
   */
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

    // Re-use already-transformed errors (e.g. from nested calls)
    if (error instanceof Error) {
      return error;
    }

    return new Error('Error al cargar datos. Por favor intenta de nuevo.');
  }
}
