/**
 * draft_recruiter_reply executor — STUB.
 *
 * Phase A5 ships a pass-through that records the draft as "delivered to
 * clipboard" without actually sending email. Phase D replaces this with the
 * real Gmail send via a user-linked Google account.
 *
 * Why no-op now: keeping the lifecycle (approved → completed) visible
 * end-to-end so the bell, audit events, and outbox UI can be exercised
 * before the irreversible send goes live.
 */
import type { ActionExecutor } from './index';

export const executeDraftRecruiterReply: ActionExecutor = async (action) => {
  return {
    ok: true,
    resultJson: {
      delivery: 'manual_copy',
      note: 'Draft prepared. Use the Outbox UI to copy/paste — automated send arrives in Phase D.',
      subject: typeof action.payload_json.subject === 'string' ? action.payload_json.subject : null,
    },
  };
};
