import { borderFlowTrailSegments } from "@/utils/borderFlowTrail";

/** Shared circular-plane trail: project its parent to an ellipse, never rotate the perspective artwork. */
export function circularOrbitTrail(radius: number, lineWidth: number, length: number, halo = false): string {
  const dash = length / borderFlowTrailSegments.length * 1.55;
  const maxOffset = borderFlowTrailSegments[borderFlowTrailSegments.length - 1].offset;
  return borderFlowTrailSegments.map(segment => {
    const width = lineWidth * segment.widthFactor / 3.45 + (halo ? lineWidth * 1.5 : 0);
    return `<circle cx="0" cy="0" r="${radius}" pathLength="100" stroke-dasharray="${dash.toFixed(3)} ${(100 - dash).toFixed(3)}" stroke-dashoffset="${(segment.offset / maxOffset * length).toFixed(3)}" stroke-width="${width.toFixed(3)}" opacity="${segment.opacity}"/>`;
  }).join("");
}
