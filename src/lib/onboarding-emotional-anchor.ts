import type { ConfidenceDrop, PracticePain, InterviewMotivation, EmotionalAnchor } from '@/types';

// ============================================
// Emotional Anchor — Deterministic framing messages
// Renders at the top of the Aha moment Slide 1
// ============================================

const CONFIDENCE_ANCHORS: Record<ConfidenceDrop, { message: string; followUp: string }> = {
  system_design: {
    message:
      "You told us system design is where your confidence drops. That's actually the most improvable area.",
    followUp: "Here's exactly what's holding you back — and the fastest path to fixing it.",
  },
  behavioral: {
    message:
      'You told us behavioral questions feel like your weak spot. Most candidates underestimate how much structure helps here.',
    followUp:
      "Your diagnostic will pinpoint exactly which stories you're missing — and how to build them fast.",
  },
  coding: {
    message:
      "You said you know the answers but can't articulate them. That's a solvable problem — it's pattern recognition, not talent.",
    followUp:
      "We'll identify the specific patterns where you freeze and build targeted drills around them.",
  },
  everything: {
    message:
      "You told us confidence is your biggest concern across the board. That's more common than you think — and more fixable.",
    followUp: "Here's what's actually causing it — and the focused path to changing it.",
  },
};

const PRACTICE_PAIN_ANCHORS: Record<PracticePain, { message: string; followUp: string }> = {
  ramble: {
    message:
      "You told us you lose structure under pressure. That's one of the fastest things to fix with the right framework.",
    followUp:
      'Your diagnostic will show exactly where structure breaks down — and how to lock it in.',
  },
  freeze: {
    message:
      "You told us you freeze on unseen questions. We see this pattern a lot — and it's fixable faster than you'd think.",
    followUp:
      "It's not about knowing more — it's about having a systematic approach when you don't know the answer.",
  },
  no_benchmark: {
    message:
      "You said you don't know what a strong answer looks like. That's the #1 thing holding most candidates back.",
    followUp: 'Your diagnostic will calibrate your answers against real interview standards.',
  },
  no_offers: {
    message:
      "You feel prepared but keep missing offers. Something specific is costing you — and you can't see it yet.",
    followUp: "Your diagnostic will find the hidden pattern that's holding you back.",
  },
};

const MOTIVATION_ANCHORS: Record<InterviewMotivation, { message: string; followUp: string }> = {
  dream_role: {
    message:
      "You're going after your dream role. Let's make sure nothing preventable gets in the way.",
    followUp: "Here's exactly where you stand — and what to focus on to close the gap.",
  },
  break_in: {
    message:
      "You're trying to break into the industry. The bar feels high because it is — but the gaps are specific and fixable.",
    followUp:
      'Your diagnostic will show exactly which gaps matter most for getting your foot in the door.',
  },
  stop_dreading: {
    message:
      'You want to stop dreading interviews. That feeling comes from uncertainty — and uncertainty comes from blind spots.',
    followUp: "Let's find those blind spots and turn them into a concrete plan.",
  },
};

export function computeEmotionalAnchor(
  confidenceDrop: ConfidenceDrop | null,
  practicePain: PracticePain | null,
  interviewMotivation: InterviewMotivation | null
): EmotionalAnchor | null {
  if (confidenceDrop) {
    const anchor = CONFIDENCE_ANCHORS[confidenceDrop];
    return { ...anchor, source: 'confidenceDrop' };
  }
  if (practicePain) {
    const anchor = PRACTICE_PAIN_ANCHORS[practicePain];
    return { ...anchor, source: 'practicePain' };
  }
  if (interviewMotivation) {
    const anchor = MOTIVATION_ANCHORS[interviewMotivation];
    return { ...anchor, source: 'interviewMotivation' };
  }
  return null;
}
