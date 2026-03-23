import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { extractResumeData } from '@/server/rag/extraction';

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

    // Rate limit: 10 per hour per user
    const allowed = await checkRateLimit({
      prefix: 'profile-resume',
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

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF magic bytes
    if (!buffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
    }

    // Parse PDF text
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

    // Upload to Supabase Storage
    const serviceClient = await createServiceClient();
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${timestamp}-${safeName}`;

    const { error: uploadError } = await serviceClient.storage
      .from('resumes')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Resume upload error:', uploadError);
      // Continue without storage — text extraction still works
    }

    // AI extraction (reuse existing pipeline function)
    let parsedResume = null;
    try {
      parsedResume = await extractResumeData(text);
    } catch (extractionError) {
      console.error('Resume extraction error:', extractionError);
      // Continue without AI extraction — user can still proceed
    }

    // Update user profile with resume data
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        resume_file_path: uploadError ? null : storagePath,
        resume_text: text,
        resume_parsed_json: parsedResume,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Profile resume update error:', updateError);
      return NextResponse.json({ error: 'Failed to save resume data' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        filePath: uploadError ? null : storagePath,
        text,
        parsed: parsedResume,
        pages: pdfData.numpages,
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
      {
        error:
          "Your PDF couldn't be read. It may be corrupted or in an unsupported format. Try re-saving it as a new PDF.",
      },
      { status: 500 }
    );
  }
}
