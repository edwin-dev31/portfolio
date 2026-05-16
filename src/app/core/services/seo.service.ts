import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string; 
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private document = inject(DOCUMENT);

  private readonly siteName = 'Portfolio';
  private readonly defaultDescription = 'Professional portfolio showcasing projects and skills.';

  
  updateMetaTags(config: SeoConfig): void {
    const pageTitle = (config.title && config.title !== 'Home') ? `${config.title} | ${this.siteName}` : this.siteName;
    const description = config.description ?? this.defaultDescription;
    const ogType = config.type ?? 'website';

    
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }

    
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    if (config.url) {
      this.meta.updateTag({ property: 'og:url', content: config.url });
    }
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: config.image });
      this.meta.updateTag({ property: 'og:image:alt', content: config.title ?? this.siteName });
    }

    
    this.meta.updateTag({ name: 'twitter:card', content: config.image ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (config.image) {
      this.meta.updateTag({ name: 'twitter:image', content: config.image });
      this.meta.updateTag({ name: 'twitter:image:alt', content: config.title ?? this.siteName });
    }
  }

  
  updateCanonicalUrl(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  
  updateStructuredData(data: StructuredData): void {
    const id = 'structured-data-json-ld';
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
