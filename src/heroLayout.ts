// Pure layout maths for the landing screen + first Home section.
// Kept free of React/DOM so it can be unit-checked for any device size.

export const DESIGN_W = 393; // phone-sized design canvas
export const DESIGN_H = 852; // original height of the landing / first section design
export const MAX_PHONE_W = 480; // up to this viewport width the canvas fills the screen; wider = centred 393px canvas
export const DEFAULT_NAV_H = 64;
export const LOWER_CONTENT_END = 3873; // design-space y where the last section ends (unchanged)

/** Single knob: how far the bottom flowers are lifted so they stop being cut by the navbar. */
export const BOTTOM_FLOWER_LIFT = 28;

const MIN_EDGE = 8; // absolute minimum breathing room above/below the stack, in px
const COMFORT_EDGE = 24; // preferred breathing room; the stack tightens until this fits (if possible)

// Measurements of the central stack in the original 393-wide design (design px).
const STACK_TOP = 45; // top of AH logo box
const STACK_BOTTOM = 744; // bottom of the #AfiforHusna line
const TEXT_TOP = 505; // "Walimatul Urus" line
const LOGO_VISIBLE_H = 110; // visible height of the AH monogram
const MAX_GAP_SAVE = 14; // px each of the two logo/frame/text gaps may tighten
const MAX_LOGO_SHRINK = 0.35;
const MAX_TEXT_SHRINK = 0.22;

/** Geometry of the central stack for a compression level p (0 = original design, 1 = tightest). */
export const stackAt = (p: number) => {
  const logoScale = 1 - MAX_LOGO_SHRINK * p;
  const textScale = 1 - MAX_TEXT_SHRINK * p;
  // frame (and its sparkles) moves up as the logo gets smaller and the gap tightens
  const frameY = -(LOGO_VISIBLE_H * (1 - logoScale) + MAX_GAP_SAVE * p);
  // text block follows the frame, with its own tightened gap
  const textY = frameY - MAX_GAP_SAVE * p;
  const height =
    STACK_BOTTOM - STACK_TOP + textY - (STACK_BOTTOM - TEXT_TOP) * (1 - textScale);
  return { logoScale, textScale, frameY, textY, height };
};

export type HeroLayout = {
  canvasW: number; // real px width of the canvas
  scale: number; // canvasW / 393 – only used for the (unchanged) lower sections
  heroH: number; // real px height of the first section (ends right above the navbar)
  closedH: number; // real px height of the canvas before the landing is opened
  totalH: number; // real px height of the canvas once opened
  lowerTop: number; // real px top of the scaled lower-sections layer
  stageTop: number; // real px offset of the central stack inside the hero
  compression: number;
  logoScale: number;
  textScale: number;
  frameY: number;
  textY: number;
  fits: boolean; // false only on extremely short viewports (hero then grows slightly)
};

export const getHeroLayout = (vw: number, vh: number, navH: number): HeroLayout => {
  const canvasW = vw <= MAX_PHONE_W ? vw : DESIGN_W;
  const scale = canvasW / DESIGN_W;
  const available = Math.max(0, vh - navH);

  // smallest compression that lets the stack fit with a little breathing room
  let p = 0;
  for (let i = 0; i < 100 && stackAt(p).height + 2 * COMFORT_EDGE > available; i++) {
    p = Math.min(1, p + 0.01);
  }
  const stack = stackAt(p);
  const minHero = Math.ceil(stackAt(1).height + 2 * MIN_EDGE);
  const heroH = Math.max(available, minHero);
  const fits = available >= minHero;

  // centre the stack between the top of the screen and the navbar
  const stageTop = Math.round((heroH - stack.height) / 2 - STACK_TOP);

  return {
    canvasW,
    scale,
    heroH,
    closedH: Math.max(vh, heroH),
    totalH: heroH + (LOWER_CONTENT_END - DESIGN_H) * scale + navH,
    // design y=852 of the lower layer sits exactly on the hero's bottom edge
    lowerTop: heroH - DESIGN_H * scale,
    stageTop,
    compression: p,
    logoScale: stack.logoScale,
    textScale: stack.textScale,
    frameY: stack.frameY,
    textY: stack.textY,
    fits,
  };
};