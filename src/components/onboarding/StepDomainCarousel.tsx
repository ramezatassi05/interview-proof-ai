'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LaptopIcon,
  ChartBarLineIcon,
  PaintBrush01Icon,
  NoteIcon,
  GlobalSearchIcon,
  SecurityIcon,
  CloudServerIcon,
  MegaphoneIcon,
  Briefcase01Icon,
} from '@hugeicons/core-free-icons';
import { FeatureCarousel, type CarouselItem } from '@/components/ui/feature-carousel';
import type { TargetDomain } from '@/types';

const DOMAIN_ITEMS: (CarouselItem & { domainValue: TargetDomain })[] = [
  {
    id: 'swe',
    domainValue: 'swe',
    label: 'Software Engineering',
    icon: LaptopIcon,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
    description: 'System design, coding, and behavioral interview rounds.',
  },
  {
    id: 'ds',
    domainValue: 'ds',
    label: 'Data Science',
    icon: ChartBarLineIcon,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
    description: 'Case studies, SQL, machine learning, and statistics rounds.',
  },
  {
    id: 'design',
    domainValue: 'design',
    label: 'Design',
    icon: PaintBrush01Icon,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
    description: 'Portfolio reviews, design critiques, and whiteboard rounds.',
  },
  {
    id: 'pm',
    domainValue: 'pm',
    label: 'Product Management',
    icon: NoteIcon,
    image:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
    description: 'Product sense, strategy, and execution rounds.',
  },
  {
    id: 'security',
    domainValue: 'security',
    label: 'Cybersecurity',
    icon: SecurityIcon,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
    description: 'AppSec, pentesting, and security architecture rounds.',
  },
  {
    id: 'cloud',
    domainValue: 'cloud',
    label: 'Cloud & DevOps',
    icon: CloudServerIcon,
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    description: 'Infrastructure, CI/CD, and system reliability rounds.',
  },
  {
    id: 'marketing',
    domainValue: 'marketing',
    label: 'Marketing',
    icon: MegaphoneIcon,
    image:
      'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop',
    description: 'Growth strategy, analytics, and campaign planning rounds.',
  },
  {
    id: 'business',
    domainValue: 'business',
    label: 'Business & Consulting',
    icon: Briefcase01Icon,
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop',
    description: 'Case interviews, strategy, and stakeholder management rounds.',
  },
  {
    id: 'general',
    domainValue: 'general',
    label: 'General',
    icon: GlobalSearchIcon,
    image:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop',
    description: 'Technical, behavioral, and situational interview rounds.',
  },
];

interface StepDomainCarouselProps {
  targetDomains: TargetDomain[];
  onTargetDomainsChange: (domains: TargetDomain[]) => void;
  onContinue: () => void;
}

export function StepDomainCarousel({
  targetDomains,
  onTargetDomainsChange,
  onContinue,
}: StepDomainCarouselProps) {
  const handleSelect = useCallback(
    (id: string) => {
      const domain = id as TargetDomain;
      onTargetDomainsChange(
        targetDomains.includes(domain)
          ? targetDomains.filter((d) => d !== domain)
          : [...targetDomains, domain]
      );
    },
    [targetDomains, onTargetDomainsChange]
  );

  return (
    <div className="relative">
      <FeatureCarousel
        items={DOMAIN_ITEMS}
        multiSelect
        selectedIds={targetDomains}
        onSelect={handleSelect}
        accentColor="#6366F1"
        autoPlay
        autoPlayInterval={3500}
      />

      {/* Confirm button — bottom right */}
      <AnimatePresence>
        {targetDomains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex justify-end mt-6 pr-2"
          >
            <button
              onClick={onContinue}
              className="group relative rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-[2px] transition-all duration-150 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              <span className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-black/90">
                Continue
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
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
