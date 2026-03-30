'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CareerStage, TargetDomain } from '@/types';
import { POPULAR_ROLES, searchRoles } from '@/lib/role-suggestions';
import { TextAnimate } from '@/components/ui/text-animate';

interface StepRoleDetailsProps {
  careerStage: CareerStage | null;
  targetRole: string;
  targetDomain: TargetDomain | null;
  yearsExperience: number | null;
  onTargetRoleChange: (role: string) => void;
  onTargetDomainChange: (domain: TargetDomain) => void;
  onYearsExperienceChange: (years: number) => void;
  onContinue: () => void;
}

interface DomainOption {
  value: TargetDomain;
  label: string;
  icon: string;
}

const domains: DomainOption[] = [
  { value: 'swe', label: 'Software Engineering', icon: '💻' },
  { value: 'ds', label: 'Data Science', icon: '📊' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'pm', label: 'Product Management', icon: '📋' },
  { value: 'general', label: 'General', icon: '🌐' },
];

interface PreviewItem {
  icon: string;
  text: string;
}

const PREVIEW_ITEMS: Record<TargetDomain, PreviewItem[]> = {
  swe: [
    { icon: '🎯', text: 'Diagnostic scoring calibrated to Software Engineering interviews' },
    { icon: '💡', text: 'Company-specific questions for system design, coding, and behavioral rounds' },
    { icon: '🧠', text: 'AI coaching that pinpoints your blind spots so you walk in sounding sharp' },
    { icon: '🗺️', text: 'A personalized study roadmap prioritized by what matters most for your role' },
  ],
  ds: [
    { icon: '🎯', text: 'Diagnostic scoring calibrated to Data Science interviews' },
    { icon: '💡', text: 'Company-specific questions for case studies, SQL, ML, and stats rounds' },
    { icon: '🧠', text: 'AI coaching that pinpoints your blind spots so you walk in sounding sharp' },
    { icon: '🗺️', text: 'A personalized study roadmap prioritized by what matters most for your role' },
  ],
  design: [
    { icon: '🎯', text: 'Diagnostic scoring calibrated to Design interviews' },
    { icon: '💡', text: 'Company-specific questions for portfolio reviews, critiques, and whiteboard rounds' },
    { icon: '🧠', text: 'AI coaching that pinpoints your blind spots so you walk in sounding sharp' },
    { icon: '🗺️', text: 'A personalized study roadmap prioritized by what matters most for your role' },
  ],
  pm: [
    { icon: '🎯', text: 'Diagnostic scoring calibrated to Product Management interviews' },
    { icon: '💡', text: 'Company-specific questions for product sense, strategy, and execution rounds' },
    { icon: '🧠', text: 'AI coaching that pinpoints your blind spots so you walk in sounding sharp' },
    { icon: '🗺️', text: 'A personalized study roadmap prioritized by what matters most for your role' },
  ],
  general: [
    { icon: '🎯', text: 'Diagnostic scoring calibrated to your target interviews' },
    { icon: '💡', text: 'Company-specific questions across technical, behavioral, and situational rounds' },
    { icon: '🧠', text: 'AI coaching that pinpoints your blind spots so you walk in sounding sharp' },
    { icon: '🗺️', text: 'A personalized study roadmap prioritized by what matters most for your role' },
  ],
};

const COMING_SOON_ITEMS: PreviewItem[] = [
  { icon: '💬', text: 'AI interview coach that preps you from recruiter emails' },
  { icon: '📈', text: 'Career advisor with real-time job market insights' },
  { icon: '📋', text: 'Job tracker with AI-powered resume optimization' },
];

const showExperience = (stage: CareerStage | null) =>
  stage === 'experienced_professional' || stage === 'career_changer';

