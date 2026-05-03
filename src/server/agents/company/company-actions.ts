import type { CompanyActionStatus } from './types';

const ALLOWED_TRANSITIONS: Record<CompanyActionStatus, readonly CompanyActionStatus[]> = {
  drafted: ['awaiting_approval', 'rejected'],
  awaiting_approval: ['approved', 'rejected'],
  approved: ['completed', 'failed'],
  rejected: [],
  completed: [],
  failed: [],
};

export function assertCompanyActionTransition(
  from: CompanyActionStatus,
  to: CompanyActionStatus
):
  | { ok: true }
  | {
      ok: false;
      message: string;
      allowed: readonly CompanyActionStatus[];
    } {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      message: `Cannot transition company action from "${from}" to "${to}".`,
      allowed,
    };
  }

  return { ok: true };
}
