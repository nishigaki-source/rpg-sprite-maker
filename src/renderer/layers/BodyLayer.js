// src/renderer/layers/BodyLayer.js
import { adjustColor } from '../../utils/colorUtils';
import { COLORS } from '../../constants/commonColors';
import { mirrorX } from '../LayoutUtils';
import { PART_ASSETS } from '../../constants/spriteAssets';

// --- Helper: Eyes ---
const drawEyeUnit = (renderer, ox, oy, style, color, isSide, flip = false) => {
    const baseIris = (color && color !== 'transparent') ? color : '#2c3e50';
    const scleraC = '#ffffff'; 

    const r = (x, y, w, h, c) => renderer.drawRect(ox + x, oy + y, w, h, c);
    const s = Math.max(0, Math.min(5, style | 0));
    const isIrisLeft = flip || isSide;

    if (s === 0) {
        if (isIrisLeft) { r(0, 0, 1, 1, baseIris); r(1, 0, 1, 1, scleraC); } 
        else { r(0, 0, 1, 1, scleraC); r(1, 0, 1, 1, baseIris); }
    }
    else if (s === 1) { 
        if (isIrisLeft) { r(0, 0, 1, 2, baseIris); r(1, 0, 1, 2, scleraC); } 
        else { r(0, 0, 1, 2, scleraC); r(1, 0, 1, 2, baseIris); }
    }
    else if (s === 2) { 
        if (isIrisLeft) { r(0, 0, 1, 1, baseIris); } else { r(1, 0, 1, 1, baseIris); }
    }
    else if (s === 3) {
        r(0, 0, 2, 1, baseIris);
    }
    else if (s === 4) {
        if (isIrisLeft) { r(0, 0, 1, 2, baseIris); } else { r(1, 0, 1, 2, baseIris); }
    }
    else if (s === 5) {
        r(0, 0, 2, 2, scleraC);
        if (isIrisLeft) { r(0, 1, 1, 1, baseIris); } else { r(1, 1, 1, 1, baseIris); }
    }
};

const drawEyePairFront = (renderer, leftOx, oy, style, color) => {
    drawEyeUnit(renderer, leftOx,  oy, style, color, false, false);
    drawEyeUnit(renderer, mirrorX(leftOx)-1, oy, style, color, false, true);
};

export const drawGroundShadow = (renderer, charState) => {
    if (charState.baseType !== 3) return; 
    renderer.setLayer(0); 
    const shadowColor = COLORS.shadow;
    renderer.getCurrentCtx().globalAlpha = 0.5;
    renderer.drawRect(10, 42, 12, 1, shadowColor);
    renderer.getCurrentCtx().globalAlpha = 1.0;
};

export const drawShoeOnLeg = (renderer, legX, legY, legW, legH, shoeStyle, shoeColor, bitMode) => {
    if (shoeStyle === 0) return; 
    const shoeH = shoeStyle === 2 ? 4 : 2; 
    const shoeY = legY + legH - shoeH;
    renderer.drawRect(legX, shoeY, legW, shoeH, shoeColor);
};

// Dimensions
const STEVE_BODY_HEIGHT = 12;
const STEVE_LEG_HEIGHT = 12;

