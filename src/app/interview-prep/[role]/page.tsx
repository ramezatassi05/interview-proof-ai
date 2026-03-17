import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';

const ROLES: Record<
  string,
  {
    label: string;
    description: string;
    scoringFocus: string[];
    commonQuestionTypes: string[];
    tips: string[];
    relatedRoles: string[];
  }
> = {
  backend: {
    label: 'Backend Engineer',
    description:
      'Backend engineering interviews focus on system design, API architecture, database optimization, and distributed systems. Expect deep dives into scalability and reliability.',
    scoringFocus: [
      'System design depth (distributed systems, databases, caching)',
      'Algorithm efficiency (time/space complexity for data-heavy problems)',
      'API design and REST/GraphQL best practices',
      'Concurrency and multi-threading understanding',
    ],
    commonQuestionTypes: [
      'Design a URL shortener / rate limiter / message queue',
      'Optimize a slow SQL query with millions of rows',
      'Implement a LRU cache from scratch',
      'Design an API for a collaborative editing system',
      'Explain CAP theorem and its practical implications',
    ],
    tips: [
      'Always discuss trade-offs between consistency and availability',
      'Lead with capacity estimation in system design (QPS, storage, bandwidth)',
      'Show experience with real databases — mention specific query patterns',
      'Discuss monitoring and observability for production systems',
    ],
    relatedRoles: ['fullstack', 'devops-infra', 'systems', 'data'],
  },
  frontend: {
    label: 'Frontend Engineer',
    description:
      'Frontend interviews test UI architecture, component design, browser performance, and user experience thinking. Modern frontend roles increasingly require system design skills.',
    scoringFocus: [
      'Component architecture and state management patterns',
      'Browser rendering pipeline and performance optimization',
      'Accessibility (a11y) and semantic HTML',
      'CSS layout models and responsive design',
    ],
    commonQuestionTypes: [
      'Build an autocomplete/typeahead component from scratch',
      'Design a real-time collaborative whiteboard frontend',
      'Implement infinite scroll with virtualization',
      'Debug and optimize a slow React render cycle',
      'Design a component library with theming support',
    ],
    tips: [
      'Know the React rendering lifecycle deeply — reconciliation, batching, Suspense',
      'Practice building components without frameworks first',
      'Discuss accessibility in every UI-related answer',
      'Show awareness of Core Web Vitals and performance metrics',
    ],
    relatedRoles: ['fullstack', 'mobile', 'backend'],
  },
  fullstack: {
    label: 'Full-Stack Engineer',
    description:
      'Full-stack interviews assess breadth across frontend and backend, plus the ability to make architectural decisions that span the entire stack.',
    scoringFocus: [
      'End-to-end system design (frontend to database)',
      'API design connecting frontend and backend',
      'Database schema design and query optimization',
      'Deployment and DevOps awareness',
    ],
    commonQuestionTypes: [
      'Design and build a full-stack feature end-to-end',
      'Architect a real-time notification system',
      'Debug a production issue spanning frontend and backend',
      'Design a data model for a multi-tenant SaaS app',
      'Implement authentication and authorization from scratch',
    ],
    tips: [
      'Show depth in at least one layer while demonstrating competence across all',
      'Discuss how frontend decisions impact backend architecture and vice versa',
      'Be ready to whiteboard a full system from UI to database',
      'Demonstrate production awareness — monitoring, error handling, deployment',
    ],
    relatedRoles: ['backend', 'frontend', 'devops-infra'],
  },
  'ml-ai': {
    label: 'ML/AI Engineer',
    description:
      'ML/AI interviews combine coding, math, and system design for machine learning. Expect questions on model training, evaluation, deployment, and ML system architecture.',
    scoringFocus: [
      'ML fundamentals (bias-variance, regularization, loss functions)',
      'Model evaluation metrics and experimental design',
      'ML system design (feature stores, training pipelines, serving)',
      'Deep learning architecture understanding (when applicable)',
    ],
    commonQuestionTypes: [
      'Design a recommendation system for an e-commerce platform',
      'How would you detect and handle data drift in production?',
      'Implement gradient descent from scratch',
      'Design an A/B testing framework for ML models',
      'Explain the trade-offs between different model architectures',
    ],
    tips: [
      'Know the full ML lifecycle: data collection, feature engineering, training, evaluation, deployment, monitoring',
      'Be prepared to discuss both research and engineering trade-offs',
      'Practice ML system design problems separately from coding problems',
      'Show awareness of responsible AI and bias mitigation',
    ],
    relatedRoles: ['data', 'backend', 'systems'],
  },
  data: {
    label: 'Data Engineer / Data Scientist',
    description:
      'Data role interviews focus on SQL mastery, pipeline architecture, statistical reasoning, and the ability to derive insights from complex datasets.',
    scoringFocus: [
      'SQL proficiency (window functions, CTEs, optimization)',
      'Data pipeline architecture (batch vs stream processing)',
      'Statistical reasoning and experimental design',
      'Data modeling and warehouse design',
    ],
    commonQuestionTypes: [
      'Write a complex SQL query with window functions and joins',
      'Design an ETL pipeline for processing 10TB of daily log data',
      'How would you design an A/B test for a new feature?',
      'Design a data warehouse schema for an analytics platform',
      'Explain and implement a specific statistical test',
    ],
    tips: [
      'Master window functions — they appear in almost every data interview',
      'Be ready to discuss data quality and validation strategies',
      'Show understanding of both batch (Spark, Airflow) and streaming (Kafka, Flink) paradigms',
      'Practice explaining statistical concepts to non-technical stakeholders',
    ],
    relatedRoles: ['ml-ai', 'backend', 'devops-infra'],
  },
  'devops-infra': {
    label: 'DevOps / Infrastructure Engineer',
    description:
      'DevOps interviews test infrastructure design, CI/CD pipeline architecture, container orchestration, and production reliability engineering.',
    scoringFocus: [
      'Infrastructure as Code (Terraform, CloudFormation)',
      'Container orchestration (Kubernetes, Docker)',
      'CI/CD pipeline design and optimization',
      'Monitoring, alerting, and incident response',
    ],
    commonQuestionTypes: [
      'Design a CI/CD pipeline for a microservices architecture',
      'How would you implement zero-downtime deployments?',
      'Design a monitoring and alerting system for a distributed application',
      'Explain Kubernetes networking and how pods communicate',
      'How would you handle a production outage affecting multiple services?',
    ],
    tips: [
      'Show understanding of both cloud-native and on-premise infrastructure',
      'Be ready to discuss cost optimization and resource efficiency',
      'Demonstrate incident response experience with specific examples',
      'Know networking fundamentals — DNS, load balancing, TLS',
    ],
    relatedRoles: ['backend', 'systems', 'security'],
  },
  mobile: {
    label: 'Mobile Engineer',
    description:
      'Mobile interviews test platform-specific expertise (iOS/Android), app architecture, performance optimization, and user experience design.',
    scoringFocus: [
      'Platform architecture patterns (MVVM, Clean Architecture)',
      'Performance optimization (memory, battery, network)',
      'UI framework mastery (SwiftUI/UIKit or Jetpack Compose)',
      'Offline-first design and data synchronization',
    ],
    commonQuestionTypes: [
      'Design a social media feed with infinite scroll and caching',
      'How would you implement offline support for a messaging app?',
      'Optimize an app that is draining battery excessively',
      'Design a cross-platform architecture for a new app',
      'Implement a custom view/animation from scratch',
    ],
    tips: [
      'Know your platform deeply — memory management, threading, lifecycle',
      'Show understanding of both native and cross-platform trade-offs',
      'Discuss accessibility and internationalization',
      'Be ready to discuss app store deployment and release management',
    ],
    relatedRoles: ['frontend', 'fullstack', 'backend'],
  },
  systems: {
    label: 'Systems Engineer',
    description:
      'Systems engineering interviews test low-level programming, OS concepts, performance engineering, and hardware-software interaction.',
    scoringFocus: [
      'Operating system concepts (memory management, scheduling, I/O)',
      'Systems programming (C/C++/Rust proficiency)',
      'Performance analysis and optimization',
      'Networking fundamentals and protocol design',
    ],
    commonQuestionTypes: [
      'Implement a memory allocator from scratch',
      'Design a high-performance key-value store',
      'Explain how virtual memory works end-to-end',
      'Debug a performance bottleneck in a multi-threaded application',
      'Design a network protocol for a real-time application',
    ],
    tips: [
      'Know your memory — stack vs heap, cache lines, page tables',
      'Be comfortable with bit manipulation and low-level data structures',
      'Practice profiling and benchmarking with real tools (perf, valgrind)',
      'Discuss trade-offs between safety and performance (Rust vs C++)',
    ],
    relatedRoles: ['backend', 'devops-infra', 'security'],
  },
  security: {
    label: 'Security Engineer',
    description:
      'Security interviews test threat modeling, vulnerability assessment, secure coding practices, and incident response capabilities.',
    scoringFocus: [
      'OWASP Top 10 and common vulnerability patterns',
      'Threat modeling and risk assessment',
      'Cryptography fundamentals (encryption, hashing, PKI)',
      'Incident response and forensics',
    ],
    commonQuestionTypes: [
      'How would you design a secure authentication system?',
      'Perform a threat model for a microservices architecture',
      'Explain how TLS handshake works end-to-end',
      'Identify vulnerabilities in a given code snippet',
      'Design a security monitoring and alerting pipeline',
    ],
    tips: [
      'Think like an attacker — always consider the adversarial perspective',
      'Know the difference between encryption at rest and in transit',
      'Be ready to discuss compliance frameworks (SOC2, GDPR, HIPAA)',
      'Show understanding of both application and infrastructure security',
    ],
    relatedRoles: ['systems', 'devops-infra', 'backend'],
  },
  management: {
    label: 'Engineering Manager',
    description:
      'Engineering management interviews assess technical depth, people leadership, project management, and strategic thinking.',
    scoringFocus: [
      'People management and team building',
      'Technical depth sufficient to guide architecture decisions',
      'Project planning and execution',
      'Cross-functional communication and stakeholder management',
    ],
    commonQuestionTypes: [
      'How do you handle an underperforming engineer on your team?',
      'Describe how you would plan and deliver a complex multi-quarter project',
      'How do you balance technical debt with feature development?',
      'Tell me about a time you had to make a difficult staffing decision',
      'How do you foster a culture of engineering excellence?',
    ],
    tips: [
      'Prepare stories that demonstrate both technical judgment and people skills',
      'Show how you create systems and processes, not just fight fires',
      'Discuss how you measure team health and engineering productivity',
      'Be ready for system design questions — managers need technical credibility',
    ],
    relatedRoles: ['fullstack', 'backend'],
  },
  general: {
    label: 'General Software Engineer',
    description:
      'General software engineering interviews cover a broad range of topics including coding, system design, and behavioral questions.',
    scoringFocus: [
      'Data structures and algorithms proficiency',
      'System design fundamentals',
      'Code quality and testing practices',
      'Communication and collaboration skills',
    ],
    commonQuestionTypes: [
      'Solve a medium-difficulty algorithm problem with optimal complexity',
      'Design a web application at a high level',
      'Implement a commonly-used data structure from scratch',
      'Discuss a project you led and the technical decisions you made',
      'Debug and optimize a given piece of code',
    ],
    tips: [
      'Build a strong foundation in the top 15 algorithm patterns',
      'Practice explaining your thought process out loud while coding',
      'Prepare behavioral stories using the STAR method',
      'Research the specific company and role to focus your preparation',
    ],
    relatedRoles: ['backend', 'frontend', 'fullstack'],
  },
};

