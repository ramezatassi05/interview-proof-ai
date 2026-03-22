import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getAnthropicClient, CLAUDE_MODELS } from '@/lib/anthropic';
import { buildCareerAdvisorSystemPrompt } from '@/server/career-advisor';
import type { ParsedResume, SkillDemand, CareerAdvisorMessage } from '@/types';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
      })
    )
    .optional()
    .default([]),
});

export const maxDuration = 120; // 2 min — career advisor responses are shorter than full analysis

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
      prefix: 'career-chat',
      identifier: `user:${user.id}`,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await request.json();
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { message, conversationHistory } = validation.data;

    // Fetch user's resume
    const { data: resumeRow, error: resumeError } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (resumeError || !resumeRow) {
      return NextResponse.json({
        data: {
          response:
            'Please upload your resume first so I can give you personalized career advice. I need to understand your skills, experience, and goals to help you effectively.',
          requiresResume: true,
        },
      });
    }

    const parsedData = resumeRow.parsed_data as ParsedResume;
    const skills = (resumeRow.skills as string[]) || [];
    const targetRole = resumeRow.target_role || 'software engineer';

    // Fetch skill demand data (gracefully handle empty table)
    let demandData: SkillDemand[] = [];
    try {
      const { data: demandRows } = await supabase
        .from('skill_demand_30d')
        .select('*')
        .eq('target_role', targetRole)
        .order('total_mentions', { ascending: false })
        .limit(20);

      if (demandRows && demandRows.length > 0) {
        demandData = demandRows.map((row) => ({
          skillName: row.skill_name as string,
          skillId: row.skill_id as string | undefined,
          targetRole: row.target_role as string,
          totalMentions: row.total_mentions as number,
        }));
      }
    } catch {
      // skill_demand table may not exist yet or view may be empty — that's fine
      console.warn('Could not fetch skill demand data — using static market intelligence only');
    }

    // Build system prompt with resume memory
    const systemPrompt = buildCareerAdvisorSystemPrompt(parsedData, skills, demandData);

    // Construct messages for Claude
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call Claude
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODELS.reasoning,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    // Extract text response
    const textBlock = response.content.find((block) => block.type === 'text');
    const responseText = textBlock?.text || 'I apologize, but I was unable to generate a response. Please try again.';

    return NextResponse.json({
      data: {
        response: responseText,
        requiresResume: false,
      },
    });
  } catch (error) {
    console.error('Career advisor chat error:', error);

    const message = error instanceof Error ? error.message : '';

    if (message.includes('overloaded') || message.includes('529')) {
      return NextResponse.json(
        { error: 'The AI service is currently busy. Please try again in a moment.' },
        { status: 503 }
      );
    }

    if (message.includes('rate_limit') || message.includes('429')) {
      return NextResponse.json(
        { error: 'Too many requests to the AI service. Please wait a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate career advice. Please try again.' },
      { status: 500 }
    );
  }
}
