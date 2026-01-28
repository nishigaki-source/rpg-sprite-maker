// src/renderer/LayoutUtils.js

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, v | 0));

export const MIRROR_X = 31;
export const mirrorX = (x) => (MIRROR_X - x);

export const getAnchors = ({ drawMode, headY, chestY, waistY, legY, handY, walkOffset }) => {
  // Steve Style Adjustments:
  // Side View Centering:
  // Head X=12 (Width 8). Range 12..19. Center 15.5.
  // Body X=13 (Width 6). Range 13..18. Center 15.5. (Aligned)
  // Legs X=13 (Width 6). (Matched to Body)
  
  const headTopLeft = (drawMode === 1)
    ? { x: 12, y: headY }   // side
    : { x: 12, y: headY };  // front/back (x=12)

  const eyeY = headY + 4;

  const eye = (drawMode === 1)
    ? {
        center: { x: 12, y: eyeY },
        leftCenter: { x: 12, y: eyeY },
        rightCenter: null,
        leftOx: 12,
        rightOx: null,
        y: eyeY
      }
    : {
        center: { x: 16, y: eyeY },
        leftCenter: { x: 13, y: eyeY },
        rightCenter: { x: mirrorX(13), y: eyeY },
        leftOx: 13,
        rightOx: mirrorX(13),
        y: eyeY
      };

  // Torso / Pelvis 
  const torso = (drawMode === 1)
    ? { topLeft: { x: 13, y: chestY }, center: { x: 16, y: chestY + 6 } } // Side: X=13
    : { topLeft: { x: 11, y: chestY }, center: { x: 16, y: chestY + 6 } }; // Front: X=11

  const pelvis = (drawMode === 1)
    ? { topLeft: { x: 13, y: waistY }, center: { x: 16, y: waistY + 6 } } // Side: X=13
    : { topLeft: { x: 11, y: waistY }, center: { x: 16, y: waistY + 6 } }; // Front: X=11

  // Legs 
  const legs = (drawMode === 1)
    ? {
        // Side View: Vertical Step Animation
        // X is 13 (Matched to body X=13)
        leftTopLeft: { x: 13, y: legY - (walkOffset === 1 ? 1 : 0) }, 
        rightTopLeft: { x: 13, y: legY - (walkOffset === -1 ? 1 : 0) } 
      }
    : {
        leftTopLeft: { x: 11, y: legY }, 
        rightTopLeft: { x: 17, y: legY } 
      };

  // Hands (Side view arms swing horizontally)
  const hands = (drawMode === 1)
    ? {
        frontTopLeft: { x: 14 + walkOffset, y: handY }, // Side: Arm at 14 (Center of Body)
        leftTopLeft: null,
        rightTopLeft: null
      }
    : {
        frontTopLeft: null,
        leftTopLeft: { x: 8, y: handY },  
        rightTopLeft: { x: 21, y: handY } 
      };

  const clampPt = (p) => (p ? ({ x: clampInt(p.x, 0, 31), y: clampInt(p.y, 0, 31) }) : p);

  return {
    headAnchor: {
      topLeft: clampPt(headTopLeft),
      center: clampPt({ x: (headTopLeft.x + 4), y: headTopLeft.y + 4 })
    },
    eyeAnchor: {
      center: clampPt(eye.center),
      leftCenter: clampPt(eye.leftCenter),
      rightCenter: clampPt(eye.rightCenter),
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