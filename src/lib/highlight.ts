export interface TextSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Find the [start, end] range of a quote within fullText.
 * 3-tier fallback: exact → case-insensitive → normalized whitespace.
 */
export function findQuoteRange(fullText: string, quote: string): [number, number] | null {
  if (!quote || !fullText) return null;

  // Tier 1: exact substring
  const exactIdx = fullText.indexOf(quote);
  if (exactIdx !== -1) return [exactIdx, exactIdx + quote.length];

  // Tier 2: case-insensitive
  const lowerFull = fullText.toLowerCase();
  const lowerQuote = quote.toLowerCase();
  const ciIdx = lowerFull.indexOf(lowerQuote);
  if (ciIdx !== -1) return [ciIdx, ciIdx + quote.length];

  // Tier 3: normalized whitespace (collapse \s+ to single space, case-insensitive)
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const normQuote = normalize(quote);
  if (!normQuote) return null;

  // Build a mapping from normalized positions back to original positions
  const normFull = normalize(fullText);
  const normIdx = normFull.indexOf(normQuote);
  if (normIdx === -1) return null;

  // Map normalized index back to original string position
  let origStart = -1;
  let origEnd = -1;
  let normPos = 0;
  let i = 0;

  // Skip leading whitespace in original to match normalize().trim()
  while (i < fullText.length && /\s/.test(fullText[i])) i++;

  for (; i < fullText.length && normPos <= normIdx + normQuote.length; i++) {
    if (normPos === normIdx && origStart === -1) {
      origStart = i;
    }
    if (normPos === normIdx + normQuote.length) {
      origEnd = i;
      break;
    }
    if (/\s/.test(fullText[i])) {
      // Consume all consecutive whitespace in original, counts as 1 in normalized
      while (i + 1 < fullText.length && /\s/.test(fullText[i + 1])) i++;
      normPos++;
    } else {
      normPos++;
    }
  }
  if (origEnd === -1 && normPos === normIdx + normQuote.length) {
    origEnd = i;
  }

  if (origStart !== -1 && origEnd !== -1) return [origStart, origEnd];
  return null;
}

/**
 * Split text into segments, marking the matching quote as highlighted.
 */
export function splitTextWithHighlight(fullText: string, quote: string): TextSegment[] {
  const range = findQuoteRange(fullText, quote);
  if (!range) return [{ text: fullText, highlighted: false }];

  const [start, end] = range;
  const segments: TextSegment[] = [];
  if (start > 0) segments.push({ text: fullText.slice(0, start), highlighted: false });
  segments.push({ text: fullText.slice(start, end), highlighted: true });
  if (end < fullText.length) segments.push({ text: fullText.slice(end), highlighted: false });
  return segments;
}
