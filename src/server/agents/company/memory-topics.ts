export const MEMORY_TOPICS = [
  'goals',
  'preferences',
  'facts',
  'people',
  'context',
  'general',
] as const;

export type MemoryTopic = (typeof MEMORY_TOPICS)[number];

export const MEMORY_TOPIC_LABELS: Record<MemoryTopic, string> = {
  goals: 'Goals',
  preferences: 'Preferences',
  facts: 'Facts',
  people: 'People',
  context: 'Context',
  general: 'General',
};

export const MEMORY_TOPIC_DESCRIPTIONS: Record<MemoryTopic, string> = {
  goals: 'What the user is driving toward',
  preferences: 'How the user likes to work or correct',
  facts: 'Concrete numbers, decisions, dates',
  people: 'Names, roles, relationships',
  context: 'How things work in this domain',
  general: 'Anything that does not fit another topic',
};

// Order in which topics render in the system prompt and popover.
// Goals + preferences come first so they ground every reply; general last.
export const MEMORY_TOPIC_ORDER: MemoryTopic[] = [
  'goals',
  'preferences',
  'facts',
  'people',
  'context',
  'general',
];

export function isMemoryTopic(value: string | null | undefined): value is MemoryTopic {
  if (!value) return false;
  return (MEMORY_TOPICS as readonly string[]).includes(value);
}
