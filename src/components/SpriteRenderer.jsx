import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { adjustColor } from '../utils/colorUtils';

const SpriteRenderer = forwardRef(({ 
  charState, 
  animationFrame = 0, 
  direction = 0, 
  bitMode = '16', // '8', '16', '32'
  bgColor = 'transparent', 
  scale = 8,
  className = ""
}, ref) => {
  const localCanvasRef = useRef(null);
  
  useImperativeHandle(ref, () => localCanvasRef.current);

  const CANVAS_SIZE = 48;
  const OFFSET_X = 8;
  const OFFSET_Y = 8;

  useEffect(() => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Keep pixel edges crisp (no smoothing)
    ctx.imageSmoothingEnabled = false;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalAlpha = 1.0;
    
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    const createBuffer = () => {
      const c = document.createElement('canvas');
      c.width = CANVAS_SIZE;
      c.height = CANVAS_SIZE;
      return c;
    };

    // 0:Shadow, 1:Back, 2:Body, 3:Head
    const buffers = [createBuffer(), createBuffer(), createBuffer(), createBuffer()]; 
    const ctxs = buffers.map(b => b.getContext('2d'));
    // Keep pixel edges crisp on all buffers
    ctxs.forEach(c => { c.imageSmoothingEnabled = false; });
    
    let currentLayer = 2; 
    const setLayer = (idx) => { currentLayer = idx; };

    const isEraseColor = (color) => color === 'transparent' || color === 'rgba(0,0,0,0)';

    const drawPixel = (x, y, color) => {
      const c = ctxs[currentLayer];
      if (isEraseColor(color)) {
        c.clearRect(x + OFFSET_X, y + OFFSET_Y, 1, 1);
        return;
      }
      c.fillStyle = color;
      c.fillRect(x + OFFSET_X, y + OFFSET_Y, 1, 1);
    };

    const drawRect = (x, y, w, h, color) => {
      const c = ctxs[currentLayer];
      if (isEraseColor(color)) {
        c.clearRect(x + OFFSET_X, y + OFFSET_Y, w, h);
        return;
      }
      c.fillStyle = color;
      c.fillRect(x + OFFSET_X, y + OFFSET_Y, w, h);
    };

    // 中級テクニック: ディザリング（網掛け）描画ヘルパー
    const drawDitherPattern = (ctx, x, y, w, h, color) => {
        ctx.fillStyle = color;
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                if (((x + dx) + (y + dy)) % 2 === 0) {
                    ctx.fillRect(x + dx + OFFSET_X, y + dy + OFFSET_Y, 1, 1);
                }
            }
        }
    };

    const drawShadedRect = (x, y, w, h, baseColor, isMetal = false) => {
      const c = ctxs[currentLayer];
      
      if (bitMode === '8') {
        c.fillStyle = baseColor;
        c.fillRect(x + OFFSET_X, y + OFFSET_Y, w, h);
        return;
      }
      
      if (bitMode === '32') {
        const gradient = c.createLinearGradient(
          x + OFFSET_X, 
          y + OFFSET_Y, 
          x + OFFSET_X + w, 
          y + OFFSET_Y + h
        );
        
        if (isMetal) {
          gradient.addColorStop(0, adjustColor(baseColor, 90)); 
          gradient.addColorStop(0.4, baseColor);
          gradient.addColorStop(0.6, adjustColor(baseColor, -40)); 
          gradient.addColorStop(1, adjustColor(baseColor, -80));
        } else {
          gradient.addColorStop(0, adjustColor(baseColor, 20));
          gradient.addColorStop(1, adjustColor(baseColor, -30));
        }
        
        c.fillStyle = gradient;
        c.fillRect(x + OFFSET_X, y + OFFSET_Y, w, h);
        return;
      }

      // 16-BIT
// Use fixed ramps to avoid "muddy" gradients and keep a crisp pixel-art look.
const ramp = isMetal
  ? makeRamp(baseColor, { shadow: -70, mid: -28, light: 34, highlight: 70 })
  : makeRamp(baseColor, { shadow: -40, mid: -16, light: 24, highlight: 48 });

const dark = ramp[0];
const light = ramp[3];
      
      drawRect(x, y, w, h, baseColor); 
      drawRect(x, y, w, 1, light); 
      drawRect(x, y, 1, h, light); 

      if (w > 2 && h > 2) {
          drawDitherPattern(c, x + w - 1, y, 1, h, dark);
          drawDitherPattern(c, x, y + h - 1, w, 1, dark);
      } else {
          drawRect(x + w - 1, y, 1, h, dark);
          drawRect(x, y + h - 1, w, 1, dark); 
      }
      
      if (isMetal && w > 2 && h > 2) {
          drawPixel(x + 1, y + 1, '#ffffff'); 
      } else {
          drawPixel(x + w - 1, y, baseColor); 
          drawPixel(x, y + h - 1, baseColor);
      }
    };

    // 中級テクニック: アンチエイリアス（AA）付きブロック描画
    const drawAntiAliasedBlock = (x, y, w, h, color) => {
        // Core fill that keeps corners open (pixel-rounded)
        drawRect(x + 1, y, w - 2, h, color);
        drawRect(x, y + 1, 1, h - 2, color);
        drawRect(x + w - 1, y + 1, 1, h - 2, color);

        // Only 32-bit gets soft AA corners (16-bit stays crisp)
        if (bitMode === '32') {
            const ctx = ctxs[currentLayer];
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = color;

            ctx.fillRect(x + OFFSET_X, y + OFFSET_Y, 1, 1);
            ctx.fillRect((x + w - 1) + OFFSET_X, y + OFFSET_Y, 1, 1);
            ctx.fillRect(x + OFFSET_X, (y + h - 1) + OFFSET_Y, 1, 1);
            ctx.fillRect((x + w - 1) + OFFSET_X, (y + h - 1) + OFFSET_Y, 1, 1);

            ctx.globalAlpha = 1.0;
        }
    };

    // === Route A: soften boxy torso/hips/legs (keep current asset logic) ===
    const drawRoundedBlock = (x, y, w, h, color) => {
      // Pixel-rounded rectangle (no outer outline). Works across 8/16/32.
      drawRect(x, y, w, h, color);
      // shave corners (top-left/top-right/bottom-left/bottom-right)
      drawPixel(x, y, 'rgba(0,0,0,0)');
      drawPixel(x + w - 1, y, 'rgba(0,0,0,0)');
      drawPixel(x, y + h - 1, 'rgba(0,0,0,0)');
      drawPixel(x + w - 1, y + h - 1, 'rgba(0,0,0,0)');
    };

    const drawSoftTorso = (x, y, w, h, color) => {
      // Use existing rounded helper for a less-rectangular silhouette
      // (AntiAliasedBlock keeps corners open; 32-bit gets subtle AA)
      drawAntiAliasedBlock(x, y, w, h, color);
      // Tiny shoulder taper: remove 1px at the very top corners to avoid a flat bar
      if (w >= 8 && h >= 4) {
        drawPixel(x + 1, y, 'rgba(0,0,0,0)');
        drawPixel(x + w - 2, y, 'rgba(0,0,0,0)');
      }
      // Subtle inner shading to break flatness (skip in 8-bit)
      if (bitMode !== '8') {
        drawRect(x + 2, y + h - 1, w - 4, 1, adjustColor(color, -18));
        drawPixel(x + 2, y + 1, adjustColor(color, 16));
      }
    };

    const drawSoftHips = (x, y, w, h, color) => {
      // Rounded hips block; slightly heavier bottom to imply volume
      drawAntiAliasedBlock(x, y, w, h, color);
      // Add 1px "bulge" on lower corners (inside) to avoid straight walls
      if (w >= 8 && h >= 4) {
        drawPixel(x + 1, y + h - 2, color);
        drawPixel(x + w - 2, y + h - 2, color);
      }
      if (bitMode !== '8') {
        drawRect(x + 2, y + h - 1, w - 4, 1, adjustColor(color, -22));
      }
    };

    const drawRoundedLeg = (x, y, color) => {
      // Keep 3x4 footprint for compatibility with shoes logic, but round the top.
      drawRect(x, y, 3, 4, color);
      drawPixel(x, y, 'rgba(0,0,0,0)');
      drawPixel(x + 2, y, 'rgba(0,0,0,0)');
      // Add a tiny highlight on the upper middle and a soft shadow at the bottom
      if (bitMode !== '8') {
        drawPixel(x + 1, y, adjustColor(color, 18));
        drawRect(x, y + 3, 3, 1, adjustColor(color, -18));
      }
    };

    const { 
      baseType,
      faceShape,
      skinColor, hairStyle, hairColor, eyeStyle, eyeColor,
      chestStyle, chestColor, waistStyle, waistColor, 
      legColor, shoeStyle, shoeColor, 
      accessory, eyeAccessory, earAccessory,
      horns, hornColor, wings, wingColor, tail, tailColor, hasFangs, hasClaws,
      weapon, shield, helmet, helmetColor, weaponColor, shieldColor
    } = charState;

    const actualSkinColor = skinColor === '#fsc' ? '#ffdbac' : skinColor;

// === Route A: fixed 4-step ramps (more "pixel-art / FF-like" than continuous shading) ===
// Order: [shadow, mid, base, light]
const makeRamp = (base, { shadow = -38, mid = -16, light = 26, highlight = 44 } = {}) => {
  return [
    adjustColor(base, shadow),
    adjustColor(base, mid),
    base,
    adjustColor(base, light),
    // optional highlight: adjustColor(base, highlight)
  ];
};

const skinRamp = makeRamp(actualSkinColor, { shadow: -34, mid: -14, light: 22, highlight: 42 });
const hairRamp = makeRamp(hairColor,      { shadow: -42, mid: -18, light: 28, highlight: 52 });

// Keep legacy names used across the file, but now derived from ramps (quantized look)
const cSkinShadow = skinRamp[0];
const cSkinLight  = skinRamp[3];
const cHairShadow = hairRamp[0];
const cHairLight  = hairRamp[3];

const cGold = '#f1c40f';
const cSilver = '#95a5a6';
const cWood = '#8d5524';
    
    if (direction === 2) {
      ctxs.forEach(c => {
        c.translate(CANVAS_SIZE, 0);
        c.scale(-1, 1);
      });
    }

    const drawMode = direction === 2 ? 1 : direction; 

    let yOffset = animationFrame === 1 ? 1 : 0;
    let walkOffset = animationFrame === 1 ? 1 : -1; 
    let tailOffset = animationFrame === 1 ? 1 : 0; 
    let itemBob = animationFrame === 1 ? 1 : 0; 

    // --- Eye symmetry helpers ---
    // Character drawing area is 32px wide (x: 0..31). Mirroring around the vertical center means:
    // mirroredX = 31 - x
    const MIRROR_X = 31;
    const mirrorX = (x) => (MIRROR_X - x);

    // For paired eyes (front view): guarantee perfect mirror placement + render right eye with `flip=true`.
    const drawEyePairFront = (leftOx, oy, style, color) => {
      // drawEyeUnit base widths by style:
      // - Normal/Small/Narrow/Cat => 3px-wide base (ox-1 .. ox+1)
      // - Big                     => 4px-wide base (ox-1 .. ox+2)
      // For perfect symmetry around the 32px character center, Big (even width) must use a different mirror anchor.
      // We also ensure at least a 1px skin gap so the two scleras never "merge" visually.

      const s = Math.max(0, Math.min(4, (style ?? 0) | 0));

      // Default (odd-width eye bases): mirror anchor about x=15.5 => mirroredOx = 31 - ox
      let left = leftOx;
      let right = mirrorX(left);

      if (s === 1) {
        // Big (4px base):
        // - shift the left anchor 1px outward (to prevent merged sclera)
        // - mirror using an anchor compensation so centers remain equidistant from the face center
        //   (for 4px width, the eye center is at ox + 0.5)
        left = leftOx - 1;
        right = mirrorX(left) - 1;
      }

      drawEyeUnit(left,  oy, s, color, false, false);
      drawEyeUnit(right, oy, s, color, false, true);
    };

    // --- Route B foundation: skeleton anchors (32x32 character space) ---
    // All anchors are defined in the 32px character coordinate system (x: 0..31, y: 0..31).
    // These anchors are intended to be the single source of truth for part placement.
    // NOTE: "Center" anchors use pixel centers conceptually; we still store integer pixels.

    const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, v | 0));

    const getAnchors = ({ drawMode, headY, chestY, waistY, legY, handY, walkOffset }) => {
      // Base (humanoid) head placement in current renderer
      const headTopLeft = (drawMode === 1)
        ? { x: 11, y: headY }   // side
        : { x: 10, y: headY };  // front/back

      // Current eye Y is consistently headY + 5 for humanoids
      const eyeY = headY + 5;

      // Eye anchor definition
      // Front: we define the LEFT eye center (ox) as the canonical anchor.
      // Right eye is always derived by perfect mirroring in drawEyePairFront.
      const eye = (drawMode === 1)
        ? {
            // side view draws a single eye at ox=11 today
            center: { x: 11, y: eyeY },
            leftCenter: { x: 11, y: eyeY },
            rightCenter: null,
            // legacy compat
            leftOx: 11,
            rightOx: null,
            y: eyeY
          }
        : {
            // front/back: canonical left eye center
            center: { x: 16, y: eyeY },
            leftCenter: { x: 13, y: eyeY },
            rightCenter: { x: mirrorX(13), y: eyeY },
            // legacy compat
            leftOx: 13,
            rightOx: mirrorX(13),
            y: eyeY
          };

      // Torso / pelvis anchors (top-left of the main block)
      const torso = (drawMode === 1)
        ? { topLeft: { x: 13, y: chestY }, center: { x: 16, y: chestY + 2 } }
        : { topLeft: { x: 11, y: chestY }, center: { x: 16, y: chestY + 2 } };

      const pelvis = (drawMode === 1)
        ? { topLeft: { x: 13, y: waistY }, center: { x: 16, y: waistY + 2 } }
        : { topLeft: { x: 11, y: waistY }, center: { x: 16, y: waistY + 2 } };

      // Legs (top-left). Side view uses walkOffset to separate legs.
      const legs = (drawMode === 1)
        ? {
            leftTopLeft: { x: 13 - walkOffset, y: legY },
            rightTopLeft: { x: 15 + walkOffset, y: legY }
          }
        : {
            leftTopLeft: { x: 12, y: legY },
            rightTopLeft: { x: 17, y: legY }
          };

      // Hands (top-left). Side view uses one hand block only.
      const hands = (drawMode === 1)
        ? {
            frontTopLeft: { x: 13 + walkOffset, y: handY },
            leftTopLeft: null,
            rightTopLeft: null
          }
        : {
            frontTopLeft: null,
            leftTopLeft: { x: 8, y: handY },
            rightTopLeft: { x: 22, y: handY }
          };

      // Final clamping for safety (prevents accidental out-of-bounds placements)
      const clampPt = (p) => (p ? ({ x: clampInt(p.x, 0, 31), y: clampInt(p.y, 0, 31) }) : p);

      return {
        headAnchor: {
          topLeft: clampPt(headTopLeft),
          center: clampPt({ x: (headTopLeft.x + (drawMode === 1 ? 4 : 6)), y: headTopLeft.y + 5 })
        },
        eyeAnchor: {
          center: clampPt(eye.center),
          leftCenter: clampPt(eye.leftCenter),
          rightCenter: clampPt(eye.rightCenter),
          // legacy compat for current calls
          leftOx: eye.leftOx,
          rightOx: eye.rightOx,
          y: eye.y
        },
        torsoAnchor: {
          topLeft: clampPt(torso.topLeft),
          center: clampPt(torso.center)
        },
        pelvisAnchor: {
          topLeft: clampPt(pelvis.topLeft),
          center: clampPt(pelvis.center)
        },
        legAnchor: {
          L: clampPt(legs.leftTopLeft),
          R: clampPt(legs.rightTopLeft)
        },
        handAnchor: {
          L: clampPt(hands.leftTopLeft),
          R: clampPt(hands.rightTopLeft),
          Front: clampPt(hands.frontTopLeft)
        }
      };
    };

    // === Route B: part-stamping foundation (drawPart) + starter assets (face / eyes) ===
    // Goal: stop hand-placing pixels in many places. Instead, define small bitmap assets and stamp them
    // relative to anchors with guaranteed mirroring.

    // Feature flag: keep OFF until we migrate each part safely.
    const USE_PART_ASSETS = true;

    // Asset format:
    // - w/h: size in pixels
    // - px: array of strings (length=h), each string length=w
    // - '.' means transparent
    // - other chars map to colors via a palette object (e.g., { F: skin, f: shadow, h: highlight })
    const PART_ASSETS = {
      // Face (FRONT) assets are intended to be stamped at headAnchor.topLeft for front/back.
      // These are deliberately conservative silhouettes (no outer outlines).
      faceFront: {
        // Normal: 12x10 (matches current front head: fillHead(10, headY, 12, 10, ...))
        normal: {
          w: 12,
          h: 10,
          px: [
            ".FFFFFFFFFF.",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            ".FFFFFFFFFF.",
          ],
        },
        // Round: 12x10 with extra rounding (shaved corners + slightly tucked sides)
        round: {
          w: 12,
          h: 10,
          px: [
            "..FFFFFFFF..",
            ".FFFFFFFFFF.",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            ".FFFFFFFFFF.",
            "..FFFFFFFF..",
          ],
        },
        // Square: 12x10 full block
        square: {
          w: 12,
          h: 10,
          px: [
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
            "FFFFFFFFFFFF",
          ],
        },
        // Long: 10x12 (matches current long front head: fillHead(11, headY-1, 10, 12, ...))
        long: {
          w: 10,
          h: 12,
          px: [
            ".FFFFFFFF.",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            "FFFFFFFFFF",
            ".FFFFFFFF.",
          ],
        },
      },

      // Face (SIDE) assets are intended to be stamped at headAnchor.topLeft for side.
      faceSide: {
        // Normal: 8x10 (matches current side head: fillHead(11, headY, 8, 10, ...))
        normal: {
          w: 8,
          h: 10,
          px: [
            ".FFFFFF.",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            ".FFFFFF.",
          ],
        },
        // Round: 8x10 with extra rounding
        round: {
          w: 8,
          h: 10,
          px: [
            "..FFFF..",
            ".FFFFFF.",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            ".FFFFFF.",
            "..FFFF..",
          ],
        },
        // Square: 8x10 block
        square: {
          w: 8,
          h: 10,
          px: [
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
            "FFFFFFFF",
          ],
        },
        // Long: 7x12 (matches current side long: fillHead(11, headY-1, 7, 12, ...))
        long: {
          w: 7,
          h: 12,
          px: [
            ".FFFFF.",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            "FFFFFFF",
            ".FFFFF.",
          ],
        },
      },

      // Eyes are stamped in local coordinates around an eye anchor.
      // Convention: eye assets are defined with their own top-left and stamped at (x,y).
      // We keep 5 styles only: normal, big, small, narrow, cat.
      // Palette keys:
      //  S: sclera, s: sclera shade
      //  I: iris mid/base, i: iris dark/shadow, l: iris light
      //  P: pupil, H: spec highlight
      eye: {
        // Normal: 3x3 sclera + 2x2 iris
        normal: {
          w: 3,
          h: 3,
          px: [
            "SSS",
            "SII",
            "sss",
          ],
        },
        // Big: 4x4 sclera + 2x3 iris
        big: {
          w: 4,
          h: 4,
          px: [
            "SSSS",
            "SIII",
            "SIII",
            "ssss",
          ],
        },
        // Small: 3x3 sclera + 1px iris
        small: {
          w: 3,
          h: 3,
          px: [
            "SSS",
            "SIS",
            "sss",
          ],
        },
        // Narrow: 3x2 sclera + 2px iris line
        narrow: {
          w: 3,
          h: 2,
          px: [
            "SSS",
            "sII",
          ],
        },
        // Cat: 3x3 sclera + iris + slit pupil
        cat: {
          w: 3,
          h: 3,
          px: [
            "SSS",
            "SIP",
            "sss",
          ],
        },
      },
    };

    // drawPart: stamp a bitmap asset into the current layer.
    // - x,y: destination top-left in character coords
    // - flipX: mirrors the asset within its own width (perfect left/right reuse)
    // - palette: char->color map; '.' or missing key => transparent
    const drawPart = (asset, x, y, { flipX = false, palette = {}, erase = false } = {}) => {
      if (!asset || !asset.px || !asset.w || !asset.h) return;
      const w = asset.w | 0;
      const h = asset.h | 0;

      for (let ay = 0; ay < h; ay++) {
        const row = asset.px[ay] || "";
        for (let ax = 0; ax < w; ax++) {
          const sx = flipX ? (w - 1 - ax) : ax;
          const ch = row[sx] || '.';

          if (ch === '.' || palette[ch] === undefined || palette[ch] === null) {
            if (erase) {
              // true erase (clearRect) rather than rgba(0,0,0,0)
              const c = ctxs[currentLayer];
              c.clearRect((x + ax) + OFFSET_X, (y + ay) + OFFSET_Y, 1, 1);
            }
            continue;
          }

          drawPixel(x + ax, y + ay, palette[ch]);
        }
      }
    };

    // Helpers to select face assets by shape + view.
    const getFaceAsset = (faceShapeClamped, drawMode) => {
      // 0 Normal / 1 Round / 2 Square / 3 Long
      const key = (faceShapeClamped === 1)
        ? 'round'
        : (faceShapeClamped === 2)
          ? 'square'
          : (faceShapeClamped === 3)
            ? 'long'
            : 'normal';

      if (drawMode === 1) return PART_ASSETS.faceSide[key];
      return PART_ASSETS.faceFront[key];
    };

    const getEyeAssetKey = (style) => {
      const s = Math.max(0, Math.min(4, (style ?? 0) | 0));
      if (s === 0) return 'normal';
      if (s === 1) return 'big';
      if (s === 2) return 'small';
      if (s === 3) return 'narrow';
      return 'cat';
    };

    let slimeHeadY = 4 + yOffset; 
    if (baseType === 1) { 
       yOffset = 0; 
       slimeHeadY = 18 + (animationFrame === 0 ? 0 : 1);
    } else if (baseType === 3) { 
       yOffset = animationFrame === 1 ? 1 : -1;
       walkOffset = 0;
    }

    let wingOffset = yOffset; 

    // Shared vertical baselines for humanoids (used by both body + head)
