import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://interviewproof.ai';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/account/', '/wallet/', '/r/', '/new/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
