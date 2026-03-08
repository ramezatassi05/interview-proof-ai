import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 36,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <span
          style={{
            fontSize: 108,
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
