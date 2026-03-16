import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'InterviewProof Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Fetch shared report data via the public API to avoid importing server-only modules in edge runtime
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://interviewproof.ai';
  let score = 0;
  let band = 'Unknown';
  let company = 'Company';
  let role = 'Role';

  try {
    const res = await fetch(`${baseUrl}/api/report/shared/${token}`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.data;
      score = data?.readinessScore ?? 0;
      band = data?.riskBand ?? 'Unknown';
      company = data?.extractedJD?.companyName ?? 'Company';
      role = 'Interview Diagnostic';
    }
  } catch {
    // Fall back to defaults if fetch fails
  }

  const bandColor =
    band === 'Low' ? '#22c55e' : band === 'Medium' ? '#f59e0b' : band === 'High' ? '#ef4444' : '#94a3b8';

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
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: 'white',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            IP
          </div>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>InterviewProof</span>
        </div>

        {/* Score circle */}
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '70px',
            border: `4px solid ${bandColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ fontSize: '56px', fontWeight: 800, color: 'white' }}>{score}</span>
        </div>

        {/* Band badge */}
        <div
          style={{
            padding: '8px 24px',
            borderRadius: '20px',
            backgroundColor: bandColor,
            fontSize: '16px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '20px',
          }}
        >
          {band} Risk
        </div>

        {/* Role + Company */}
        <div
          style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            maxWidth: '600px',
          }}
        >
          {role} {company !== 'Company' ? `at ${company}` : ''}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '32px',
          }}
        >
          Evidence-based interview diagnostic | interviewproof.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
