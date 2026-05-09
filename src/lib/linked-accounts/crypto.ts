/**
 * AES-GCM token vault for user_linked_accounts.
 *
 * We never store OAuth tokens in plaintext. The envelope is:
 *   stored = base64( iv (12B) || ciphertext || authTag (16B) )
 * encrypted with the LINKED_ACCOUNT_KEY env var (a 32-byte base64 string).
 *
 * Implementation uses Node's WebCrypto (`crypto.subtle`) so this works on
 * Vercel Functions without adding a dependency.
 */
import { webcrypto } from 'node:crypto';

const subtle = webcrypto.subtle;
const IV_LENGTH_BYTES = 12;
const ALGO = 'AES-GCM' as const;

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const raw = process.env.LINKED_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'LINKED_ACCOUNT_KEY is not set. Generate with: openssl rand -base64 32'
    );
  }
  const bytes = Buffer.from(raw, 'base64');
  if (bytes.byteLength !== 32) {
    throw new Error(
      `LINKED_ACCOUNT_KEY must decode to 32 bytes (got ${bytes.byteLength}). Generate with: openssl rand -base64 32`
    );
  }
  cachedKey = await subtle.importKey('raw', bytes, ALGO, false, ['encrypt', 'decrypt']);
  return cachedKey;
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = new Uint8Array(await subtle.encrypt({ name: ALGO, iv }, key, data));
  // Concat iv || ciphertext (which already includes the 16-byte GCM auth tag).
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.byteLength);
  return Buffer.from(combined).toString('base64');
}

export async function decryptToken(encoded: string): Promise<string> {
  const key = await getKey();
  const combined = Buffer.from(encoded, 'base64');
  if (combined.byteLength < IV_LENGTH_BYTES + 16) {
    throw new Error('Ciphertext too short to be a valid AES-GCM envelope');
  }
  const iv = combined.subarray(0, IV_LENGTH_BYTES);
  const ciphertext = combined.subarray(IV_LENGTH_BYTES);
  const plaintext = new Uint8Array(
    await subtle.decrypt({ name: ALGO, iv }, key, ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}
