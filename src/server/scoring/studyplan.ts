import type {
  PrepPreferences,
  PersonalizedStudyPlan,
  DailyPlan,
  DetailedTask,
  RiskItem,
  LLMAnalysis,
  RoundType,
  FocusArea,
} from '@/types';

const STUDY_PLAN_VERSION = 'v0.1';

/**
 * Maps timeline to number of days.
 */
function getTimelineDays(timeline: PrepPreferences['timeline']): number {
  const mapping: Record<PrepPreferences['timeline'], number> = {
    '1day': 1,
    '3days': 3,
    '1week': 7,
    '2weeks': 14,
    '4weeks_plus': 28,
  };
  return mapping[timeline];
}

/**
 * Maps focus areas to task categories.
 */
function focusAreaToCategories(area: FocusArea): DetailedTask['category'][] {
  const mapping: Record<FocusArea, DetailedTask['category'][]> = {
    technical_depth: ['technical'],
    behavioral_stories: ['behavioral'],
    system_design: ['technical'],
    communication: ['behavioral', 'practice'],
    domain_knowledge: ['technical', 'review'],
  };
  return mapping[area];
}

/**
 * Gets daily themes based on round type and day number.
 */
function getDailyTheme(dayNumber: number, totalDays: number, roundType: RoundType): string {
  // Single day - everything at once
  if (totalDays === 1) {
    return 'Intensive Review & Practice';
  }

  // Calculate phase (early, mid, late)
  const progress = dayNumber / totalDays;

  if (progress <= 0.3) {
    // Early phase - foundation
    const earlyThemes: Record<RoundType, string> = {
      technical: 'Foundation Review & Gap Analysis',
      behavioral: 'Story Mining & STAR Framework',
      case: 'Framework Review & Mental Models',
      finance: 'Core Concepts & Valuation Basics',
      research: 'Paper Reading & ML Fundamentals Review',
    };
    return earlyThemes[roundType];
  } else if (progress <= 0.7) {
    // Mid phase - deep practice
    const midThemes: Record<RoundType, string> = {
      technical: 'Deep Practice & Problem Solving',
      behavioral: 'Story Refinement & Delivery',
      case: 'Case Practice & Structuring',
      finance: 'Modeling & Technical Deep-Dive',
      research: 'Research Proposals & Experiment Design',
    };
    return midThemes[roundType];
  } else {
    // Late phase - polish and mock
    const lateThemes: Record<RoundType, string> = {
      technical: 'Mock Interviews & Final Polish',
      behavioral: 'Mock Interviews & Confidence Building',
      case: 'Timed Cases & Presentation Polish',
      finance: 'Mock Technicals & Mental Math',
      research: 'Mock Presentations & ML System Design',
    };
    return lateThemes[roundType];
  }
}

/**
 * Gets a friendly day label.
 */
function getDayLabel(dayNumber: number, totalDays: number): string {
  if (totalDays === 1) return 'Today';
  if (dayNumber === 1) return 'Day 1 (Today)';
  if (dayNumber === totalDays) return `Day ${dayNumber} (Interview Day)`;
  return `Day ${dayNumber}`;
}

/**
 * Converts basic LLM tasks to detailed tasks with defaults.
 */
function convertToDetailedTasks(
  tasks: LLMAnalysis['studyPlan'],
  risks: RiskItem[]
): DetailedTask[] {
  const riskMap = new Map(risks.map((r) => [r.id, r]));

  return tasks.map((task, index) => {
    const risk = riskMap.get(task.mappedRiskId);
    const severity = risk?.severity || 'medium';

    // Infer priority from risk severity
    let priority: DetailedTask['priority'] = 'medium';
    if (severity === 'critical') priority = 'critical';
    else if (severity === 'high') priority = 'high';

    // Infer category from task text
    let category: DetailedTask['category'] = 'review';
    const taskLower = task.task.toLowerCase();
    if (
      taskLower.includes('practice') ||
      taskLower.includes('mock') ||
      taskLower.includes('drill')
    ) {
      category = 'practice';
    } else if (
      taskLower.includes('code') ||
      taskLower.includes('algorithm') ||
      taskLower.includes('system') ||
      taskLower.includes('technical')
    ) {
      category = 'technical';
    } else if (
      taskLower.includes('story') ||
      taskLower.includes('star') ||
      taskLower.includes('behavioral') ||
      taskLower.includes('example')
    ) {
      category = 'behavioral';
    }

    return {
      id: `task-${index + 1}`,
      task: task.task,
      description: task.description || `Address the gap: ${risk?.title || 'identified risk'}`,
      timeEstimateMinutes: task.timeEstimateMinutes,
      priority: task.priority || priority,
      mappedRiskId: task.mappedRiskId,
      category: task.category || category,
    };
  });
}

