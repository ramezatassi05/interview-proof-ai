import type { CareerStage } from '@/types';

/**
 * Returns a seniority modifier to prepend/append to job search queries
 * based on the user's career stage and years of experience.
 *
 * "staff" / "lead" / "principal" are intentionally excluded — they return
 * too few results on JSearch/Adzuna. "senior" casts a wider net.
 */
export function getSeniorityModifier(
  careerStage: CareerStage | null,
  yearsExperience: number | null
): string | null {
  switch (careerStage) {
    case 'student':
      return 'intern';
    case 'new_grad':
      return 'junior';
    case 'career_changer':
      return 'entry level';
    case 'experienced_professional':
      return yearsExperience != null && yearsExperience >= 6 ? 'senior' : null;
    default:
      return null;
  }
}
