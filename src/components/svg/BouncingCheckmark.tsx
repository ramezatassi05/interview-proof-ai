'use client';

export function BouncingCheckmark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        .check-circle {
          animation: bounce-check 0.6s ease-out forwards;
        }
        .check-path {
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: draw-check 0.4s 0.3s ease-out forwards;
        }
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      <circle
        className="check-circle"
        cx="24"
        cy="24"
        r="20"
        fill="#2ec4b6"
        opacity="0.15"
      />
      <circle
        className="check-circle"
        cx="24"
        cy="24"
        r="16"
        fill="#2ec4b6"
        opacity="0.25"
      />
      <path
        className="check-path"
        d="M16 24L22 30L34 18"
        stroke="#2ec4b6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
