import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: resume, error: fetchError } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected when no resume uploaded)
      console.error('Resume fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch resume' },
        { status: 500 }
      );
    }

    if (!resume) {
      return NextResponse.json({ data: { resume: null } });
    }

    return NextResponse.json({
      data: {
        resume: {
          id: resume.id,
          userId: resume.user_id,
          rawText: resume.raw_text,
          rawFileUrl: resume.raw_file_url,
          fileName: resume.file_name,
          fileType: resume.file_type,
          parsedData: resume.parsed_data,
          skills: resume.skills,
          skillIds: resume.skill_ids,
          targetRole: resume.target_role,
          targetIndustry: resume.target_industry,
          experienceLevel: resume.experience_level,
          graduationDate: resume.graduation_date,
          createdAt: resume.created_at,
          updatedAt: resume.updated_at,
          lastParsedAt: resume.last_parsed_at,
          parseVersion: resume.parse_version,
        },
      },
    });
  } catch (error) {
    console.error('Resume GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('user_resumes')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Resume delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete resume' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: 'Resume deleted successfully' },
    });
  } catch (error) {
    console.error('Resume DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
