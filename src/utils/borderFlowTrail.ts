export interface BorderFlowTrailSegment {
  id: number;
  offset: number;
  opacity: number;
  widthFactor: number;
  isHead: boolean;
}

export const BORDER_FLOW_DASH_LENGTH = 1.75;
export const BORDER_FLOW_DASH_GAP = 100 - BORDER_FLOW_DASH_LENGTH;

const segmentCount = 24;
const segmentStep = 1.15;
const headWidth = 3.45;
const tailWidth = 0.52;

export const borderFlowTrailSegments: BorderFlowTrailSegment[] = Array.from(
  { length: segmentCount },
  (_, index) => {
    const progress = index / (segmentCount - 1);
    const remaining = 1 - progress;

    return {
      id: index,
      offset: Number((BORDER_FLOW_DASH_LENGTH + index * segmentStep).toFixed(3)),
      opacity: Number(Math.pow(remaining, 1.35).toFixed(3)),
      widthFactor: Number((tailWidth + (headWidth - tailWidth) * Math.pow(remaining, 1.08)).toFixed(3)),
      isHead: index === 0
    };
  }
);
