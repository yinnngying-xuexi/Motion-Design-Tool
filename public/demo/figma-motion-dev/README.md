# Figma Motion Delivery

## Files

- `index.html`: transparent-background animation component.
- `assets/`: local image layers required by the component.

Keep `index.html` and `assets/` in the same folder. The HTML references assets with relative paths and has no external Figma URLs.

## Motion

- Duration: 2 seconds.
- Light layer: moves from left to right once with `cubic-bezier(0.42, 0, 0.58, 1)`.
- Node `17`: rotates from 0 to 360 degrees once with linear easing.
- Reduced-motion preference: animation is disabled.

## Integration

Use the markup inside `.figma-motion-component` and its styles in the target page, or embed `index.html` in an iframe sized `410px` by `40px`. The component background is transparent.
