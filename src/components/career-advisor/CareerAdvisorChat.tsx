'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { CareerAdvisorMessage, UserResume } from '@/types';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { PulsatingButton } from '@/components/ui/pulsating-button';
import { BlurFade } from '@/components/ui/blur-fade';
import { StarterPrompts } from './StarterPrompts';

interface CareerAdvisorChatProps {
  resume: UserResume;
}

export function CareerAdvisorChat({ resume }: CareerAdvisorChatProps) {
  const [messages, setMessages] = useState<CareerAdvisorMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: CareerAdvisorMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setError(null);
      setIsLoading(true);

      try {
        const result = await api.sendCareerAdvisorMessage({
          message: userMessage.content,
          conversationHistory: messages,
        });

        const assistantMessage: CareerAdvisorMessage = {
          role: 'assistant',
          content: result.data.response,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get response. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleStarterSelect = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 min-h-0">
        {messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-full max-w-lg">
              <StarterPrompts resume={resume} onSelect={handleStarterSelect} />
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <BlurFade key={i} delay={0.05}>
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%]`}>
                    {/* Avatar */}
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`rounded-xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose-sm whitespace-pre-wrap break-words leading-relaxed [&_strong]:font-semibold [&_a]:text-[var(--accent-primary)] [&_a]:underline">
                          {msg.content}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                    </div>

                    {/* User avatar */}
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)]">
                        {resume.parsedData.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                </div>
              </BlurFade>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <BlurFade delay={0.05}>
                <div className="flex justify-start">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 py-3">
                      <TypingAnimation
                        className="text-sm text-[var(--text-muted)]"
                        duration={50}
                        startOnView={false}
                        showCursor={true}
                      >
                        Thinking...
                      </TypingAnimation>
                    </div>
                  </div>
                </div>
              </BlurFade>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center">
            <p className="rounded-lg bg-[var(--color-danger-muted)] px-4 py-2 text-xs text-[var(--color-danger)]">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your career, skills to learn, or roadmaps..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] disabled:opacity-50"
          />
          <PulsatingButton
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            pulseColor="var(--accent-primary)"
            className="h-10 w-10 shrink-0 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </PulsatingButton>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[var(--text-muted)]">
          Shift+Enter for new line · Career advice powered by Claude
        </p>
      </div>
    </div>
  );
}
