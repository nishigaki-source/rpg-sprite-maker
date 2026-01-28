// src/renderer/layers/BodyLayer.js
import { adjustColor } from '../../utils/colorUtils';
import { COLORS } from '../../constants/commonColors';
import { mirrorX, getAnchors } from '../LayoutUtils';
import { PART_ASSETS } from '../../constants/spriteAssets';

// --- Helper: Eyes ---
const drawEyeUnit = (renderer, ox, oy, style, color, isSide, flip = false) => {
    const baseIris = (color && color !== 'transparent') ? color : '#2c3e50';
    const lashC = adjustColor(baseIris, -100); 
    const scleraC = '#ffffff'; 
    const specC = '#ffffff';

    const p = (x, y, c) => renderer.drawPixel(ox + x, oy + y, c);
    const r = (x, y, w, h, c) => renderer.drawRect(ox + x, oy + y, w, h, c);
    const s = Math.max(0, Math.min(4, style | 0));

    // Normal
    if (s === 0) {
        if (isSide) {
            r(0, 1, 1, 2, baseIris);
        } else {
            if(!flip) { r(-1, 0, 1, 2, scleraC); r(0, 0, 2, 2, baseIris); } 
            else { r(-1, 0, 2, 2, baseIris); r(1, 0, 1, 2, scleraC); }
            r(-1, -1, 3, 1, lashC);
        }
    }
    // Big
    else if (s === 1) {
        if (isSide) { r(0, 0, 1, 3, baseIris); p(1, 1, specC); } 
        else {
            r(-1, -1, 4, 4, scleraC);
            if (!flip) { r(0, -1, 2, 3, baseIris); p(0, -1, specC); } 
            else { r(0, -1, 2, 3, baseIris); p(1, -1, specC); }
            r(-1, -1, 4, 1, lashC);
        }
    }
    // Small
    else if (s === 2) {
         if (isSide) { p(0, 1, baseIris); } 
         else {
             if (!flip) { r(0, 0, 2, 2, baseIris); } else { r(-1, 0, 2, 2, baseIris); }
         }
    }
    // Narrow
    else if (s === 3) {
        if (isSide) { r(0, 1, 2, 1, lashC); } else { r(-1, 1, 3, 1, lashC); }
    }
    // Cat
    else {
        if (isSide) { r(0, 0, 2, 3, scleraC); r(1, 0, 1, 3, baseIris); } 
        else {
            r(-1, -1, 3, 3, scleraC); r(-1, -1, 3, 1, lashC);
            r(0, -1, 1, 3, baseIris); p(0, 0, '#000000');
        }
    }
};

const drawEyePairFront = (renderer, leftOx, oy, style, color) => {
    const s = Math.max(0, Math.min(4, (style ?? 0) | 0));
    let left = leftOx;
    let right = mirrorX(left);
    if (s === 1) { // Big needs adjustment
        left = leftOx - 1;
        right = mirrorX(left) - 1;
    }
    drawEyeUnit(renderer, left,  oy, s, color, false, false);
    drawEyeUnit(renderer, right, oy, s, color, false, true);
};


// --- Main Draw Functions ---

export const drawGroundShadow = (renderer, charState) => {
    if (charState.baseType !== 3) return; // Ghost only
    renderer.setLayer(0); 
    const shadowColor = COLORS.shadow;
    renderer.getCurrentCtx().globalAlpha = 0.5;
    renderer.drawRect(12, 34, 8, 1, shadowColor);
    renderer.drawRect(13, 35, 6, 1, shadowColor);
    renderer.getCurrentCtx().globalAlpha = 1.0;
};

export const drawShoeOnLeg = (renderer, legX, legY, legW, legH, shoeStyle, shoeColor, bitMode) => {
    if (shoeStyle === 0) return; 
    const shoeH = shoeStyle === 2 ? 3 : 2; 
    const shoeY = legY + legH - shoeH;
    
    const shoeRealW = legW;
    const shoeRealX = legX;

    if (bitMode !== '8' && shoeH > 1) {
         renderer.drawRect(shoeRealX, shoeY, shoeRealW, shoeH, shoeColor);
         if (bitMode === '16') {
             renderer.drawDitherPattern(shoeRealX, shoeY + shoeH -1, shoeRealW, 1, adjustColor(shoeColor, -40));
         } else {
             renderer.drawRect(shoeRealX, shoeY + shoeH -1, shoeRealW, 1, adjustColor(shoeColor, -40)); 
         }
    } else {
         renderer.drawRect(shoeRealX, shoeY, shoeRealW, shoeH, shoeColor);
    }
};

