import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RichTextEditorComponent } from './rich-text-editor.component';
import { By } from '@angular/platform-browser';

describe('RichTextEditorComponent', () => {
  let component: RichTextEditorComponent;
  let fixture: ComponentFixture<RichTextEditorComponent>;

  beforeEach(async () => {
    // Mock document.execCommand
    document.execCommand = vi.fn().mockReturnValue(true);
    document.queryCommandState = vi.fn().mockReturnValue(false);

    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RichTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should have empty content by default', () => {
      expect(component.content()).toBe('');
    });

    it('should not be bold initially', () => {
      expect(component.isBold()).toBe(false);
    });

    it('should not be italic initially', () => {
      expect(component.isItalic()).toBe(false);
    });
  });

  describe('Toolbar buttons', () => {
    it('should render bold button', () => {
      const boldBtn = fixture.debugElement.query(By.css('button[aria-label="Bold"]'));
      expect(boldBtn).not.toBeNull();
    });

    it('should render italic button', () => {
      const italicBtn = fixture.debugElement.query(By.css('button[aria-label="Italic"]'));
      expect(italicBtn).not.toBeNull();
    });

    it('should render bullet list button', () => {
      const listBtn = fixture.debugElement.query(By.css('button[aria-label="Bullet list"]'));
      expect(listBtn).not.toBeNull();
    });

    it('should render numbered list button', () => {
      const listBtn = fixture.debugElement.query(By.css('button[aria-label="Numbered list"]'));
      expect(listBtn).not.toBeNull();
    });

    it('should render link button', () => {
      const linkBtn = fixture.debugElement.query(By.css('button[aria-label="Insert link"]'));
      expect(linkBtn).not.toBeNull();
    });
  });

  describe('Editor content', () => {
    it('should render contenteditable div', () => {
      const editor = fixture.debugElement.query(By.css('[contenteditable="true"]'));
      expect(editor).not.toBeNull();
    });

    it('should have role textbox', () => {
      const editor = fixture.debugElement.query(By.css('.rich-text-editor__content'));
      expect(editor.nativeElement.getAttribute('role')).toBe('textbox');
    });

    it('should have aria-multiline', () => {
      const editor = fixture.debugElement.query(By.css('.rich-text-editor__content'));
      expect(editor.nativeElement.getAttribute('aria-multiline')).toBe('true');
    });

    it('should have aria-label', () => {
      const editor = fixture.debugElement.query(By.css('.rich-text-editor__content'));
      expect(editor.nativeElement.getAttribute('aria-label')).toBe('Rich text editor');
    });
  });

  describe('Formatting commands', () => {
    it('should call execCommand when toggleBold is called', () => {
      const execCommandSpy = document.execCommand as ReturnType<typeof vi.fn>;
      
      component.toggleBold();
      
      expect(execCommandSpy).toHaveBeenCalledWith('bold', false, undefined);
    });

    it('should call execCommand when toggleItalic is called', () => {
      const execCommandSpy = document.execCommand as ReturnType<typeof vi.fn>;
      
      component.toggleItalic();
      
      expect(execCommandSpy).toHaveBeenCalledWith('italic', false, undefined);
    });

    it('should call execCommand when insertUnorderedList is called', () => {
      const execCommandSpy = document.execCommand as ReturnType<typeof vi.fn>;
      
      component.insertUnorderedList();
      
      expect(execCommandSpy).toHaveBeenCalledWith('insertUnorderedList', false, undefined);
    });

    it('should call execCommand when insertOrderedList is called', () => {
      const execCommandSpy = document.execCommand as ReturnType<typeof vi.fn>;
      
      component.insertOrderedList();
      
      expect(execCommandSpy).toHaveBeenCalledWith('insertOrderedList', false, undefined);
    });
  });

  describe('Active button states', () => {
    it('should apply active class to bold button when bold is active', () => {
      component.isBold.set(true);
      fixture.detectChanges();

      const boldBtn = fixture.debugElement.query(By.css('button[aria-label="Bold"]'));
      expect(boldBtn.nativeElement.classList.contains('rich-text-editor__btn--active')).toBe(true);
    });

    it('should apply active class to italic button when italic is active', () => {
      component.isItalic.set(true);
      fixture.detectChanges();

      const italicBtn = fixture.debugElement.query(By.css('button[aria-label="Italic"]'));
      expect(italicBtn.nativeElement.classList.contains('rich-text-editor__btn--active')).toBe(true);
    });

    it('should not apply active class when formatting is not active', () => {
      component.isBold.set(false);
      fixture.detectChanges();

      const boldBtn = fixture.debugElement.query(By.css('button[aria-label="Bold"]'));
      expect(boldBtn.nativeElement.classList.contains('rich-text-editor__btn--active')).toBe(false);
    });
  });

  describe('Paste handling', () => {
    it('should prevent default paste behavior', () => {
      const event = {
        preventDefault: vi.fn(),
        clipboardData: {
          getData: vi.fn().mockReturnValue('plain text')
        }
      } as unknown as ClipboardEvent;

      component.onPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should insert plain text on paste', () => {
      const execCommandSpy = document.execCommand as ReturnType<typeof vi.fn>;
      const event = {
        preventDefault: vi.fn(),
        clipboardData: {
          getData: vi.fn().mockReturnValue('pasted text')
        }
      } as unknown as ClipboardEvent;

      component.onPaste(event);

      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, 'pasted text');
    });
  });

  describe('Content model', () => {
    it('should update content model', () => {
      component.content.set('<p>Test content</p>');
      fixture.detectChanges();

      expect(component.content()).toBe('<p>Test content</p>');
    });

    it('should display content in editor', () => {
      component.content.set('<strong>Bold text</strong>');
      fixture.detectChanges();

      const editor = fixture.debugElement.query(By.css('.rich-text-editor__content'));
      expect(editor.nativeElement.innerHTML).toContain('Bold text');
    });
  });

  describe('Toolbar accessibility', () => {
    it('should have role toolbar', () => {
      const toolbar = fixture.debugElement.query(By.css('.rich-text-editor__toolbar'));
      expect(toolbar.nativeElement.getAttribute('role')).toBe('toolbar');
    });

    it('should have aria-label on toolbar', () => {
      const toolbar = fixture.debugElement.query(By.css('.rich-text-editor__toolbar'));
      expect(toolbar.nativeElement.getAttribute('aria-label')).toBe('Text formatting');
    });

    it('should have title attributes on buttons', () => {
      const boldBtn = fixture.debugElement.query(By.css('button[aria-label="Bold"]'));
      expect(boldBtn.nativeElement.title).toBe('Bold');
    });
  });
});
