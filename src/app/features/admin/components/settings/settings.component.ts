import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../../../core/services/data.service';
import { Profile, About, Contact, TECH_COLORS } from '../../../../models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { finalize } from 'rxjs/operators';
import { Skill } from '../../../../models';

type SettingsTab = 'profile' | 'about' | 'skills' | 'contact';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    RichTextEditorComponent
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private cloudinaryService = inject(CloudinaryService);

  activeTab = signal<SettingsTab>('profile');
  isLoading = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  profileForm!: FormGroup;
  aboutForm!: FormGroup;
  contactForm!: FormGroup;
  skillForm!: FormGroup;

  skills = signal<Skill[]>([]);
  
  skillSearchResults = signal<string[]>([]);
  showSkillDropdown = signal(false);
  
  availableTechs = Object.keys(TECH_COLORS).sort();
  
  // For About Rich Text
  aboutDescriptionContent = '';
  
  // For Profile Image
  profilePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  ngOnInit() {
    this.initForms();
    this.loadData();
  }

  private initForms() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      title: ['', Validators.required],
      tagline: ['', Validators.required],
      description: ['', Validators.required],
      yearAvailable: [new Date().getFullYear()],
      deployments: [0],
      awards: [0],
      github: [''],
      linkedin: [''],
      email: ['', Validators.email]
    });

    this.aboutForm = this.fb.group({
      journeyTitle: ['', Validators.required]
    });

    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      ctaTitle: ['', Validators.required],
      ctaDescription: ['', Validators.required],
      primaryButton: ['', Validators.required],
      secondaryButton: ['', Validators.required]
    });

    this.skillForm = this.fb.group({
      name: ['', Validators.required],
      category: ['language', Validators.required]
    });
  }

  private loadData() {
    this.isLoading.set(true);
    
    // Load Profile
    this.dataService.getProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          name: profile.name,
          title: profile.title,
          tagline: profile.tagline,
          description: profile.description,
          yearAvailable: profile.yearAvailable,
          deployments: profile.stats.deployments,
          awards: profile.stats.awards,
          github: profile.stats.social.github,
          linkedin: profile.stats.social.linkedin,
          email: profile.stats.social.email
        });
        this.profilePreview.set(profile.image || null);
      },
      error: (err) => this.errorMessage.set(err.message)
    });

    // Load About
    this.dataService.getAbout().subscribe({
      next: (about) => {
        this.aboutForm.patchValue({
          journeyTitle: about.journey.title
        });
        this.aboutDescriptionContent = about.journey.description;
      },
      error: (err) => this.errorMessage.set(err.message)
    });

    // Load Skills
    this.dataService.getSkills().subscribe({
      next: (skills) => this.skills.set(skills),
      error: (err) => this.errorMessage.set(err.message)
    });

    // Load Contact
    this.dataService.getContact().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (contact) => {
        this.contactForm.patchValue({
          email: contact.email,
          ctaTitle: contact.callToAction.title,
          ctaDescription: contact.callToAction.description,
          primaryButton: contact.callToAction.primaryButton,
          secondaryButton: contact.callToAction.secondaryButton
        });
      },
      error: (err) => this.errorMessage.set(err.message)
    });
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    
    this.isLoading.set(true);
    try {
      let imageUrl = this.profilePreview();

      // Upload image if a new file was selected
      if (this.selectedFile()) {
        imageUrl = await this.cloudinaryService.uploadImage(this.selectedFile()!, 'portfolio/profile');
      }

      const val = this.profileForm.value;
      const profileData: Partial<Profile> = {
        name: val.name,
        title: val.title,
        tagline: val.tagline,
        description: val.description,
        yearAvailable: val.yearAvailable,
        image: imageUrl || '',
        stats: {
          deployments: val.deployments,
          awards: val.awards,
          social: {
            github: val.github,
            linkedin: val.linkedin,
            email: val.email
          }
        }
      };
      await this.dataService.updateProfile(profileData);
      this.showMessage('Profile updated successfully');
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveAbout() {
    if (this.aboutForm.invalid) return;

    this.isLoading.set(true);
    try {
      const aboutData: Partial<About> = {
        journey: {
          title: this.aboutForm.value.journeyTitle,
          description: this.aboutDescriptionContent
        }
      };
      await this.dataService.updateAbout(aboutData);
      this.showMessage('About section updated successfully');
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveContact() {
    if (this.contactForm.invalid) return;

    this.isLoading.set(true);
    try {
      const val = this.contactForm.value;
      const contactData: Partial<Contact> = {
        email: val.email,
        callToAction: {
          title: val.ctaTitle,
          description: val.ctaDescription,
          primaryButton: val.primaryButton,
          secondaryButton: val.secondaryButton
        }
      };
      await this.dataService.updateContact(contactData);
      this.showMessage('Contact settings updated successfully');
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addSkill() {
    if (this.skillForm.invalid) return;

    const skillName = this.skillForm.value.name.trim();
    if (!TECH_COLORS[skillName.toLowerCase()]) {
      this.errorMessage.set('Please select a valid technology from the list');
      return;
    }

    const existingSkill = this.skills().find(
      s => s.name.toLowerCase() === skillName.toLowerCase()
    );
    if (existingSkill) {
      this.errorMessage.set('This skill already exists');
      return;
    }

    this.isLoading.set(true);
    try {
      const newSkill: Partial<Skill> = {
        name: skillName,
        category: this.skillForm.value.category,
        order: this.skills().length + 1
      };
      await this.dataService.createSkill(newSkill);
      this.skillForm.reset({ category: 'language' });
      this.skillSearchResults.set([]);
      this.dataService.getSkills().subscribe(s => this.skills.set(s));
      this.showMessage('Skill added successfully');
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSkillInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    if (value.length < 1) {
      this.skillSearchResults.set([]);
      this.showSkillDropdown.set(false);
      return;
    }

    const filtered = this.availableTechs.filter(tech => 
      tech.toLowerCase().includes(value)
    );
    this.skillSearchResults.set(filtered);
    this.showSkillDropdown.set(filtered.length > 0);
  }

  selectSkill(tech: string): void {
    this.skillForm.patchValue({ name: tech });
    this.showSkillDropdown.set(false);
    this.skillSearchResults.set([]);
  }

  onSkillBlur(): void {
    setTimeout(() => this.showSkillDropdown.set(false), 200);
  }

  onSkillFocus(): void {
    if (this.skillSearchResults().length > 0) {
      this.showSkillDropdown.set(true);
    }
  }

  async deleteSkill(name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    this.isLoading.set(true);
    try {
      await this.dataService.deleteSkill(name);
      this.skills.update(prev => prev.filter(s => s.name !== name));
      this.showMessage('Skill deleted successfully');
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onProfileImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);
      
      // Create local preview
      const reader = new FileReader();
      reader.onload = (e) => this.profilePreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeProfileImage() {
    this.selectedFile.set(null);
    this.profilePreview.set(null);
  }

  private showMessage(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  getTechColor(name: string): string {
    return TECH_COLORS[name.toLowerCase()] ?? '#888888';
  }
}
