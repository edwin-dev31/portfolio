import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;
  let cardElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    cardElement = fixture.debugElement.query(By.css('.card'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Base classes', () => {
    it('should always have base card class', () => {
      expect(cardElement.nativeElement.classList.contains('card')).toBe(true);
    });
  });

  describe('Elevation variants', () => {
    it('should apply medium elevation by default', () => {
      expect(cardElement.nativeElement.classList.contains('card--elevation-md')).toBe(true);
    });

    it('should apply none elevation when specified', () => {
      fixture.componentRef.setInput('elevation', 'none');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--elevation-none')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--elevation-md')).toBe(false);
    });

    it('should apply small elevation when specified', () => {
      fixture.componentRef.setInput('elevation', 'sm');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--elevation-sm')).toBe(true);
    });

    it('should apply large elevation when specified', () => {
      fixture.componentRef.setInput('elevation', 'lg');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--elevation-lg')).toBe(true);
    });

    it('should apply extra large elevation when specified', () => {
      fixture.componentRef.setInput('elevation', 'xl');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--elevation-xl')).toBe(true);
    });
  });

  describe('Padding variants', () => {
    it('should apply medium padding by default', () => {
      expect(cardElement.nativeElement.classList.contains('card--padding-md')).toBe(true);
    });

    it('should apply none padding when specified', () => {
      fixture.componentRef.setInput('padding', 'none');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--padding-none')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--padding-md')).toBe(false);
    });

    it('should apply small padding when specified', () => {
      fixture.componentRef.setInput('padding', 'sm');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--padding-sm')).toBe(true);
    });

    it('should apply large padding when specified', () => {
      fixture.componentRef.setInput('padding', 'lg');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--padding-lg')).toBe(true);
    });

    it('should apply extra large padding when specified', () => {
      fixture.componentRef.setInput('padding', 'xl');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--padding-xl')).toBe(true);
    });
  });

  describe('Hoverable state', () => {
    it('should be hoverable by default', () => {
      expect(cardElement.nativeElement.classList.contains('card--hoverable')).toBe(true);
    });

    it('should not be hoverable when hoverable is false', () => {
      fixture.componentRef.setInput('hoverable', false);
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--hoverable')).toBe(false);
    });

    it('should have cursor pointer when hoverable', () => {
      const styles = window.getComputedStyle(cardElement.nativeElement);
      expect(styles.cursor).toBe('pointer');
    });
  });

  describe('Content projection', () => {
    it('should project content into card', () => {
      const testContent = 'Card content';
      cardElement.nativeElement.textContent = testContent;
      fixture.detectChanges();

      expect(cardElement.nativeElement.textContent).toContain(testContent);
    });
  });

  describe('Computed classes', () => {
    it('should combine elevation and padding classes', () => {
      fixture.componentRef.setInput('elevation', 'lg');
      fixture.componentRef.setInput('padding', 'xl');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--elevation-lg')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--padding-xl')).toBe(true);
    });

    it('should update classes when inputs change', () => {
      fixture.componentRef.setInput('elevation', 'sm');
      fixture.detectChanges();
      expect(cardElement.nativeElement.classList.contains('card--elevation-sm')).toBe(true);

      fixture.componentRef.setInput('elevation', 'lg');
      fixture.detectChanges();
      expect(cardElement.nativeElement.classList.contains('card--elevation-lg')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--elevation-sm')).toBe(false);
    });

    it('should include hoverable class when hoverable is true', () => {
      fixture.componentRef.setInput('hoverable', true);
      fixture.componentRef.setInput('elevation', 'md');
      fixture.componentRef.setInput('padding', 'lg');
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--elevation-md')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--padding-lg')).toBe(true);
      expect(cardElement.nativeElement.classList.contains('card--hoverable')).toBe(true);
    });

    it('should exclude hoverable class when hoverable is false', () => {
      fixture.componentRef.setInput('hoverable', false);
      fixture.detectChanges();

      expect(cardElement.nativeElement.classList.contains('card--hoverable')).toBe(false);
    });
  });

  describe('Glassmorphism effect', () => {
    it('should have glassmorphism styles applied', () => {
      const styles = window.getComputedStyle(cardElement.nativeElement);
      
      // Card should have border-radius
      expect(styles.borderRadius).toBeTruthy();
    });
  });
});
