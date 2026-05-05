import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdminUser } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;
const PREVIEW_CHARS = 240;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
]);

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'text/markdown': 'md',
};

function kindForMime(mime: string): 'pdf' | 'image' | 'text' | 'file' {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'text/plain' || mime === 'text/markdown') return 'text';
  return 'file';
}

interface UploadedAttachment {
  id: string;
  kind: 'pdf' | 'image' | 'text' | 'file';
  filename: string;
  byteSize: number;
  extractedTextPreview: string | null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const allowed = await checkRateLimit({
    prefix: 'company_agent_upload',
    identifier: `user:${auth.user.id}`,
    maxRequests: 30,
    windowSeconds: 3600,
  });
  if (!allowed) return rateLimitResponse(3600);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files. Max ${MAX_FILES} per request.` },
      { status: 400 }
    );
  }

  const sessionIdRaw = formData.get('sessionId');
  const sessionId =
    typeof sessionIdRaw === 'string' && sessionIdRaw.length > 0 ? sessionIdRaw : null;

  const service = await createServiceClient();
  const uploaded: UploadedAttachment[] = [];

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds 8 MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = kindForMime(file.type);

    let extractedText: string | null = null;
    if (kind === 'pdf') {
      if (!buffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
        return NextResponse.json(
          { error: `"${file.name}" doesn't look like a real PDF.` },
          { status: 400 }
        );
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const parsed = await pdfParse(buffer);
        extractedText = (parsed.text as string).trim() || null;
      } catch (err) {
        console.error('[company-agent/upload] pdf-parse error:', err);
        return NextResponse.json(
          { error: `Couldn't read text from "${file.name}".` },
          { status: 400 }
        );
      }
    } else if (kind === 'text') {
      extractedText = buffer.toString('utf8').trim() || null;
    }

    const ext = EXT_BY_MIME[file.type] ?? 'bin';
    const id = randomUUID();
    const storagePath = `${auth.user.id}/${sessionId ?? 'pending'}/${id}.${ext}`;

    const { error: uploadError } = await service.storage
      .from('agent-attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[company-agent/upload] storage error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file. Try again.' },
        { status: 500 }
      );
    }

    const { data: row, error: insertError } = await service
      .from('company_agent_attachments')
      .insert({
        id,
        user_id: auth.user.id,
        session_id: sessionId,
        kind,
        filename: file.name,
        mime_type: file.type,
        byte_size: file.size,
        storage_path: storagePath,
        extracted_text: extractedText,
      })
      .select('id')
      .single();

    if (insertError || !row) {
      console.error('[company-agent/upload] insert error:', insertError);
      // Best-effort cleanup of orphaned storage object.
      await service.storage.from('agent-attachments').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to record attachment.' },
        { status: 500 }
      );
    }

    uploaded.push({
      id: row.id as string,
      kind,
      filename: file.name,
      byteSize: file.size,
      extractedTextPreview: extractedText ? extractedText.slice(0, PREVIEW_CHARS) : null,
    });
  }

  return NextResponse.json({ data: uploaded });
}
