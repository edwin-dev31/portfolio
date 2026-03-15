import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Project } from '../../models/project.model';

export interface SeoMetaTags {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

/**
 * SeoService
 *
 * Manages page meta tags, Open Graph tags, Twitter Card tags,
 * canonical URLs, and JSON-LD structured data.
 *
 * Requirements: 12.2, 12.3, 12.5, 12.6
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private document = inject(DOCUMENT);

  private readonly siteName = 'Portfolio';
  private readonly defaultDescription = 'Professional portfolio showcasing projects and skills.';

  /**
   * Update all meta tags for a page.
   * Sets title, description, keywords, Open Graph, and Twitter Card tags.
   */
  updateMetaTags(tags: SeoMetaTags): void {
    const fullTitle = `${tags.title} | ${this.siteName}`;

    // Basic meta
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: tags.description });
    if (tags.keywords) {
      this.meta.updateTag({ name: 'keywords', content: tags.keywords });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: tags.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    if (tags.url) {
      this.meta.updateTag({ property: 'og:url', content: tags.url });
    }
    if (tags.image) {
      this.meta.updateTag({ property: 'og:image', content: tags.image });
      this.meta.updateTag({ property: 'og:image:alt', content: tags.title });
    }

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: tags.image ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: tags.description });
    if (tags.image) {
      this.meta.updateTag({ name: 'twitter:image', content: tags.image });
      this.meta.updateTag({ name: 'twitter:image:alt', content: tags.title });
    }
  }

  /**
   * Update or create the canonical URL link element.
   */
  updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * Inject or update a JSON-LD structured data script tag.
   */
  updateStructuredData(data: object): void {
    const id = 'structured-data-json-ld';
    let script: HTMLScriptElement = this.document.getElementById(id) as HTMLScriptElement;
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  /**
   * Set default home page meta tags.
   */
  setHomeMeta(url: string): void {
    this.updateMetaTags({
      title: 'Home',
      description: this.defaultDescription,
      url
    });
    this.updateCanonicalUrl(url);
    this.updateStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url
    });
  }

  /**
   * Set project page meta tags and JSON-LD structured data.
   */
  setProjectMeta(project: Project, url: string): void {
    this.updateMetaTags({
      title: project.title,
      description: project.description,
      keywords: project.tools.join(', '),
      image: project.image || undefined,
      url
    });
    this.updateCanonicalUrl(url);
    this.updateStructuredData({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.description,
      url: project.links?.liveDemo || url,
      image: project.image || undefined,
      keywords: project.tools.join(', '),
      codeRepository: project.links?.repository || undefined
    });
  }
}
