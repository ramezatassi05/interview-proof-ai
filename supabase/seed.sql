-- Seed data for InterviewProof MVP
-- Initial rubric chunks and question archetypes for SWE technical interviews

-- Software Engineering Technical Rubric Chunks
INSERT INTO rubric_chunks (domain, round_type, chunk_text, source_name, metadata) VALUES

-- Data Structures & Algorithms
('swe', 'technical',
'Data Structures Proficiency: Candidates should demonstrate working knowledge of arrays, linked lists, trees (binary, BST, balanced), graphs, hash tables, heaps, and stacks/queues. Expected to choose appropriate data structures based on time/space complexity requirements.',
'internal_rubric', '{"category": "dsa", "priority": "high"}'),

('swe', 'technical',
'Algorithm Design: Ability to analyze problems, identify patterns (two pointers, sliding window, divide and conquer, dynamic programming, BFS/DFS), and implement clean solutions. Should articulate time and space complexity using Big O notation.',
'internal_rubric', '{"category": "dsa", "priority": "high"}'),

-- System Design
('swe', 'technical',
'System Design Fundamentals: For senior roles, candidates should discuss scalability (horizontal vs vertical), load balancing, caching strategies, database choices (SQL vs NoSQL), and common architectural patterns (microservices, event-driven).',
'internal_rubric', '{"category": "system_design", "priority": "high"}'),

('swe', 'technical',
'API Design: Ability to design RESTful APIs with proper HTTP methods, status codes, and resource naming. Understanding of authentication/authorization patterns (OAuth, JWT). Awareness of GraphQL as an alternative.',
'internal_rubric', '{"category": "system_design", "priority": "medium"}'),

-- Coding Quality
('swe', 'technical',
'Code Quality Signals: Clean, readable code with meaningful variable names. Proper error handling. Edge case consideration. Ability to refactor and optimize. Test-driven thinking even if not writing tests.',
'internal_rubric', '{"category": "code_quality", "priority": "high"}'),

('swe', 'technical',
'Problem Solving Process: Clear communication of thought process. Breaking down problems into smaller parts. Asking clarifying questions before coding. Ability to debug and fix issues systematically.',
'internal_rubric', '{"category": "process", "priority": "high"}'),

-- Experience Signals
('swe', 'technical',
'Ownership & Impact: Evidence of owning projects end-to-end. Quantified impact (performance improvements, user growth, cost savings). Experience with production systems at scale.',
'internal_rubric', '{"category": "experience", "priority": "high"}'),

('swe', 'technical',
'Technical Depth: Deep knowledge in at least one area (frontend, backend, infrastructure, ML). Ability to discuss trade-offs and alternatives. Awareness of current best practices in their domain.',
'internal_rubric', '{"category": "experience", "priority": "medium"}');

-- Software Engineering Behavioral Rubric Chunks
INSERT INTO rubric_chunks (domain, round_type, chunk_text, source_name, metadata) VALUES

('swe', 'behavioral',
'Collaboration & Conflict Resolution: Concrete examples of working with cross-functional teams. How they handle disagreements. Evidence of giving and receiving feedback constructively.',
'internal_rubric', '{"category": "teamwork", "priority": "high"}'),

('swe', 'behavioral',
'Leadership & Mentorship: Examples of mentoring junior engineers. Leading technical initiatives. Driving consensus on technical decisions. Does not require management title.',
'internal_rubric', '{"category": "leadership", "priority": "medium"}'),

('swe', 'behavioral',
'Handling Failure: Honest discussion of past failures or mistakes. What they learned. How they prevented recurrence. Growth mindset indicators.',
'internal_rubric', '{"category": "resilience", "priority": "high"}'),

('swe', 'behavioral',
'Ambiguity & Prioritization: Examples of working with unclear requirements. How they prioritize competing demands. Evidence of making progress without perfect information.',
'internal_rubric', '{"category": "autonomy", "priority": "high"}');

-- Question Archetypes for Technical Interviews
INSERT INTO question_archetypes (domain, round_type, question_template, tags) VALUES

-- DSA Questions
('swe', 'technical',
'Given [data structure/constraint], implement a function that [operation]. Optimize for [time/space].',
'["dsa", "coding", "optimization"]'),

('swe', 'technical',
'Design a data structure that supports [operations] in O(1) or O(log n) time.',
'["dsa", "design", "complexity"]'),

('swe', 'technical',
'Walk me through how you would debug [type of issue] in a production system.',
'["debugging", "production", "process"]'),

-- System Design Questions
('swe', 'technical',
'Design a system like [well-known product]. Focus on [specific aspect: scale, reliability, latency].',
'["system_design", "architecture", "scalability"]'),

('swe', 'technical',
'How would you design the API for [feature]? What considerations would you make?',
'["api_design", "rest", "architecture"]'),

-- Experience Questions
('swe', 'technical',
'Tell me about a technically challenging project. What made it difficult and how did you solve it?',
'["experience", "depth", "problem_solving"]'),

('swe', 'technical',
'What''s a technical decision you made that you''d do differently now? Why?',
'["experience", "growth", "reflection"]');

-- Question Archetypes for Behavioral Interviews
INSERT INTO question_archetypes (domain, round_type, question_template, tags) VALUES

('swe', 'behavioral',
'Tell me about a time you had a conflict with a colleague. How did you resolve it?',
'["conflict", "teamwork", "communication"]'),

('swe', 'behavioral',
'Describe a project that failed or didn''t meet expectations. What happened and what did you learn?',
'["failure", "learning", "resilience"]'),

('swe', 'behavioral',
'Give an example of when you had to make a decision without complete information.',
'["ambiguity", "decision_making", "autonomy"]'),

('swe', 'behavioral',
'Tell me about a time you disagreed with your manager or team lead. What did you do?',
'["conflict", "leadership", "communication"]'),

('swe', 'behavioral',
'Describe how you''ve mentored or helped a teammate grow.',
'["mentorship", "leadership", "teamwork"]');
