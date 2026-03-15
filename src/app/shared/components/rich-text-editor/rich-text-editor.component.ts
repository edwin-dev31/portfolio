import { Component, ChangeDetectionStrategy, model, signal, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * RichTextEditorComponent
 * 
 * A simple rich text editor for project descriptions.
 * Supports basic formatting: bold, italic, lists, and links.
 * Uses contenteditable for editing with toolbar controls.
 * 
 * @example
 * <app-rich-text-editor [(content)]="projectDescription">
 * </app-rich-text-editor>
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichTextEditorComponent {
  /**
   * HTML content (two-way binding)
   */
  content = model<string>('');

  /**
   * Reference to the contenteditable div
   */
  private editorElement = viewChild<ElementRef<HTMLDivElement>>('editor');

  /**
   * Active formatting states
   */
  isBold = signal<boolean>(false);
  isItalic = signal<boolean>(false);

  /**
   * Flag to prevent circular updates
   */
  private isUpdatingFromUser = false;

  constructor() {
    // Update editor content when content model changes externally
    effect(() => {
      const newContent = this.content();
      const editor = this.editorElement();
      
      if (editor && !this.isUpdatingFromUser) {
        const currentContent = editor.nativeElement.innerHTML;
        if (currentContent !== newContent) {
          editor.nativeElement.innerHTML = newContent;
        }
      }
    });
  }

  /**
   * Execute formatting command
   */
  execCommand(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.updateContent();
    this.updateToolbarState();
  }

  /**
   * Toggle bold formatting
   */
  toggleBold(): void {
    this.execCommand('bold');
  }

  /**
   * Toggle italic formatting
   */
  toggleItalic(): void {
    this.execCommand('italic');
  }

  /**
   * Insert unordered list
   */
  insertUnorderedList(): void {
    this.execCommand('insertUnorderedList');
  }

  /**
   * Insert ordered list
   */
  insertOrderedList(): void {
    this.execCommand('insertOrderedList');
  }

  /**
   * Insert link
   */
  insertLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.execCommand('createLink', url);
    }
  }

  /**
   * Handle content changes
   */
  onContentChange(event: Event): void {
    this.isUpdatingFromUser = true;
    this.updateContent();
    this.updateToolbarState();
    this.isUpdatingFromUser = false;
  }

  /**
   * Update content model from editor
   */
  private updateContent(): void {
    const editor = this.editorElement();
    if (editor) {
      this.content.set(editor.nativeElement.innerHTML);
    }
  }

  /**
   * Update toolbar button states based on current selection
   */
  private updateToolbarState(): void {
    this.isBold.set(document.queryCommandState('bold'));
    this.isItalic.set(document.queryCommandState('italic'));
  }

  /**
   * Handle paste event to clean up formatting
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  }
}
