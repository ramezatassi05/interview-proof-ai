'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserIcon,
  CodeIcon,
  ServerStackIcon,
  SmartPhone01Icon,
  AiCloudIcon,
  ChartBarLineIcon,
  SearchList01Icon,
  PaintBrush01Icon,
  GlobalSearchIcon,
  Settings01Icon,
  SecurityIcon,
  CloudServerIcon,
  MegaphoneIcon,
  Briefcase01Icon,
  AnalyticsUpIcon,
  Target01Icon,
  ComputerIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { FeatureCarousel, type CarouselItem } from '@/components/ui/feature-carousel';
import { POPULAR_ROLES, searchRoles } from '@/lib/role-suggestions';
import type { CareerStage, TargetDomain } from '@/types';

/** Map role names to relevant HugeIcons */
const ROLE_ICON_MAP: Record<string, IconSvgElement> = {
  // SWE
  'Frontend Engineer': CodeIcon,
  'Backend Engineer': ServerStackIcon,
  'Full-Stack Engineer': Settings01Icon,
  'Mobile Engineer': SmartPhone01Icon,
  'ML Engineer': AiCloudIcon,
  'Platform Engineer': ComputerIcon,
  'DevOps Engineer': CloudServerIcon,
  'Site Reliability Engineer': ServerStackIcon,
  // Data Science
  'Data Scientist': ChartBarLineIcon,
  'Data Analyst': SearchList01Icon,
  'Data Engineer': ServerStackIcon,
  'Analytics Engineer': AnalyticsUpIcon,
  'AI Research Scientist': AiCloudIcon,
  'Business Analyst': ChartBarLineIcon,
  // Design
  'Product Designer': PaintBrush01Icon,
  'UX Designer': PaintBrush01Icon,
  'UX Researcher': SearchList01Icon,
  'UI Designer': PaintBrush01Icon,
  'Interaction Designer': PaintBrush01Icon,
  'Visual Designer': PaintBrush01Icon,
  'Content Designer': PaintBrush01Icon,
  // PM
  'Product Manager': GlobalSearchIcon,
  'Technical PM': Settings01Icon,
  'Program Manager': GlobalSearchIcon,
  'Growth PM': ChartBarLineIcon,
  'Senior Product Manager': GlobalSearchIcon,
  'Technical Program Manager': Settings01Icon,
  'Director of Product': GlobalSearchIcon,
  // Security
  'Security Engineer': SecurityIcon,
  'Penetration Tester': SecurityIcon,
  'Security Analyst': SecurityIcon,
  'AppSec Engineer': SecurityIcon,
  'Cloud Security Engineer': SecurityIcon,
  'Security Architect': SecurityIcon,
  // Cloud & DevOps
  'Cloud Engineer': CloudServerIcon,
  'Infrastructure Engineer': ServerStackIcon,
  'Solutions Architect': ComputerIcon,
  // Marketing
  'Growth Marketer': AnalyticsUpIcon,
  'Product Marketing Manager': MegaphoneIcon,
  'SEO Specialist': SearchList01Icon,
  'Content Strategist': MegaphoneIcon,
  'Performance Marketing Manager': Target01Icon,
  'Marketing Analyst': ChartBarLineIcon,
  // Business & Consulting
  'Management Consultant': Briefcase01Icon,
  'Strategy Analyst': ChartBarLineIcon,
  'Operations Manager': Settings01Icon,
  'Business Development Manager': Briefcase01Icon,
  'Financial Analyst': ChartBarLineIcon,
  // General
  'Software Engineer': CodeIcon,
  Designer: PaintBrush01Icon,
  'Technical Writer': CodeIcon,
  'Solutions Engineer': ComputerIcon,
  'Engineering Manager': Settings01Icon,
};