export const drawBody = (renderer, charState, drawMode, animationFrame, anchors, walkOffset) => {
    const { 
        baseType, chestStyle, chestColor, waistStyle, waistColor, 
        legColor, shoeStyle, shoeColor, skinColor, bitMode
    } = charState;

    if (baseType === 1) return; 

    const bodyColor = (skinColor === '#fsc' ? '#ffdbac' : skinColor);
    const chestY = anchors.torsoAnchor.topLeft.y;
    const legY = anchors.legAnchor.L.y;
    const chestX = anchors.torsoAnchor.topLeft.x;

    const bodyH = STEVE_BODY_HEIGHT;
    const legH = STEVE_LEG_HEIGHT;
    
    const bodyW = 10;
    const legW = 4; 

    if (drawMode === 0 || drawMode === 3) {
        renderer.drawRect(chestX, chestY, bodyW, bodyH, bodyColor);
        const lx = anchors.legAnchor.L.x;
        const rx = anchors.legAnchor.R.x;
        renderer.drawRect(lx, legY, legW, legH, legColor);
        renderer.drawRect(rx, legY, legW, legH, legColor);
        
        const gapX = lx + legW;
        const gapW = rx - gapX;
        if (gapW > 0) {
            renderer.drawRect(gapX, legY, gapW, 3, legColor);
        }

        if (baseType === 2) { 
             renderer.drawRect(chestX+3, chestY+2, 4, 6, '#2c3e50');
        }
    } else if (drawMode === 1) {
        renderer.drawRect(chestX, chestY, 6, bodyH, bodyColor);
        const lx = anchors.legAnchor.L.x;
        const ly = anchors.legAnchor.L.y;
        const rx = anchors.legAnchor.R.x;
        const ry = anchors.legAnchor.R.y;
        
        renderer.drawRect(lx, ly, 6, legH, legColor);
        renderer.drawRect(rx, ry, 6, legH, legColor);
    }

    if (drawMode === 0 || drawMode === 3) {
        if (chestStyle !== 0) { 
            renderer.drawShadedRect(chestX, chestY, bodyW, bodyH, chestColor, false);
            if (chestStyle === 5) { 
                 renderer.drawRect(chestX, chestY+4, bodyW, 4, bodyColor); 
            }
        }
        const isSkirt = waistStyle === 2 || waistStyle === 4;
        if (isSkirt) {
            renderer.drawRect(chestX, legY, bodyW, legH - 4, waistColor);
        } else if (waistStyle !== 5) { 
            const lx = anchors.legAnchor.L.x;
            const rx = anchors.legAnchor.R.x;
            renderer.drawRect(lx, legY, legW, legH, legColor);
            renderer.drawRect(rx, legY, legW, legH, legColor);
            
            const gapX = lx + legW;
            const gapW = rx - gapX;
            if (gapW > 0) {
                renderer.drawRect(gapX, legY, gapW, 3, legColor);
            }
        }
        if (shoeStyle !== 0) {
            drawShoeOnLeg(renderer, anchors.legAnchor.L.x, legY, legW, legH, shoeStyle, shoeColor, bitMode);
            drawShoeOnLeg(renderer, anchors.legAnchor.R.x, legY, legW, legH, shoeStyle, shoeColor, bitMode);
        }
    } 
    else if (drawMode === 1) { 
        if (chestStyle !== 0) {
            renderer.drawShadedRect(chestX, chestY, 6, bodyH, chestColor, false);
        }
        if (shoeStyle !== 0) {
            drawShoeOnLeg(renderer, anchors.legAnchor.L.x, anchors.legAnchor.L.y, 6, legH, shoeStyle, shoeColor, bitMode);
            drawShoeOnLeg(renderer, anchors.legAnchor.R.x, anchors.legAnchor.R.y, 6, legH, shoeStyle, shoeColor, bitMode);
        }
    }
};

export const drawHands = (renderer, charState, drawMode, handY, walkOffset, isFrontLayer) => {
    renderer.setLayer(isFrontLayer ? 3 : 1);
    const { hasClaws, hornColor, skinColor, baseType, chestColor, chestStyle } = charState;
    if (baseType === 1) return; 

    const hColor = hasClaws ? hornColor : (skinColor === '#fsc' ? '#ffdbac' : skinColor);
    const armW = 3; 
    const armH = 14;

    if (drawMode === 0 || drawMode === 3) { 
        if (!isFrontLayer) return; 
        
        renderer.drawRect(8, handY, armW, armH, hColor); 
        renderer.drawRect(21, handY, armW, armH, hColor);
        
        if (chestStyle !== 0 && chestStyle !== 5) {
            renderer.drawRect(8, handY, armW, 4, chestColor);
            renderer.drawRect(21, handY, armW, 4, chestColor);
        }

        renderer.drawPixel(10, handY + 12, 'transparent');
        renderer.drawPixel(21, handY + 12, 'transparent');

    } else if (drawMode === 1) { 
        if (isFrontLayer) {
            renderer.drawRect(13 + walkOffset, handY, armW, armH, hColor);
            if (chestStyle !== 0 && chestStyle !== 5) {
                renderer.drawRect(13 + walkOffset, handY, armW, 4, chestColor);
            }
        }
    }
};