export function StepRoleDetails({
  careerStage,
  targetRole,
  targetDomain,
  yearsExperience,
  onTargetRoleChange,
  onTargetDomainChange,
  onYearsExperienceChange,
  onContinue,
}: StepRoleDetailsProps) {
  const canContinue = targetDomain !== null;

  // ── Autocomplete state ──────────────────────────────────────
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filteredRoles = useMemo(() => searchRoles(targetRole, 6), [targetRole]);

  const selectRole = useCallback(
    (role: string) => {
      onTargetRoleChange(role);
      setShowDropdown(false);
      setHighlightedIndex(-1);
    },
    [onTargetRoleChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTargetRoleChange(e.target.value);
      setShowDropdown(e.target.value.trim().length > 0);
      setHighlightedIndex(-1);
    },
    [onTargetRoleChange]
  );

  const handleInputFocus = useCallback(() => {
    if (targetRole.trim().length > 0) {
      setShowDropdown(true);
    }
  }, [targetRole]);

  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if clicking inside dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) return;
    setShowDropdown(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || filteredRoles.length === 0) {
        if (e.key === 'Enter' && canContinue) {
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
            selectRole(filteredRoles[highlightedIndex]);
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
    [showDropdown, filteredRoles, highlightedIndex, selectRole, canContinue, onContinue]
  );

  // Popular roles for the current domain
  const popularRoles = targetDomain ? POPULAR_ROLES[targetDomain] : [];

  // Preview content
  const previewItems = targetDomain ? PREVIEW_ITEMS[targetDomain] : null;

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── Headline ── */}
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        <TextAnimate animation="blurInUp" by="word" delay={0.05}>
          {"What's your dream role?"}
        </TextAnimate>
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        Pick your targets and we&apos;ll build a practice plan just for you.
      </p>

      <div className="w-full max-w-md space-y-6">
        {/* ── Domain chips ── */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Domain</label>
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => {
              const isSelected = targetDomain === d.value;
              return (
                <motion.button
                  key={d.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTargetDomainChange(d.value)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 border border-orange-300 text-orange-700 shadow-md shadow-orange-400/10'
                        : 'bg-gray-100 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200'
                    }
                  `}
                >
                  <span>{d.icon}</span>
                  {d.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Role autocomplete ── */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Target Role <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>

          {/* Popular role chips */}
          <AnimatePresence mode="wait">
            <motion.div
              key={targetDomain ?? 'none'}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-wrap gap-2 mb-3"
            >
              {popularRoles.map((role) => {
                const isSelected = targetRole === role;
                return (
                  <motion.button
                    key={role}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTargetRoleChange(isSelected ? '' : role)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150
                      ${
                        isSelected
                          ? 'bg-orange-100 text-orange-700 border border-orange-300'
                          : 'bg-gray-100 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200'
                      }
                    `}
                  >
                    {role}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Autocomplete input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showDropdown && filteredRoles.length > 0}
              aria-controls="role-listbox"
              aria-activedescendant={highlightedIndex >= 0 ? `role-option-${highlightedIndex}` : undefined}
              aria-autocomplete="list"
              value={targetRole}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Or type to search roles..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
            />

            {/* Dropdown */}
            <AnimatePresence>
              {showDropdown && filteredRoles.length > 0 && (
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
                        e.preventDefault(); // Prevent blur before click fires
                        selectRole(role);
                      }}
                      className={`
                        px-4 py-2.5 text-sm cursor-pointer transition-colors
                        ${
                          i === highlightedIndex
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-[var(--text-primary)] hover:bg-gray-50'
                        }
                      `}
                    >
                      {role}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Years of experience (conditional) ── */}
        {showExperience(careerStage) && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Years of Experience
              <span className="ml-2 text-orange-600 font-semibold tabular-nums">
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
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500 bg-gray-200"
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

        {/* ── Personalization preview ── */}
        <AnimatePresence mode="wait">
          {previewItems && (
            <motion.div
              key={targetDomain}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 border border-orange-100 overflow-hidden">
                <div className="px-4 pt-3.5 pb-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600/80">
                    What you get
                  </p>
                  <ul className="space-y-1.5">
                    {previewItems.map((item) => (
                      <li key={item.text} className="flex items-start gap-2 text-[13px] text-[var(--text-primary)] leading-snug">
                        <span className="shrink-0 mt-px">{item.icon}</span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-4 py-2.5 bg-black/[0.03] border-t border-orange-100/60">
                  <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Coming soon
                  </p>
                  <ul className="space-y-1">
                    {COMING_SOON_ITEMS.map((item) => (
                      <li key={item.text} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)] leading-snug">
                        <span className="shrink-0 mt-px">{item.icon}</span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sticky CTA ── */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-white via-white to-white/0">
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="group relative w-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 p-[2px] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
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
