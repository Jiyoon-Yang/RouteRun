const BADGE_HEIGHT = 36;
const BADGE_BACKGROUND_COLOR = '#16833e';
const BADGE_TEXT_COLOR = '#FFFFFF';
const BADGE_FONT_SIZE = 16;
const BADGE_HORIZONTAL_PADDING = 16;
const BADGE_CHAR_WIDTH_APPROX = 11;

export function buildRegionClusterIconDataUrl(label: string, count: number): string {
  const text = `${label} ${count}`;
  const width = Math.round(text.length * BADGE_CHAR_WIDTH_APPROX + BADGE_HORIZONTAL_PADDING * 2);
  const height = BADGE_HEIGHT;
  const radius = height / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${BADGE_BACKGROUND_COLOR}"/>
  <text x="${centerX}" y="${centerY}" fill="${BADGE_TEXT_COLOR}" font-size="${BADGE_FONT_SIZE}" font-family="sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>
`.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