// 指定されたボディパターン (Y13~Y27)
const BASE_BODY_PATTERN = [
    "0001111000", // Y13 (Neck)
    "1111111111", // Y14 (Shoulders)
    "1111111111", // Y15
    "1111111111", // Y16
    "0111111110", // Y17
    "0111111110", // Y18
    "0111111110", // Y19 (Waist start)
    "0111111110", // Y20
    "0111111110", // Y21
    "0111001110", // Y22
    "0111001110", // Y23
    "0110000110", // Y24 (Legs start)
    "0110000110", // Y25
    "0110000110", // Y26
    "1110000111"  // Y27 (Feet)
];

const drawBodyFromPattern = (renderer, startX, startY, color) => {
    for (let y = 0; y < BASE_BODY_PATTERN.length; y++) {
        const row = BASE_BODY_PATTERN[y];
        for (let x = 0; x < row.length; x++) {
            if (row[x] === '1') {
                renderer.drawPixel(startX + x, startY + y, color);
            }
        }
    }
};

export const drawBody = (renderer, charState, drawMode, animationFrame, anchors, walkOffset) => {
    const { 
        baseType, chestStyle, chestColor, waistStyle, waistColor, 
        legColor, shoeStyle, shoeColor, skinColor, bitMode
    } = charState;

    if (baseType === 1) return; // Slime handles its own body

    const bodyColor = (skinColor === '#fsc' ? '#ffdbac' : skinColor);
    const chestY = anchors.torsoAnchor.topLeft.y;
    const waistY = anchors.pelvisAnchor.topLeft.y;
    const legY = anchors.legAnchor.L.y;

    const isBareWaist = waistStyle === 5; 

    // --- BASE BODY DRAWING (Skin) ---
    if (drawMode === 0 || drawMode === 3) {
        if (baseType === 2) {
            // Skeleton (Custom)
            renderer.drawRect(15, chestY - 1, 2, 1, '#bdc3c7'); // Neck
            renderer.drawRect(13, chestY + 1, 6, 1, bodyColor); // Ribs
            renderer.drawRect(12, chestY + 3, 8, 1, bodyColor);
            renderer.drawRect(15, chestY + 1, 2, 4, '#2c3e50'); 
            // Waist/Legs handling for skeleton can be procedural below
        } else {
            // 修正: パターン描画のY座標を動的(chestY - 1)に変更し、アニメーションに対応
            drawBodyFromPattern(renderer, 11, chestY - 1, bodyColor);
        }
    } else if (drawMode === 1) {
        // --- Side View Base Body ---
        // Neck
        if (baseType !== 2) renderer.drawRect(14, chestY - 1, 4, 1, adjustColor(bodyColor, -20));
        else renderer.drawRect(15, chestY - 1, 2, 1, '#bdc3c7');
        
        // Chest
        renderer.drawSoftTorso(13, chestY, 6, 5, bodyColor);
        
        // Waist (Hips)
        const hipColor = isBareWaist ? bodyColor : legColor; // 裸なら肌色
        renderer.drawSoftHips(13, waistY, 6, 5, hipColor);
        
        // Legs (Width 4px)
        const legColorToUse = isBareWaist ? bodyColor : legColor;
        const l1x = 12 - walkOffset;
        renderer.drawRoundedLeg(l1x, legY, legColorToUse, 4);
        const l2x = 15 + walkOffset;
        renderer.drawRoundedLeg(l2x, legY, legColorToUse, 4);
    }

    // --- CLOTHING OVERLAY (Front/Back) ---
    if (drawMode === 0 || drawMode === 3) {
        // Chest Clothes
        if (chestStyle === 1) { renderer.drawShadedRect(11, chestY, 10, 5, chestColor, false); renderer.drawRect(9, chestY, 2, 4, chestColor); renderer.drawRect(21, chestY, 2, 4, chestColor); } 
        else if (chestStyle === 2) { renderer.drawShadedRect(10, chestY, 12, 5, chestColor, true); renderer.drawShadedRect(8, chestY - 1, 4, 4, adjustColor(chestColor, 20), true); renderer.drawShadedRect(20, chestY - 1, 4, 4, adjustColor(chestColor, 20), true); } 
        else if (chestStyle === 3) { renderer.drawRect(10, chestY, 12, 5, chestColor); renderer.drawRect(9, chestY, 2, 5, chestColor); renderer.drawRect(21, chestY, 2, 5, chestColor); } 
        else if (chestStyle === 4) { renderer.drawRect(11, chestY, 10, 5, chestColor); renderer.drawRect(11, chestY, 2, 5, adjustColor(chestColor, 20)); renderer.drawRect(19, chestY, 2, 5, adjustColor(chestColor, 20)); renderer.drawRect(9, chestY, 2, 4, chestColor); renderer.drawRect(21, chestY, 2, 4, chestColor); } 
        else if (chestStyle === 5) { renderer.drawRect(12, chestY+1, 3, 2, chestColor); renderer.drawRect(17, chestY+1, 3, 2, chestColor); } 
        
        // Waist/Leg Clothes
        const isSkirt = waistStyle === 2 || waistStyle === 4;
        
        if (isSkirt) {
            renderer.drawRect(12, waistY, 8, 1, waistColor);
            renderer.drawRect(11, waistY + 1, 10, 1, waistColor);
            renderer.drawRect(10, waistY + 2, 12, 3, waistColor);
            // Skirt Bottom
            renderer.drawRect(10, legY, 12, 1, waistColor);
            renderer.drawRect(9, legY + 1, 14, 2, waistColor);
            renderer.drawRect(8, legY + 3, 16, 1, waistColor);
        } else {
            if (!isBareWaist) {
                // Pants overlay
                renderer.drawSoftHips(11, waistY, 10, 5, legColor);
                if (waistStyle === 1) { renderer.drawRect(11, waistY, 10, 2, waistColor); renderer.drawRect(14, waistY, 4, 2, COLORS.gold); } 
                else if (waistStyle === 3) { renderer.drawRect(13, waistY, 6, 5, waistColor); } 
                else if (waistStyle === 4) { renderer.drawShadedRect(10, waistY, 12, 5, waistColor, true); renderer.drawRect(15, waistY, 2, 5, adjustColor(waistColor, -20)); }
                
                // Pants Legs overlay (Width 4px)
                renderer.drawRoundedLeg(11, legY, legColor, 4);
                renderer.drawRoundedLeg(17, legY, legColor, 4);
            }
        }

        // Shoes
        if (!isSkirt && shoeStyle !== 0) {
            if (isBareWaist) {
                // Shoes on bare legs (Pattern legs width is irregular, but shoes are 4px)
                drawShoeOnLeg(renderer, 11, legY, 4, 4, shoeStyle, shoeColor, bitMode);
                drawShoeOnLeg(renderer, 17, legY, 4, 4, shoeStyle, shoeColor, bitMode);
            } else {
                // Shoes on pants
                drawShoeOnLeg(renderer, 11, legY, 4, 4, shoeStyle, shoeColor, bitMode);
                drawShoeOnLeg(renderer, 17, legY, 4, 4, shoeStyle, shoeColor, bitMode);
            }
        }
    }

    // --- CLOTHING OVERLAY (Side) ---
    if (drawMode === 1) {
        if (chestStyle === 1) { renderer.drawShadedRect(13, chestY, 6, 5, chestColor, false); renderer.drawRect(14 + walkOffset, chestY + 1, 3, 3, chestColor); } 
        else if (chestStyle === 2) { renderer.drawShadedRect(12, chestY, 8, 5, chestColor, true); renderer.drawShadedRect(12 + walkOffset, chestY - 1, 4, 4, adjustColor(chestColor, 20), true); } 
        else if (chestStyle === 3) { renderer.drawRect(12, chestY, 8, 5, chestColor); renderer.drawRect(14 + walkOffset, chestY + 1, 4, 4, chestColor); } 
        else if (chestStyle === 4) { renderer.drawRect(13, chestY, 6, 5, chestColor); renderer.drawRect(14 + walkOffset, chestY + 1, 3, 3, chestColor); } 
        else if (chestStyle === 5) { renderer.drawRect(13, chestY+1, 4, 2, chestColor); renderer.drawRect(14 + walkOffset, chestY + 1, 2, 2, bodyColor); } 
        else { renderer.drawRect(14 + walkOffset, chestY + 1, 2, 4, bodyColor); }

        const isSkirt = waistStyle === 2 || waistStyle === 4;
        if (isSkirt) {
            renderer.drawRect(14, waistY, 4, 1, waistColor);
            renderer.drawRect(13, waistY+1, 6, 1, waistColor);
            renderer.drawRect(12, waistY+2, 8, 3, waistColor);
            // Skirt Bottom
            renderer.drawRect(11, legY, 10, 1, waistColor);
            renderer.drawRect(10, legY + 1, 12, 2, waistColor);
            renderer.drawRect(9, legY + 3, 14, 1, waistColor);
        } else {
            if (!isBareWaist) {
                if (waistStyle === 1) { renderer.drawRect(13, waistY, 6, 2, waistColor); } 
                else if (waistStyle === 3) { renderer.drawRect(12, waistY, 8, 5, waistColor); } 
                else if (waistStyle === 4) { renderer.drawShadedRect(12, waistY, 8, 5, waistColor, true); }
            }
            // Shoes (Side) - Width 4px
            if (shoeStyle !== 0) {
                drawShoeOnLeg(renderer, 12 - walkOffset, legY, 4, 4, shoeStyle, shoeColor, bitMode);
                drawShoeOnLeg(renderer, 15 + walkOffset, legY, 4, 4, shoeStyle, shoeColor, bitMode);
            }
        }
    }

    if (baseType === 3) { // Ghost overrides
        if (drawMode === 0) { renderer.drawRect(12, legY, 8, 4, chestColor); renderer.drawRect(14, legY+4, 4, 3, chestColor); } 
        else if (drawMode === 1) { renderer.drawRect(13, legY, 6, 5, chestColor); renderer.drawRect(15 - (walkOffset || 0), legY+5, 2, 3, chestColor); }
    }
};

