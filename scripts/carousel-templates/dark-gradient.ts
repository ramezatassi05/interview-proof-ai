/**
 * Dark Gradient TikTok Carousel Template
 *
 * Renders slide HTML with dark backgrounds, gradient accents,
 * bold typography, and subtle grain/glow effects.
 */

export type SlideType = 'hook' | 'content' | 'cta';

interface SlideOptions {
  text: string;
  type: SlideType;
  slideNumber: number;
  totalSlides: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatText(text: string): string {
  // Bold text wrapped in *asterisks*
  let formatted = escapeHtml(text).replace(
    /\*([^*]+)\*/g,
    '<span class="bold-accent">$1</span>'
  );
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

export function renderSlideHtml({ text, type, slideNumber, totalSlides }: SlideOptions): string {
  const formattedText = formatText(text);

  const hookStyles = `
    .slide-text {
      font-size: 60px;
      font-weight: 900;
      line-height: 1.15;
      background: linear-gradient(135deg, #fff 0%, #c084fc 50%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 40px rgba(168, 85, 247, 0.4));
    }
  `;

  const contentStyles = `
    .slide-text {
      font-size: 46px;
      font-weight: 700;
      line-height: 1.35;
      color: #f1f5f9;
    }
    .bold-accent {
      color: #c084fc;
      font-weight: 800;
    }
  `;

  const ctaStyles = `
    .slide-text {
      font-size: 50px;
      font-weight: 800;
      line-height: 1.3;
      color: #f1f5f9;
    }
    .cta-arrow {
      display: block;
      margin-top: 40px;
      font-size: 66px;
      background: linear-gradient(135deg, #c084fc, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.7; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
  `;

  const typeStyles = type === 'hook' ? hookStyles : type === 'cta' ? ctaStyles : contentStyles;

  // Vary gradient accent position per slide for visual variety
  const gradientAngle = 135 + (slideNumber * 30) % 90;
  const accentHue1 = (270 + slideNumber * 25) % 360;
  const accentHue2 = (accentHue1 + 40) % 360;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    }

    .slide {
      position: relative;
      width: 1080px;
      height: 1920px;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      /* TikTok safe zone: top 150px, right 120px, bottom 370px, left 64px */
      padding: 150px 120px 370px 64px;
    }

    /* Gradient orb accent */
    .gradient-orb {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        hsla(${accentHue1}, 70%, 55%, 0.15) 0%,
        hsla(${accentHue2}, 60%, 45%, 0.05) 50%,
        transparent 70%
      );
      filter: blur(80px);
      top: ${type === 'hook' ? '15%' : type === 'cta' ? '40%' : '25%'};
      left: ${type === 'hook' ? '10%' : '30%'};
    }

    .gradient-orb-2 {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        hsla(${accentHue2}, 80%, 60%, 0.1) 0%,
        transparent 60%
      );
      filter: blur(60px);
      bottom: 20%;
      right: 10%;
    }

    /* Subtle grain overlay */
    .grain {
      position: absolute;
      inset: 0;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-size: 256px 256px;
    }

    /* Top accent line */
    .accent-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        hsl(${accentHue1}, 70%, 60%) 30%,
        hsl(${accentHue2}, 70%, 60%) 70%,
        transparent 100%
      );
    }

    .content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 850px;
    }

    ${typeStyles}

    /* Slide counter — positioned above the bottom safe zone */
    .slide-counter {
      position: absolute;
      bottom: 380px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 1;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
    }

    .dot.active {
      background: linear-gradient(135deg, hsl(${accentHue1}, 70%, 60%), hsl(${accentHue2}, 70%, 60%));
      box-shadow: 0 0 10px hsla(${accentHue1}, 70%, 60%, 0.5);
    }

    /* Decorative corner elements */
    .corner-decoration {
      position: absolute;
      width: 120px;
      height: 120px;
      border: 2px solid rgba(255, 255, 255, 0.03);
      z-index: 1;
    }
    .corner-tl { top: 160px; left: 74px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
    .corner-br { bottom: 380px; right: 130px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
  </style>
</head>
<body>
  <div class="slide">
    <div class="gradient-orb"></div>
    <div class="gradient-orb-2"></div>
    <div class="grain"></div>
    <div class="accent-line"></div>
    <div class="corner-decoration corner-tl"></div>
    <div class="corner-decoration corner-br"></div>

    <div class="content">
      <div class="slide-text">
        ${formattedText}
        ${type === 'cta' ? '<span class="cta-arrow">\u2193</span>' : ''}
      </div>
    </div>

    <div class="slide-counter">
      ${Array.from({ length: totalSlides }, (_, i) => `<div class="dot${i + 1 === slideNumber ? ' active' : ''}"></div>`).join('\n      ')}
    </div>
  </div>
</body>
</html>`;
}
