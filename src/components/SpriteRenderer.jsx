// src/components/SpriteRenderer.jsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { PixelContext } from '../renderer/PixelContext';
import { getAnchors } from '../renderer/LayoutUtils';
import { drawBody, drawHead, drawHands, drawSlimeBody, drawGroundShadow } from '../renderer/layers/BodyLayer';
import { drawWings, drawTail, drawHorns } from '../renderer/layers/MonsterPartsLayer';
import { drawWeapon, drawShield, drawHelmet, drawHeadAccessory, drawEyeAccessory, drawEarAccessory } from '../renderer/layers/EquipmentLayer';

const SpriteRenderer = forwardRef(({ 
  charState, 
  animationFrame = 0, 
  direction = 0, 
  bitMode = '16', 
  bgColor = 'transparent', 
  scale = 8,
  className = ""
}, ref) => {
  const localCanvasRef = useRef(null);
  
  useImperativeHandle(ref, () => localCanvasRef.current);

  const CANVAS_SIZE = 48;

  useEffect(() => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Reset
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // 2. Background
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    // 3. Create Buffers
    const createBuffer = () => {
      const c = document.createElement('canvas');
      c.width = CANVAS_SIZE;
      c.height = CANVAS_SIZE;
      return c;
    };
    // 0:Shadow, 1:Back, 2:Body, 3:Head/Front
    const buffers = [createBuffer(), createBuffer(), createBuffer(), createBuffer()]; 
    const ctxs = buffers.map(b => b.getContext('2d'));
    ctxs.forEach(c => { c.imageSmoothingEnabled = false; });
    
    // 4. Transform for direction (Mirroring)
    if (direction === 2) {
      ctxs.forEach(c => {
        c.translate(CANVAS_SIZE, 0);
        c.scale(-1, 1);
      });
    }

    // 5. Initialize Renderer
    const renderer = new PixelContext(ctxs, bitMode);
    
    // 6. Draw Logic
    const drawMode = direction === 2 ? 1 : direction; 
    const isRightFacing = direction === 2;
    
    // Animation offsets
    let yOffset = animationFrame === 1 ? 1 : 0;
    let walkOffset = animationFrame === 1 ? 1 : -1; 
    let itemBob = animationFrame === 1 ? 1 : 0;
    
    if (charState.baseType === 1) { // Slime logic override
       yOffset = 0; 
       if (charState.baseType === 3) { // Ghost
          yOffset = animationFrame === 1 ? 1 : -1;
          walkOffset = 0;
       }
    }

    const anchors = getAnchors({
        drawMode,
        // Head offset: 3px (created 1px gap with chest at 14)
        headY: (charState.baseType === 1 ? 18 : 3) + yOffset,
        chestY: 14 + yOffset,
        waistY: 19 + yOffset,
        legY: 24 + yOffset,
        handY: 19 + yOffset,
        walkOffset
    });

    // --- RENDER SEQUENCE ---

    drawGroundShadow(renderer, charState);

    // Layer 1/3: Back parts
    drawWings(renderer, charState, drawMode, yOffset, true);
    drawTail(renderer, charState, drawMode, yOffset, true);

    // Back Hand/Weapon (if side view)
    if (charState.baseType !== 1) {
        if (drawMode === 1) {
             if (isRightFacing) {
                 if (charState.shield > 0) drawShield(renderer, charState.shield, 14 + walkOffset, anchors.handAnchor.Front.y + itemBob, charState.shieldColor);
             } else {
                 if (charState.weapon > 0) drawWeapon(renderer, charState.weapon, 13, anchors.handAnchor.Front.y + itemBob, charState.weaponColor, true);
             }
        } else if (drawMode === 3) {
             if (charState.weapon > 0) drawWeapon(renderer, charState.weapon, 23, 19 + yOffset + itemBob, charState.weaponColor, true);
             if (charState.shield > 0) drawShield(renderer, charState.shield, 9, 19 + yOffset + itemBob, charState.shieldColor);
        }
    }

    // Layer 2: Body
    renderer.setLayer(2);
    if (charState.baseType === 1) {
        drawSlimeBody(renderer, charState, drawMode, animationFrame);
    } else {
        // 修正: walkOffset を渡す
        drawBody(renderer, charState, drawMode, animationFrame, anchors, walkOffset);
        drawHead(renderer, charState, drawMode, anchors);
    }

    // Layer 3: Front parts
    renderer.setLayer(3);
    if (charState.baseType !== 1) {
        drawWings(renderer, charState, drawMode, yOffset, false);
        drawTail(renderer, charState, drawMode, yOffset, false);
    }
    
    drawHorns(renderer, charState, drawMode, anchors.headAnchor.topLeft.y);
    drawEyeAccessory(renderer, charState.eyeAccessory, anchors.headAnchor.topLeft.y, drawMode, charState.baseType);
    drawEarAccessory(renderer, charState.earAccessory, anchors.headAnchor.topLeft.y, drawMode, charState.baseType, charState.helmet);
    drawHeadAccessory(renderer, charState.accessory, anchors.headAnchor.topLeft.y, charState.hairColor, drawMode, charState.baseType);
    drawHelmet(renderer, charState.helmet, anchors.headAnchor.topLeft.y, charState.helmetColor, drawMode);

    drawHands(renderer, charState, drawMode, anchors.handAnchor?.Front?.y || 19, walkOffset, true);

    // Front Weapon/Shield
    if (charState.baseType !== 1) {
        if (drawMode === 0) {
            if (charState.weapon > 0) drawWeapon(renderer, charState.weapon, 9, 19 + yOffset + itemBob, charState.weaponColor, false);
            if (charState.shield > 0) drawShield(renderer, charState.shield, 23, 19 + yOffset + itemBob, charState.shieldColor);
        } else if (drawMode === 1) {
            if (isRightFacing) {
                if (charState.weapon > 0) drawWeapon(renderer, charState.weapon, 12 + walkOffset, 19 + yOffset + itemBob, charState.weaponColor, true);
            } else {
                if (charState.shield > 0) drawShield(renderer, charState.shield, 12 + walkOffset, 19 + yOffset + itemBob, charState.shieldColor);
            }
        }
    }

    // 7. Composite
    if (bitMode === '32' && (charState.baseType === 1 || charState.baseType === 3)) ctx.globalAlpha = 0.8;
    ctx.drawImage(buffers[0], 0, 0);
    ctx.drawImage(buffers[1], 0, 0);
    ctx.drawImage(buffers[2], 0, 0);
    ctx.drawImage(buffers[3], 0, 0);
    ctx.globalAlpha = 1.0;

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