/**
 * Sorts tasks by priority and focus area relevance.
 */
function sortTasksByPriority(tasks: DetailedTask[], focusAreas: FocusArea[]): DetailedTask[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  // Get preferred categories from focus areas
  const preferredCategories = new Set(focusAreas.flatMap((area) => focusAreaToCategories(area)));

  return [...tasks].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by focus area match
    const aMatch = preferredCategories.has(a.category) ? 0 : 1;
    const bMatch = preferredCategories.has(b.category) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;

    // Then by time (shorter first for early momentum)
    return a.timeEstimateMinutes - b.timeEstimateMinutes;
  });
}

/**
 * Distributes tasks across days based on available time.
 */
function distributeTasks(
  sortedTasks: DetailedTask[],
  totalDays: number,
  dailyMinutes: number
): DailyPlan[] {
  const dailyPlans: DailyPlan[] = [];
  let taskIndex = 0;

  for (let day = 1; day <= totalDays; day++) {
    const dayTasks: DetailedTask[] = [];
    let remainingMinutes = dailyMinutes;

    // Fill the day with tasks
    while (taskIndex < sortedTasks.length && remainingMinutes > 0) {
      const task = sortedTasks[taskIndex];

      // Allow tasks that fit or if it's the first task of the day
      if (task.timeEstimateMinutes <= remainingMinutes || dayTasks.length === 0) {
        dayTasks.push(task);
        remainingMinutes -= task.timeEstimateMinutes;
        taskIndex++;
      } else {
        // Try to find a smaller task that fits
        let foundSmaller = false;
        for (let i = taskIndex + 1; i < sortedTasks.length; i++) {
          if (sortedTasks[i].timeEstimateMinutes <= remainingMinutes) {
            dayTasks.push(sortedTasks[i]);
            remainingMinutes -= sortedTasks[i].timeEstimateMinutes;
            sortedTasks.splice(i, 1); // Remove from remaining
            foundSmaller = true;
            break;
          }
        }
        if (!foundSmaller) break; // No more tasks fit today
      }
    }

    // If no tasks assigned to day, it means remaining tasks don't fit
    // This shouldn't happen with proper planning
    if (dayTasks.length === 0 && taskIndex < sortedTasks.length) {
      // Force at least one task per day
      dayTasks.push(sortedTasks[taskIndex]);
      taskIndex++;
    }

    dailyPlans.push({
      dayNumber: day,
      label: '', // Will be set later
      theme: '', // Will be set later
      totalMinutes: dayTasks.reduce((sum, t) => sum + t.timeEstimateMinutes, 0),
      tasks: dayTasks,
    });
  }

  // Distribute remaining tasks to days with capacity
  while (taskIndex < sortedTasks.length) {
    const task = sortedTasks[taskIndex];

    // Find day with most capacity
    let bestDay = dailyPlans[0];
    for (const day of dailyPlans) {
      if (day.totalMinutes < bestDay.totalMinutes) {
        bestDay = day;
      }
    }

    bestDay.tasks.push(task);
    bestDay.totalMinutes += task.timeEstimateMinutes;
    taskIndex++;
  }

  return dailyPlans;
}

// ---------------------------------------------------------------------------
// Synthetic task generation — fills empty/sparse days
// ---------------------------------------------------------------------------

interface TaskTemplate {
  task: string;
  description: string;
  category: DetailedTask['category'];
  minutes: number;
}

/**
 * Truncates a string to maxLen chars, adding ellipsis if needed.
 */
function truncate(s: string, maxLen: number): string {
  return s.length <= maxLen ? s : s.slice(0, maxLen - 1) + '\u2026';
}

/**
 * Samples up to `count` topic names from prior daily plan tasks.
 */
function sampleTopics(priorTasks: DetailedTask[], count: number): string[] {
  const names = priorTasks.map((t) => truncate(t.task, 60));
  // Take evenly-spaced samples
  if (names.length <= count) return names;
  const step = Math.floor(names.length / count);
  return Array.from({ length: count }, (_, i) => names[i * step]);
}

/**
 * Returns task templates for the MID phase of the plan (<=60% progress).
 */
