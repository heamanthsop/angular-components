
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  Input, OnChanges, OnInit, Output, SimpleChanges, EventEmitter
} from '@angular/core';
import { NzSkeletonComponent } from 'ng-zorro-antd/skeleton';
import { CommonModule } from '@angular/common';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/* This component depends on a 3rd part package: marked to compile markdown to html */
import { marked } from 'marked';

@Component({
  selector: 'rappider-markdown-viewer',
  standalone: true,
  imports: [CommonModule, NzSkeletonComponent],
  templateUrl: 'markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RappiderMarkdownViewerComponent implements OnInit, OnChanges {
  @Input() markdownText: string | undefined;
  @Input() typeInRealTime? = false;
  @Input() customMarkdownClass?: string | undefined;
  @Input() typingSpeed = 5; // milliseconds, less is faster

  @Output() realtimeTypingCompleted = new EventEmitter<string>();

  /* This component doesnt use the input directly to manage the local state */
  _markdownText = '';
  markDownPreviewValue: SafeHtml = '';
  _typingIndex = 0;

  /* The string variable that saves the types text if typeInRealTime is true  */
  typingText = '';

  constructor(private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this._markdownText = this.markdownText;
    if (!this.typeInRealTime) {
      this.setMarkDownPreviewValue(this._markdownText);
    } else {
      this.typeTextInRealTime();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.['markdownText']?.currentValue !== this._markdownText) {
      this.typingText = '';
      this._typingIndex = 0;
      this._markdownText = changes['markdownText'].currentValue;
      this.setMarkDownPreviewValue(this._markdownText);
    }
  }

  async setMarkDownPreviewValue(markdownTextToDisplay: string) {
    // Set global marked options
    marked.setOptions({
      gfm: true,
      breaks: true, // this is important to keep \n as <br>
    });

    const parsedHtml = await Promise.resolve(marked(markdownTextToDisplay ?? ''));
    this.markDownPreviewValue = this.sanitizer.bypassSecurityTrustHtml(parsedHtml);
    this.cdr.detectChanges();
  }


  typeTextInRealTime(): void {

    const typeChar = () => {
      if (this._typingIndex < this._markdownText?.length) {
        this.typingText += this._markdownText.charAt(this._typingIndex);
        this.setMarkDownPreviewValue(this.typingText);

        this._typingIndex++;
        // Manually trigger change detection to update the UI
        this.cdr.detectChanges();

        setTimeout(typeChar, this.typingSpeed);
      } else {
        this.realtimeTypingCompleted.emit(new Date().toISOString());
      }
    };

    typeChar(); // initiate typing
  }

}
