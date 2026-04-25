'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  CodeIcon,
  ServerStackIcon,
  AiCloudIcon,
  SecurityIcon,
  Settings01Icon,
  Target01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

/* ─── Inline company logo SVGs ─── */

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AmazonLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M13.96 14.37c-1.8 1.33-4.41 2.04-6.66 2.04-3.15 0-5.99-1.17-8.14-3.1-.17-.15-.02-.36.18-.24 2.32 1.35 5.18 2.16 8.14 2.16 1.99 0 4.19-.41 6.21-1.27.3-.13.56.2.27.41z"
        fill="#FF9900"
      />
      <path
        d="M14.74 13.47c-.23-.29-1.5-.14-2.07-.07-.17.02-.2-.13-.04-.24 1.02-.71 2.68-.51 2.87-.27.2.25-.05 1.97-.99 2.79-.15.13-.28.06-.22-.1.21-.53.68-1.82.45-2.11z"
        fill="#FF9900"
      />
      <path
        d="M12.73 8.56V7.7c0-.13.1-.22.22-.22h3.87c.12 0 .22.09.22.22v.74c0 .12-.11.28-.29.53l-2.01 2.87c.75-.02 1.54.09 2.21.47.15.09.19.21.2.34v.92c0 .12-.14.27-.28.19a4.47 4.47 0 0 0-4.09.01c-.13.07-.27-.08-.27-.2v-.87c0-.14 0-.37.14-.58l2.33-3.34h-2.03c-.12 0-.22-.09-.22-.22z"
        fill="#232F3E"
      />
      <path
        d="M4.97 13.24h-1.18c-.11-.01-.2-.1-.21-.2V7.71c0-.12.1-.22.23-.22h1.1c.12.01.21.1.22.21v.72h.02c.29-.72.85-1.05 1.59-1.05.75 0 1.23.33 1.57 1.05.29-.72.96-1.05 1.66-1.05.5 0 1.05.21 1.39.68.37.52.3 1.28.3 1.95l-.01 2.99c0 .12-.1.22-.23.22H10.25c-.12-.01-.21-.1-.21-.22V9.66c0-.26.02-.91-.03-1.15-.09-.4-.35-.52-.69-.52-.28 0-.58.19-.7.5-.12.3-.11.81-.11 1.17v2.33c0 .12-.1.22-.23.22H7.11c-.12-.01-.21-.1-.21-.22V9.66c0-.69.11-1.7-.72-1.7-.84 0-.81.99-.81 1.7v2.33c0 .12-.1.22-.23.22z"
        fill="#232F3E"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function NetflixLogo() {
  return (
    <svg width="14" height="18" viewBox="0 0 111 300" fill="none">
      <path
        d="M0 0h30.57l49.6 136.72L130.63 0H111v295.68c-9.5-2.5-20-4.45-30.57-5.9L30.57 148.07V289.2c-10.1-1.12-20.42-1.77-30.57-2.1V0z"
        fill="#E50914"
        transform="scale(0.85) translate(5, 0)"
      />
    </svg>
  );
}

function SpotifyLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.99-.12-1.11-.6-.12-.48.12-.99.6-1.11 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.21 1.17zm.12-3.36C15.24 8.4 8.88 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" />
    </svg>
  );
}

function MetaLogo() {
  return (
    <svg width="20" height="16" viewBox="0 0 36 24" fill="none">
      <path
        d="M7.56 2.4C9 .6 10.56 0 11.76 0c1.68 0 2.88 1.08 4.2 3.12.96-1.56 2.16-3.12 4.08-3.12 2.52 0 5.28 2.88 5.28 8.16 0 3.84-1.56 7.68-3.96 10.56-1.2 1.44-2.64 2.28-3.84 2.28-1.2 0-2.04-.6-3.36-2.4L12 15.36l-2.16 3.24c-1.32 1.8-2.16 2.4-3.36 2.4-1.2 0-2.64-.84-3.84-2.28C.24 15.84-1.32 12 .96 8.16.96 5.28 3.72 2.4 6.24 2.4c.48 0 .96.12 1.32.24V2.4zM5.04 8.4c-1.08 1.56-1.68 3.72-1.68 5.76 0 1.68.6 2.64 1.2 2.64.48 0 .96-.36 1.68-1.44l2.88-4.32c-.96-1.68-1.8-2.64-2.76-2.64-.48 0-.96.36-1.32 0zm12.72 6.96c.72 1.08 1.2 1.44 1.68 1.44.6 0 1.2-.96 1.2-2.64 0-2.04-.6-4.2-1.68-5.76-.36-.36-.84-.72-1.32-.72-.96 0-1.8.96-2.76 2.64l2.88 4.32z"
        fill="#0081FB"
        transform="translate(5, 1)"
      />
    </svg>
  );
}