function getMidPlanTemplates(roundType: RoundType, topicSamples: string[]): TaskTemplate[] {
  const ref = topicSamples.length > 0 ? topicSamples[0] : 'earlier topics';
  const templates: Record<RoundType, TaskTemplate[]> = {
    technical: [
      { task: `Review & reattempt: ${ref}`, description: 'Revisit an earlier problem to reinforce learning and identify lingering gaps.', category: 'review', minutes: 25 },
      { task: 'Timed coding drill (2 medium problems, 25 min each)', description: 'Build speed and accuracy under time pressure with fresh problems.', category: 'practice', minutes: 50 },
      { task: 'Articulation practice: explain your approach aloud', description: 'Practice narrating your thought process as you solve a problem — interviewers evaluate communication alongside code.', category: 'practice', minutes: 20 },
    ],
    behavioral: [
      { task: `Refine STAR story inspired by: ${ref}`, description: 'Revisit an earlier story draft, sharpen the Situation/Task/Action/Result structure.', category: 'behavioral', minutes: 25 },
      { task: 'Record yourself telling a story and self-critique', description: 'Hearing yourself reveals filler words, weak transitions, and missing impact statements.', category: 'practice', minutes: 30 },
      { task: 'Draft a conflict-resolution story', description: 'Interviewers frequently probe how you handle disagreements — prepare a polished example.', category: 'behavioral', minutes: 25 },
    ],
    case: [
      { task: `Re-examine framework from: ${ref}`, description: 'Revisit the framework you used earlier and stress-test it with a different scenario.', category: 'review', minutes: 25 },
      { task: 'Timed mini-case: market sizing (15 min)', description: 'Practice a quick market-sizing case to build estimation fluency.', category: 'practice', minutes: 20 },
      { task: 'Structure a profitability case end-to-end', description: 'Walk through a classic profitability case, focusing on clear structure and hypothesis-driven analysis.', category: 'practice', minutes: 30 },
    ],
    finance: [
      { task: `Review valuation concept from: ${ref}`, description: 'Revisit a valuation method studied earlier and work through a fresh example.', category: 'review', minutes: 25 },
      { task: 'Mental math drill: quick multiples & percentages', description: 'Speed drills on the mental math that comes up in finance interviews.', category: 'practice', minutes: 20 },
      { task: 'Walk through a 3-statement model from memory', description: 'Practice building income statement → balance sheet → cash flow linkages without notes.', category: 'technical', minutes: 35 },
    ],
    research: [
      { task: `Re-read and summarize key paper: ${ref}`, description: 'Revisit a foundational paper, write a one-paragraph summary of contributions and limitations.', category: 'review', minutes: 30 },
      { task: 'ML concept drill: loss functions, optimization, regularization', description: 'Practice explaining core ML concepts clearly — interviewers test depth of understanding.', category: 'practice', minutes: 25 },
      { task: 'Design a simple experiment for a research question', description: 'Practice formulating hypotheses, choosing baselines, and defining evaluation metrics.', category: 'technical', minutes: 30 },
    ],
  };
  return templates[roundType];
}

/**
 * Returns task templates for the LATE phase (60-85% progress).
 */
function getLatePlanTemplates(roundType: RoundType, topicSamples: string[]): TaskTemplate[] {
  const ref = topicSamples.length > 0 ? topicSamples[0] : 'weak areas';
  const templates: Record<RoundType, TaskTemplate[]> = {
    technical: [
      { task: 'Mock technical interview simulation (45 min)', description: 'Simulate a full interview round with a timer — solve, explain, and handle follow-ups.', category: 'practice', minutes: 45 },
      { task: `Targeted drill on weakness: ${ref}`, description: 'Focus on the topic you struggled with most and solve 2-3 problems in that area.', category: 'technical', minutes: 30 },
      { task: 'Consolidation: write a cheat sheet of key patterns', description: 'Summarize the most important patterns, formulas, or templates you have learned so far.', category: 'review', minutes: 20 },
    ],
    behavioral: [
      { task: 'Mock behavioral interview: 4 questions in 20 min', description: 'Practice answering rapid-fire behavioral questions to build fluency and confidence.', category: 'practice', minutes: 25 },
      { task: `Strengthen weakest story: ${ref}`, description: 'Identify your least polished story and rewrite it with stronger action verbs and quantified impact.', category: 'behavioral', minutes: 25 },
      { task: 'Prepare "tell me about yourself" (90-second version)', description: 'Craft and rehearse a concise personal pitch that bridges your background to the target role.', category: 'practice', minutes: 20 },
    ],
    case: [
      { task: 'Full timed case interview simulation (30 min)', description: 'Run through a complete case from prompt to recommendation under a strict timer.', category: 'practice', minutes: 35 },
      { task: `Drill weakness area: ${ref}`, description: 'Revisit the case type or analytical step you found hardest and practice it in isolation.', category: 'practice', minutes: 25 },
      { task: 'Practice delivering a crisp recommendation', description: 'Focus on the final 2 minutes of a case — synthesize findings and present a clear, confident recommendation.', category: 'practice', minutes: 20 },
    ],
    finance: [
      { task: 'Mock technical Q&A: accounting & valuation', description: 'Have someone (or a timer) quiz you on common finance interview questions.', category: 'practice', minutes: 30 },
      { task: `Deep review of weak concept: ${ref}`, description: 'Spend focused time on the topic you are least confident about.', category: 'review', minutes: 30 },
      { task: 'Practice "walk me through a DCF" end to end', description: 'Rehearse the classic DCF walkthrough until it feels natural and complete.', category: 'practice', minutes: 25 },
    ],
    research: [
      { task: 'Mock research presentation (15 min talk + Q&A)', description: 'Simulate presenting a paper or project to a panel — practice handling tough follow-up questions.', category: 'practice', minutes: 30 },
      { task: `Deep review of weak ML topic: ${ref}`, description: 'Spend focused time on the ML concept or method you are least confident about.', category: 'review', minutes: 30 },
      { task: 'Practice critiquing a paper: strengths, weaknesses, extensions', description: 'Read a recent paper and practice articulating a balanced critique — a common research interview task.', category: 'practice', minutes: 25 },
    ],
  };
  return templates[roundType];
}

