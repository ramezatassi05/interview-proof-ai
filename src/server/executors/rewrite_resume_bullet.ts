/**
 * rewrite_resume_bullet executor — STUB.
 *
 * Phase A5 ships a pass-through. Future work: write the approved bullet to
 * the user's resume artifact store (or surface a "copy to your resume"
 * affordance in the outbox).
 */
import type { ActionExecutor } from './index';

export const executeRewriteResumeBullet: ActionExecutor = async (action) => {
  return {
    ok: true,
    resultJson: {
      delivery: 'manual_copy',
      note: 'Bullet rewrite ready. Outbox UI surfaces the final text.',
      bullet:
        typeof action.payload_json.rewrittenBullet === 'string'
          ? action.payload_json.rewrittenBullet
          : null,
    },
  };
};
