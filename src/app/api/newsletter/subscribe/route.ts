import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { isDisposableEmail } from '@/lib/waitlist';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid email.' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Please use a non-disposable email address.' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Upsert — if already subscribed, just update subscribed_at
    const { error } = await supabase.from('newsletter_subscribers').upsert(
      {
        email: email.toLowerCase(),
        source: 'landing',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: 'email' }
    );

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Failed to subscribe.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
