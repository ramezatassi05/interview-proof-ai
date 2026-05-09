/**
 * Gmail send wrapper — minimal REST call, no SDK.
 *
 * Constructs an RFC 822 message and posts it base64url-encoded to the Gmail
 * v1 send endpoint. The user's stored OAuth access token is supplied by the
 * caller (typically resolved via getLiveAccessToken from ./store).
 */
const SEND_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

export class GmailSendError extends Error {
  readonly status?: number;
  constructor(message: string, opts?: { status?: number }) {
    super(message);
    this.name = 'GmailSendError';
    this.status = opts?.status;
  }
}

export interface SendGmailArgs {
  accessToken: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  /** Optional plain-text Reply-To if the user wants replies elsewhere. */
  replyTo?: string;
}

export interface SendGmailResult {
  messageId: string;
  threadId: string | null;
}

function escapeHeader(v: string): string {
  // Strip CR/LF to avoid header injection. Subjects with non-ASCII are safe
  // because Gmail accepts UTF-8 inside encoded-word headers; we keep it
  // simple by leaving them verbatim — most subjects are ASCII.
  return v.replace(/[\r\n]+/g, ' ').trim();
}

function buildRfc822(args: SendGmailArgs): string {
  const headers: string[] = [
    `From: ${escapeHeader(args.fromEmail)}`,
    `To: ${escapeHeader(args.toEmail)}`,
    `Subject: ${escapeHeader(args.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="utf-8"',
    'Content-Transfer-Encoding: 8bit',
  ];
  if (args.replyTo) headers.push(`Reply-To: ${escapeHeader(args.replyTo)}`);
  return `${headers.join('\r\n')}\r\n\r\n${args.bodyText}`;
}

function base64UrlEncode(s: string): string {
  return Buffer.from(s, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export async function sendGmail(args: SendGmailArgs): Promise<SendGmailResult> {
  const raw = base64UrlEncode(buildRfc822(args));
  const res = await fetch(SEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GmailSendError(`Gmail send failed (${res.status}): ${text}`, {
      status: res.status,
    });
  }
  const json = (await res.json()) as { id: string; threadId?: string };
  return { messageId: json.id, threadId: json.threadId ?? null };
}
