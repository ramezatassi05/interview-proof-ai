/**
 * draft_recruiter_reply executor — Phase D.
 *
 * If the user has connected Gmail (Phase A4), sends the reply via Gmail's
 * API and stamps the message id on result_json. If they haven't, falls back
 * to the Phase A5 "manual_copy" delivery so the lifecycle still completes
 * cleanly and the user can copy the draft from the Outbox UI.
 *
 * Recipient resolution: looks for `recipientHint` in the action payload as a
 * plain email address. If it doesn't look like one, refuses to send and
 * falls back to manual_copy (the Outbox UI surfaces it for the user).
 */
import type { ActionExecutor } from './index';
import { getLiveAccessToken, LinkedAccountMissingError } from '@/lib/linked-accounts/store';
import { sendGmail, GmailSendError } from '@/lib/linked-accounts/gmail';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export const executeDraftRecruiterReply: ActionExecutor = async (action, { supabase }) => {
  const subject = asString(action.payload_json.subject).trim();
  const body = asString(action.payload_json.body).trim();
  const recipientHint = asString(action.payload_json.recipientHint).trim();

  if (!subject || !body) {
    return { ok: false, error: 'Missing subject or body' };
  }

  // No usable recipient → fall back to manual delivery.
  if (!recipientHint || !EMAIL_REGEX.test(recipientHint)) {
    return {
      ok: true,
      resultJson: {
        delivery: 'manual_copy',
        note: 'No recipient email on the draft — copy/paste from the outbox.',
        subject,
      },
    };
  }

  let account;
  try {
    account = await getLiveAccessToken(supabase, action.user_id, 'google');
  } catch (err) {
    if (err instanceof LinkedAccountMissingError) {
      return {
        ok: true,
        resultJson: {
          delivery: 'manual_copy',
          note: 'Gmail not connected — connect on /account to enable automated send.',
          subject,
          recipient: recipientHint,
        },
      };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const fromEmail = account.accountEmail ?? recipientHint; // Best-guess if userinfo is missing.

  try {
    const sent = await sendGmail({
      accessToken: account.accessToken,
      fromEmail,
      toEmail: recipientHint,
      subject,
      bodyText: body,
    });
    return {
      ok: true,
      resultJson: {
        delivery: 'gmail_sent',
        gmailMessageId: sent.messageId,
        gmailThreadId: sent.threadId,
        recipient: recipientHint,
        subject,
      },
    };
  } catch (err) {
    const msg =
      err instanceof GmailSendError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Send failed';
    return { ok: false, error: msg };
  }
};