// ... (drawHands, drawHead, drawSlimeBody unchanged) ...
export const drawHands = (renderer, charState, drawMode, handY, walkOffset, isFrontLayer) => {
    renderer.setLayer(isFrontLayer ? 3 : 1);
    const { hasClaws, hornColor, skinColor, baseType } = charState;
    if (baseType === 1) return; 

    const hColor = hasClaws ? hornColor : (skinColor === '#fsc' ? '#ffdbac' : skinColor);
    const hLen = hasClaws ? 3 : 2;

    if (drawMode === 0 || drawMode === 3) { 
        if (!isFrontLayer) return; 
        renderer.drawRect(8, handY, 2, hLen, hColor); 
        renderer.drawRect(22, handY, 2, hLen, hColor);
    } else if (drawMode === 1) { 
        if (isFrontLayer) {
            renderer.drawRect(13 + walkOffset, handY, 3, hLen, hColor);
        }
    }
};

export const drawHead = (renderer, charState, drawMode, anchors) => {
    const { 
        baseType, faceShape, skinColor, hairStyle, hairColor, 
        eyeStyle, eyeColor, hasFangs, helmet, bitMode
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
    if (faceShapeClamped === 3) {
        faceY -= 1;
        if (drawMode !== 1) faceX += 1;
    }

    renderer.drawPart(faceAsset, faceX, faceY, { palette: { F: headColor } });

    if (bitMode !== '8') {
            const cSkinLight = adjustColor(headColor, 22);
            renderer.drawPixel(faceX + 2, faceY + 2, cSkinLight);
    }

    if (baseType === 4 || baseType === 8) {
            if (drawMode !== 1) {
                renderer.drawRect(8,  faceY + 3, 2, 4, headColor);
                renderer.drawRect(22, faceY + 3, 2, 4, headColor);
            } else {
                renderer.drawRect(10, faceY + 3, 2, 4, headColor);
            }
    }
    if (baseType === 6) {
            if (drawMode === 0) renderer.drawRect(14, faceY + 7, 4, 2, COLORS.gold); 
            else if (drawMode === 1) renderer.drawRect(8, faceY + 5, 3, 2, COLORS.gold);
    }
    
    if (drawMode === 3) return; 

    const eyeY = anchors.eyeAnchor.y;
    if (drawMode === 0) { 
        if (baseType === 2) { 
             renderer.drawRect(12, eyeY, 3, 3, '#2c3e50'); 
             renderer.drawRect(17, eyeY, 3, 3, '#2c3e50'); 
             renderer.drawRect(15, eyeY + 5, 2, 1, '#2c3e50'); 
        } else {
             drawEyePairFront(renderer, anchors.eyeAnchor.leftOx, eyeY, eyeStyle, eyeColor);
             
             if (hasFangs || baseType === 4 || baseType === 7) {
                const fxL = (faceShapeClamped === 3) ? 14 : 13;
                const fxR = (faceShapeClamped === 3) ? 17 : 18;
                renderer.drawPixel(fxL, eyeY + 3, '#fff');
                renderer.drawPixel(fxR, eyeY + 3, '#fff');
             }
             if (baseType === 9) { 
                 renderer.drawRect(11, eyeY + 3, 10, 4, hairColor); 
                 renderer.drawRect(12, eyeY + 7, 8, 1, hairColor); 
             }
        }
    } else if (drawMode === 1) { 
        const eyeX = 11;
        if (baseType === 2) { 
            renderer.drawRect(eyeX + 1, eyeY, 3, 3, '#2c3e50'); 
        } else {
             drawEyeUnit(renderer, anchors.eyeAnchor.center.x, eyeY, eyeStyle, eyeColor, true);
             
             if (hasFangs || baseType === 4 || baseType === 7) {
                 renderer.drawPixel(eyeX + 1, eyeY + 3, '#fff');
             }
             if (baseType === 9) {
                 renderer.drawRect(11, eyeY + 3, 3, 4, hairColor);
                 renderer.drawRect(12, eyeY + 7, 2, 1, hairColor);
             }
        }
    }

    if (helmet === 0 && hairStyle !== 4) {
        const hY = anchors.headAnchor.topLeft.y;
        const cHairLight = adjustColor(hairColor, 28);
        
        const fillHair = (x, y, w, h) => { 
            renderer.drawRect(x, y, w, h, hairColor); 
            if (bitMode !== '8' && h >= 3) { 
                const ctx = renderer.getCurrentCtx(); 
                ctx.fillStyle = cHairLight; 
                ctx.fillRect((x+renderer.OFFSET_X), (y+renderer.OFFSET_Y+1), w, 1); 
            } 
        };

        renderer.setLayer(1); 
        if (drawMode === 0) { 
             if (hairStyle === 0) { renderer.drawRect(9, hY, 2, 6, hairColor); renderer.drawRect(21, hY, 2, 6, hairColor); }
             else if (hairStyle === 1) { renderer.drawRect(9, hY, 2, 12, hairColor); renderer.drawRect(21, hY, 2, 12, hairColor); }
             else if (hairStyle === 2) { renderer.drawRect(9, hY, 2, 4, hairColor); renderer.drawRect(21, hY, 2, 4, hairColor); }
             else if (hairStyle === 3) { renderer.drawRect(8, hY + 1, 3, 8, hairColor); renderer.drawRect(21, hY + 1, 3, 8, hairColor); }
        } else if (drawMode === 1) { 
             if (hairStyle === 0) { renderer.drawRect(17, hY + 1, 4, 4, hairColor); renderer.drawRect(18, hY + 5, 2, 2, hairColor); }
             else if (hairStyle === 1) { renderer.drawRect(16, hY, 6, 9, hairColor); renderer.drawRect(17, hY + 9, 5, 3, hairColor); }
             else if (hairStyle === 2) { renderer.drawRect(18, hY + 2, 2, 3, hairColor); }
             else if (hairStyle === 3) { renderer.drawRect(16, hY + 1, 6, 7, hairColor); renderer.drawRect(17, hY + 8, 5, 2, hairColor); }
        }

        renderer.setLayer(2); 
        if (drawMode === 0) {
            fillHair(10, hY - 2, 12, 3);
            renderer.drawPixel(12, hY + 1, hairColor); renderer.drawPixel(13, hY + 2, hairColor);
            renderer.drawPixel(15, hY + 1, hairColor); renderer.drawPixel(16, hY + 2, hairColor);
            renderer.drawPixel(18, hY + 1, hairColor); renderer.drawPixel(19, hY + 2, hairColor);
            
            if (hairStyle === 1) fillHair(11, hY, 10, 2); 
            else if (hairStyle === 2) { renderer.drawRect(14, hY - 4, 4, 4, hairColor); renderer.drawRect(10, hY - 1, 12, 2, hairColor); } 
            else if (hairStyle === 3) { renderer.drawRect(11, hY, 3, 3, hairColor); renderer.drawRect(18, hY, 3, 3, hairColor); }
        } else if (drawMode === 1) {
            fillHair(11, hY - 1, 8, 3);
            renderer.drawPixel(10, hY + 1, hairColor); renderer.drawPixel(11, hY + 3, hairColor);
            if (hairStyle === 0) renderer.drawRect(13, hY, 6, 5, hairColor);
            else if (hairStyle === 1) { renderer.drawRect(13, hY, 7, 9, hairColor); renderer.drawRect(14, hY + 9, 6, 2, hairColor); }
            else if (hairStyle === 2) { renderer.drawRect(12, hY - 2, 7, 3, hairColor); renderer.drawRect(13, hY + 1, 6, 4, hairColor); }
            else if (hairStyle === 3) { renderer.drawRect(12, hY - 1, 7, 7, hairColor); renderer.drawRect(13, hY + 6, 6, 2, hairColor); }
        } else if (drawMode === 3) {
             if (hairStyle === 0) { fillHair(10, hY - 2, 12, 3); renderer.drawRect(9, hY, 14, 6, hairColor); }
             else if (hairStyle === 1) { fillHair(10, hY - 2, 12, 3); renderer.drawRect(9, hY, 14, 12, hairColor); }
             else if (hairStyle === 2) { renderer.drawRect(14, hY - 4, 4, 4, hairColor); renderer.drawRect(9, hY, 14, 5, hairColor); }
             else if (hairStyle === 3) { fillHair(10, hY - 2, 12, 4); renderer.drawRect(8, hY + 1, 16, 8, hairColor); }
        }
    }
    if (hairStyle === 4 && drawMode !== 3) { // Skinhead shine
        renderer.drawRect(12, anchors.headAnchor.topLeft.y + 1, 2, 2, 'rgba(255,255,255,0.3)');
    }
};

export const drawSlimeBody = (renderer, charState, drawMode, animationFrame) => {
    const { skinColor, eyeStyle, eyeColor, hairStyle, hairColor, bitMode } = charState;
    const sW = animationFrame === 0 ? 16 : 18;
    const sH = animationFrame === 0 ? 14 : 12;
    const sX = (32 - sW) / 2;
    const sY = 32 - sH;
    const actualSkinColor = skinColor === '#fsc' ? '#ffdbac' : skinColor;

    if (bitMode === '8') {
         renderer.drawRect(sX + 1, sY, sW - 2, sH, actualSkinColor);
         renderer.drawRect(sX, sY + 1, 1, sH - 1, actualSkinColor);
         renderer.drawRect(sX + sW - 1, sY + 1, 1, sH - 1, actualSkinColor);
    } else {
         renderer.drawAntiAliasedBlock(sX, sY, sW, sH, actualSkinColor);
         if (bitMode === '16') {
             renderer.drawDitherPattern(sX+1, sY+sH-2, sW-2, 2, adjustColor(actualSkinColor, -34));
         }
    }
    if(bitMode !== '8') renderer.drawPixel(sX + 3, sY + 3, adjustColor(actualSkinColor, 22));
    
    const eyeY = sY + 4;
    if (drawMode !== 3) {
         const leftOx = sX + 4;
         drawEyePairFront(renderer, leftOx, eyeY, eyeStyle, eyeColor);
    }
    
    if (hairStyle !== 4) { 
         const hY = sY - 2; 
         const fillHair = (x, y, w, h) => { renderer.drawRect(x, y, w, h, hairColor); };
         if (hairStyle === 0) { fillHair(sX+2, hY, sW-4, 3); }
         else if (hairStyle === 1) { fillHair(sX+2, hY, sW-4, 8); }
         else if (hairStyle === 2) { fillHair(sX+4, hY-2, sW-8, 5); }
         else if (hairStyle === 3) { fillHair(sX+1, hY, sW-2, 6); }
    }
};