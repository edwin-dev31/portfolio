import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SeoService, SeoConfig, StructuredData } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let metaService: Meta;
  let titleService: Title;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    metaService = TestBed.inject(Meta);
    titleService = TestBed.inject(Title);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Clean up canonical link and structured data script
    const canonical = document.querySelector('link[rel="canonical"]');
    canonical?.remove();
    const script = document.getElementById('structured-data-json-ld');
    script?.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateMetaTags()', () => {
    it('should set page title with site name suffix', () => {
      service.updateMetaTags({ title: 'Home' });
      expect(titleService.getTitle()).toBe('Portfolio');
    });

    it('should use site name alone when no title provided', () => {
      service.updateMetaTags({});
      expect(titleService.getTitle()).toBe('Portfolio');
    });

    it('should set description meta tag', () => {
      service.updateMetaTags({ description: 'Test description' });
      const tag = metaService.getTag('name="description"');
      expect(tag?.content).toBe('Test description');
    });

    it('should set keywords meta tag when provided', () => {
      service.updateMetaTags({ keywords: 'angular, typescript' });
      const tag = metaService.getTag('name="keywords"');
      expect(tag?.content).toBe('angular, typescript');
    });

    it('should set Open Graph title tag', () => {
      service.updateMetaTags({ title: 'My Project' });
      const tag = metaService.getTag('property="og:title"');
      expect(tag?.content).toBe('My Project | Portfolio');
    });

    it('should set Open Graph description tag', () => {
      service.updateMetaTags({ description: 'OG description' });
      const tag = metaService.getTag('property="og:description"');
      expect(tag?.content).toBe('OG description');
    });

    it('should set og:type from config', () => {
      service.updateMetaTags({ type: 'article' });
      const tag = metaService.getTag('property="og:type"');
      expect(tag?.content).toBe('article');
    });

    it('should default og:type to website', () => {
      service.updateMetaTags({});
      const tag = metaService.getTag('property="og:type"');
      expect(tag?.content).toBe('website');
    });

    it('should set og:url when url provided', () => {
      service.updateMetaTags({ url: 'https://example.com/page' });
      const tag = metaService.getTag('property="og:url"');
      expect(tag?.content).toBe('https://example.com/page');
    });

    it('should set og:image when image provided', () => {
      service.updateMetaTags({ image: 'https://example.com/img.jpg' });
      const tag = metaService.getTag('property="og:image"');
      expect(tag?.content).toBe('https://example.com/img.jpg');
    });

    it('should set Twitter Card tags', () => {
      service.updateMetaTags({ title: 'Test', description: 'Desc' });
      const card = metaService.getTag('name="twitter:card"');
      const title = metaService.getTag('name="twitter:title"');
      const desc = metaService.getTag('name="twitter:description"');
      expect(card?.content).toBe('summary');
      expect(title?.content).toBe('Test | Portfolio');
      expect(desc?.content).toBe('Desc');
    });

    it('should use summary_large_image Twitter card when image provided', () => {
      service.updateMetaTags({ image: 'https://example.com/img.jpg' });
      const tag = metaService.getTag('name="twitter:card"');
      expect(tag?.content).toBe('summary_large_image');
    });
  });

  describe('updateCanonicalUrl()', () => {
    it('should create canonical link element', () => {
      service.updateCanonicalUrl('https://example.com/page');
      const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://example.com/page');
    });

    it('should update existing canonical link element', () => {
      service.updateCanonicalUrl('https://example.com/first');
      service.updateCanonicalUrl('https://example.com/second');
      const links = document.querySelectorAll('link[rel="canonical"]');
      expect(links.length).toBe(1);
      expect((links[0] as HTMLLinkElement).getAttribute('href')).toBe('https://example.com/second');
    });
  });

  describe('updateStructuredData()', () => {
    it('should inject JSON-LD script tag', () => {
      const data: StructuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Portfolio'
      };
      service.updateStructuredData(data);
      const script = document.getElementById('structured-data-json-ld') as HTMLScriptElement;
      expect(script).toBeTruthy();
      expect(script.type).toBe('application/ld+json');
      expect(JSON.parse(script.textContent!)).toEqual(data);
    });

    it('should update existing JSON-LD script tag', () => {
      const first: StructuredData = { '@context': 'https://schema.org', '@type': 'WebSite' };
      const second: StructuredData = { '@context': 'https://schema.org', '@type': 'Article', name: 'Post' };
      service.updateStructuredData(first);
      service.updateStructuredData(second);
      const scripts = document.querySelectorAll('#structured-data-json-ld');
      expect(scripts.length).toBe(1);
      expect(JSON.parse((scripts[0] as HTMLScriptElement).textContent!)).toEqual(second);
    });
  });
});
