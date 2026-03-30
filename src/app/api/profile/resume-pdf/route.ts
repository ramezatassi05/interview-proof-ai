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

    // Download the PDF file from Supabase Storage
    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from('resumes')
      .download(profile.resume_pdf_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to load resume PDF' },
        { status: 500 }
      );
    }

    // Stream the PDF directly with proper headers
    const buffer = Buffer.from(await fileData.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume.pdf"',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    console.error('Resume PDF GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
