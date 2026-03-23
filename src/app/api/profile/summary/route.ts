import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import type { ProfileSummary } from '@/types';
import { z } from 'zod';

const ProfileSummarySchema = z.object({
  readinessEstimate: z.number().min(0).max(100),
  projectedPotential: z.number().min(0).max(100),
  summaryText: z.string(),
  recommendations: z.array(z.string()),
  strengths: z.array(z.string()),
});

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build context from profile
    const skills = profile.resume_parsed_json?.skills ?? [];
    const metrics = profile.resume_parsed_json?.metrics ?? [];
    const experienceCount = profile.resume_parsed_json?.experiences?.length ?? 0;

    const prompt = `You are a career assessment expert for InterviewProof, an AI interview preparation platform.
Based on the following candidate profile, generate a brief, motivational assessment.

Profile:
- Display Name: ${profile.display_name || 'Not provided'}
- Career Status: ${profile.career_status || 'Not provided'}
- Years of Experience: ${profile.years_of_experience ?? 'Not provided'}
- Current Role: ${profile.current_job_role || 'Not provided'} at ${profile.current_company || 'Unknown'}
- Target Role: ${profile.target_role || 'Not provided'}
- Target Companies: ${(profile.target_companies as { name: string }[])?.map((c) => c.name).join(', ') || 'Not specified'}
- Industries: ${(profile.industries as string[])?.join(', ') || 'Not specified'}
- Functions: ${(profile.job_functions as string[])?.join(', ') || 'Not specified'}
- Interview Timeline: ${profile.interview_timeline || 'Not specified'}
- Biggest Concerns: ${(profile.concerns as string[])?.join(', ') || 'None listed'}
- Resume Skills: ${skills.slice(0, 15).join(', ') || 'No resume uploaded'}
- Resume Metrics: ${metrics.slice(0, 5).join('; ') || 'None found'}
- Work Experiences Listed: ${experienceCount}

Return a JSON object with exactly this structure:
{
  "readinessEstimate": <number 0-100, estimate of current interview readiness>,
  "projectedPotential": <number 0-100, projected potential after using InterviewProof>,
  "summaryText": "<2-3 sentence personalized summary of their profile and potential>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"]
}

Be realistic but encouraging. The readinessEstimate should reflect their current preparation level.
The projectedPotential should show what they could achieve with focused preparation.
Keep recommendations actionable and specific to their profile.`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: MODELS.extraction,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    const parsed = ProfileSummarySchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.error('Summary validation error:', parsed.error);
      return NextResponse.json({ error: 'Invalid summary format' }, { status: 500 });
    }

    const summary: ProfileSummary = parsed.data;

    // Save to profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        profile_summary_json: summary,
        onboarding_completed: true,
        onboarding_current_step: 12,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Summary save error:', updateError);
    }

    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error('Profile summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