/** Map role names to relevant Unsplash images */
const ROLE_IMAGE_MAP: Record<string, string> = {
  // SWE
  'Frontend Engineer':
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop',
  'Backend Engineer':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
  'Full-Stack Engineer':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
  'Mobile Engineer':
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop',
  'ML Engineer':
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
  'Platform Engineer':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
  'DevOps Engineer':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
  'Site Reliability Engineer':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
  // Data Science
  'Data Scientist':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
  'Data Analyst':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
  'Data Engineer':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
  'Analytics Engineer':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
  'AI Research Scientist':
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
  'Business Analyst':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
  // Design
  'Product Designer':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
  'UX Designer':
    'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop',
  'UX Researcher':
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop',
  'UI Designer':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
  'Interaction Designer':
    'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop',
  'Visual Designer':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
  'Content Designer':
    'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop',
  // PM
  'Product Manager':
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
  'Technical PM':
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
  'Program Manager':
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop',
  'Growth PM':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
  'Senior Product Manager':
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
  'Technical Program Manager':
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
  'Director of Product':
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
  // Security
  'Security Engineer':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
  'Penetration Tester':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
  'Security Analyst':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
  'AppSec Engineer':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
  'Cloud Security Engineer':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
  'Security Architect':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
  // Cloud & DevOps
  'Cloud Engineer':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
  'Infrastructure Engineer':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
  'Solutions Architect':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
  // Marketing
  'Growth Marketer':
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop',
  'Product Marketing Manager':
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop',
  'SEO Specialist':
    'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&auto=format&fit=crop',
  'Content Strategist':
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop',
  'Performance Marketing Manager':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
  'Marketing Analyst':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
  // Business & Consulting
  'Management Consultant':
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop',
  'Strategy Analyst':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
  'Operations Manager':
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop',
  'Business Development Manager':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
  'Financial Analyst':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
  // General
  'Software Engineer':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
  Designer: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
  'Technical Writer':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
  'Solutions Engineer':
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
  'Engineering Manager':
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  // SWE
  'Frontend Engineer': 'Build beautiful, performant user interfaces and web experiences.',
  'Backend Engineer': 'Design scalable APIs, services, and data architectures.',
  'Full-Stack Engineer': 'Own features end-to-end across the entire stack.',
  'Mobile Engineer': 'Craft native and cross-platform mobile experiences.',
  'ML Engineer': 'Build and deploy machine learning models at scale.',
  'Platform Engineer': 'Build and maintain internal developer platforms and tooling.',
  'DevOps Engineer': 'Automate infrastructure, CI/CD pipelines, and deployments.',
  'Site Reliability Engineer': 'Ensure system reliability, uptime, and performance at scale.',
  // Data Science
  'Data Scientist': 'Extract insights and build predictive models from data.',
  'Data Analyst': 'Transform data into actionable business intelligence.',
  'Data Engineer': 'Build robust data pipelines and infrastructure.',
  'Analytics Engineer': 'Bridge data engineering and analytics with modeled datasets.',
  'AI Research Scientist': 'Push the frontier of AI with novel research and models.',
  'Business Analyst': 'Translate business needs into data-driven recommendations.',
  // Design
  'Product Designer': 'Shape products through research, strategy, and visual design.',
  'UX Designer': 'Create intuitive, user-centered design solutions.',
  'UX Researcher': 'Uncover user needs through research and testing.',
  'UI Designer': 'Craft pixel-perfect interfaces and design systems.',
  'Interaction Designer': 'Design engaging micro-interactions and motion patterns.',
  'Visual Designer': 'Create compelling brand visuals and marketing design.',
  'Content Designer': 'Craft clear, purposeful content that guides users.',
  // PM
  'Product Manager': 'Drive product strategy, roadmap, and execution.',
  'Technical PM': 'Bridge engineering and product with technical depth.',
  'Program Manager': 'Coordinate cross-functional programs and delivery.',
  'Growth PM': 'Drive user acquisition, activation, and retention.',
  'Senior Product Manager': 'Lead product strategy for complex product areas.',
  'Technical Program Manager': 'Orchestrate large-scale technical initiatives.',
  'Director of Product': 'Set product vision and lead product management teams.',
  // Security
  'Security Engineer': 'Build and maintain security infrastructure and controls.',
  'Penetration Tester': 'Identify vulnerabilities through ethical hacking and testing.',
  'Security Analyst': 'Monitor, detect, and respond to security threats.',
  'AppSec Engineer': 'Secure applications through code review and threat modeling.',
  'Cloud Security Engineer': 'Protect cloud infrastructure and workloads.',
  'Security Architect': 'Design enterprise-wide security architectures and policies.',
  // Cloud & DevOps
  'Cloud Engineer': 'Design and manage cloud infrastructure at scale.',
  'Infrastructure Engineer': 'Build and maintain core infrastructure and networking.',
  'Solutions Architect': 'Design end-to-end technical solutions for complex problems.',
  // Marketing
  'Growth Marketer': 'Drive user growth through experimentation and data.',
  'Product Marketing Manager': 'Position products and drive go-to-market strategy.',
  'SEO Specialist': 'Optimize content and sites for search engine visibility.',
  'Content Strategist': 'Plan and create content that drives engagement and growth.',
  'Performance Marketing Manager': 'Optimize paid channels for ROI and scale.',
  'Marketing Analyst': 'Measure campaign performance and uncover growth insights.',
  // Business & Consulting
  'Management Consultant': 'Solve complex business problems with structured frameworks.',
  'Strategy Analyst': 'Analyze markets and competitors to inform strategic decisions.',
  'Operations Manager': 'Optimize processes and drive operational efficiency.',
  'Business Development Manager': 'Identify and close strategic partnerships and deals.',
  'Financial Analyst': 'Model financials and provide data-driven investment insights.',
  // General
  'Software Engineer': 'Build and maintain software systems and applications.',
  Designer: 'Create compelling visual and interaction designs.',
  'Technical Writer': 'Create clear documentation for technical products and APIs.',
  'Solutions Engineer': 'Bridge sales and engineering with technical demonstrations.',
  'Engineering Manager': 'Lead engineering teams and drive technical execution.',
};

