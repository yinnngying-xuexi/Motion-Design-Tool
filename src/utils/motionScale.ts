export function motionScaleFactor(percent: unknown = 100): number {
  const value = Number(percent);
  return Math.min(1000, Math.max(1, Number.isFinite(value) ? value : 100)) / 100;
}

/** Layout scaling is separate from animation transforms, so rotate/translate keep working. */
export function withMotionScale(markup: string, percent: unknown = 100): string {
  const factor = motionScaleFactor(percent);
  if (factor === 1) return markup;
  return `<div data-dm-scale="${factor * 100}" style="display:inline-grid;place-items:center;width:max-content;height:max-content;zoom:${factor}">${markup}</div>`;
}