export function generateStaticParams() {
  return Object.keys(ROLES).map((role) => ({ role }));
}

interface Props {
  params: Promise<{ role: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  const data = ROLES[role];
  if (!data) return { title: 'Role Not Found' };

  return {
    title: `${data.label} Interview Prep Guide | InterviewProof`,
    description: `Comprehensive preparation guide for ${data.label} interviews. Common questions, scoring focus areas, and expert tips.`,
    openGraph: {
      title: `${data.label} Interview Preparation Guide`,
      description: data.description,
    },
  };
}

export default async function RolePrepPage({ params }: Props) {
  const { role } = await params;
  const data = ROLES[role];
  if (!data) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/"
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
                Back to Home
              </Link>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)]">
                Interview Prep
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">
                {data.label} Interview Preparation Guide
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                {data.description}
              </p>
            </div>
          </Container>
        </section>

        {/* Scoring focus */}
        <section className="bg-[var(--bg-section-alt)] py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Key Scoring Dimensions
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                These are the areas that carry the most weight in {data.label} interviews.
              </p>
              <div className="mt-6 space-y-3">
                {data.scoringFocus.map((focus, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--accent-primary)]/10 text-xs font-bold text-[var(--accent-primary)]">
                      {i + 1}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{focus}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Common questions */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Common Question Types
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Questions you should be prepared to answer in a {data.label} interview.
              </p>
              <div className="mt-6 space-y-3">
                {data.commonQuestionTypes.map((q, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Expert tips */}
        <section className="bg-[var(--bg-section-alt)] py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Expert Tips</h2>
              <div className="mt-6 space-y-3">
                {data.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Related roles */}
        {data.relatedRoles.length > 0 && (
          <section className="py-16">
            <Container size="md">
              <div className="mx-auto max-w-3xl">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Related Role Guides
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {data.relatedRoles.map((slug) => {
                    const related = ROLES[slug];
                    if (!related) return null;
                    return (
                      <Link
                        key={slug}
                        href={`/interview-prep/${slug}`}
                        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                      >
                        {related.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* CTA */}
        <section className="pb-20 lg:pb-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8 text-center">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Get Your {data.label} Interview Diagnostic
                </h2>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Upload your resume and job description for a personalized gap analysis calibrated
                  to {data.label} interview standards.
                </p>
                <Link
                  href="/new"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-colors hover:from-orange-500 hover:via-pink-600 hover:to-purple-600"
                >
                  Start My Diagnostic
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
