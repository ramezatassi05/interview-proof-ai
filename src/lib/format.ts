/**
 * Formats a decimal hour value into "Xh Ym" format.
 * Examples: 3.8 → "3h 48m", 1.0 → "1h", 0.5 → "30m", 2.25 → "2h 15m"
 */
export function formatHoursMinutes(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