/**
 * Returns task templates for the FINAL phase (85-100% progress).
 */
function getFinalPlanTemplates(roundType: RoundType, topicSamples: string[]): TaskTemplate[] {
  const ref = topicSamples.length > 0 ? topicSamples[0] : 'key topics';
  const templates: Record<RoundType, TaskTemplate[]> = {
    technical: [
      { task: 'Full mock interview under real conditions', description: 'Simulate the entire interview experience — whiteboard/screen-share, time limit, verbal explanation.', category: 'practice', minutes: 50 },
      { task: `Final review: revisit ${ref} and top patterns`, description: 'Do a light pass over the most important topics — reinforce, do not cram.', category: 'review', minutes: 25 },
      { task: 'Prepare 3-4 thoughtful questions for your interviewer', description: 'Having great questions shows genuine interest and preparation.', category: 'review', minutes: 15 },
      { task: 'Logistics check: setup, links, ID, environment', description: 'Verify your interview environment, tech setup, calendar invite, and any required documents.', category: 'review', minutes: 10 },
    ],
    behavioral: [
      { task: 'Full mock behavioral interview (30 min)', description: 'Run through a complete behavioral round — opening pitch, 4-5 stories, closing questions.', category: 'practice', minutes: 35 },
      { task: `Final story polish: ${ref}`, description: 'Give your best stories one last read-through — tighten language and ensure impact is clear.', category: 'review', minutes: 20 },
      { task: 'Prepare insightful questions for the interviewer', description: 'Show you have researched the company and role with 3-4 tailored questions.', category: 'review', minutes: 15 },
      { task: 'Logistics & confidence prep', description: 'Lay out your outfit, check your setup, and do a brief visualization/confidence exercise.', category: 'review', minutes: 10 },
    ],
    case: [
      { task: 'Full timed case simulation with presentation', description: 'Run a complete case end-to-end including a final recommendation slide/summary.', category: 'practice', minutes: 40 },
      { task: `Quick framework refresher: ${ref}`, description: 'Review your go-to frameworks one final time — make sure they are second nature.', category: 'review', minutes: 15 },
      { task: 'Prepare questions to ask the interviewer', description: 'Demonstrate curiosity and preparation with thoughtful, role-specific questions.', category: 'review', minutes: 15 },
      { task: 'Pre-interview logistics and mental prep', description: 'Confirm time, location/link, and do a brief warm-up case to get in the zone.', category: 'review', minutes: 10 },
    ],
    finance: [
      { task: 'Full mock technical + fit interview', description: 'Simulate the complete interview flow — technical questions followed by fit/motivation questions.', category: 'practice', minutes: 45 },
      { task: `Final concept review: ${ref}`, description: 'Light refresher on the core concepts — do not cram, just reinforce.', category: 'review', minutes: 20 },
      { task: 'Prepare 3-4 smart questions about the team/deals', description: 'Show you understand the group\'s focus and recent activity.', category: 'review', minutes: 15 },
      { task: 'Logistics: print materials, check setup, rest well', description: 'Handle all logistics so interview day is stress-free.', category: 'review', minutes: 10 },
    ],
    research: [
      { task: 'Full mock research interview: paper discussion + ML deep-dive', description: 'Simulate a complete research interview — present your work, discuss papers, and answer ML theory questions.', category: 'practice', minutes: 50 },
      { task: `Final review: revisit ${ref} and key ML concepts`, description: 'Do a light pass over the most important topics — reinforce, do not cram.', category: 'review', minutes: 25 },
      { task: 'Prepare 3-4 thoughtful questions about the research group', description: 'Show genuine interest in the team\'s research direction and recent publications.', category: 'review', minutes: 15 },
      { task: 'Logistics check: setup, slides, environment', description: 'Verify your interview environment, presentation materials, and any required documents.', category: 'review', minutes: 10 },
    ],
  };
  return templates[roundType];
}