/* ─── Data model ─── */

type GridCell =
  | { type: 'ghost' }
  | { type: 'icon'; icon: IconSvgElement }
  | { type: 'company'; logo: ReactNode; bg: string };

const g: GridCell = { type: 'ghost' };

/* Left grid — interview category icons (3 cols × 8 rows = 24 cells) */
const LEFT_GRID: GridCell[] = [
  g,
  { type: 'icon', icon: CodeIcon },
  g,
  g,
  g,
  g,
  g,
  g,
  { type: 'icon', icon: ServerStackIcon },
  g,
  g,
  g,
  g,
  { type: 'icon', icon: Target01Icon },
  g,
  g,
  g,
  g,
  g,
  g,
  { type: 'icon', icon: SecurityIcon },
  g,
  { type: 'icon', icon: AiCloudIcon },
  g,
  g,
  g,
  g,
  g,
  { type: 'icon', icon: Settings01Icon },
  g,
];

/* Right grid — company logos (3 cols × 10 rows = 30 cells) */
const RIGHT_GRID: GridCell[] = [
  g,
  g,
  { type: 'company', logo: <GoogleLogo />, bg: '#ffffff' },
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  { type: 'company', logo: <AmazonLogo />, bg: '#ffffff' },
  g,
  g,
  g,
  g,
  { type: 'company', logo: <AppleLogo />, bg: '#f5f5f5' },
  g,
  g,
  g,
  g,
  g,
  g,
  g,
  { type: 'company', logo: <NetflixLogo />, bg: '#000000' },
  g,
  g,
  g,
  { type: 'company', logo: <MetaLogo />, bg: '#ffffff' },
  g,
  g,
  g,
  g,
  g,
  { type: 'company', logo: <SpotifyLogo />, bg: '#191414' },
  g,
];

/* ─── Animation variants ─── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const circleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

/* ─── Components ─── */

function GridCircle({ cell }: { cell: GridCell }) {
  if (cell.type === 'ghost') {
    return <motion.div variants={circleVariants} className="h-10 w-10 rounded-full bg-gray-200" />;
  }

  if (cell.type === 'icon') {
    return (
      <motion.div
        variants={circleVariants}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
      >
        <HugeiconsIcon icon={cell.icon} size={18} strokeWidth={1.5} className="text-gray-400" />
      </motion.div>
    );
  }

  // company
  return (
    <motion.div
      variants={circleVariants}
      className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
      style={{ backgroundColor: cell.bg }}
    >
      {cell.logo}
    </motion.div>
  );
}

function SideGrid({ cells, side }: { cells: GridCell[]; side: 'left' | 'right' }) {
  const maskImage =
    side === 'left'
      ? 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)'
      : 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-4 p-4"
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      {cells.map((cell, i) => (
        <GridCircle key={i} cell={cell} />
      ))}
    </motion.div>
  );
}

export function FloatingEdgeBubbles() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="pointer-events-none fixed inset-0 z-10 hidden lg:block"
    >
      {/* Left edge — category icons */}
      <div className="absolute bottom-0 left-0 top-0 flex w-[168px] items-center overflow-hidden xl:w-[200px]">
        <SideGrid cells={LEFT_GRID} side="left" />
      </div>

      {/* Right edge — company logos */}
      <div className="absolute bottom-0 right-0 top-0 flex w-[168px] items-center overflow-hidden xl:w-[200px]">
        <SideGrid cells={RIGHT_GRID} side="right" />
      </div>

      {/* Top gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </motion.div>
  );
}
