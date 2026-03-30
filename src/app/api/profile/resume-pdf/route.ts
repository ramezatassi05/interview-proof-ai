import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's resume PDF path
    const serviceClient = await createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('resume_pdf_path')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.resume_pdf_path) {
      return NextResponse.json({ error: 'No resume PDF found' }, { status: 404 });
    }

    // Generate a signed URL (5 minutes expiry)
    const { data: signedData, error: signError } = await serviceClient.storage
      .from('resumes')
      .createSignedUrl(profile.resume_pdf_path, 300);

    if (signError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signError);
      return NextResponse.json(
        { error: 'Failed to generate resume preview URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { signedUrl: signedData.signedUrl } });
  } catch (err) {
    console.error('Resume PDF GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
