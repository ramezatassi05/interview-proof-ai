import { getTierLabel } from '@/lib/waitlist';
import type { WaitlistTier } from '@/types';

const BRAND_COLOR = '#6366f1';
const BG_COLOR = '#0f0f14';
const CARD_BG = '#1a1a24';
const TEXT_PRIMARY = '#f0f0f5';
const TEXT_SECONDARY = '#9ca3af';
const BORDER_COLOR = '#2a2a3a';

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

/**
 * Email 1: Confirmation (double opt-in)
 */
export function getConfirmationEmailHtml(confirmUrl: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${TEXT_PRIMARY};">
      Confirm your spot
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${TEXT_SECONDARY};">
      You're one click away from joining the InterviewProof waitlist. Confirm your email to secure your position.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td align="center" style="background-color:${BRAND_COLOR};border-radius:8px;">
          <a href="${confirmUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            Confirm My Spot
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};">
      If you didn't sign up for InterviewProof, you can safely ignore this email.
    </p>`;

  return emailWrapper(content);
}

export function getConfirmationEmailSubject(): string {
  return 'Confirm your spot on the InterviewProof waitlist';
}

/**
 * Email 2: Welcome (after confirmation)
 */
export function getWelcomeEmailHtml(
  position: number,
  referralUrl: string,
  tier: WaitlistTier
): string {
  const tierLabel = getTierLabel(tier);
  const tierBlock = tierLabel
    ? `<div style="margin:16px 0;padding:12px 16px;background-color:${BRAND_COLOR}20;border:1px solid ${BRAND_COLOR}40;border-radius:8px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:${BRAND_COLOR};">
          ${tierLabel}
        </p>
      </div>`
    : '';

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${TEXT_PRIMARY};">
      You're on the list
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${TEXT_SECONDARY};">
      Welcome to InterviewProof. Your position has been secured.
    </p>
    <!-- Position -->
    <div style="text-align:center;padding:24px 0;border-top:1px solid ${BORDER_COLOR};border-bottom:1px solid ${BORDER_COLOR};">
      <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${TEXT_SECONDARY};">
        Your Position
      </p>
      <p style="margin:0;font-size:48px;font-weight:800;color:${BRAND_COLOR};">
        #${position}
      </p>
      ${tierBlock}
    </div>
    <!-- Referral Card -->
    <div style="margin-top:24px;padding:20px;background-color:${BG_COLOR};border:1px solid ${BORDER_COLOR};border-radius:8px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">
        Move up the list
      </p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${TEXT_SECONDARY};">
        Each friend who confirms moves you up 3 spots. Share your personal link:
      </p>
      <div style="padding:10px 14px;background-color:${CARD_BG};border:1px solid ${BORDER_COLOR};border-radius:6px;word-break:break-all;">
        <a href="${referralUrl}" style="font-size:13px;color:${BRAND_COLOR};text-decoration:none;">
          ${referralUrl}
        </a>
      </div>
    </div>
    <!-- Closing -->
    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${TEXT_SECONDARY};">
      We'll email you when it's your turn. Until then, every referral gets you closer to the front.
    </p>`;

  return emailWrapper(content);
}

export function getWelcomeEmailSubject(): string {
  return "You're on the list — InterviewProof is coming soon";
}
