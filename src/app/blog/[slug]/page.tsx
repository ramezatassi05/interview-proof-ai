import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { getAllPosts, getPostBySlug } from '../lib';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} - InterviewProof Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <article className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-2xl">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to Blog
              </Link>

              <div className="mt-8 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span>&middot;</span>
                <span>{post.readingTime}</span>
                <span>&middot;</span>
                <span>{post.author}</span>
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                {post.description}
              </p>

              <div className="mt-10 border-t border-[var(--border-default)] pt-10">
                <div className="prose-custom font-serif text-base leading-relaxed text-[var(--text-secondary)]">
                  {post.content.split('\n\n').map((paragraph, i) => {
                    const trimmed = paragraph.trim();
                    if (!trimmed) return null;

                    if (trimmed.startsWith('## ')) {
                      return (
                        <h2
                          key={i}
                          className="mb-4 mt-10 text-2xl font-bold text-[var(--text-primary)]"
                        >
                          {trimmed.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith('### ')) {
                      return (
                        <h3
                          key={i}
                          className="mb-3 mt-8 text-xl font-bold text-[var(--text-primary)]"
                        >
                          {trimmed.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                      const items = trimmed.split('\n').filter((l) => l.trim());
                      return (
                        <ul key={i} className="my-4 ml-6 list-disc space-y-2">
                          {items.map((item, j) => (
                            <li key={j}>{item.replace(/^[-*]\s+/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={i} className="mb-4">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>

              <div className="mt-16 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 text-center">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Ready to find your interview gaps?
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Get a personalized diagnostic in minutes.
                </p>
                <Link
                  href="/new"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-colors hover:from-orange-500 hover:via-pink-600 hover:to-purple-600"
                >
                  Start My Diagnostic
                </Link>
              </div>
            </div>
          </Container>
        </article>
      </main>
      <Footer />
    </>
  );
}
