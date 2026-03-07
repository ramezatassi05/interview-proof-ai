#!/usr/bin/env npx tsx
/**
 * TikTok Carousel Generator
 *
 * Generates viral, dark-gradient styled carousel PNGs from a text file.
 *
 * Usage:
 *   npx tsx scripts/tiktok-carousel.ts --input content.txt --output ./carousels
 *
 * Input format — slides separated by `---`:
 *   Your hook headline goes here
 *   ---
 *   First key point or insight
 *   with optional second line
 *   ---
 *   Follow @handle for more tips!
 */

import puppeteer from 'puppeteer';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { renderSlideHtml, type SlideType } from './carousel-templates/dark-gradient';

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(): { input: string; output: string } {
  const args = process.argv.slice(2);
  let input = '';
  let output = './carousels';

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--input' || args[i] === '-i') && args[i + 1]) {
      input = args[++i];
    } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
      output = args[++i];
    }
  }

  if (!input) {
    console.error('Usage: npx tsx scripts/tiktok-carousel.ts --input <file.txt> [--output <dir>]');
    process.exit(1);
  }

  return { input: resolve(input), output: resolve(output) };
}

// ---------------------------------------------------------------------------
// Slide parsing
// ---------------------------------------------------------------------------

function parseSlides(raw: string): { text: string; type: SlideType }[] {
  const parts = raw
    .split(/^---$/m)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    console.error('No slides found. Separate slides with --- on its own line.');
    process.exit(1);
  }

  return parts.map((text, i) => {
    let type: SlideType = 'content';
    if (i === 0) type = 'hook';
    else if (i === parts.length - 1 && parts.length > 1) type = 'cta';
    return { text, type };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { input, output } = parseArgs();

  // Read input file
  const raw = await readFile(input, 'utf-8');
  const slides = parseSlides(raw);
  console.log(`Parsed ${slides.length} slide(s) from ${input}`);

  // Ensure output directory exists
  await mkdir(output, { recursive: true });

  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const html = renderSlideHtml({
      text: slide.text,
      type: slide.type,
      slideNumber: i + 1,
      totalSlides: slides.length,
    });

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pngBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1920 },
    });

    const filename = `slide-${i + 1}.png`;
    await writeFile(join(output, filename), pngBuffer);
    console.log(`  [${i + 1}/${slides.length}] ${filename}  (${slide.type})`);
  }

  await browser.close();
  console.log(`\nDone! ${slides.length} slides saved to ${output}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