function buildRoleItems(domain: TargetDomain): CarouselItem[] {
  const roles = POPULAR_ROLES[domain] || [];
  return roles.map((role) => ({
    id: role,
    label: role,
    icon: ROLE_ICON_MAP[role] || UserIcon,
    image: ROLE_IMAGE_MAP[role] || DEFAULT_IMAGE,
    description: ROLE_DESCRIPTIONS[role] || `Prepare for ${role} interviews.`,
  }));
}

const showExperience = (stage: CareerStage | null) =>
  stage === 'experienced_professional' || stage === 'career_changer';

const MAX_ROLES = 3;

interface StepRoleCarouselProps {
  careerStage: CareerStage | null;
  targetRoles: string[];
  targetDomains: TargetDomain[];
  yearsExperience: number | null;
  onTargetRolesChange: (roles: string[]) => void;
  onYearsExperienceChange: (years: number) => void;
  onContinue: () => void;
}

export function StepRoleCarousel({
  careerStage,
  targetRoles,
  targetDomains,
  yearsExperience,
  onTargetRolesChange,
  onYearsExperienceChange,
  onContinue,
}: StepRoleCarouselProps) {
  const primaryDomain = targetDomains[0] ?? 'general';
  const roleItems = useMemo(() => buildRoleItems(primaryDomain), [primaryDomain]);

  // ── Autocomplete state (separate from selected roles) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const atCapacity = targetRoles.length >= MAX_ROLES;

  const filteredRoles = useMemo(
    () => searchRoles(searchQuery, 6).filter((r) => !targetRoles.includes(r)),
    [searchQuery, targetRoles]
  );

  const addRole = useCallback(
    (role: string) => {
      if (!targetRoles.includes(role) && targetRoles.length < MAX_ROLES) {
        onTargetRolesChange([...targetRoles, role]);
      }
      setSearchQuery('');
      setShowDropdown(false);
      setHighlightedIndex(-1);
    },
    [onTargetRolesChange, targetRoles]
  );

  const removeRole = useCallback(
    (role: string) => {
      onTargetRolesChange(targetRoles.filter((r) => r !== role));
    },
    [onTargetRolesChange, targetRoles]
  );

  const handleCarouselSelect = useCallback(
    (id: string) => {
      if (targetRoles.includes(id)) {
        removeRole(id);
      } else if (targetRoles.length < MAX_ROLES) {
        onTargetRolesChange([...targetRoles, id]);
      }
    },
    [onTargetRolesChange, targetRoles, removeRole]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.trim().length > 0);
    setHighlightedIndex(-1);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (searchQuery.trim().length > 0) setShowDropdown(true);
  }, [searchQuery]);

  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) return;
    setShowDropdown(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || filteredRoles.length === 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onContinue();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredRoles.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredRoles.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredRoles.length) {
            addRole(filteredRoles[highlightedIndex]);
          } else {
            setShowDropdown(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          break;
      }
    },
    [showDropdown, filteredRoles, highlightedIndex, addRole, onContinue]
  );

  return (
    <div className="flex flex-col items-center w-full gap-6">
      {/* Carousel — multi-select */}
      <FeatureCarousel
        items={roleItems}
        multiSelect
        selectedIds={targetRoles}
        onSelect={handleCarouselSelect}
        accentColor="#7C3AED"
        autoPlay={false}
      />

      {/* Search + extras below carousel */}
      <div className="w-full max-w-md space-y-5 px-4">
        {/* Selected role chips */}
        {targetRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {targetRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium"
              >
                {role}
                <button
                  type="button"
                  onClick={() => removeRole(role)}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200 transition-colors"
                  aria-label={`Remove ${role}`}
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <span className="inline-flex items-center text-xs text-[var(--text-muted)] px-1">
              {targetRoles.length}/{MAX_ROLES}
            </span>
          </div>
        )}

        {/* Autocomplete input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown && filteredRoles.length > 0}
            aria-controls="role-listbox"
            aria-activedescendant={
              highlightedIndex >= 0 ? `role-option-${highlightedIndex}` : undefined
            }
            aria-autocomplete="list"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={atCapacity}
            placeholder={atCapacity ? 'Maximum 3 roles selected' : 'Or type to search roles...'}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <AnimatePresence>
            {showDropdown && filteredRoles.length > 0 && !atCapacity && (
              <motion.ul
                ref={dropdownRef}
                id="role-listbox"
                role="listbox"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-[240px] overflow-y-auto"
                tabIndex={-1}
              >
                {filteredRoles.map((role, i) => (
                  <li
                    key={role}
                    id={`role-option-${i}`}
                    role="option"
                    aria-selected={i === highlightedIndex}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addRole(role);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      i === highlightedIndex
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-[var(--text-primary)] hover:bg-gray-50'
                    }`}
                  >
                    {role}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Years of experience (conditional) */}
        {showExperience(careerStage) && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Years of Experience
              <span className="ml-2 text-purple-600 font-semibold tabular-nums">
                {yearsExperience ?? 3}
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={yearsExperience ?? 3}
              onChange={(e) => onYearsExperienceChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-500 bg-gray-200"
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20+</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2 pb-2">
          <button
            onClick={onContinue}
            className="group relative w-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 p-[2px] transition-all duration-150"
          >
            <span className="flex items-center justify-center rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-black/90 min-h-[48px]">
              Build My Prep Plan
            </span>
          </button>
          <p className="text-xs text-[var(--text-muted)] text-center mt-2">
            You can change this later
          </p>
        </div>
      </div>
    </div>
  );
}
