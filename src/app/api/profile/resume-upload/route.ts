import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'resume-upload',
      identifier: `user:${user.id}`,
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF magic bytes
    if (!buffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
    }

    // Extract text from PDF
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);
    const text = (pdfData.text as string).trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            'No readable text found in this PDF. It may be a scanned image. Try re-saving it with OCR enabled, or paste your resume text instead.',
        },
        { status: 400 }
      );
    }

    // Upload PDF to Supabase Storage
    const storagePath = `${user.id}/resume.pdf`;
    const serviceClient = await createServiceClient();

    const { error: uploadError } = await serviceClient.storage
      .from('resumes')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload resume file' },
        { status: 500 }
      );
    }

    // Update user profile with both text and PDF path
    const { error: updateError } = await serviceClient
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          resume_text: text,
          resume_pdf_path: storagePath,
        },
        { onConflict: 'user_id' }
      );

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save resume' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        text,
        resumePdfPath: storagePath,
        characters: text.length,
      },
    });
  } catch (error) {
    console.error('Resume upload error:', error);

    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (message.includes('encrypt') || message.includes('password')) {
      return NextResponse.json(
        {
          error:
            'This PDF is password-protected. Please remove the password and re-upload, or paste your resume text instead.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process resume. Please try again.' },
      { status: 500 }
    );
  }
}
