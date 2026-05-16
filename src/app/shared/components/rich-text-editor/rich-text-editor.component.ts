import { Component, ChangeDetectionStrategy, model, signal, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RichTextEditorComponent {
  
  content = model<string>('');

  
  private editorElement = viewChild<ElementRef<HTMLDivElement>>('editor');

  
  isBold = signal<boolean>(false);
  isItalic = signal<boolean>(false);

  
  private isUpdatingFromUser = false;

  constructor() {
    
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

  
  execCommand(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.updateContent();
    this.updateToolbarState();
  }

  
  toggleBold(): void {
    this.execCommand('bold');
  }

  
  toggleItalic(): void {
    this.execCommand('italic');
  }

  
  insertUnorderedList(): void {
    this.execCommand('insertUnorderedList');
  }

  
  insertOrderedList(): void {
    this.execCommand('insertOrderedList');
  }

  
  insertLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.execCommand('createLink', url);
    }
  }

  
  onContentChange(event: Event): void {
    this.isUpdatingFromUser = true;
    this.updateContent();
    this.updateToolbarState();
    this.isUpdatingFromUser = false;
  }

  
  private updateContent(): void {
    const editor = this.editorElement();
    if (editor) {
      this.content.set(editor.nativeElement.innerHTML);
    }
  }

  
  private updateToolbarState(): void {
    this.isBold.set(document.queryCommandState('bold'));
    this.isItalic.set(document.queryCommandState('italic'));
  }

  
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  }
}
