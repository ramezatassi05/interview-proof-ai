'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type FloatingActionMenuOption = {
  label: string;
  onClick: () => void;
  Icon?: React.ReactNode;
};

type FloatingActionMenuProps = {
  userInitial: string;
  options: FloatingActionMenuOption[];
  className?: string;
};

export default function FloatingActionMenu({
  userInitial,
  options,
  className,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer',
          'bg-[var(--header-elevated)] border border-[var(--header-border)] text-[var(--header-text-secondary)]',
          'hover:text-[var(--header-text)] hover:border-[var(--header-text-secondary)]',
          isOpen && 'ring-2 ring-[var(--accent-primary)]/30'
        )}
      >
        <motion.span
          animate={{ scale: isOpen ? 1.1 : 1 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
        >
          {userInitial}
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            role="menu"
            className="absolute right-0 top-full mt-2 min-w-[180px] rounded-xl border border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="flex flex-col py-1">
              {options.map((option, index) => (
                <motion.button
                  key={index}
                  role="menuitem"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15, delay: index * 0.05 }}
                  onClick={() => {
                    option.onClick();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--header-text-secondary)] hover:text-[var(--header-text)] hover:bg-[var(--header-elevated)] transition-colors cursor-pointer text-left w-full"
                >
                  {option.Icon && (
                    <span className="flex h-4 w-4 items-center justify-center shrink-0">
                      {option.Icon}
                    </span>
                  )}
                  <span>{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
