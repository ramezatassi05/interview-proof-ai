import crypto from 'crypto';

const BRAND_COLOR = '#6366f1';
const BG_COLOR = '#0f0f14';
const CARD_BG = '#1a1a24';
const TEXT_PRIMARY = '#f0f0f5';
const TEXT_SECONDARY = '#9ca3af';
const BORDER_COLOR = '#2a2a3a';
const STAR_COLOR = '#f59e0b';

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:20px;font-weight:700;color:${TEXT_PRIMARY};letter-spacing:-0.5px;">
                Interview<span style="color:${BRAND_COLOR};">Proof</span>
              </span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:${CARD_BG};border:1px solid ${BORDER_COLOR};border-radius:12px;padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:${TEXT_SECONDARY};">
                InterviewProof — Interview Intelligence Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getFeedbackEmailSubject(): string {
  return 'How was your InterviewProof report?';
}

export function getFeedbackEmailHtml(reportId: string, token: string, baseUrl: string): string {
  const stars = [1, 2, 3, 4, 5]
    .map((n) => {
      const url = `${baseUrl}/feedback/${reportId}?rating=${n}&token=${encodeURIComponent(token)}`;
      return `<a href="${url}" target="_blank" style="display:inline-block;padding:4px 6px;font-size:32px;text-decoration:none;color:${STAR_COLOR};">&#9733;</a>`;
    })
    .join('');

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${TEXT_PRIMARY};">
      How was your report?
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${TEXT_SECONDARY};">
      Your feedback helps us improve InterviewProof. Tap a star to rate your experience — it takes less than a minute.
    </p>
    <!-- Stars -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td align="center" style="padding:16px 0;">
          ${stars}
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;text-align:center;color:${TEXT_SECONDARY};">
      Click any star to leave your rating
    </p>`;

  return emailWrapper(content);
}

/**
 * Generate an HMAC-SHA256 token for feedback URL verification.
 */
export function generateFeedbackToken(reportId: string, userId: string): string {
  const secret = process.env.FEEDBACK_HMAC_SECRET;
  if (!secret) {
    throw new Error('FEEDBACK_HMAC_SECRET environment variable is not set');
  }
  return crypto.createHmac('sha256', secret).update(`${reportId}:${userId}`).digest('hex');
}

/**
 * Verify an HMAC feedback token using timing-safe comparison.
 */
export function verifyFeedbackToken(reportId: string, userId: string, token: string): boolean {
  const secret = process.env.FEEDBACK_HMAC_SECRET;
  if (!secret) {
    throw new Error('FEEDBACK_HMAC_SECRET environment variable is not set');
  }
  const expected = crypto.createHmac('sha256', secret).update(`${reportId}:${userId}`).digest('hex');

  if (token.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(token, 'utf-8'), Buffer.from(expected, 'utf-8'));
}