// Must be in the main renderer scope (NOT inside the humanoid body-only block)
const chestY = 14 + yOffset;
const waistY = 19 + yOffset;
const legY   = 24 + yOffset;
const handY  = 19 + yOffset;

    const activeHeadY = (baseType === 1) ? slimeHeadY : (4 + yOffset);
    const headY = 4 + yOffset;
    const baseHandY = 19; 

    // ゴーストのみ接地影を描画
    const drawGroundShadow = () => {
        if (baseType !== 3) return;

        setLayer(0); 
        const ctx = ctxs[0];
        const shadowColor = 'rgba(0, 0, 0, 0.2)';
        
        const shadowY = 34; 
        const shadowW = 10; 
        const shadowX = 11;

        ctx.globalAlpha = 0.5;
        drawRect(shadowX + 1, shadowY, shadowW - 2, 1, shadowColor);
        drawRect(shadowX + 2, shadowY + 1, shadowW - 4, 1, shadowColor);
        ctx.globalAlpha = 1.0;
    };

    const drawShoeOnLeg = (legX, legY, legW, legH) => {
        if (shoeStyle === 0) return; 
        if (baseType === 2 || baseType === 3 || baseType === 1) return; 
        
        const shoeH = shoeStyle === 2 ? 3 : 2; 
        const shoeY = legY + legH - shoeH;
        if (bitMode !== '8' && shoeH > 1) {
             drawRect(legX, shoeY, legW, shoeH, shoeColor);
             if (bitMode === '16') {
                 drawDitherPattern(ctxs[currentLayer], legX, shoeY + shoeH -1, legW, 1, adjustColor(shoeColor, -40));
             } else {
                 drawRect(legX, shoeY + shoeH -1, legW, 1, adjustColor(shoeColor, -40)); 
             }
        } else {
             drawRect(legX, shoeY, legW, shoeH, shoeColor);
        }
    };

    const getHandColor = () => hasClaws ? hornColor : actualSkinColor; 
    const getHandLen = () => hasClaws ? 3 : 2;

    const drawWeapon = (x, y, isSideView) => {
        if (weapon === 0) return;
        const wc = weaponColor;
        const handleC = cWood;
        const isMetal = true; 

        if (weapon === 1) { // Sword
            drawShadedRect(x, y - 8, 2, 8, wc, isMetal); drawRect(x - 2, y, 6, 1, cGold); drawRect(x, y + 1, 2, 2, handleC); 
        } else if (weapon === 2) { // Staff
            drawRect(x, y - 8, 2, 12, handleC); drawRect(x - 1, y - 10, 4, 3, cGold); drawPixel(x + 1, y - 9, '#e74c3c'); 
        } else if (weapon === 3) { // Bow
            drawRect(x + 1, y - 6, 1, 12, cWood); drawPixel(x, y - 5, cWood); drawPixel(x, y + 5, cWood); drawPixel(x - 1, y - 4, cWood); drawPixel(x - 1, y + 4, cWood); drawRect(x - 1, y - 3, 1, 6, '#fff'); 
        } else if (weapon === 4) { // Spear
            drawRect(x, y - 10, 1, 14, handleC); drawShadedRect(x - 1, y - 13, 3, 3, wc, isMetal); drawPixel(x, y - 14, wc);
        } else if (weapon === 5) { // Axe
            drawRect(x, y - 6, 2, 10, handleC); drawShadedRect(x + 2, y - 7, 3, 6, wc, isMetal); drawShadedRect(x - 3, y - 7, 3, 6, wc, isMetal); 
        } else if (weapon === 6) { // Dagger
            drawShadedRect(x, y - 3, 2, 3, wc, isMetal); drawRect(x - 1, y, 4, 1, cGold); drawRect(x, y + 1, 2, 1, handleC); 
        }
    };

    const drawShield = (x, y) => {
        if (shield === 0) return;
        const sc = shieldColor; 
        const trim = cGold;
        const isMetal = true;

        if (shield === 1) { // Buckler
            drawShadedRect(x - 1, y - 2, 6, 6, sc, isMetal); drawPixel(x + 1, y + 1, trim);
        } else if (shield === 2) { // Kite
            drawShadedRect(x - 2, y - 2, 8, 5, sc, isMetal); drawRect(x - 1, y + 3, 6, 2, sc); drawRect(x, y + 5, 4, 2, sc); drawRect(x - 2, y - 2, 8, 1, trim); drawPixel(x + 2, y + 2, trim); 
        } else if (shield === 3) { // Tower
            drawShadedRect(x - 3, y - 4, 10, 12, sc, isMetal); drawRect(x - 2, y - 3, 8, 10, adjustColor(sc, -20));
        }
    };

    const drawWings = (isBackLayer) => {
      if (wings === 0) return;
      const wc = wingColor;
      setLayer(isBackLayer ? 1 : 3); 
      const sY = baseType === 1 ? 16 : 0;
      const wy = 14 + wingOffset + sY; // Front/Back 用の基本Y座標 (背中の位置)

      // 左右対称描画ヘルパー
      const drawSymmetricWing = (drawFn) => {
          // Left
          drawFn(false);
          // Right
          drawFn(true);
      };

      if (drawMode === 0 || drawMode === 3) { // Front or Back
        if (drawMode === 0 && !isBackLayer) return;
        if (drawMode === 3 && isBackLayer) return;

        if (wings === 1) { // Bat
             // Shape: 🦇
             drawSymmetricWing((isRight) => {
                 if (!isRight) {
                     drawRect(4, wy-3, 7, 1, wc); // Top bone
                     drawPixel(3, wy-2, wc); drawPixel(2, wy-1, wc); // Tip
                     drawRect(3, wy, 2, 4, wc); // Outer
                     drawRect(5, wy-2, 5, 5, wc); // Inner
                     drawPixel(5, wy+3, wc); drawPixel(7, wy+3, wc); drawPixel(9, wy+3, wc); // Bottom points
                 } else {
                     drawRect(21, wy-3, 7, 1, wc);
                     drawPixel(28, wy-2, wc); drawPixel(29, wy-1, wc);
                     drawRect(27, wy, 2, 4, wc);
                     drawRect(22, wy-2, 5, 5, wc);
                     drawPixel(26, wy+3, wc); drawPixel(24, wy+3, wc); drawPixel(22, wy+3, wc);
                 }
             });
        } 
        else if (wings === 2) { // Angel (High Quality)
             // Shape: 🪽 大きく広がる神々しい翼
             const featherC = '#ecf0f1';
             const shadowC = '#bdc3c7';
             
             drawSymmetricWing((isRight) => {
                 const xOff = isRight ? 16 : 0;
                 if (!isRight) {
                     // Left Wing
                     drawRect(2, wy-6, 12, 2, featherC); // Top Arch
                     drawRect(0, wy-4, 4, 6, featherC); // Outer Tip
                     drawRect(4, wy-4, 8, 10, featherC); // Main Body
                     drawRect(6, wy+6, 6, 3, featherC); // Bottom
                     
                     // Feathers details
                     drawPixel(0, wy+2, shadowC); 
                     drawPixel(1, wy+4, shadowC); 
                     drawPixel(3, wy+6, shadowC);
                 } else {
                     // Right Wing
                     drawRect(18, wy-6, 12, 2, featherC);
                     drawRect(28, wy-4, 4, 6, featherC);
                     drawRect(20, wy-4, 8, 10, featherC);
                     drawRect(20, wy+6, 6, 3, featherC);
                     
                     drawPixel(31, wy+2, shadowC);
                     drawPixel(30, wy+4, shadowC);
                     drawPixel(28, wy+6, shadowC);
                 }
             });
        }
        else if (wings === 3) { // Fairy
             // Shape: 🧚
             const glassC = 'rgba(162, 155, 254, 0.6)';
             drawSymmetricWing((isRight) => {
                 if (!isRight) {
                     drawRect(4, wy-5, 6, 5, glassC); // Top
                     drawRect(5, wy, 4, 3, glassC); // Bottom
                     drawPixel(3, wy-4, glassC);
                 } else {
                     drawRect(22, wy-5, 6, 5, glassC);
                     drawRect(23, wy, 4, 3, glassC);
                     drawPixel(28, wy-4, glassC);
                 }
             });
        }
        else if (wings === 4) { // Dragon (High Quality) - ver2
            // ver2 goals:
            // - less boxy: angled finger bones (pixel lines), curved membranes (clustered fills)
            // - more depth: bone highlights + membrane 3-tone + optional shaded blocks (16/32)
            // - real torn edge: use clearRect to punch holes (rgba(0,0,0,0) does not erase)

            const OUT = adjustColor(wc, -75);
            const BONE_DK = adjustColor(wc, -55);
            const BONE_MD = adjustColor(wc, -30);
            const BONE_LT = adjustColor(wc, 25);

            const MEM_DK = adjustColor(wc, -65);
            const MEM_MD = adjustColor(wc, -35);
            const MEM_LT = adjustColor(wc, 5);
            const SPEC   = adjustColor(wc, 40);

            const CLAW = '#ffffff';
            const CANVAS_W = 32;

            // --- mirrored helpers (32px character area) ---
            const px = (isRight, x) => (isRight ? (CANVAS_W - 1 - x) : x);
            const rectM = (isRight, x, y, w, h, c) => {
              if (!isRight) return drawRect(x, y, w, h, c);
              return drawRect(px(isRight, x + w - 1), y, w, h, c);
            };
            const pixM = (isRight, x, y, c) => drawPixel(px(isRight, x), y, c);
            const shadeM = (isRight, x, y, w, h, c, isMetal=false) => {
              // Use shaded blocks in 16/32 for depth; fallback to flat in 8-bit
              if (!isRight) return drawShadedRect(x, y, w, h, c, isMetal);
              return drawShadedRect(px(isRight, x + w - 1), y, w, h, c, isMetal);
            };
            const eraseM = (isRight, x, y, w=1, h=1) => {
              const c = ctxs[currentLayer];
              const ex = px(isRight, x);
              c.clearRect(ex + OFFSET_X, y + OFFSET_Y, w, h);
            };

            // Bresenham line (1px)
            const lineM = (isRight, x0, y0, x1, y1, c) => {
              let x = x0, y = y0;
              const dx = Math.abs(x1 - x0);
              const dy = Math.abs(y1 - y0);
              const sx = x0 < x1 ? 1 : -1;
              const sy = y0 < y1 ? 1 : -1;
              let err = dx - dy;
              while (true) {
                pixM(isRight, x, y, c);
                if (x === x1 && y === y1) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 <  dx) { err += dx; y += sy; }
              }
            };
            const thickLineM = (isRight, x0, y0, x1, y1, c) => {
              // 2px thickness by drawing a parallel line
              lineM(isRight, x0, y0, x1, y1, c);
              lineM(isRight, x0, y0 + 1, x1, y1 + 1, c);
            };

            // Draw one wing (left/right)
            drawSymmetricWing((isRight) => {
              // ---- Shoulder joint (depth anchor) ----
              rectM(isRight, 4, wy - 10, 4, 4, BONE_DK);
              rectM(isRight, 5, wy - 9,  2, 2, BONE_MD);
              pixM(isRight, 6, wy - 9, BONE_LT);

              // ---- Top claw + ridge ----
              pixM(isRight, 3, wy - 12, CLAW);
              pixM(isRight, 4, wy - 12, CLAW);
              pixM(isRight, 3, wy - 11, CLAW);

              thickLineM(isRight, 4, wy - 11, 18, wy - 9, OUT);     // outer ridge
              lineM(isRight,      5, wy - 10, 17, wy - 9, BONE_DK); // inner bone
              lineM(isRight,      6, wy - 10, 16, wy - 9, BONE_MD);
              pixM(isRight, 16, wy - 10, BONE_LT);

              // ---- Leading edge bone (slight diagonal) ----
              thickLineM(isRight, 4, wy - 9, 6, wy + 7, OUT);
              lineM(isRight,      5, wy - 8, 6, wy + 6, BONE_DK);
              // highlight along the leading edge
              pixM(isRight, 6, wy - 6, BONE_LT);
              pixM(isRight, 6, wy - 3, BONE_LT);
              pixM(isRight, 6, wy + 1, BONE_LT);

              // ---- Finger bones (angled ribs) ----
              // Rib tips (adds silhouette)
              const tip1 = { x: 11, y: wy + 4 };
              const tip2 = { x: 16, y: wy + 6 };
              const tip3 = { x: 21, y: wy + 7 };

              // Rib 1
              thickLineM(isRight, 7, wy - 7, tip1.x, tip1.y, OUT);
              lineM(isRight,      8, wy - 6, tip1.x, tip1.y - 1, BONE_DK);
              pixM(isRight, tip1.x, tip1.y - 1, BONE_LT);

              // Rib 2
              thickLineM(isRight, 10, wy - 6, tip2.x, tip2.y, OUT);
              lineM(isRight,      11, wy - 5, tip2.x, tip2.y - 1, BONE_DK);
              pixM(isRight, tip2.x, tip2.y - 1, BONE_LT);

              // Rib 3
              thickLineM(isRight, 13, wy - 5, tip3.x, tip3.y, OUT);
              lineM(isRight,      14, wy - 4, tip3.x, tip3.y - 1, BONE_DK);
              pixM(isRight, tip3.x, tip3.y - 1, BONE_LT);

              // small spikes near rib 3
              pixM(isRight, 20, wy - 8, OUT);
              pixM(isRight, 20, wy - 7, BONE_LT);

              // ---- Membranes (curved clusters, 3-tone) ----
              // We build curved lobes with decreasing widths to avoid boxy look.
              // Lobe A: between leading edge and rib1
              shadeM(isRight, 6,  wy - 5, 4, 3, MEM_MD, false);
              shadeM(isRight, 6,  wy - 2, 5, 3, MEM_MD, false);
              shadeM(isRight, 7,  wy + 1, 4, 3, MEM_MD, false);
              rectM(isRight, 6,  wy + 3, 4, 2, MEM_DK);
              rectM(isRight, 7,  wy - 4, 2, 2, MEM_LT);

              // Lobe B: between rib1 and rib2
              shadeM(isRight, 10, wy - 4, 5, 3, MEM_MD, false);
              shadeM(isRight, 10, wy - 1, 6, 3, MEM_MD, false);
              shadeM(isRight, 11, wy + 2, 5, 3, MEM_MD, false);
              rectM(isRight, 10, wy + 4, 5, 2, MEM_DK);
              rectM(isRight, 12, wy - 3, 2, 2, MEM_LT);

              // Lobe C: between rib2 and rib3 (largest)
              shadeM(isRight, 15, wy - 3, 6, 3, MEM_MD, false);
              shadeM(isRight, 15, wy,     7, 3, MEM_MD, false);
              shadeM(isRight, 16, wy + 3, 6, 3, MEM_MD, false);
              rectM(isRight, 15, wy + 5, 6, 2, MEM_DK);
              rectM(isRight, 17, wy - 2, 2, 2, MEM_LT);

              // ---- Specular/glow accents (non-8bit) ----
              if (bitMode !== '8') {
                pixM(isRight, 12, wy + 0, SPEC);
                pixM(isRight, 16, wy + 1, SPEC);
                pixM(isRight, 18, wy + 2, SPEC);
                // subtle membrane texture dots
                pixM(isRight, 9,  wy + 2, adjustColor(MEM_MD, -20));
                pixM(isRight, 14, wy + 3, adjustColor(MEM_MD, -20));
                pixM(isRight, 19, wy + 4, adjustColor(MEM_MD, -20));
              }

              // ---- Outer contour (manual, jagged) ----
              // Top/back contour
              lineM(isRight, 4, wy - 11, 18, wy - 9, OUT);
              // Trailing edge contour down to tips
              lineM(isRight, 18, wy - 9, tip3.x, tip3.y, OUT);
              // Bottom contour back to body
              lineM(isRight, tip3.x, tip3.y, 7, wy + 8, OUT);
              lineM(isRight, 7, wy + 8, 4, wy - 9, OUT);

              // torn edge pixels (extra jag)
              pixM(isRight, 12, wy + 9, OUT);
              pixM(isRight, 15, wy + 10, OUT);
              pixM(isRight, 18, wy + 9, OUT);
              pixM(isRight, 21, wy + 8, OUT);

              // Real holes / nicks (clear pixels)
              if (bitMode !== '8') {
                eraseM(isRight, 14, wy + 6, 1, 1);
                eraseM(isRight, 19, wy + 5, 1, 1);
                eraseM(isRight, 11, wy + 4, 1, 1);
              }

              // depth cue near trailing edge
              pixM(isRight, 22, wy + 2, adjustColor(wc, -80));
            });
        }
        else if (wings === 5) { // Butterfly (High Quality)
             // Shape: 🦋 上下に分かれた大きな羽
             const patternC = adjustColor(wc, -20);
             drawSymmetricWing((isRight) => {
                 if (!isRight) {
                     // Upper Wing
                     drawRect(2, wy-8, 10, 8, wc); 
                     drawPixel(1, wy-6, patternC);
                     // Lower Wing
                     drawRect(4, wy+1, 8, 6, patternC); 
                     drawPixel(5, wy+3, wc);
                 } else {
                     drawRect(20, wy-8, 10, 8, wc);
                     drawPixel(30, wy-6, patternC);
                     drawRect(20, wy+1, 8, 6, patternC);
                     drawPixel(26, wy+3, wc);
                 }
             });
        }
        else if (wings === 6) { // Demon (New)
             // Shape: 😈 鋭角的で禍々しい翼
             const darkC = adjustColor(wc, -40);
             drawSymmetricWing((isRight) => {
                 if (!isRight) {
                     drawRect(4, wy-7, 8, 2, wc); // Bone
                     drawRect(2, wy-5, 2, 6, wc); // Outer Tip
                     drawRect(4, wy-5, 8, 8, darkC); // Membrane
                     drawPixel(2, wy-8, wc); // Spike
                     drawPixel(4, wy+3, wc); // Jagged bottom
                     drawPixel(7, wy+4, wc);
                     drawPixel(10, wy+3, wc);
                 } else {
                     drawRect(20, wy-7, 8, 2, wc);
                     drawRect(28, wy-5, 2, 6, wc);
                     drawRect(20, wy-5, 8, 8, darkC);
                     drawPixel(29, wy-8, wc);
                     drawPixel(27, wy+3, wc);
                     drawPixel(24, wy+4, wc);
                     drawPixel(21, wy+3, wc);
                 }
             });
        }
      } 
      else if (drawMode === 1) { // Side
        if (isBackLayer) return; 
        
        // ★修正: Side viewの座標計算を `wy` 基準（背中中心）からの相対値に変更
        // `wy` はすでに 14 + ... なので、Y=14 付近が中心になるように調整
        
        const finalOffX = -4; 
        const finalOffY = 2;

        if (wings === 1) { // Bat
             // Y=14付近に合わせるため、`wy` を基準にする
             drawRect(22 + finalOffX, wy + finalOffY, 4, 1, wc); 
             drawRect(25 + finalOffX, wy + 1 + finalOffY, 3, 1, wc); 
             drawRect(27 + finalOffX, wy + 2 + finalOffY, 2, 2, wc); 
             drawPixel(24 + finalOffX, wy + 1 + finalOffY, wc); 
             drawPixel(26 + finalOffX, wy + 3 + finalOffY, wc);
        } else if (wings === 2) { // Angel (HQ)
             drawRect(20 + finalOffX, wy - 2 + finalOffY, 6, 4, '#ecf0f1'); // Main
             drawRect(24 + finalOffX, wy - 4 + finalOffY, 4, 3, '#ecf0f1'); // Top
             drawRect(22 + finalOffX, wy + 2 + finalOffY, 4, 3, '#ecf0f1'); // Bottom
             drawPixel(26 + finalOffX, wy - 1 + finalOffY, '#bdc3c7'); 
        } else if (wings === 3) { // Fairy
             drawRect(22 + finalOffX, wy - 1 + finalOffY, 3, 4, 'rgba(162, 155, 254, 0.6)');
             drawRect(25 + finalOffX, wy - 2 + finalOffY, 2, 2, 'rgba(162, 155, 254, 0.6)');
        } else if (wings === 4) { // Dragon (HQ) - ver2
             const OUT = adjustColor(wc, -75);
             const MEM = adjustColor(wc, -35);
             const BONE = adjustColor(wc, -45);

             // Bone ridge + claw
             drawRect(21 + finalOffX, wy - 5 + finalOffY, 8, 2, OUT);
             drawRect(22 + finalOffX, wy - 4 + finalOffY, 6, 1, BONE);
             drawPixel(28 + finalOffX, wy - 6 + finalOffY, '#fff');

             // Membrane (shaded when possible)
             if (bitMode === '8') {
               drawRect(22 + finalOffX, wy - 2 + finalOffY, 6, 7, MEM);
               drawRect(23 + finalOffX, wy + 4 + finalOffY, 5, 1, adjustColor(MEM, -25));
             } else {
               drawShadedRect(22 + finalOffX, wy - 2 + finalOffY, 6, 7, MEM, false);
               drawRect(23 + finalOffX, wy + 4 + finalOffY, 5, 1, adjustColor(MEM, -30));
             }

             // Outline + torn edge
             drawRect(22 + finalOffX, wy + 5 + finalOffY, 6, 1, OUT);
             drawPixel(23 + finalOffX, wy + 6 + finalOffY, OUT);
             drawPixel(26 + finalOffX, wy + 7 + finalOffY, OUT);
        } else if (wings === 5) { // Butterfly (HQ)
              drawRect(22 + finalOffX, wy - 4 + finalOffY, 6, 5, wc); 
              drawRect(23 + finalOffX, wy + 1 + finalOffY, 4, 4, adjustColor(wc, -20)); 
              drawPixel(26 + finalOffX, wy - 2 + finalOffY, '#fff');
        } else if (wings === 6) { // Demon (New)
           const darkC = adjustColor(wc, -40);
           drawRect(21 + finalOffX, wy - 3 + finalOffY, 7, 2, wc); // Bone
           drawRect(22 + finalOffX, wy - 1 + finalOffY, 6, 6, darkC); // Membrane
           drawPixel(28 + finalOffX, wy - 4 + finalOffY, wc); // Spike
           drawPixel(26 + finalOffX, wy + 5 + finalOffY, wc); // Tail
        }
      }
    };

    const drawTail = (isBackLayer) => {
      if (tail === 0 && baseType !== 5) return; 
      const useTail = (baseType === 5 && tail === 0) ? 3 : tail; 
      if (useTail === 0) return;

      const tc = (baseType === 5) ? actualSkinColor : tailColor;
      setLayer(isBackLayer ? 1 : 3); 
      const sY = baseType === 1 ? 16 : 0;

      if (drawMode === 0) { 
        if (!isBackLayer) return;
        if (useTail === 1) { drawRect(21, 22 + tailOffset + sY, 4, 1, tc); drawRect(24, 20 + tailOffset + sY, 1, 2, tc); drawRect(23, 19 + tailOffset + sY, 3, 2, tc); } 
        else if (useTail === 2) { drawRect(20, 23 + tailOffset + sY, 6, 3, tc); } 
        else if (useTail === 3) { drawRect(20, 24 + sY, 8, 2, tc); }
        else if (useTail === 4) { drawRect(20, 20 + sY, 8, 4, tc); drawRect(22, 18 + sY, 6, 2, tc); drawRect(24, 16 + sY, 4, 2, '#fff'); } 
        else if (useTail === 5) { drawRect(22, 22 + sY + tailOffset, 2, 2, tc); drawRect(23, 20 + sY + tailOffset, 2, 2, tc); drawRect(24, 18 + sY + tailOffset, 2, 4, tc); } 
      }
      else if (drawMode === 1) { 
        if (!isBackLayer) return;
        if (useTail === 1) { 
            drawRect(18, 22 + tailOffset + sY, 3, 1, tc); 
            drawRect(20, 19 + tailOffset + sY, 2, 3, tc); 
            drawPixel(21, 18 + tailOffset + sY, tc); 
        } 
        else if (useTail === 2) { drawRect(17, 23 + tailOffset + sY, 5, 2, tc); drawRect(18, 22 + tailOffset + sY, 3, 1, tc); } 
        else if (useTail === 3) { drawRect(16, 22 + sY, 2, 2, tc); drawRect(18, 23 + sY, 2, 2, tc); drawRect(20, 24 + sY, 4, 2, tc); }
        else if (useTail === 4) { drawRect(17, 20 + sY + tailOffset, 5, 3, tc); drawRect(20, 18 + sY + tailOffset, 3, 2, '#fff'); }
        else if (useTail === 5) { drawRect(18, 22 + sY + tailOffset, 2, 2, tc); drawRect(19, 20 + sY + tailOffset, 2, 3, tc); }
      }
      else if (drawMode === 3) { 
        if (isBackLayer) return;
        if (useTail === 1) { drawRect(16, 22 + tailOffset + sY, 6, 1, tc); drawRect(21, 19 + tailOffset + sY, 2, 3, tc); } 
        else if (useTail === 2) { drawRect(15, 23 + tailOffset + sY, 2, 6, tc); } 
        else if (useTail === 3) { drawRect(15, 24 + sY, 2, 6, tc); }
        else if (useTail === 4) { drawRect(14, 20 + sY, 8, 4, tc); drawRect(16, 18 + sY, 6, 2, tc); drawRect(18, 16 + sY, 4, 2, '#fff'); }
        else if (useTail === 5) { drawRect(15, 22 + sY + tailOffset, 2, 2, tc); drawRect(16, 20 + sY + tailOffset, 2, 2, tc); drawRect(17, 18 + sY + tailOffset, 2, 4, tc); }
      }
    };

    const drawHorns = () => {
      if (horns === 0 && baseType !== 7) return; 
      const useHorns = (baseType === 7 && horns === 0) ? 4 : horns; 
      if (useHorns === 0) return;

      setLayer(3); 
      const hc = hornColor;
      const hY = activeHeadY; 
      const dh = (x,y,w,h,c) => drawRect(x,y,w,h,c);
      const sX = (baseType === 1 && drawMode === 1) ? 4 : 0; 
      const sY = (baseType === 1) ? -4 : 0; 

      if (drawMode === 0 || drawMode === 3) { 
        if (useHorns === 1) { dh(11, hY - 2 + sY, 2, 2, hc); dh(19, hY - 2 + sY, 2, 2, hc); } 
        else if (useHorns === 2) { dh(9, hY - 2 + sY, 3, 2, hc); dh(20, hY - 2 + sY, 3, 2, hc); dh(8, hY - 4 + sY, 1, 3, hc); dh(23, hY - 4 + sY, 1, 3, hc); } 
        else if (useHorns === 3) { dh(15, hY - 6 + sY, 2, 6, hc); } 
        else if (useHorns === 4) { dh(10, hY - 4 + sY, 2, 4, hc); dh(20, hY - 4 + sY, 2, 4, hc); dh(11, hY - 5 + sY, 4, 2, hc); dh(17, hY - 5 + sY, 4, 2, hc); }
        else if (useHorns === 5) { dh(8, hY + 1 + sY, 2, 3, hc); dh(22, hY + 1 + sY, 2, 3, hc); dh(7, hY + 2 + sY, 1, 2, hc); dh(24, hY + 2 + sY, 1, 2, hc); dh(8, hY + 4 + sY, 3, 1, hc); dh(21, hY + 4 + sY, 3, 1, hc); }
        else if (useHorns === 6) { dh(10, hY - 6 + sY, 2, 6, hc); dh(20, hY - 6 + sY, 2, 6, hc); dh(8, hY - 4 + sY, 2, 2, hc); dh(22, hY - 4 + sY, 2, 2, hc); dh(12, hY - 5 + sY, 1, 2, hc); dh(19, hY - 5 + sY, 1, 2, hc); }
      } else if (drawMode === 1) { 
         if (useHorns === 1) { dh(12+sX, hY - 2 + sY, 2, 2, hc); } 
         else if (useHorns === 2) { dh(11+sX, hY - 2 + sY, 3, 2, hc); dh(10+sX, hY - 4 + sY, 1, 3, hc); } 
         else if (useHorns === 3) { dh(11+sX, hY - 6 + sY, 2, 6, hc); } 
         else if (useHorns === 4) { dh(11+sX, hY - 4 + sY, 3, 4, hc); dh(12+sX, hY - 5 + sY, 4, 2, hc); }
         else if (useHorns === 5) { dh(10+sX, hY + 1 + sY, 3, 3, hc); dh(9+sX, hY + 3 + sY, 2, 2, hc); }
         else if (useHorns === 6) { dh(11+sX, hY - 6 + sY, 2, 6, hc); dh(10+sX, hY - 4 + sY, 1, 2, hc); }
      }
    };

    const drawEyeAccessory = (hY) => {
        if (eyeAccessory === 0 || drawMode === 3) return; 
        setLayer(3);
        
        let eyeY = hY + 5;
        if(baseType === 1) eyeY = hY + 4; 

        const color = '#333'; 
        const glassColor = 'rgba(100, 200, 255, 0.5)';
        const sOff = baseType === 1 ? 4 : 0;
        const sY = baseType === 1 && drawMode === 1 ? 4 : 0; 

        if (drawMode === 0) { 
            if (eyeAccessory === 1) { 
                drawRect(11+sOff, eyeY, 4, 3, glassColor); drawRect(11+sOff, eyeY, 4, 1, color); 
                drawRect(17-sOff, eyeY, 4, 3, glassColor); drawRect(17-sOff, eyeY, 4, 1, color); 
                drawRect(15, eyeY + 1, 2, 1, color); 
            } else if (eyeAccessory === 2) { 
                drawRect(11+sOff, eyeY, 4, 3, '#000'); drawRect(17-sOff, eyeY, 4, 3, '#000');
                drawRect(15, eyeY + 1, 2, 1, '#000');
            } else if (eyeAccessory === 3) { 
                drawRect(17-sOff, eyeY, 4, 3, glassColor);
                drawRect(17-sOff, eyeY, 4, 1, cGold); drawRect(17-sOff, eyeY+2, 4, 1, cGold); drawRect(17-sOff, eyeY, 1, 3, cGold); drawRect(20-sOff, eyeY, 1, 3, cGold);
            } else if (eyeAccessory === 4) { 
                drawRect(11+sOff, eyeY, 4, 2, 'rgba(255, 50, 50, 0.6)');
                drawRect(10+sOff, eyeY, 1, 4, '#555'); drawRect(9+sOff, hY + 3, 1, 4, '#555'); 
            } else if (eyeAccessory === 5) { 
                drawRect(17-sOff, eyeY, 4, 2, '#333');
                drawRect(18-sOff, eyeY, 2, 1, '#000');
                drawPixel(16-sOff, eyeY+1, '#333');
                drawRect(11+sOff, eyeY, 4, 1, 'rgba(0,0,0,0.3)'); 
            }
        } else if (drawMode === 1) { 
            const eyeX = 11 + sY;
            if (eyeAccessory === 1) { 
                drawRect(eyeX, eyeY, 3, 3, glassColor); drawRect(eyeX, eyeY, 3, 1, color);
                drawRect(eyeX - 1, eyeY, 1, 1, color); 
            } else if (eyeAccessory === 2) {
                drawRect(eyeX, eyeY, 3, 3, '#000'); drawRect(eyeX - 1, eyeY, 1, 1, '#000');
            } else if (eyeAccessory === 4) {
                drawRect(eyeX, eyeY, 3, 2, 'rgba(255, 50, 50, 0.6)');
                drawRect(10+sY, hY + 4, 2, 2, '#555');
            } else if (eyeAccessory === 5) { 
                drawRect(eyeX, eyeY, 3, 2, '#333');
                drawRect(eyeX-1, eyeY, 1, 1, '#333');
            }
        }
    };

    const drawEarAccessory = (hY) => {
        if (earAccessory === 0 || drawMode === 3 || baseType === 1 || baseType === 2) return;
        setLayer(3);
        
        let c = cGold;
        if (earAccessory === 2) c = cSilver;
        if (earAccessory === 3) c = '#e74c3c';
        if (earAccessory === 4) c = '#3498db';

        if (helmet === 1 || helmet === 2 || helmet === 4) return;

        if (drawMode === 0) {
            drawPixel(9, hY + 7, c);
            drawPixel(22, hY + 7, c);
        } else if (drawMode === 1) {
            drawPixel(10, hY + 7, c);
        }
    };
    
    const drawHeadAccessory = (hY) => {
        if (accessory === 0) return;
        setLayer(3);
        
        const sY = baseType === 1 ? -4 : 0; 
        const sX = (baseType === 1 && drawMode === 1) ? 4 : 0; 

        if (drawMode !== 3) { 
          if (accessory === 1) { 
            if (drawMode === 0) { drawPixel(11, hY - 3 + sY, hairColor); drawPixel(10, hY - 2 + sY, hairColor); drawPixel(20, hY - 3 + sY, hairColor); drawPixel(21, hY - 2 + sY, hairColor); } 
            else { drawPixel(12+sX, hY - 3 + sY, hairColor); drawPixel(11+sX, hY - 2 + sY, hairColor); } 
          } else if (accessory === 2) { 
             if (drawMode === 0) { drawRect(11, hY - 4 + sY, 10, 2, '#f1c40f'); drawPixel(11, hY - 5 + sY, '#f1c40f'); drawPixel(15, hY - 5 + sY, '#f1c40f'); drawPixel(20, hY - 5 + sY, '#f1c40f'); } 
             else { drawRect(11+sX, hY - 4 + sY, 8, 2, '#f1c40f'); drawPixel(11+sX, hY - 5 + sY, '#f1c40f'); drawPixel(14+sX, hY - 5 + sY, '#f1c40f'); } 
          }
        } else { 
             if (accessory === 1) { drawPixel(11, hY - 3 + sY, hairColor); drawPixel(10, hY - 2 + sY, hairColor); drawPixel(20, hY - 3 + sY, hairColor); drawPixel(21, hY - 2 + sY, hairColor); }
             else if (accessory === 2) { drawRect(11, hY - 4 + sY, 10, 2, '#f1c40f'); drawPixel(11, hY - 5 + sY, '#f1c40f'); drawPixel(15, hY - 5 + sY, '#f1c40f'); drawPixel(20, hY - 5 + sY, '#f1c40f'); } 
        }
    };

    const drawHands = (isFrontLayer) => {
        setLayer(isFrontLayer ? 3 : 1);
        const hColor = getHandColor();
        const hLen = getHandLen();
        if (baseType === 1) return; 

        if (drawMode === 0 || drawMode === 3) { 
            if (!isFrontLayer) return; 
            drawRect(8, handY, 2, hLen, hColor); 
            drawRect(22, handY, 2, hLen, hColor);
        } else if (drawMode === 1) { 
            if (isFrontLayer) {
                drawRect(13 + walkOffset, handY, 3, hLen, hColor);
            }
        }
    };

    const drawEyeUnit = (ox, oy, style, color, isSide, flip = false) => {
        // Palette helpers (match "eye parts" reference: soft lash, wider sclera, iris depth)

        // Route B note:
        // We will migrate eyes to the PART_ASSETS + drawPart system gradually.
        // For now, drawEyeUnit stays procedural for stability.
        const pupilC = '#000000';
        const specC = '#ffffff';

        // Sclera: keep clean white + a very light lower shade (avoid "muddy" whites)
        const scleraC = '#ffffff';
        const scleraShadeC = '#e6e6e6';

        // Upper lid shading (NO eyelashes): keep it subtle so it blends with skin.
        // Use a very light gray so the eye reads cleanly without harsh borders.
        const lidShadeC = '#f4f4f4';

        // Iris ramp (required): fixes ReferenceError for irisMid/irisDark/irisLight.
        // Use the same quantized ramp strategy as the rest of Route A.
        const baseIris = (color && color !== 'transparent') ? color : '#2c3e50';
        const irisRamp = makeRamp(baseIris, { shadow: -58, mid: -28, light: 22, highlight: 44 });
        const irisDark = irisRamp[0];
        const irisMid  = irisRamp[2]; // base
        const irisLight = irisRamp[3];

        // Helpers to keep left/right eyes perfectly mirrored.
        // For 3px-wide sclera (base3): iris (2px) should sit toward the inner corner.
        const irisX3 = () => (ox - 1) + (flip ? 0 : 1);
        // For 4px-wide sclera (base4): iris (2px) sits more strongly toward the inner corner.
        const irisX4 = () => (ox - 1) + (flip ? 0 : 2);
        // For 1px iris (small): place it at the inner corner.
        const irisX1Inner = () => (ox - 1) + (flip ? 0 : 2);

        // --- 8-bit minimal (5 styles) ---
        if (bitMode === '8') {
            // 5 styles only: 0 Normal, 1 Big, 2 Small, 3 Narrow, 4 Cat
            // (8-bit is intentionally minimal)
            if (style === 0) { // Normal
                drawRect(ox, oy, 2, 2, color);
                drawPixel(ox, oy, '#fff');
            }
            else if (style === 1) { // Big
                drawRect(ox - 1, oy - 1, 4, 4, '#fff');
                drawRect(ox, oy, 3, 3, color);
                drawPixel(ox, oy, '#fff');
                drawPixel(ox + 1, oy + 1, '#000');
            }
            else if (style === 2) { // Small
                drawRect(ox - 1, oy, 3, 2, '#fff');
                drawPixel(ox, oy + 1, color);
            }
            else if (style === 3) { // Narrow
                drawRect(ox - 1, oy, 3, 1, '#fff');
                drawRect(ox, oy, 2, 1, color);
            }
            else if (style === 4) { // Cat
                drawRect(ox - 1, oy - 1, 3, 3, '#fff');
                drawRect(ox, oy - 1, 1, 3, '#000');
                drawPixel(ox + 1, oy, color);
            }
            return;
        }

        // --- 16/32-bit upgraded eye parts (5 styles only) ---
        // Styles:
        // 0: Normal / 1: Big / 2: Small / 3: Narrow / 4: Cat

        // Clamp unexpected old values to keep backward compatibility
        const s = Math.max(0, Math.min(4, style | 0));

        const drawEyeBase3 = () => {
            // 3x3 sclera with a 1px lower shade (smaller by 1 step)
            drawRect(ox - 1, oy, 3, 3, scleraC);
            drawRect(ox - 1, oy + 2, 3, 1, scleraShadeC);
        };

        const drawEyeBase4 = () => {
            // 4x4 sclera with a 1px lower shade (used only for "Big")
            drawRect(ox - 1, oy - 1, 4, 4, scleraC);
            drawRect(ox - 1, oy + 2, 4, 1, scleraShadeC);
        };


        const drawIris = (w, h, ix, iy, variant = 'normal') => {
            // Iris block with inner shading, plus pupil and spec highlight
            drawRect(ix, iy, w, h, irisMid);
            // lower band for depth
            if (h >= 2) drawRect(ix, iy + (h - 1), w, 1, irisDark);

            // Subtle light spot on iris (mirror with flip)
            if (w >= 2 && h >= 2) {
                const lx = flip ? (ix + (w - 1)) : ix;
                drawPixel(lx, iy + Math.min(1, h - 1), irisLight);
            }

            // Pupil
            if (variant === 'cat') {
                // vertical slit (keep it inside the iris bounds)
                const sx = ix + Math.max(0, Math.floor(w / 2));
                drawRect(sx, iy, 1, h, pupilC);
            } else {
                // compact pupil (mirror with flip)
                const px0 = flip ? ix : (ix + Math.max(0, w - 1));
                const py0 = iy + Math.max(0, Math.floor(h / 2) - 1);
                drawRect(px0, py0, 1, Math.min(2, h), pupilC);
            }

            // Specular highlight (mirror with flip)
            const hx = flip ? (ix + (w - 1)) : ix;
            drawPixel(hx, iy, specC);
        };

        const drawNormal = () => {
            // Smaller (3x3 base)
            drawEyeBase3();
            // Subtle lid shade (no lashes)
            drawRect(ox - 1, oy, 3, 1, lidShadeC);
            // Iris 2x2, slightly lower, mirrored toward inner corner
            drawIris(2, 2, irisX3(), oy + 1, 'normal');
        };

        const drawBig = () => {
            // Big uses 4x4 sclera
            drawEyeBase4();
            // Subtle lid shade (no lashes)
            drawRect(ox - 1, oy - 1, 4, 1, lidShadeC);

            // Iris 2x3, shifted down by 1px, mirrored toward inner corner
            drawIris(2, 3, irisX4(), oy + 1, 'normal');
        };

        const drawSmall = () => {
            // Small: 3x3 base + 1px iris at inner corner
            drawEyeBase3();
            drawRect(ox - 1, oy, 3, 1, lidShadeC);
            const ix = irisX1Inner();
            drawPixel(ix, oy + 1, irisDark);
            drawPixel(ix, oy + 1, specC);
        };

        const drawNarrow = () => {
            // Narrow: compact horizontal eye (3x2)
            drawRect(ox - 1, oy + 1, 3, 2, scleraC);
            drawRect(ox - 1, oy + 2, 3, 1, scleraShadeC);
            // Lid shade (no lashes)
            drawRect(ox - 1, oy + 1, 3, 1, lidShadeC);

            // Iris line (2px), mirrored toward inner corner
            const ix = irisX3();
            drawRect(ix, oy + 2, 2, 1, irisDark);

            // Pupil on inner side, spec on outer side (mirrored)
            const pupilX = ix + (flip ? 0 : 1);
            const specX  = ix + (flip ? 1 : 0);
            drawPixel(pupilX, oy + 2, pupilC);
            drawPixel(specX,  oy + 2, specC);
        };

        const drawCat = () => {
            // Cat: 3x3 base + vertical slit
            drawEyeBase3();
            drawRect(ox - 1, oy, 3, 1, lidShadeC);
            drawIris(2, 2, irisX3(), oy + 1, 'cat');
        };

        // Side view uses compact versions to prevent cheek overlap
        const drawSideCompact = () => {
            // 3x3 sclera base
            drawRect(ox - 1, oy, 3, 3, scleraC);
            drawRect(ox - 1, oy + 2, 3, 1, scleraShadeC);

            if (s === 3) { // Narrow
                drawRect(ox - 1, oy + 1, 3, 1, irisDark);
                drawPixel(ox, oy + 1, irisDark);
                drawPixel(ox, oy + 1, specC);
                return;
            }

            if (s === 2) { // Small
                drawPixel(ox + 1, oy + 1, irisDark);
                drawPixel(ox + 1, oy + 1, specC);
                return;
            }

            // Normal / Big / Cat
            if (s === 1) {
                // Big (side): 2x2 iris
                drawRect(ox, oy + 1, 2, 2, irisDark);
                drawPixel(ox, oy + 1, specC);
                drawPixel(ox + 1, oy + 2, pupilC);
                return;
            }
            if (s === 4) {
                // Cat (side): vertical slit
                drawRect(ox + 1, oy + 1, 1, 2, pupilC);
                drawPixel(ox, oy + 1, irisDark);
                drawPixel(ox, oy + 1, specC);
                return;
            }
            // Normal (side)
            drawRect(ox, oy + 1, 2, 2, irisDark);
            drawPixel(ox, oy + 1, specC);
            drawPixel(ox + 1, oy + 2, pupilC);
        };

        if (isSide) {
            drawSideCompact();
            return;
        }

        if (s === 0) drawNormal();
        else if (s === 1) drawBig();
        else if (s === 2) drawSmall();
        else if (s === 3) drawNarrow();
        else drawCat();
    };


    // --- MAIN RENDER SEQUENCE ---

    drawGroundShadow(); 

    drawWings(true);
    drawTail(true);
    
    setLayer(1); 
    if (baseType !== 1 && baseType !== 2) { // Hair back
        if (hairStyle !== 4) { // Not Skinhead
            if (drawMode === 1) {
                 // Side-view back hair: avoid boxy blocks by tapering and breaking edges
                 if (hairStyle === 0) { // Short
                     // Rounded cap
                     drawRect(17, headY + 1, 4, 4, hairColor);
                     drawPixel(17, headY + 1, 'rgba(0,0,0,0)');
                     drawPixel(20, headY + 1, 'rgba(0,0,0,0)');
                     // Nape taper
                     drawRect(18, headY + 5, 2, 2, hairColor);
                     drawPixel(17, headY + 6, hairColor);
                     // Shading (underside)
                     if (bitMode !== '8') {
                       drawRect(18, headY + 6, 2, 1, cHairShadow);
                       drawPixel(19, headY + 2, cHairLight);
                     }
                 }
                 else if (hairStyle === 1) { // Long
                     // Top/side mass with slight curve
                     drawRect(16, headY, 6, 9, hairColor);
                     drawPixel(16, headY, 'rgba(0,0,0,0)');
                     drawPixel(21, headY, 'rgba(0,0,0,0)');
                     // Lower taper (less rectangular)
                     drawRect(17, headY + 9, 5, 3, hairColor);
                     drawRect(18, headY + 12, 3, 1, hairColor);
                     drawPixel(17, headY + 12, hairColor);
                     // Strand breaks on edge
                     drawPixel(16, headY + 6, 'rgba(0,0,0,0)');
                     drawPixel(21, headY + 7, 'rgba(0,0,0,0)');
                     if (bitMode !== '8') {
                       drawRect(17, headY + 11, 5, 1, cHairShadow);
                       drawRect(17, headY + 3, 5, 1, cHairLight);
                     }
                 }
                 else if (hairStyle === 2) { // Spiky
                     // Spikes: stepped silhouette (no big rectangle)
                     drawRect(18, headY + 2, 2, 3, hairColor);
                     drawPixel(19, headY + 1, hairColor);
                     drawPixel(20, headY + 2, hairColor);
                     drawPixel(20, headY + 3, hairColor);
                     drawPixel(18, headY + 1, hairColor);
                     // Small nape
                     drawPixel(18, headY + 5, hairColor);
                     if (bitMode !== '8') {
                       drawPixel(19, headY + 3, cHairLight);
                       drawPixel(18, headY + 4, cHairShadow);
                     }
                 }
                 else if (hairStyle === 3) { // Bob
                     // Bob: rounded bottom + slight inward cut
                     drawRect(16, headY + 1, 6, 7, hairColor);
                     drawPixel(16, headY + 1, 'rgba(0,0,0,0)');
                     drawPixel(21, headY + 1, 'rgba(0,0,0,0)');
                     // Bottom curve
                     drawRect(17, headY + 8, 5, 2, hairColor);
                     drawPixel(16, headY + 9, hairColor);
                     // Edge breaks to avoid straight wall
                     drawPixel(16, headY + 4, 'rgba(0,0,0,0)');
                     drawPixel(21, headY + 5, 'rgba(0,0,0,0)');
                     if (bitMode !== '8') {
                       drawRect(17, headY + 9, 5, 1, cHairShadow);
                       drawRect(17, headY + 3, 4, 1, cHairLight);
                     }
                 }
            } else if (drawMode === 0) { 
                 if (hairStyle === 0) { drawRect(9, headY, 2, 6, hairColor); drawRect(21, headY, 2, 6, hairColor); }
                 else if (hairStyle === 1) { drawRect(9, headY, 2, 12, hairColor); drawRect(21, headY, 2, 12, hairColor); }
                 else if (hairStyle === 2) { drawRect(9, headY, 2, 4, hairColor); drawRect(21, headY, 2, 4, hairColor); }
                 else if (hairStyle === 3) { drawRect(8, headY + 1, 3, 8, hairColor); drawRect(21, headY + 1, 3, 8, hairColor); }
            }
        }
    } else if (baseType === 1 && hairStyle !== 4) { 
        const hY = activeHeadY - 2;
        const sX = 4; 
        if (drawMode === 3) {
             if (hairStyle === 0) { drawRect(13, hY, 6, 3, hairColor); }
             else if (hairStyle === 1) { drawRect(13, hY, 6, 8, hairColor); }
             else if (hairStyle === 2) { drawRect(12, hY, 8, 4, hairColor); }
             else if (hairStyle === 3) { drawRect(12, hY, 8, 5, hairColor); }
        } else if (drawMode === 1) { 
             if (hairStyle === 1) { drawRect(18+sX, hY+2, 2, 6, hairColor); }
             else if (hairStyle === 3) { drawRect(17+sX, hY+2, 3, 4, hairColor); }
        }
    }

    setLayer(1);
    const isRightFacing = direction === 2; 
    
    if (baseType !== 1) {
        if (drawMode === 1) { 
            if (isRightFacing) {
                if (shield > 0) drawShield(14 + walkOffset, baseHandY + yOffset + itemBob);
            } else {
                if (weapon > 0) drawWeapon(13, baseHandY + yOffset + itemBob, true);
            }

        } else if (drawMode === 3) { 
            if (weapon > 0) drawWeapon(23, baseHandY + yOffset + itemBob, true);
            if (shield > 0) drawShield(9, baseHandY + yOffset + itemBob);
        }
    }

    setLayer(2);

    if (baseType === 1) { 
        // Slime Body
        const sW = animationFrame === 0 ? 16 : 18;
        const sH = animationFrame === 0 ? 14 : 12;
        const sX = (32 - sW) / 2;
        const sY = 32 - sH;
        if (bitMode === '8') {
             drawRect(sX + 1, sY, sW - 2, sH, actualSkinColor);
             drawRect(sX, sY + 1, 1, sH - 1, actualSkinColor);
             drawRect(sX + sW - 1, sY + 1, 1, sH - 1, actualSkinColor);
        } else {
             drawAntiAliasedBlock(sX, sY, sW, sH, actualSkinColor);
             if (bitMode === '16') {
                 drawDitherPattern(ctxs[currentLayer], sX+1, sY+sH-2, sW-2, 2, cSkinShadow);
             }
        }
        if(bitMode !== '8') drawPixel(sX + 3, sY + 3, cSkinLight);
        const eyeY = sY + 4;
        if (drawMode !== 3) {
             // Guarantee perfect symmetry by deriving the right eye from the left eye.
             const leftOx = sX + 4;
             drawEyePairFront(leftOx, eyeY, eyeStyle, eyeColor);
        }
        
        if (hairStyle !== 4) { 
             const hY = sY - 2; 
             const hColor = hairColor;
             const fillHair = (x, y, w, h) => { drawRect(x, y, w, h, hColor); };
             
             if (hairStyle === 0) { fillHair(sX+2, hY, sW-4, 3); }
             else if (hairStyle === 1) { fillHair(sX+2, hY, sW-4, 8); }
             else if (hairStyle === 2) { fillHair(sX+4, hY-2, sW-8, 5); }
             else if (hairStyle === 3) { fillHair(sX+1, hY, sW-2, 6); }
        }
    } 
    else {
        // Shared vertical baselines for humanoids (must be outer-scope; used by both body + head)
        // ... (Humanoid body logic) ...
        const bodyColor = baseType === 2 ? '#bdc3c7' : actualSkinColor;
        const drawChest = (mode) => {
            if (mode === 0 || mode === 3) { 
                if (baseType === 2) { 
                    drawRect(13, chestY + 1, 6, 1, bodyColor);
                    drawRect(12, chestY + 3, 8, 1, bodyColor);
                    drawRect(15, chestY + 1, 2, 4, '#2c3e50'); 
                } else {
                    drawSoftTorso(11, chestY, 10, 5, bodyColor);
                }
                const isArmor = chestStyle === 2; // 鎧かどうか
                if (chestStyle === 1) { drawShadedRect(11, chestY, 10, 5, chestColor, false); drawRect(9, chestY, 2, 4, chestColor); drawRect(21, chestY, 2, 4, chestColor); } 
                else if (chestStyle === 2) { drawShadedRect(10, chestY, 12, 5, chestColor, true); drawShadedRect(8, chestY - 1, 4, 4, adjustColor(chestColor, 20), true); drawShadedRect(20, chestY - 1, 4, 4, adjustColor(chestColor, 20), true); } 
                else if (chestStyle === 3) { drawRect(10, chestY, 12, 5, chestColor); drawRect(9, chestY, 2, 5, chestColor); drawRect(21, chestY, 2, 5, chestColor); } 
                else if (chestStyle === 4) { drawRect(11, chestY, 10, 5, chestColor); drawRect(11, chestY, 2, 5, adjustColor(chestColor, 20)); drawRect(19, chestY, 2, 5, adjustColor(chestColor, 20)); drawRect(9, chestY, 2, 4, chestColor); drawRect(21, chestY, 2, 4, chestColor); } 
                else if (chestStyle === 5) { drawRect(12, chestY+1, 3, 2, chestColor); drawRect(17, chestY+1, 3, 2, chestColor); drawRect(9, chestY, 2, 2, actualSkinColor); drawRect(21, chestY, 2, 2, actualSkinColor); } 
                else { drawRect(9, chestY, 2, 4, actualSkinColor); drawRect(21, chestY, 2, 4, actualSkinColor); }

            } else if (mode === 1) { 
                if(baseType === 2) {
                    drawRect(14, chestY+1, 4, 4, bodyColor);
                } else {
                    drawSoftTorso(13, chestY, 6, 5, bodyColor);
                }
                if (chestStyle === 1) { drawShadedRect(13, chestY, 6, 5, chestColor, false); drawRect(14 + walkOffset, chestY + 1, 3, 3, chestColor); } 
                else if (chestStyle === 2) { drawShadedRect(12, chestY, 8, 5, chestColor, true); drawShadedRect(12 + walkOffset, chestY - 1, 4, 4, adjustColor(chestColor, 20), true); } 
                else if (chestStyle === 3) { drawRect(12, chestY, 8, 5, chestColor); drawRect(14 + walkOffset, chestY + 1, 4, 4, chestColor); } 
                else if (chestStyle === 4) { drawRect(13, chestY, 6, 5, chestColor); drawRect(14 + walkOffset, chestY + 1, 3, 3, chestColor); } 
                else if (chestStyle === 5) { drawRect(13, chestY+1, 4, 2, chestColor); drawRect(14 + walkOffset, chestY + 1, 2, 2, actualSkinColor); } 
                else { drawRect(14 + walkOffset, chestY + 1, 2, 4, actualSkinColor); }
            }
        };
        drawChest(drawMode);

        const drawWaist = (mode) => {
            const wColor = waistColor;
            if (mode === 0 || mode === 3) { 
                 drawSoftHips(11, waistY, 10, 5, legColor);
                 if (waistStyle === 1) { drawRect(11, waistY, 10, 2, wColor); drawRect(14, waistY, 4, 2, cGold); } 
                 else if (waistStyle === 2) { drawShadedRect(10, waistY, 12, 5, wColor); } 
                 else if (waistStyle === 3) { drawRect(13, waistY, 6, 5, wColor); } 
                 else if (waistStyle === 4) { drawShadedRect(10, waistY, 12, 5, wColor, true); drawRect(15, waistY, 2, 5, adjustColor(wColor, -20)); }
            } else if (mode === 1) { 
                 drawSoftHips(13, waistY, 6, 5, legColor);
                 if (waistStyle === 1) { drawRect(13, waistY, 6, 2, wColor); } 
                 else if (waistStyle === 2) { drawShadedRect(12, waistY, 8, 5, wColor); } 
                 else if (waistStyle === 3) { drawRect(12, waistY, 8, 5, wColor); } 
                 else if (waistStyle === 4) { drawShadedRect(12, waistY, 8, 5, wColor, true); }
            }
        };
        drawWaist(drawMode);

        // legY is already defined above
        if (baseType !== 3) { 
            const drawLegs = (mode) => {
                const isSkirt = waistStyle === 2 || waistStyle === 4;
                if (mode === 0 || mode === 3) {
                    if (!isSkirt) {
                        drawRoundedLeg(12, legY, legColor);
                        drawShoeOnLeg(12, legY, 3, 4);
                        drawRoundedLeg(17, legY, legColor);
                        drawShoeOnLeg(17, legY, 3, 4);
                    } 
                    else { drawRect(10, legY, 12, 4, waistColor); if (shoeStyle !== 0) { drawShoeOnLeg(11, legY+2, 3, 2); drawShoeOnLeg(18, legY+2, 3, 2); } }
                } else if (mode === 1) {
                    if (!isSkirt) {
                        const l1x = 13 - walkOffset;
                        drawRoundedLeg(l1x, legY, legColor);
                        drawShoeOnLeg(l1x, legY, 3, 4);

                        const l2x = 15 + walkOffset;
                        drawRoundedLeg(l2x, legY, legColor);
                        drawShoeOnLeg(l2x, legY, 3, 4);
                    } 
                    else { drawRect(12, legY, 8, 4, waistColor); if (shoeStyle !== 0) { drawShoeOnLeg(13+walkOffset, legY+2, 3, 2); } }
                }
            };
            drawLegs(drawMode);
        } else {
            if (drawMode === 0) { drawRect(12, legY, 8, 4, chestColor); drawRect(14, legY+4, 4, 3, chestColor); } 
            else if (drawMode === 1) { drawRect(13, legY, 6, 5, chestColor); drawRect(15-walkOffset, legY+5, 2, 3, chestColor); }
        }
    }

    setLayer(3);
    if (baseType !== 1) { 
        drawWings(false);
        drawTail(false);
    }
    
    drawHands(true);

    if (baseType === 1) { // Slime
        const sW = animationFrame === 0 ? 16 : 18;
        const sH = animationFrame === 0 ? 14 : 12;
        const sX = (32 - sW) / 2;
        const sY = 32 - sH;
        
        const eyeY = sY + 4;
        if (drawMode !== 3) {
             // Paired eyes must be rendered via drawEyePairFront to guarantee perfect mirroring.
             const leftOx = sX + 4;
             drawEyePairFront(leftOx, eyeY, eyeStyle, eyeColor);
        }
        
        if (hairStyle !== 4) { 
             const hY = sY - 2; 
             const hColor = hairColor;
             const fillHair = (x, y, w, h) => { drawRect(x, y, w, h, hColor); };
             
             if (hairStyle === 0) { fillHair(sX+2, hY, sW-4, 3); }
             else if (hairStyle === 1) { fillHair(sX+2, hY, sW-4, 8); }
             else if (hairStyle === 2) { fillHair(sX+4, hY-2, sW-8, 5); }
             else if (hairStyle === 3) { fillHair(sX+1, hY, sW-2, 6); }
        }
    } 
    else {
        const faceShapeSafe = (faceShape === undefined || faceShape === null) ? 0 : (faceShape | 0);
        const faceShapeClamped = Math.max(0, Math.min(3, faceShapeSafe));

        const fillHead = (x, y, w, h, c) => {
            // Face shapes:
            // 0 Normal (soft corners)
            // 1 Round  (more rounding)
            // 2 Square (hard corners)
            // 3 Long   (taller)

            const useSquare = faceShapeClamped === 2;
            const useRound = faceShapeClamped === 1;

            if (useSquare) {
                drawRect(x, y, w, h, c);
            } else {
                // default soft-rounded block
                drawAntiAliasedBlock(x, y, w, h, c);
            }

            if (bitMode !== '8') {
                // subtle top/bottom shading (keep consistent across shapes)
                drawRect(x + 1, y, w - 2, 1, cSkinShadow);
                drawRect(x + 1, y + h - 1, w - 2, 1, cSkinShadow);
                if (baseType !== 2) {
                    drawPixel(x + 2, y + 2, cSkinLight);
                }
            }

            // corner cleanup (rounder shapes only)
            if (!useSquare && baseType !== 2) {
                // Standard corner clears
                drawPixel(x, y, 'rgba(0,0,0,0)');
                drawPixel(x + w - 1, y, 'rgba(0,0,0,0)');
                drawPixel(x, y + h - 1, 'rgba(0,0,0,0)');
                drawPixel(x + w - 1, y + h - 1, 'rgba(0,0,0,0)');

                if (useRound) {
                    // Extra rounding for "round" face
                    if (w >= 4 && h >= 4) {
                        drawPixel(x + 1, y, 'rgba(0,0,0,0)');
                        drawPixel(x, y + 1, 'rgba(0,0,0,0)');
                        drawPixel(x + w - 2, y, 'rgba(0,0,0,0)');
                        drawPixel(x + w - 1, y + 1, 'rgba(0,0,0,0)');

                        drawPixel(x + 1, y + h - 1, 'rgba(0,0,0,0)');
                        drawPixel(x, y + h - 2, 'rgba(0,0,0,0)');
                        drawPixel(x + w - 2, y + h - 1, 'rgba(0,0,0,0)');
                        drawPixel(x + w - 1, y + h - 2, 'rgba(0,0,0,0)');
                    }
                }
            }
        };

        const headColor = baseType === 2 ? '#ecf0f1' : actualSkinColor;

        // Route B (assets): draw face using stamped bitmap parts.
        // Keep robot (baseType===2) on the legacy path for now.
        const useFaceAssets = USE_PART_ASSETS && baseType !== 2;

        // Anchors: single source of truth for placement.
        const anchors = getAnchors({
          drawMode,
          headY,
          chestY,
          waistY,
          legY,
          handY,
          walkOffset,
        });

        if (useFaceAssets) {
          const faceAsset = getFaceAsset(faceShapeClamped, drawMode);

          // The long face variants in the legacy renderer are shifted (+x for front/back, -y for both).
          let faceX = anchors.headAnchor.topLeft.x;
          let faceY = anchors.headAnchor.topLeft.y;
          if (faceShapeClamped === 3) {
            faceY -= 1;
            if (drawMode !== 1) faceX += 1;
          }

          // Stamp base face
          drawPart(faceAsset, faceX, faceY, {
            palette: { F: headColor }
          });

          // Add the same subtle shading cues as the legacy head (keeps material continuity)
          if (bitMode !== '8') {
            const w = faceAsset.w | 0;
            const h = faceAsset.h | 0;
            if (w >= 3) {
              drawRect(faceX + 1, faceY, w - 2, 1, cSkinShadow);
              drawRect(faceX + 1, faceY + h - 1, w - 2, 1, cSkinShadow);
            }
            drawPixel(faceX + 2, faceY + 2, cSkinLight);
          }

          // Extra side ear blocks for some races (match legacy behavior)
          if (baseType === 4 || baseType === 8) {
            if (drawMode !== 1) {
              drawRect(8,  faceY + 3, 2, 4, headColor);
              drawRect(22, faceY + 3, 2, 4, headColor);
            } else {
              drawRect(10, faceY + 3, 2, 4, headColor);
            }
          }

        } else {
          // Legacy procedural head
          if (drawMode !== 1) { // Front/Back
            if (faceShapeClamped === 3) {
              // Long face: slightly narrower and taller
              fillHead(11, headY - 1, 10, 12, headColor);
            } else {
              fillHead(10, headY, 12, 10, headColor);
            }
            if (baseType !== 2) { 
               drawPixel(10, headY, 'rgba(0,0,0,0)'); drawPixel(21, headY, 'rgba(0,0,0,0)');
               drawPixel(10, headY + 9, 'rgba(0,0,0,0)'); drawPixel(21, headY + 9, 'rgba(0,0,0,0)');
               if (baseType === 4 || baseType === 8) { drawRect(8, headY + 3, 2, 4, headColor); drawRect(22, headY + 3, 2, 4, headColor); }
            }
          } else { // Side
            if (faceShapeClamped === 3) {
              // Long face (side): a bit taller
              fillHead(11, headY - 1, 7, 12, headColor);
            } else {
              fillHead(11, headY, 8, 10, headColor);
            }

            if (baseType === 5) { drawRect(18, headY + 5, 4, 3, headColor); }
            else if (baseType === 6) { // Birdman Beak
                drawRect(8, headY + 5, 3, 2, '#f1c40f'); 
            }
            else if (baseType === 4 || baseType === 8) { drawRect(10, headY + 3, 2, 4, headColor); }
            if (baseType !== 2) { drawPixel(11, headY, 'rgba(0,0,0,0)'); drawPixel(18, headY, 'rgba(0,0,0,0)'); drawPixel(11, headY + 9, 'rgba(0,0,0,0)'); drawPixel(18, headY + 9, 'rgba(0,0,0,0)'); }
          }
        }

        // Head drawing block ends here, before:
        // if (drawMode !== 3 && baseType !== 1 && helmet === 0) {

        const eyeY = headY + 5;
        if (drawMode === 0) { // Front
            if (baseType === 2) { 
                 drawRect(12, eyeY, 3, 3, '#2c3e50'); drawRect(17, eyeY, 3, 3, '#2c3e50'); drawRect(15, eyeY + 5, 2, 1, '#2c3e50'); 
            } else {
                 if (baseType === 6) { drawRect(14, eyeY + 2, 4, 2, '#f1c40f'); }
                 
                 // Guarantee perfect left/right mirror placement (right eye is derived from left eye).
                 const anchors = getAnchors({
                   drawMode,
                   headY,
                   chestY,
                   waistY,
                   legY: 24 + yOffset,
                   handY: 19 + yOffset,
                   walkOffset,
                 });
                 drawEyePairFront(anchors.eyeAnchor.leftOx, anchors.eyeAnchor.y, eyeStyle, eyeColor);
                 
                 if (hasFangs || baseType === 4 || baseType === 7) {
                   const fxL = (faceShapeClamped === 3) ? 14 : 13;
                   const fxR = (faceShapeClamped === 3) ? 17 : 18;
                   drawPixel(fxL, eyeY + 3, '#fff');
                   drawPixel(fxR, eyeY + 3, '#fff');
                 }
                 if (baseType === 9) { // Dwarf Beard
                     const beardColor = hairColor; 
                     drawRect(11, eyeY + 3, 10, 4, beardColor); 
                     drawRect(12, eyeY + 7, 8, 1, beardColor); 
                 }
            }
        } else if (drawMode === 1) { // Side
          const eyeX = 11;
          if (baseType === 2) { drawRect(eyeX + 1, eyeY, 3, 3, '#2c3e50'); } else {
              const anchors = getAnchors({
                drawMode,
                headY,
                chestY,
                waistY,
                legY: 24 + yOffset,
                handY: 19 + yOffset,
                walkOffset,
              });
              drawEyeUnit(anchors.eyeAnchor.center.x, anchors.eyeAnchor.center.y, eyeStyle, eyeColor, true); // Single Eye
              
              if (hasFangs || baseType === 4 || baseType === 7) {
                const fdx = (faceShapeClamped === 3) ? 0 : 0;
                drawPixel(eyeX + 1 + fdx, eyeY + 3, '#fff');
              }
              if (baseType === 9) {
                 const beardColor = hairColor;
                 drawRect(11, eyeY + 3, 3, 4, beardColor);
                 drawRect(12, eyeY + 7, 2, 1, beardColor);
              }
          }
        }

        if (baseType !== 1) { 
            if (helmet > 0) {
                if (drawMode === 0) { 
                    if (helmet === 1) { drawShadedRect(9, headY - 3, 14, 6, helmetColor, true); drawRect(15, headY - 4, 2, 9, '#2c3e50'); } 
                    else if (helmet === 2) { drawShadedRect(9, headY - 2, 14, 4, helmetColor, true); drawRect(8, headY - 4, 2, 4, '#fff'); drawRect(22, headY - 4, 2, 4, '#fff'); } 
                    else if (helmet === 3) { drawRect(7, headY - 1, 18, 2, helmetColor); drawRect(10, headY - 8, 12, 7, helmetColor); drawRect(12, headY - 12, 8, 4, helmetColor); } 
                    else if (helmet === 4) { drawRect(8, headY - 3, 16, 13, helmetColor); drawRect(11, headY, 10, 8, 'rgba(0,0,0,0.3)'); } 
                } else if (drawMode === 1) { 
                    if (helmet === 1) { drawShadedRect(10, headY - 3, 12, 6, helmetColor, true); }
                    else if (helmet === 2) { drawShadedRect(10, headY - 2, 12, 4, helmetColor, true); drawRect(12, headY - 4, 2, 4, '#fff'); }
                    else if (helmet === 3) { drawRect(9, headY - 1, 14, 2, helmetColor); drawRect(11, headY - 8, 10, 7, helmetColor); drawRect(13, headY - 12, 6, 4, helmetColor); }
                    else if (helmet === 4) { 
                        drawRect(10, headY - 3, 13, 13, helmetColor); 
                        drawRect(10, headY + 1, 2, 6, adjustColor(helmetColor, -30));
                    }
                } else if (drawMode === 3) { 
                    if (helmet === 1) { drawShadedRect(9, headY - 3, 14, 10, helmetColor, true); }
                    else if (helmet === 2) { drawShadedRect(9, headY - 2, 14, 8, helmetColor, true); }
                    else if (helmet === 3) { drawRect(7, headY - 1, 18, 2, helmetColor); drawRect(10, headY - 8, 12, 7, helmetColor); }
                    else if (helmet === 4) { drawRect(8, headY - 3, 16, 14, helmetColor); }
                }
            } else {
                const fillHair = (x, y, w, h) => { drawRect(x, y, w, h, hairColor); if (bitMode !== '8' && h >= 3) { const ctx = ctxs[currentLayer]; ctx.fillStyle = cHairLight; ctx.fillRect((x+OFFSET_X), (y+OFFSET_Y+1), w, 1); } };
                if (hairStyle !== 4) { // Not Skinhead
                    if (drawMode === 0) { 
                        // Top cap (rounded) + stepped fringe to avoid a flat bar
                        fillHair(10, headY - 2, 12, 3);
                        drawPixel(10, headY - 2, 'rgba(0,0,0,0)');
                        drawPixel(21, headY - 2, 'rgba(0,0,0,0)');
                        // Fringe (3 clusters)
                        drawPixel(12, headY + 1, hairColor);
                        drawPixel(13, headY + 2, hairColor);
                        drawPixel(15, headY + 1, hairColor);
                        drawPixel(16, headY + 2, hairColor);
                        drawPixel(18, headY + 1, hairColor);
                        drawPixel(19, headY + 2, hairColor);
                        if (bitMode !== '8') {
                          drawPixel(12, headY - 1, cHairLight);
                          drawPixel(18, headY - 1, cHairLight);
                        }
                        if (hairStyle === 1) fillHair(11, headY, 10, 2); else if (hairStyle === 2) { drawRect(14, headY - 4, 4, 4, hairColor); drawRect(10, headY - 1, 12, 2, hairColor); } else if (hairStyle === 3) { drawRect(11, headY, 3, 3, hairColor); drawRect(18, headY, 3, 3, hairColor); } 
                    } else if (drawMode === 1) {
                        // Side-view FRONT hair: de-boxify via stepped bangs + tapered back + broken edge pixels
                        // Base cap (slightly rounded)
                        fillHair(11, headY - 1, 8, 3);
                        drawPixel(11, headY - 1, 'rgba(0,0,0,0)');
                        drawPixel(18, headY - 1, 'rgba(0,0,0,0)');

                        // Bangs: stepped diagonal instead of a rectangle wall
                        drawPixel(10, headY + 1, hairColor);
                        drawPixel(10, headY + 2, hairColor);
                        drawPixel(11, headY + 3, hairColor);
                        drawPixel(12, headY + 4, hairColor);

                        if (hairStyle === 0) { // Short
                            // Short side hair with taper and a tiny nape
                            drawRect(13, headY, 6, 5, hairColor);
                            drawPixel(18, headY + 1, 'rgba(0,0,0,0)');
                            drawPixel(18, headY + 2, hairColor);
                            drawPixel(18, headY + 3, hairColor);
                            drawPixel(17, headY + 5, hairColor);
                            if (bitMode !== '8') {
                              drawPixel(12, headY + 1, cHairLight);
                              drawRect(14, headY + 4, 4, 1, cHairShadow);
                            }
                        }
                        else if (hairStyle === 1) { // Long
                            // Long hair: volume + tapered tail
                            drawRect(13, headY, 7, 9, hairColor);
                            drawRect(14, headY + 9, 6, 2, hairColor);
                            drawRect(16, headY + 11, 3, 1, hairColor);
                            // Break the back edge a bit
                            drawPixel(19, headY + 3, 'rgba(0,0,0,0)');
                            drawPixel(19, headY + 6, 'rgba(0,0,0,0)');
                            if (bitMode !== '8') {
                              drawRect(14, headY + 3, 5, 1, cHairLight);
                              drawRect(14, headY + 10, 6, 1, cHairShadow);
                            }
                        }
                        else if (hairStyle === 2) { // Spiky
                            // Spiky: stepped spikes (no big box)
                            drawRect(12, headY - 2, 7, 3, hairColor);
                            drawPixel(13, headY - 3, hairColor);
                            drawPixel(16, headY - 3, hairColor);
                            drawPixel(18, headY - 2, hairColor);
                            // Side mass
                            drawRect(13, headY + 1, 6, 4, hairColor);
                            // Edge breaks
                            drawPixel(18, headY + 2, 'rgba(0,0,0,0)');
                            drawPixel(18, headY + 3, hairColor);
                            if (bitMode !== '8') {
                              drawPixel(14, headY + 1, cHairLight);
                              drawPixel(17, headY + 4, cHairShadow);
                            }
                        }
                        else if (hairStyle === 3) { // Bob
                            // Bob: rounded bottom + slight inward cut
                            drawRect(12, headY - 1, 7, 7, hairColor);
                            drawPixel(12, headY - 1, 'rgba(0,0,0,0)');
                            drawPixel(18, headY - 1, 'rgba(0,0,0,0)');
                            drawRect(13, headY + 6, 6, 2, hairColor);
                            drawPixel(12, headY + 7, hairColor);
                            // Break straight wall
                            drawPixel(18, headY + 3, 'rgba(0,0,0,0)');
                            drawPixel(18, headY + 4, hairColor);
                            if (bitMode !== '8') {
                              drawRect(13, headY + 2, 4, 1, cHairLight);
                              drawRect(13, headY + 7, 6, 1, cHairShadow);
                            }
                        }
                    } else if (drawMode === 3) { 
                        if (hairStyle === 0) { fillHair(10, headY - 2, 12, 3); drawRect(9, headY, 14, 6, hairColor); drawRect(11, headY + 6, 10, 2, hairColor); } else if (hairStyle === 1) { fillHair(10, headY - 2, 12, 3); drawRect(9, headY, 14, 12, hairColor); } else if (hairStyle === 2) { drawRect(14, headY - 4, 4, 4, hairColor); drawRect(10, headY - 1, 12, 2, hairColor); drawRect(9, headY, 14, 5, hairColor); } else if (hairStyle === 3) { fillHair(10, headY - 2, 12, 4); drawRect(8, headY + 1, 16, 8, hairColor); } 
                    }
                }
                if (hairStyle === 4 && drawMode !== 3) { // Skinhead shine
                     drawRect(12, headY + 1, 2, 2, 'rgba(255,255,255,0.3)');
                }
            }
        }
    }

    drawHorns();
    drawEyeAccessory(activeHeadY);
    drawHeadAccessory(activeHeadY);

    if (drawMode !== 3 && baseType !== 1) { 
       // Front Equipment
    } 

    if (drawMode === 0 && baseType !== 1) { 
        if (weapon > 0) drawWeapon(9, baseHandY + yOffset + itemBob, false);
        if (shield > 0) drawShield(23, baseHandY + yOffset + itemBob);
    } else if (drawMode === 1 && baseType !== 1) { 
        if (isRightFacing) {
            if (weapon > 0) {
                const wx = 12 + walkOffset;
                const wy = baseHandY + yOffset + itemBob;
                drawWeapon(wx, wy, true);
            }
        } else {
            if (shield > 0) drawShield(12 + walkOffset, baseHandY + yOffset + itemBob);
        }
    }

    const compositeLayers = () => {
      if (bitMode === '32') {
        if (baseType === 1 || baseType === 3) ctx.globalAlpha = 0.8; 
      }
      ctx.drawImage(buffers[0], 0, 0);
      ctx.drawImage(buffers[1], 0, 0);
      ctx.drawImage(buffers[2], 0, 0);
      ctx.drawImage(buffers[3], 0, 0);
      ctx.globalAlpha = 1.0;
    };

    // --- Priority A: post-process 1px outline (8/16-bit) ---
    // Rationale: unify silhouette and reduce "flat" look without rewriting every part.
    // Strategy: after compositing, add an outline pixel on "empty" pixels adjacent to non-empty pixels.
    // Outline color is derived from the nearest neighbor color and darkened (not pure black).

    const parseCssColor = (str) => {
      if (!str || str === 'transparent') return { r: 0, g: 0, b: 0, a: 0, valid: true };
      const s = String(str).trim();

      // #rgb / #rrggbb
      if (s[0] === '#') {
        const hex = s.slice(1);
        if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          return { r, g, b, a: 255, valid: true };
        }
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return { r, g, b, a: 255, valid: true };
        }
      }

      // rgba(r,g,b,a) / rgb(r,g,b)
      const m = s.match(/rgba?\(([^)]+)\)/i);
      if (m) {
        const parts = m[1].split(',').map(v => v.trim());
        const r = Math.max(0, Math.min(255, Math.round(Number(parts[0]))));
        const g = Math.max(0, Math.min(255, Math.round(Number(parts[1]))));
        const b = Math.max(0, Math.min(255, Math.round(Number(parts[2]))));
        let a = 255;
        if (parts.length >= 4) {
          const av = Number(parts[3]);
          a = av <= 1 ? Math.round(av * 255) : Math.round(av);
          a = Math.max(0, Math.min(255, a));
        }
        return { r, g, b, a, valid: true };
      }

      return { r: 0, g: 0, b: 0, a: 0, valid: false };
    };

    const clamp255 = (v) => Math.max(0, Math.min(255, v | 0));

    // Lighter outline: closer to neighbor color, thinner edge feel
    const outlineFromNeighbor = (nr, ng, nb) => {
      // Higher factor = lighter outline (closer to the original color)
      const f = bitMode === '8' ? 0.62 : 0.55;
      const bias = bitMode === '8' ? 10 : 12;
      const r = clamp255(Math.round(nr * f + bias));
      const g = clamp255(Math.round(ng * f + bias));
      const b = clamp255(Math.round(nb * f + bias));

      // Keep a small floor so very dark neighbors don't collapse to black
      const floor = bitMode === '8' ? 12 : 16;
      return {
        r: Math.max(r, floor),
        g: Math.max(g, floor),
        b: Math.max(b, floor)
      };
    };

    const applyOutlineToComposite = () => {
      // INNER OUTLINE: darken edge pixels *inside* the sprite instead of drawing outside.
      // This avoids silhouette "jaggies" caused by 1px external outlines.
      if (bitMode === '32') return;

      const w = CANVAS_SIZE;
      const h = CANVAS_SIZE;
      const img = ctx.getImageData(0, 0, w, h);
      const data = img.data;

      const bg = parseCssColor(bgColor);
      const hasBg = bgColor !== 'transparent' && bg.valid;

      const idx = (x, y) => (y * w + x) * 4;
      const isEmpty = (x, y) => {
        const i = idx(x, y);
        const a = data[i + 3];
        if (!hasBg) return a === 0;
        return a === 255 && data[i] === bg.r && data[i + 1] === bg.g && data[i + 2] === bg.b;
      };
      const isSolid = (x, y) => {
        const i = idx(x, y);
        const a = data[i + 3];
        if (a === 0) return false;
        if (!hasBg) return true;
        return !(a === 255 && data[i] === bg.r && data[i + 1] === bg.g && data[i + 2] === bg.b);
      };

      // Inner outline color from the pixel itself (subtle darken, not black)
      const innerOutlineFromSelf = (sr, sg, sb) => {
  // Subtle darken that preserves hue. Keep it LIGHT to avoid chunky, jaggy-looking edges.
  // (We are drawing INSIDE the sprite, so the delta should be small.)
  const f = bitMode === '8' ? 0.82 : 0.86;
  const bias = bitMode === '8' ? -12 : -10;
  return {
    r: clamp255(Math.round(sr * f + bias)),
    g: clamp255(Math.round(sg * f + bias)),
    b: clamp255(Math.round(sb * f + bias))
  };
};

      // Outline style: 'shadow' is cleaner (right/bottom only). 'full' outlines all edges.
      const OUTLINE_MODE = 'shadow';

      const out = new Uint8ClampedArray(data);

      // Mark edge pixels inside the sprite
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (!isSolid(x, y)) continue;

          const leftEmpty = isEmpty(x - 1, y);
          const rightEmpty = isEmpty(x + 1, y);
          const upEmpty = isEmpty(x, y - 1);
          const downEmpty = isEmpty(x, y + 1);

          let isEdge = false;
          if (OUTLINE_MODE === 'shadow') {
            // Only apply on shadow side (pixels that border empty on right/bottom)
            isEdge = rightEmpty || downEmpty;
          } else {
            // Full inner outline
            isEdge = leftEmpty || rightEmpty || upEmpty || downEmpty;
          }

          if (!isEdge) continue;

          const i = idx(x, y);
const sr = data[i];
const sg = data[i + 1];
const sb = data[i + 2];
const sa = data[i + 3];

// Guardrails to prevent outlines from dirtying highlights (eyes/sparkles) or crushing dark clusters
const sum = sr + sg + sb;
// Skip near-white pixels (sclera/spec highlights, bright hair shine)
if (sum >= 740) continue;
// Skip near-black pixels (already at the darkest ramp)
if (sum <= 70) continue;
// Skip very transparent (safety)
if (sa < 200) continue;

// Keep original alpha; only adjust RGB
const oc = innerOutlineFromSelf(sr, sg, sb);
out[i] = oc.r;
out[i + 1] = oc.g;
out[i + 2] = oc.b;
out[i + 3] = sa;
        }
      }

      img.data.set(out);
      ctx.putImageData(img, 0, 0);
    };

    compositeLayers();
    applyOutlineToComposite();

  }, [charState, animationFrame, direction, bitMode, bgColor, scale]);

  return (
    <canvas
      ref={localCanvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className={`image-pixelated bg-transparent ${className}`}
      style={{ 
        width: `${CANVAS_SIZE * scale}px`, 
        height: `${CANVAS_SIZE * scale}px`,
        imageRendering: 'pixelated' 
      }}
    />
  );
});

export default SpriteRenderer;