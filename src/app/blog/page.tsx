import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { getAllPosts } from './lib';

export const metadata: Metadata = {
  title: 'Blog - InterviewProof',
  description:
    'Interview tips, career strategies, and hiring insights from the InterviewProof team.',
  openGraph: {
    title: 'Blog - InterviewProof',
    description:
      'Interview tips, career strategies, and hiring insights from the InterviewProof team.',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-primary)]">
                Blog
              </div>
              <h1 className="text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
                Interview Tips & Insights
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
                Actionable strategies to help you prepare smarter and land offers at top companies.
              </p>
            </div>
          </Container>
        </section>

        <section className="pb-20 lg:pb-28">
          <Container size="md">
            {posts.length === 0 ? (
              <p className="text-center text-[var(--text-muted)]">
                Posts coming soon. Stay tuned!
              </p>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {posts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                    <article className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 transition-colors duration-200 group-hover:border-[var(--border-accent)]">
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                        <span>&middot;</span>
                        <span>{post.readingTime}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {post.description}
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
