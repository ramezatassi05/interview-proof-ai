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
    };
    return earlyThemes[roundType];
  } else if (progress <= 0.7) {
    // Mid phase - deep practice
    const midThemes: Record<RoundType, string> = {
      technical: 'Deep Practice & Problem Solving',
      behavioral: 'Story Refinement & Delivery',
      case: 'Case Practice & Structuring',
      finance: 'Modeling & Technical Deep-Dive',
    };
    return midThemes[roundType];
  } else {
    // Late phase - polish and mock
    const lateThemes: Record<RoundType, string> = {
      technical: 'Mock Interviews & Final Polish',
      behavioral: 'Mock Interviews & Confidence Building',
      case: 'Timed Cases & Presentation Polish',
      finance: 'Mock Technicals & Mental Math',
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
