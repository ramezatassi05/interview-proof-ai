import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'InterviewProof - Know What Will Sink You';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {/* Shield logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M16 1C16 1 4 3 4 6v12c0 6 5.5 10.5 12 13 6.5-2.5 12-7 12-13V6c0-3-12-5-12-5z"
              fill="rgba(255,255,255,0.2)"
            />
            <path d="M8 9h3v13H8z" fill="white" />
            <path
              fillRule="evenodd"
              d="M13 9h6.5C22.5 9 24 10.5 24 13s-1.5 4-4.5 4H16v5h-3zM16 11.5h3c1.5 0 2.2.7 2.2 1.5s-.7 1.5-2.2 1.5h-3z"
              fill="white"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          InterviewProof
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Know What Will Sink You
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.55)',
            marginTop: 24,
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          Job-specific interview diagnostics that identify rejection risks and prioritize fixes
        </div>
      </div>
    ),
    { ...size }
  );
}
