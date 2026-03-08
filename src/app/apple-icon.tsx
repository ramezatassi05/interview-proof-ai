import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#4F46E5',
          borderRadius: 34,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.05em',
            lineHeight: 1,
          }}
        >
          IP
        </span>
      </div>
    ),
    { ...size }
  );
}