/**
 * Selects phase-appropriate task templates based on progress through the plan.
 */
function getPhaseTemplates(
  progress: number,
  roundType: RoundType,
  topicSamples: string[]
): TaskTemplate[] {
  if (progress <= 0.6) return getMidPlanTemplates(roundType, topicSamples);
  if (progress <= 0.85) return getLatePlanTemplates(roundType, topicSamples);
  return getFinalPlanTemplates(roundType, topicSamples);
}

/**
 * Generates synthetic review/practice tasks to fill a sparse day.
 */
function generateSyntheticTasks(
  dayNumber: number,
  totalDays: number,
  minutesToFill: number,
  priorTasks: DetailedTask[],
  roundType: RoundType,
  idOffset: number
): DetailedTask[] {
  const progress = dayNumber / totalDays;
  const topicSamples = sampleTopics(priorTasks, 3);
  const templates = getPhaseTemplates(progress, roundType, topicSamples);

  const result: DetailedTask[] = [];
  let remaining = minutesToFill;
  let nextId = idOffset;

  for (const tpl of templates) {
    if (remaining <= 0) break;
    const minutes = Math.min(tpl.minutes, remaining);
    result.push({
      id: `task-synth-${nextId++}`,
      task: tpl.task,
      description: tpl.description,
      timeEstimateMinutes: minutes,
      priority: 'medium',
      mappedRiskId: 'synthetic',
      category: tpl.category,
    });
    remaining -= minutes;
  }

  return result;
}

/**
 * Fills empty or sparse days with synthetic review/practice tasks.
 * A day is considered sparse if it uses less than 40% of the daily time budget.
 */
function fillEmptyDays(
  dailyPlans: DailyPlan[],
  dailyMinutes: number,
  roundType: RoundType
): void {
  const threshold = dailyMinutes * 0.4;
  // Collect all tasks from prior days to reference topics
  const allPriorTasks: DetailedTask[] = [];
  let synthCounter = 1;

  for (const plan of dailyPlans) {
    if (plan.totalMinutes < threshold) {
      const minutesToFill = dailyMinutes - plan.totalMinutes;
      const syntheticTasks = generateSyntheticTasks(
        plan.dayNumber,
        dailyPlans.length,
        minutesToFill,
        allPriorTasks,
        roundType,
        synthCounter
      );
      plan.tasks.push(...syntheticTasks);
      plan.totalMinutes += syntheticTasks.reduce((s, t) => s + t.timeEstimateMinutes, 0);
      synthCounter += syntheticTasks.length;
    }
    // Accumulate tasks for topic sampling in later days
    allPriorTasks.push(...plan.tasks);
  }
}

/**
 * Generates a personalized study plan based on user preferences and LLM analysis.
 */
export function generatePersonalizedStudyPlan(
  tasks: LLMAnalysis['studyPlan'],
  preferences: PrepPreferences,
  risks: RiskItem[],
  roundType: RoundType
): PersonalizedStudyPlan {
  const totalDays = getTimelineDays(preferences.timeline);
  const dailyMinutes = Math.round(preferences.dailyHours * 60);

  // Convert to detailed tasks
  const detailedTasks = convertToDetailedTasks(tasks, risks);

  // Sort by priority and focus area relevance
  const sortedTasks = sortTasksByPriority(detailedTasks, preferences.focusAreas);

  // Distribute across days
  const dailyPlans = distributeTasks(sortedTasks, totalDays, dailyMinutes);

  // Fill empty/sparse days with synthetic review & practice tasks
  fillEmptyDays(dailyPlans, dailyMinutes, roundType);

  // Add labels and themes
  for (const plan of dailyPlans) {
    plan.label = getDayLabel(plan.dayNumber, totalDays);
    plan.theme = getDailyTheme(plan.dayNumber, totalDays, roundType);
  }

  // Calculate actual total hours
  const actualTotalMinutes = dailyPlans.reduce((sum, p) => sum + p.totalMinutes, 0);

  return {
    preferences,
    totalDays,
    totalHours: Math.round((actualTotalMinutes / 60) * 10) / 10,
    dailyPlans,
    version: STUDY_PLAN_VERSION,
  };
}
