import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

// Company slugs for interview question pages
const COMPANY_SLUGS = [
  'google',
  'meta',
  'apple',
  'amazon',
  'netflix',
  'microsoft',
  'nvidia',
  'openai',
  'anthropic',
  'stripe',
  'uber',
  'airbnb',
  'goldman-sachs',
  'jp-morgan',
  'figma',
  'notion',
  'vercel',
  'coinbase',
  'databricks',
  'palantir',
];

// Role slugs for interview prep pages
const ROLE_SLUGS = [
  'backend',
  'frontend',
  'fullstack',
  'ml-ai',
  'data',
  'devops-infra',
  'mobile',
  'systems',
  'security',
  'management',
  'general',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://interviewproof.ai';

  // Static pages
  const staticRoutes = [
    '/',
    '/privacy',
    '/terms',
    '/contact',
    '/about',
    '/methodology',
    '/blog',
    '/ambassadors',
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));

  // Company interview question pages
  for (const slug of COMPANY_SLUGS) {
    entries.push({
      url: `${baseUrl}/interview-questions/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  // Role prep pages
  for (const slug of ROLE_SLUGS) {
    entries.push({
      url: `${baseUrl}/interview-prep/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  // Blog posts
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      entries.push({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
