// src/renderer/LayoutUtils.js

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, v | 0));

// Character drawing area is 32px wide (x: 0..31). 
// Mirroring around the vertical center (15.5) means: mirroredX = 31 - x
export const MIRROR_X = 31;
export const mirrorX = (x) => (MIRROR_X - x);

export const getAnchors = ({ drawMode, headY, chestY, waistY, legY, handY, walkOffset }) => {
  // Base (humanoid) head placement
  const headTopLeft = (drawMode === 1)
    ? { x: 11, y: headY }   // side
    : { x: 10, y: headY };  // front/back

  // Current eye Y is consistently headY + 5 for humanoids
  const eyeY = headY + 5;

  // Eye anchor definition
  const eye = (drawMode === 1)
    ? {
        // side view draws a single eye at ox=11
        center: { x: 11, y: eyeY },
        leftCenter: { x: 11, y: eyeY },
        rightCenter: null,
        leftOx: 11,
        rightOx: null,
        y: eyeY
      }
    : {
        // front/back: canonical left eye center
        center: { x: 16, y: eyeY },
        leftCenter: { x: 13, y: eyeY },
        rightCenter: { x: mirrorX(13), y: eyeY },
        leftOx: 13,
        rightOx: mirrorX(13),
        y: eyeY
      };

  // Torso / pelvis anchors
  const torso = (drawMode === 1)
    ? { topLeft: { x: 13, y: chestY }, center: { x: 16, y: chestY + 2 } }
    : { topLeft: { x: 11, y: chestY }, center: { x: 16, y: chestY + 2 } };

  const pelvis = (drawMode === 1)
    ? { topLeft: { x: 13, y: waistY }, center: { x: 16, y: waistY + 2 } }
    : { topLeft: { x: 11, y: waistY }, center: { x: 16, y: waistY + 2 } };

  // Legs
  const legs = (drawMode === 1)
    ? {
        leftTopLeft: { x: 13 - walkOffset, y: legY },
        rightTopLeft: { x: 15 + walkOffset, y: legY }
      }
    : {
        leftTopLeft: { x: 12, y: legY },
        rightTopLeft: { x: 17, y: legY }
      };

  // Hands
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

  // Helper to ensure points are within bounds
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