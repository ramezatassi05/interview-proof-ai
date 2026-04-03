'use client';

import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CareerStage, TargetDomain } from '@/types';
import { TextAnimate } from '@/components/ui/text-animate';
import { SubStepDots } from '@/components/onboarding/SubStepDots';
import { StepDomainCarousel } from '@/components/onboarding/StepDomainCarousel';
import { StepRoleCarousel } from '@/components/onboarding/StepRoleCarousel';

interface StepRoleDetailsProps {
  careerStage: CareerStage | null;
  targetRoles: string[];
  targetDomains: TargetDomain[];
  yearsExperience: number | null;
  onTargetRolesChange: (roles: string[]) => void;
  onTargetDomainsChange: (domains: TargetDomain[]) => void;
  onYearsExperienceChange: (years: number) => void;
  onContinue: () => void;
}

export interface StepRoleDetailsHandle {
  handleBack: () => boolean;
}

export const StepRoleDetails = forwardRef<StepRoleDetailsHandle, StepRoleDetailsProps>(
  function StepRoleDetails(
    {
      careerStage,
      targetRoles,
      targetDomains,
      yearsExperience,
      onTargetRolesChange,
      onTargetDomainsChange,
      onYearsExperienceChange,
      onContinue,
    },
    ref
  ) {
    const [subStep, setSubStep] = useState<0 | 1>(0);

    // Expose back-handling to parent
    useImperativeHandle(ref, () => ({
      handleBack: () => {
        if (subStep === 1) {
          setSubStep(0);
          return true; // handled internally
        }
        return false; // let parent handle
      },
    }));

    const advanceToRole = useCallback(() => {
      setSubStep(1);
    }, []);

    return (
      <div className="flex flex-col items-center w-full">
        {/* Shared heading */}
        <h2
          key={subStep}
          className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1 text-center"
        >
          <TextAnimate animation="blurInUp" by="word" delay={0.05}>
            {subStep === 0 ? 'What field are you in?' : "What's your target role?"}
          </TextAnimate>
        </h2>
        <p className="text-[var(--text-secondary)] text-center mb-1">
          {subStep === 0
            ? 'Choose your interview domain to get started.'
            : 'Pick the role you\u2019re interviewing for.'}
        </p>

        {/* Sub-step dots */}
        <SubStepDots current={subStep} labels={['Domain', 'Target Role']} />

        {/* Sub-slide content with horizontal slide animation */}
        <AnimatePresence mode="wait">
          {subStep === 0 ? (
            <motion.div
              key="domain"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full"
            >
              <StepDomainCarousel
                targetDomains={targetDomains}
                onTargetDomainsChange={onTargetDomainsChange}
                onContinue={advanceToRole}
              />
            </motion.div>
          ) : (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full"
            >
              <StepRoleCarousel
                careerStage={careerStage}
                targetRoles={targetRoles}
                targetDomains={targetDomains}
                yearsExperience={yearsExperience}
                onTargetRolesChange={onTargetRolesChange}
                onYearsExperienceChange={onYearsExperienceChange}
                onContinue={onContinue}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