// ★ Draw Back Hair (Behind Body) - Modified to use Anchors
export const drawBackHair = (renderer, charState, drawMode, anchors) => {
    const { hairStyle, hairColor, helmet, baseType } = charState;
    if (baseType === 1 || helmet !== 0 || hairStyle === 4) return; 

    renderer.setLayer(1); 
    const hY = anchors.headAnchor.topLeft.y;
    // ★ FIX 1: Use anchor for faceX instead of fixed 12
    const faceX = anchors.headAnchor.topLeft.x;

    // 1: Long
    if (hairStyle === 1) {
        if (drawMode === 0) { // Front
            renderer.drawRect(faceX - 1, hY + 2, 10, 12, hairColor); 
            // Flare
            renderer.drawRect(faceX - 2, hY + 8, 1, 6, hairColor);
            renderer.drawRect(faceX + 9, hY + 8, 1, 6, hairColor);
        } else if (drawMode === 1) { // Side
            renderer.drawRect(faceX + 3, hY + 2, 5, 12, hairColor); 
        } else if (drawMode === 3) { // Back
            renderer.drawRect(faceX - 1, hY + 1, 10, 14, hairColor);
        }
    }
};

// ★ Main Head Drawing (Front/Top Hair)
export const drawHead = (renderer, charState, drawMode, anchors) => {
    const { 
        baseType, faceShape, skinColor, hairStyle, hairColor, 
        eyeStyle, eyeColor, helmet, bitMode
    } = charState;
    
    if (baseType === 1) return;

    const faceShapeClamped = Math.max(0, Math.min(3, (faceShape || 0) | 0));
    const headColor = (skinColor === '#fsc' ? '#ffdbac' : skinColor);
    
    const getFaceAsset = (shape, mode) => {
        const key = (shape === 1) ? 'round' : (shape === 2) ? 'square' : (shape === 3) ? 'long' : 'normal';
        return (mode === 1) ? PART_ASSETS.faceSide[key] : PART_ASSETS.faceFront[key];
    };
    const faceAsset = getFaceAsset(faceShapeClamped, drawMode);
    
    let faceX = anchors.headAnchor.topLeft.x;
    let faceY = anchors.headAnchor.topLeft.y;

    // ★ FIX 2: Explicit Layer 2 for Face Base
    renderer.setLayer(2);
    renderer.drawPart(faceAsset, faceX, faceY, { palette: { F: headColor } });

    // Eye Y position for limiting hair
    const eyeY = anchors.eyeAnchor.y;

    // ★ FIX 2: Draw Hair BEFORE Eyes, Layer 3
    if (helmet === 0 && hairStyle !== 4) {
        const hY = faceY;
        const fillHair = (x, y, w, h) => renderer.drawRect(x, y, w, h, hairColor);

        renderer.setLayer(3); 
        
        // 0: Short
        if (hairStyle === 0) {
            if (drawMode === 0) {
                fillHair(faceX, hY, 8, 2); 
                fillHair(faceX, hY, 1, 4); 
                fillHair(faceX+7, hY, 1, 4); 
            } else if (drawMode === 1) {
                fillHair(faceX, hY, 8, 2);
                fillHair(faceX+4, hY, 4, 4);
            } else if (drawMode === 3) {
                fillHair(faceX, hY, 8, 8);
            }
        }
        // 1: Long
        else if (hairStyle === 1) {
            if (drawMode === 0) {
                fillHair(faceX, hY, 8, 2); 
                // ★ FIX 3: Limit vertical rect to not cover eyes (eyeY - 1)
                // Originally hY+2, height 6 -> hY+8 (Covers eyeY at hY+4)
                // New height = (eyeY - 1) - (hY + 2) + 1 = (hY + 3) - (hY + 2) + 1 = 2px
                fillHair(faceX, hY+2, 1, 2); 
                fillHair(faceX+7, hY+2, 1, 2); 
            } else if (drawMode === 1) {
                fillHair(faceX, hY, 8, 2);
                fillHair(faceX+4, hY, 4, 2); 
            } else if (drawMode === 3) {
                fillHair(faceX, hY, 8, 4);
            }
        }
        // 2: Spiky
        else if (hairStyle === 2) {
            if (drawMode === 0 || drawMode === 3) {
                fillHair(faceX, hY, 8, 2);
                renderer.drawPixel(faceX, hY-1, hairColor);
                renderer.drawPixel(faceX+2, hY-1, hairColor);
                renderer.drawPixel(faceX+4, hY-1, hairColor);
                renderer.drawPixel(faceX+6, hY-1, hairColor);
                if (drawMode === 0) {
                    fillHair(faceX, hY, 1, 3);
                    fillHair(faceX+7, hY, 1, 3);
                } else {
                    fillHair(faceX, hY, 8, 7);
                }
            } else if (drawMode === 1) {
                fillHair(faceX, hY, 8, 2);
                renderer.drawPixel(faceX+1, hY-1, hairColor);
                renderer.drawPixel(faceX+3, hY-1, hairColor);
                renderer.drawPixel(faceX+5, hY-1, hairColor);
                fillHair(faceX+5, hY, 3, 6); 
            }
        }
        // 3: Bob
        else if (hairStyle === 3) {
            if (drawMode === 0) {
                fillHair(faceX, hY, 8, 2); 
                // ★ FIX 3: Limit vertical rect for Bob too
                // Limit to eyeY - 1 = hY + 3. Starts at hY. Height = 4.
                fillHair(faceX-1, hY, 2, 4); 
                fillHair(faceX+7, hY, 2, 4); 
            } else if (drawMode === 1) {
                fillHair(faceX, hY, 8, 2);
                fillHair(faceX+2, hY, 6, 4); // Also limit side/back slightly
            } else if (drawMode === 3) {
                fillHair(faceX-1, hY, 10, 7);
            }
        }
        // 5: Mohawk
        else if (hairStyle === 5) {
             if (drawMode === 0 || drawMode === 3) {
                fillHair(faceX + 3, hY - 2, 2, 10); 
            } else if (drawMode === 1) {
                fillHair(faceX, hY - 2, 8, 2); 
                fillHair(faceX + 6, hY, 2, 8); 
            }
        }
    }

    // ★ FIX 2: Draw Eyes Last (Layer 3)
    if (drawMode !== 3) { 
        renderer.setLayer(3); // Explicitly ensure top layer
        const eyeY = anchors.eyeAnchor.y;
        if (drawMode === 0) { 
             drawEyePairFront(renderer, 13, eyeY, eyeStyle, eyeColor);
        } else if (drawMode === 1) { 
             drawEyeUnit(renderer, faceX + 1, eyeY, eyeStyle, eyeColor, true);
        }
    }
};

export const drawSlimeBody = (renderer, charState, drawMode, animationFrame) => {
    const { skinColor, eyeStyle, eyeColor, bitMode } = charState;
    const sW = 16;
    const sH = 14;
    const sX = 8;
    const sY = 18;
    const actualSkinColor = skinColor === '#fsc' ? '#ffdbac' : skinColor;

    renderer.drawRect(sX, sY, sW, sH, actualSkinColor);
    
    if (drawMode !== 3) {
         drawEyePairFront(renderer, sX + 4, sY + 4, eyeStyle, eyeColor);
    }
};