import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = (data.text as string).trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            'No readable text found in this PDF. It may be a scanned image. Try re-saving it with OCR enabled, or paste your resume text instead.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        text,
        pages: data.numpages,
      },
    });
  } catch (error) {
    console.error('PDF parse error:', error);

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
          "Your PDF couldn't be read. It may be corrupted or in an unsupported format. Try re-saving it as a new PDF, or paste your resume text instead.",
      },
      { status: 500 }
    );
  }
}
