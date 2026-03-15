import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminShellComponent } from './admin-shell.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { signal } from '@angular/core';
import { User } from '../../../../models';
import { vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminShellComponent', () => {
  let component: AdminShellComponent;
  let fixture: ComponentFixture<AdminShellComponent>;
  let mockAuthService: any;
  let mockThemeService: any;
  let router: Router;

  const mockUser: User = {
    uid: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'admin',
    createdAt: new Date(),
    lastLogin: new Date()
  };

  beforeEach(async () => {
    mockAuthService = {
      logout: vi.fn(),
      currentUser: signal(mockUser)
    };

    mockThemeService = {
      currentTheme: signal<'light' | 'dark'>('dark')
    };

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile menu', () => {
    expect(component.isMobileMenuOpen()).toBe(false);
    
    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen()).toBe(true);
    
    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('should close mobile menu', () => {
    component.isMobileMenuOpen.set(true);
    
    component.closeMobileMenu();
    
    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('should logout and navigate to login', async () => {
    mockAuthService.logout.mockResolvedValue(undefined);
    
    await component.logout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('should get user display name from displayName', () => {
    const displayName = component.getUserDisplayName();
    expect(displayName).toBe('Test User');
  });

  it('should get user display name from email when displayName is not available', async () => {
    // Create new mock with different user
    const mockAuthServiceNoName = {
      logout: vi.fn(),
      currentUser: signal({
        ...mockUser,
        displayName: undefined
      })
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthServiceNoName },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    const newFixture = TestBed.createComponent(AdminShellComponent);
    const newComponent = newFixture.componentInstance;
    
    const displayName = newComponent.getUserDisplayName();
    expect(displayName).toBe('test@example.com');
  });

  it('should return default display name when user is null', async () => {
    // Create new mock with null user
    const mockAuthServiceNullUser = {
      logout: vi.fn(),
      currentUser: signal(null)
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthServiceNullUser },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    const newFixture = TestBed.createComponent(AdminShellComponent);
    const newComponent = newFixture.componentInstance;
    
    const displayName = newComponent.getUserDisplayName();
    expect(displayName).toBe('Usuario');
  });

  it('should get user initials from display name', () => {
    const initials = component.getUserInitials();
    expect(initials).toBe('TU');
  });

  it('should get user initials from email when displayName is not available', async () => {
    // Create new mock with different user
    const mockAuthServiceNoName = {
      logout: vi.fn(),
      currentUser: signal({
        ...mockUser,
        displayName: undefined
      })
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthServiceNoName },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    const newFixture = TestBed.createComponent(AdminShellComponent);
    const newComponent = newFixture.componentInstance;
    
    const initials = newComponent.getUserInitials();
    expect(initials).toBe('TE');
  });

  it('should return default initials when user is null', async () => {
    // Create new mock with null user
    const mockAuthServiceNullUser = {
      logout: vi.fn(),
      currentUser: signal(null)
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthServiceNullUser },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    const newFixture = TestBed.createComponent(AdminShellComponent);
    const newComponent = newFixture.componentInstance;
    
    const initials = newComponent.getUserInitials();
    expect(initials).toBe('U');
  });

  it('should handle logout error gracefully', async () => {
    mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    await component.logout();
    
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
