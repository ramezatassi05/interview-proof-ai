interface FAQItem {
  question: string;
  answer: string;
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'InterviewProof',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://interviewproof.ai',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://interviewproof.ai'}/icon.png`,
    description:
      'Job-specific interview diagnostic that identifies rejection risks and prioritizes fixes.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'ramez@interviewproof.ai',
      contactType: 'customer support',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'InterviewProof',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Job-specific interview diagnostic that identifies rejection risks and prioritizes fixes.',
    offers: {
      '@type': 'Offer',
      price: '9',
      priceCurrency: 'USD',
    },
  };
}

export function faqPageJsonLd(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
