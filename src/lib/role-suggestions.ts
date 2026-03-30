import type { TargetDomain } from '@/types';

/** Quick-select role chips shown per domain */
export const POPULAR_ROLES: Record<TargetDomain, string[]> = {
  swe: ['Frontend Engineer', 'Backend Engineer', 'Full-Stack Engineer', 'Mobile Engineer', 'ML Engineer'],
  ds: ['Data Scientist', 'Data Analyst', 'ML Engineer', 'Data Engineer'],
  design: ['Product Designer', 'UX Designer', 'UX Researcher', 'UI Designer'],
  pm: ['Product Manager', 'Technical PM', 'Program Manager', 'Growth PM'],
  general: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Designer'],
};

/** Full searchable list of CS-relevant titles */
export const ALL_ROLES: string[] = [
  // Software Engineering
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Software Engineer',
  'Principal Software Engineer',
  'Frontend Engineer',
  'Senior Frontend Engineer',
  'Backend Engineer',
  'Senior Backend Engineer',
  'Full-Stack Engineer',
  'Senior Full-Stack Engineer',
  'Mobile Engineer',
  'iOS Engineer',
  'Android Engineer',
  'React Native Engineer',
  'ML Engineer',
  'Senior ML Engineer',
  'Platform Engineer',
  'Infrastructure Engineer',
  'Site Reliability Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Security Engineer',
  'Embedded Systems Engineer',
  'Firmware Engineer',
  'Systems Engineer',
  'QA Engineer',
  'Test Automation Engineer',
  'Performance Engineer',
  'Developer Advocate',
  'Solutions Engineer',
  'Solutions Architect',
  'Engineering Manager',
  'VP of Engineering',
  'CTO',

  // Data Science & Analytics
  'Data Scientist',
  'Senior Data Scientist',
  'Staff Data Scientist',
  'Data Analyst',
  'Senior Data Analyst',
  'Business Analyst',
  'Data Engineer',
  'Senior Data Engineer',
  'Analytics Engineer',
  'Machine Learning Researcher',
  'AI Research Scientist',
  'NLP Engineer',
  'Computer Vision Engineer',
  'Quantitative Analyst',
  'Business Intelligence Analyst',

  // Design
  'Product Designer',
  'Senior Product Designer',
  'UX Designer',
  'Senior UX Designer',
  'UI Designer',
  'UX Researcher',
  'Senior UX Researcher',
  'Interaction Designer',
  'Visual Designer',
  'Design Systems Engineer',
  'Content Designer',
  'Design Manager',
  'Head of Design',

  // Product Management
  'Product Manager',
  'Senior Product Manager',
  'Staff Product Manager',
  'Principal Product Manager',
  'Technical PM',
  'Technical Program Manager',
  'Program Manager',
  'Senior Program Manager',
  'Growth PM',
  'Group Product Manager',
  'Director of Product',
  'VP of Product',

  // General / Cross-functional
  'Technical Writer',
  'Scrum Master',
  'Agile Coach',
  'Chief of Staff',
].sort();

/** Case-insensitive substring search against ALL_ROLES */
export function searchRoles(query: string, limit = 6): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: string[] = [];
  for (const role of ALL_ROLES) {
    if (role.toLowerCase().includes(q)) {
      results.push(role);
      if (results.length >= limit) break;
    }
  }
  return results;
}
