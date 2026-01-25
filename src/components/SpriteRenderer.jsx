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
  
  // 親コンポーネントからキャンバスへのアクセスを提供
  useImperativeHandle(ref, () => localCanvasRef.current);

  const CANVAS_SIZE = 48;
  const OFFSET_X = 8;
  const OFFSET_Y = 8;

  useEffect(() => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // キャンバス初期化
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

    const buffers = [createBuffer(), createBuffer(), createBuffer()]; // 0:Back, 1:Body, 2:Head
    const ctxs = buffers.map(b => b.getContext('2d'));
    
    let currentLayer = 1; 
    const setLayer = (idx) => { currentLayer = idx; };
    
    // シンプルなドット描画
    const drawPixel = (x, y, color) => {
      const c = ctxs[currentLayer];
      c.fillStyle = color;
      c.fillRect(x + OFFSET_X, y + OFFSET_Y, 1, 1);
    };

    const drawRect = (x, y, w, h, color) => {
      const c = ctxs[currentLayer];
      c.fillStyle = color;
      c.fillRect(x + OFFSET_X, y + OFFSET_Y, w, h);
    };

    // シェーディング描画ヘルパー (8/16/32-bit対応)
    const drawShadedRect = (x, y, w, h, baseColor, isMetal = false) => {
      const c = ctxs[currentLayer];
      
      if (bitMode === '8') {
        // 8-BIT: 単色
        c.fillStyle = baseColor;
        c.fillRect(x + OFFSET_X, y + OFFSET_Y, w, h);
        return;
      }
      
      if (bitMode === '32') {
        // 32-BIT: グラデーション
        const gradient = c.createLinearGradient(
          x + OFFSET_X, 
          y + OFFSET_Y, 
          x + OFFSET_X + w, 
          y + OFFSET_Y + h
        );
        
        if (isMetal) {
          // 金属光沢
          gradient.addColorStop(0, adjustColor(baseColor, 60));
          gradient.addColorStop(0.3, baseColor);
          gradient.addColorStop(0.5, adjustColor(baseColor, 40)); 
          gradient.addColorStop(1, adjustColor(baseColor, -60));
        } else {
          // 滑らかなシェーディング
          gradient.addColorStop(0, adjustColor(baseColor, 20));
          gradient.addColorStop(1, adjustColor(baseColor, -30));
        }
        
        c.fillStyle = gradient;
        c.fillRect(x + OFFSET_X, y + OFFSET_Y, w, h);
        return;
      }

      // 16-BIT: ドットシェーディング
      const light = adjustColor(baseColor, 40);
      const dark = adjustColor(baseColor, -40);
      
      drawRect(x, y, w, h, baseColor); 
      drawRect(x, y, w, 1, light); // Top
      drawRect(x, y, 1, h, light); // Left
      drawRect(x + w - 1, y, 1, h, dark); // Right
      drawRect(x, y + h - 1, w, 1, dark); // Bottom
      drawPixel(x + w - 1, y, baseColor); 
      drawPixel(x, y + h - 1, baseColor);
    };

    const { 
      baseType,
      skinColor, hairStyle, hairColor, eyeStyle, eyeColor, hasWhiteEye,
      chestStyle, chestColor, waistStyle, waistColor, 
      legColor, shoeStyle, shoeColor, 
      accessory, eyeAccessory, earAccessory,
      horns, hornColor, wings, wingColor, tail, tailColor, hasFangs, hasClaws,
      weapon, shield, helmet, helmetColor, weaponColor, shieldColor
    } = charState;

    const actualSkinColor = skinColor === '#fsc' ? '#ffdbac' : skinColor;
    
    // 派生カラー
    const cSkinLight = adjustColor(actualSkinColor, 30);
    const cSkinShadow = adjustColor(actualSkinColor, -30);
    const cHairLight = adjustColor(hairColor, 40);
    const cHairShadow = adjustColor(hairColor, -40);
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

    // アニメーション変数
    let yOffset = animationFrame === 1 ? 1 : 0;
    let walkOffset = animationFrame === 1 ? 1 : -1; 
    let tailOffset = animationFrame === 1 ? 1 : 0; 
    let itemBob = animationFrame === 1 ? 1 : 0; 

    // スライム用の変数
    let slimeHeadY = 4 + yOffset; 
    if (baseType === 1) { // Slime
       yOffset = 0; 
       slimeHeadY = 18 + (animationFrame === 0 ? 0 : 1);
    } else if (baseType === 3) { // Ghost
       yOffset = animationFrame === 1 ? 1 : -1;
       walkOffset = 0;
    }

    // 羽のアニメーション同期
    let wingOffset = yOffset; 

    const activeHeadY = (baseType === 1) ? slimeHeadY : (4 + yOffset);
    const headY = 4 + yOffset;
    const baseHandY = 19; 

    const drawShoeOnLeg = (legX, legY, legW, legH) => {
        if (shoeStyle === 0) return; 
        if (baseType === 2 || baseType === 3 || baseType === 1) return; 
        
        const shoeH = shoeStyle === 2 ? 3 : 2; 
        const shoeY = legY + legH - shoeH;
        if (bitMode !== '8' && shoeH > 1) {
             drawRect(legX, shoeY, legW, shoeH, shoeColor);
             drawRect(legX, shoeY + shoeH -1, legW, 1, adjustColor(shoeColor, -40)); 
        } else {
             drawRect(legX, shoeY, legW, shoeH, shoeColor);
        }
    };

    const getHandColor = () => hasClaws ? hornColor : actualSkinColor; 
    const getHandLen = () => hasClaws ? 3 : 2;

    // --- EQUIPMENT DRAWING HELPERS ---

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

    // --- PARTS DRAWING ---

    const drawWings = (isBackLayer) => {
      if (wings === 0) return;
      const wc = wingColor;
      const wcDark = adjustColor(wc, -30);
      setLayer(isBackLayer ? 0 : 2); 
      const sY = baseType === 1 ? 16 : 0;

      const fillWing = (x, y, w, h, c) => {
        drawRect(x, y, w, h, c);
        if (bitMode !== '8' && w > 2 && h > 2) { drawRect(x+1, y+h-1, w-1, 1, wcDark); }
      };

      if (drawMode === 0) { // Front
        if (!isBackLayer) return; 
        const wy = 14 + wingOffset + sY;
        if (wings === 1) { fillWing(4, wy, 6, 1, wc); fillWing(22, wy, 6, 1, wc); fillWing(3, wy+1, 2, 4, wc); fillWing(27, wy+1, 2, 4, wc); fillWing(5, wy+1, 1, 1, wc); fillWing(26, wy+1, 1, 1, wc); fillWing(6, wy+2, 1, 1, wc); fillWing(25, wy+2, 1, 1, wc); } 
        else if (wings === 2) { fillWing(5, wy-2, 5, 8, '#ecf0f1'); fillWing(22, wy-2, 5, 8, '#ecf0f1'); drawPixel(4, wy-1, '#bdc3c7'); drawPixel(27, wy-1, '#bdc3c7'); } 
        else if (wings === 3) { fillWing(6, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)'); fillWing(22, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)'); } 
        else if (wings === 4) { fillWing(2, wy-4, 8, 2, wc); fillWing(22, wy-4, 8, 2, wc); fillWing(1, wy-2, 2, 6, wc); fillWing(29, wy-2, 2, 6, wc); fillWing(3, wy-2, 6, 4, wc); fillWing(23, wy-2, 6, 4, wc); } 
        else if (wings === 5) { fillWing(2, wy - 4, 8, 6, wc); fillWing(22, wy - 4, 8, 6, wc); fillWing(4, wy + 2, 6, 6, adjustColor(wc, -20)); fillWing(22, wy + 2, 6, 6, adjustColor(wc, -20)); drawPixel(5, wy - 1, '#fff'); drawPixel(26, wy - 1, '#fff'); } 
        else if (wings === 6) { const metalC = '#95a5a6'; drawRect(4, wy, 8, 2, metalC); drawRect(20, wy, 8, 2, metalC); drawRect(2, wy - 6, 2, 12, wc); drawRect(28, wy - 6, 2, 12, wc); drawRect(0, wy - 2, 2, 4, adjustColor(wc, 40)); drawRect(30, wy - 2, 2, 4, adjustColor(wc, 40)); }
      } 
      else if (drawMode === 1) { // Side
        if (isBackLayer) return; // 手前のみ描画（背中から生える1枚）
        
        const wy = wingOffset + sY;
        const useLeftWing = (direction === 1); 
        // 方向によってベース位置を切り替え
        const offX = useLeftWing ? 24 : -16;
        
        // 背中から離すための微調整(-3)と、高さの微調整(+2)
        const finalOffX = offX - 3;
        const finalOffY = 2;

        if (wings === 1) { // Bat
          if (useLeftWing) {
             fillWing(4 + finalOffX, 14 + wy + finalOffY, 6, 1, wc); fillWing(3 + finalOffX, 15 + wy + finalOffY, 2, 4, wc); fillWing(5 + finalOffX, 15 + wy + finalOffY, 1, 1, wc); fillWing(6 + finalOffX, 16 + wy + finalOffY, 1, 1, wc);
          } else {
             fillWing(22 + finalOffX, 14 + wy + finalOffY, 6, 1, wc); fillWing(27 + finalOffX, 15 + wy + finalOffY, 2, 4, wc); fillWing(26 + finalOffX, 15 + wy + finalOffY, 1, 1, wc); fillWing(25 + finalOffX, 16 + wy + finalOffY, 1, 1, wc);
          }
        } else if (wings === 2) { // Angel
          if (useLeftWing) {
             fillWing(5 + finalOffX, 12 + wy + finalOffY, 5, 8, '#ecf0f1'); drawPixel(4 + finalOffX, 13 + wy + finalOffY, '#bdc3c7');
          } else {
             fillWing(22 + finalOffX, 12 + wy + finalOffY, 5, 8, '#ecf0f1'); drawPixel(27 + finalOffX, 13 + wy + finalOffY, '#bdc3c7');
          }
        } else if (wings === 3) { // Fairy
          if (useLeftWing) {
             fillWing(6 + finalOffX, 13 + wy + finalOffY, 4, 6, 'rgba(162, 155, 254, 0.6)');
          } else {
             fillWing(22 + finalOffX, 13 + wy + finalOffY, 4, 6, 'rgba(162, 155, 254, 0.6)');
          }
        } else if (wings === 4) { // Dragon
          if (useLeftWing) {
             fillWing(2 + finalOffX, 10 + wy + finalOffY, 8, 2, wc); fillWing(1 + finalOffX, 12 + wy + finalOffY, 2, 6, wc); fillWing(3 + finalOffX, 12 + wy + finalOffY, 6, 4, wc);
          } else {
             fillWing(22 + finalOffX, 10 + wy + finalOffY, 8, 2, wc); fillWing(29 + finalOffX, 12 + wy + finalOffY, 2, 6, wc); fillWing(23 + finalOffX, 12 + wy + finalOffY, 6, 4, wc);
          }
        } else if (wings === 5) { // Butterfly
           if (useLeftWing) {
              fillWing(2 + finalOffX, 10 + wy + finalOffY, 8, 6, wc); fillWing(4 + finalOffX, 16 + wy + finalOffY, 6, 6, adjustColor(wc, -20)); drawPixel(5 + finalOffX, 13 + wy + finalOffY, '#fff');
           } else {
              fillWing(22 + finalOffX, 10 + wy + finalOffY, 8, 6, wc); fillWing(22 + finalOffX, 16 + wy + finalOffY, 6, 6, adjustColor(wc, -20)); drawPixel(26 + finalOffX, 13 + wy + finalOffY, '#fff');
           }
        } else if (wings === 6) { // Mechanical
           const metalC = '#95a5a6';
           if (useLeftWing) {
              drawRect(4 + finalOffX, 14 + wy + finalOffY, 8, 2, metalC); drawRect(2 + finalOffX, 8 + wy + finalOffY, 2, 12, wc); drawRect(0 + finalOffX, 12 + wy + finalOffY, 2, 4, adjustColor(wc, 40));
           } else {
              drawRect(20 + finalOffX, 14 + wy + finalOffY, 8, 2, metalC); drawRect(28 + finalOffX, 8 + wy + finalOffY, 2, 12, wc); drawRect(30 + finalOffX, 12 + wy + finalOffY, 2, 4, adjustColor(wc, 40));
           }
        }
      }
      else if (drawMode === 3) { // Back
        if (isBackLayer) return; 
        const wy = 14 + wingOffset + sY;
        if (wings === 1) { fillWing(4, wy, 24, 1, wc); fillWing(2, wy-1, 10, 6, wc); fillWing(20, wy-1, 10, 6, wc); } 
        else if (wings === 2) { fillWing(6, wy-1, 8, 8, '#ecf0f1'); fillWing(18, wy-1, 8, 8, '#ecf0f1'); } 
        else if (wings === 3) { fillWing(8, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)'); fillWing(20, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)'); } 
        else if (wings === 4) { fillWing(3, wy-3, 10, 8, wc); fillWing(19, wy-3, 10, 8, wc); }
        else if (wings === 5) { fillWing(2, wy - 4, 8, 6, wc); fillWing(22, wy - 4, 8, 6, wc); fillWing(4, wy + 2, 6, 6, adjustColor(wc, -20)); fillWing(22, wy + 2, 6, 6, adjustColor(wc, -20)); }
        else if (wings === 6) { const metalC = '#95a5a6'; drawRect(4, wy, 8, 2, metalC); drawRect(20, wy, 8, 2, metalC); drawRect(2, wy - 6, 2, 12, wc); drawRect(28, wy - 6, 2, 12, wc); }
      }
    };

    const drawTail = (isBackLayer) => {
      if (tail === 0 && baseType !== 5) return; 
      const useTail = (baseType === 5 && tail === 0) ? 3 : tail; 
      if (useTail === 0) return;

      const tc = (baseType === 5) ? actualSkinColor : tailColor;
      setLayer(isBackLayer ? 0 : 2); 
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
        if (useTail === 1) { drawRect(18, 22 + tailOffset + sY, 4, 1, tc); drawRect(21, 18 + tailOffset + sY, 2, 4, tc); } 
        else if (useTail === 2) { drawRect(17, 23 + tailOffset + sY, 5, 3, tc); } 
        else if (useTail === 3) { drawRect(16, 21 + sY, 3, 3, tc); drawRect(17, 23 + sY, 3, 3, tc); drawRect(19, 25 + sY, 6, 3, tc); }
        else if (useTail === 4) { drawRect(17, 20 + sY + tailOffset, 6, 4, tc); drawRect(20, 18 + sY + tailOffset, 4, 2, '#fff'); }
        else if (useTail === 5) { drawRect(18, 22 + sY + tailOffset, 2, 2, tc); drawRect(19, 20 + sY + tailOffset, 2, 4, tc); }
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

      setLayer(2); 
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
        setLayer(2);
        
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
        setLayer(2);
        
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
        setLayer(2);
        
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

    // ★ 復活させた drawHands 関数
    const drawHands = (isFrontLayer) => {
        setLayer(isFrontLayer ? 2 : 0);
        const hColor = getHandColor();
        const hLen = getHandLen();
        if (baseType === 1) return; 

        const handY = 19 + yOffset; 
        
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


    // --- MAIN RENDER SEQUENCE ---

    drawWings(true);
    drawTail(true);
    
    setLayer(0); 
    if (baseType !== 1 && baseType !== 2) { // Hair back
        if (hairStyle !== 4) { // Not Skinhead
            if (drawMode === 1) { 
                 if (hairStyle === 0) { drawRect(17, headY, 4, 7, hairColor); if(bitMode !== '8') drawRect(17, headY+6, 4, 1, cHairShadow); }
                 else if (hairStyle === 1) { 
                     drawRect(15, headY, 8, 12, hairColor); 
                     if(bitMode !== '8') { 
                        drawRect(15, headY+11, 8, 1, cHairShadow); 
                        drawRect(15, headY+3, 8, 1, cHairLight); 
                     } 
                 }
                 else if (hairStyle === 2) { drawRect(18, headY, 3, 5, hairColor); }
                 else if (hairStyle === 3) { drawRect(15, headY + 1, 6, 8, hairColor); if(bitMode !== '8') { drawRect(15, headY+8, 6, 1, cHairShadow); } }
            } else if (drawMode === 0) { 
                 if (hairStyle === 0) { drawRect(9, headY, 2, 6, hairColor); drawRect(21, headY, 2, 6, hairColor); }
                 else if (hairStyle === 1) { drawRect(9, headY, 2, 12, hairColor); drawRect(21, headY, 2, 12, hairColor); }
                 else if (hairStyle === 2) { drawRect(9, headY, 2, 4, hairColor); drawRect(21, headY, 2, 4, hairColor); }
                 else if (hairStyle === 3) { drawRect(8, headY + 1, 3, 8, hairColor); drawRect(21, headY + 1, 3, 8, hairColor); }
            }
        }
    } else if (baseType === 1 && hairStyle !== 4) { // Slime Back Hair
        const hY = activeHeadY - 2;
        const sX = 4; // Side view shift
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

    // 2. EQUIPMENT (BACK LAYER)
    setLayer(0);
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

    // 3. BODY PARTS (Layer 1)
    setLayer(1);

    if (baseType === 1) { 
        // Slime Body
        const sW = animationFrame === 0 ? 16 : 18;
        const sH = animationFrame === 0 ? 14 : 12;
        const sX = (32 - sW) / 2;
        const sY = 32 - sH;
        drawShadedRect(sX, sY, sW, sH, actualSkinColor);
        if(bitMode !== '8') drawPixel(sX + 3, sY + 3, cSkinLight);
    } 
    else {
        // ... (Humanoid body logic) ...
        const bodyColor = baseType === 2 ? '#bdc3c7' : actualSkinColor;
        const chestY = 14 + yOffset;
        const drawChest = (mode) => {
            if (mode === 0 || mode === 3) { 
                if (baseType === 2) { 
                    drawRect(13, chestY + 1, 6, 1, bodyColor);
                    drawRect(12, chestY + 3, 8, 1, bodyColor);
                    drawRect(15, chestY + 1, 2, 4, '#2c3e50'); 
                } else {
                    drawRect(11, chestY, 10, 5, bodyColor);
                }
                if (chestStyle === 1) { drawShadedRect(11, chestY, 10, 5, chestColor); drawRect(9, chestY, 2, 4, chestColor); drawRect(21, chestY, 2, 4, chestColor); } 
                else if (chestStyle === 2) { drawShadedRect(10, chestY, 12, 5, chestColor); drawShadedRect(8, chestY - 1, 4, 4, adjustColor(chestColor, 20)); drawShadedRect(20, chestY - 1, 4, 4, adjustColor(chestColor, 20)); } 
                else if (chestStyle === 3) { drawRect(10, chestY, 12, 5, chestColor); drawRect(9, chestY, 2, 5, chestColor); drawRect(21, chestY, 2, 5, chestColor); } 
                else if (chestStyle === 4) { drawRect(11, chestY, 10, 5, chestColor); drawRect(11, chestY, 2, 5, adjustColor(chestColor, 20)); drawRect(19, chestY, 2, 5, adjustColor(chestColor, 20)); drawRect(9, chestY, 2, 4, chestColor); drawRect(21, chestY, 2, 4, chestColor); } 
                else if (chestStyle === 5) { drawRect(12, chestY+1, 3, 2, chestColor); drawRect(17, chestY+1, 3, 2, chestColor); drawRect(9, chestY, 2, 2, actualSkinColor); drawRect(21, chestY, 2, 2, actualSkinColor); } 
                else { drawRect(9, chestY, 2, 4, actualSkinColor); drawRect(21, chestY, 2, 4, actualSkinColor); }

            } else if (mode === 1) { 
                if(baseType === 2) drawRect(14, chestY+1, 4, 4, bodyColor); else drawRect(13, chestY, 6, 5, bodyColor);
                if (chestStyle === 1) { drawShadedRect(13, chestY, 6, 5, chestColor); drawRect(14 + walkOffset, chestY + 1, 3, 3, chestColor); } 
                else if (chestStyle === 2) { drawShadedRect(12, chestY, 8, 5, chestColor); drawShadedRect(12 + walkOffset, chestY - 1, 4, 4, adjustColor(chestColor, 20)); } 
                else if (chestStyle === 3) { drawRect(12, chestY, 8, 5, chestColor); drawRect(14 + walkOffset, chestY + 1, 4, 4, chestColor); } 
                else if (chestStyle === 4) { drawRect(13, chestY, 6, 5, chestColor); drawRect(14 + walkOffset, chestY + 1, 3, 3, chestColor); } 
                else if (chestStyle === 5) { drawRect(13, chestY+1, 4, 2, chestColor); drawRect(14 + walkOffset, chestY + 1, 2, 2, actualSkinColor); } 
                else { drawRect(14 + walkOffset, chestY + 1, 2, 4, actualSkinColor); }
            }
        };
        drawChest(drawMode);

        const waistY = 19 + yOffset;
        const drawWaist = (mode) => {
            const wColor = waistColor;
            if (mode === 0 || mode === 3) { 
                 drawRect(11, waistY, 10, 5, legColor);
                 if (waistStyle === 1) { drawRect(11, waistY, 10, 2, wColor); drawRect(14, waistY, 4, 2, cGold); } 
                 else if (waistStyle === 2) { drawShadedRect(10, waistY, 12, 5, wColor); } 
                 else if (waistStyle === 3) { drawRect(13, waistY, 6, 5, wColor); } 
                 else if (waistStyle === 4) { drawShadedRect(10, waistY, 12, 5, wColor); drawRect(15, waistY, 2, 5, adjustColor(wColor, -20)); }
            } else if (mode === 1) { 
                 drawRect(13, waistY, 6, 5, legColor);
                 if (waistStyle === 1) { drawRect(13, waistY, 6, 2, wColor); } 
                 else if (waistStyle === 2) { drawShadedRect(12, waistY, 8, 5, wColor); } 
                 else if (waistStyle === 3) { drawRect(12, waistY, 8, 5, wColor); } 
                 else if (waistStyle === 4) { drawShadedRect(12, waistY, 8, 5, wColor); }
            }
        };
        drawWaist(drawMode);

        const legY = 24 + yOffset;
        if (baseType !== 3) { 
            const drawLegs = (mode) => {
                const isSkirt = waistStyle === 2 || waistStyle === 4;
                if (mode === 0 || mode === 3) {
                    if (!isSkirt) { drawRect(12, legY, 3, 4, legColor); drawShoeOnLeg(12, legY, 3, 4); drawRect(17, legY, 3, 4, legColor); drawShoeOnLeg(17, legY, 3, 4); } 
                    else { drawRect(10, legY, 12, 4, waistColor); if (shoeStyle !== 0) { drawShoeOnLeg(11, legY+2, 3, 2); drawShoeOnLeg(18, legY+2, 3, 2); } }
                } else if (mode === 1) {
                    if (!isSkirt) { const l1x = 13 - walkOffset; drawRect(l1x, legY, 3, 4, legColor); drawShoeOnLeg(l1x, legY, 3, 4); const l2x = 15 + walkOffset; drawRect(l2x, legY, 3, 4, legColor); drawShoeOnLeg(l2x, legY, 3, 4); } 
                    else { drawRect(12, legY, 8, 4, waistColor); if (shoeStyle !== 0) { drawShoeOnLeg(13+walkOffset, legY+2, 3, 2); } }
                }
            };
            drawLegs(drawMode);
        } else {
            if (drawMode === 0) { drawRect(12, legY, 8, 4, chestColor); drawRect(14, legY+4, 4, 3, chestColor); } 
            else if (drawMode === 1) { drawRect(13, legY, 6, 5, chestColor); drawRect(15-walkOffset, legY+5, 2, 3, chestColor); }
        }
    }

    // 4. HEAD & EQUIPMENT (Layer 2)
    setLayer(2);
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
        // Eyes logic for slime
        const eyeY = sY + 4;
        if (drawMode !== 3) {
             const eC = eyeColor;
             if (eyeStyle === 0) {
                 drawRect(sX + 4, eyeY, 2, 2, eC); drawRect(sX + sW - 6, eyeY, 2, 2, eC);
             } else if (eyeStyle === 1) { // Sleepy
                 drawRect(sX + 4, eyeY+1, 2, 1, eC); drawRect(sX + sW - 6, eyeY+1, 2, 1, eC);
             } else if (eyeStyle === 2) { // Tall
                 drawRect(sX + 4, eyeY-1, 2, 3, eC); drawRect(sX + sW - 6, eyeY-1, 2, 3, eC);
             } 

             if(hasWhiteEye && eyeStyle !== 1) { 
                 drawPixel(sX+4, eyeY, '#fff'); drawPixel(sX+sW-6, eyeY, '#fff'); 
             }
             drawRect(sX + 7, eyeY + 4, 4, 1, '#7f8c8d');
        }
        
        // --- Slime Hair ---
        if (hairStyle !== 4) { // Not Skinhead
             const hY = sY - 2; 
             const hColor = hairColor;
             const fillHair = (x, y, w, h) => { drawRect(x, y, w, h, hColor); };
             
             if (hairStyle === 0) { fillHair(sX+2, hY, sW-4, 3); }
             else if (hairStyle === 1) { fillHair(sX+2, hY, sW-4, 8); }
             else if (hairStyle === 2) { fillHair(sX+4, hY-2, sW-8, 5); }
             else if (hairStyle === 3) { fillHair(sX+1, hY, sW-2, 6); }
             // hairStyle === 4 は描画しない (Skinhead)
        }
    } 
    else {
        const fillHead = (x, y, w, h, c) => {
            drawRect(x, y, w, h, c);
            if (bitMode !== '8') { drawRect(x+1, y, w-2, 1, cSkinShadow); drawRect(x+1, y+h-1, w-2, 1, cSkinShadow); if (baseType !== 2) drawPixel(x+2, y+2, cSkinLight); }
        };
        const headColor = baseType === 2 ? '#ecf0f1' : actualSkinColor;

        if (drawMode !== 1) { // Front/Back
          fillHead(10, headY, 12, 10, headColor);
          if (baseType !== 2) { 
             drawPixel(10, headY, 'rgba(0,0,0,0)'); drawPixel(21, headY, 'rgba(0,0,0,0)');
             drawPixel(10, headY + 9, 'rgba(0,0,0,0)'); drawPixel(21, headY + 9, 'rgba(0,0,0,0)');
             if (baseType === 4 || baseType === 8) { drawRect(8, headY + 3, 2, 4, headColor); drawRect(22, headY + 3, 2, 4, headColor); }
          }
        } else { // Side
          // 横向きの顔を薄くする (幅10 -> 8)
          fillHead(11, headY, 8, 10, headColor);
          
          if (baseType === 5) { drawRect(18, headY + 5, 4, 3, headColor); }
          else if (baseType === 6) { // Birdman Beak
              drawRect(8, headY + 5, 3, 2, '#f1c40f'); 
          }
          else if (baseType === 4 || baseType === 8) { drawRect(10, headY + 3, 2, 4, headColor); }
          if (baseType !== 2) { drawPixel(11, headY, 'rgba(0,0,0,0)'); drawPixel(18, headY, 'rgba(0,0,0,0)'); drawPixel(11, headY + 9, 'rgba(0,0,0,0)'); drawPixel(18, headY + 9, 'rgba(0,0,0,0)'); }
        }

        if (drawMode !== 3 && baseType !== 1 && helmet === 0) {
            // Hat logic for specific Chest Style? maybe remove for now or keep simple
        }

        const eyeY = headY + 5;
        if (drawMode === 0) { // Front
            if (baseType === 2) { 
                 drawRect(12, eyeY, 3, 3, '#2c3e50'); drawRect(17, eyeY, 3, 3, '#2c3e50'); drawRect(15, eyeY + 5, 2, 1, '#2c3e50'); 
            } else {
                 if (baseType === 6) { drawRect(14, eyeY + 2, 4, 2, '#f1c40f'); }
                 if (eyeStyle === 0) { if (hasWhiteEye) { drawRect(11, eyeY, 4, 2, '#fff'); drawRect(17, eyeY, 4, 2, '#fff'); } drawRect(12, eyeY, 2, 2, eyeColor); drawRect(18, eyeY, 2, 2, eyeColor); if(bitMode !== '8') { drawPixel(12, eyeY, '#fff'); drawPixel(18, eyeY, '#fff'); } }
                 else if (eyeStyle === 1) { if (hasWhiteEye) { drawRect(11, eyeY + 1, 4, 1, '#fff'); drawRect(17, eyeY + 1, 4, 1, '#fff'); } drawRect(12, eyeY + 1, 2, 1, eyeColor); drawRect(18, eyeY + 1, 2, 1, eyeColor); }
                 else if (eyeStyle === 2) { if (hasWhiteEye) { drawRect(11, eyeY - 1, 4, 3, '#fff'); drawRect(17, eyeY - 1, 4, 3, '#fff'); } drawRect(12, eyeY - 1, 2, 3, eyeColor); drawRect(18, eyeY - 1, 2, 3, eyeColor); }
                 
                 if (hasFangs || baseType === 4 || baseType === 7) { drawPixel(13, eyeY + 3, '#fff'); drawPixel(18, eyeY + 3, '#fff'); }
                 if (baseType === 9) { // Dwarf Beard
                     const beardColor = hairColor; 
                     drawRect(11, eyeY + 3, 10, 4, beardColor); 
                     drawRect(12, eyeY + 7, 8, 1, beardColor); 
                 }
            }
        } else if (drawMode === 1) { // Side
          const eyeX = 11;
          if (baseType === 2) { drawRect(eyeX + 1, eyeY, 3, 3, '#2c3e50'); } else {
              let y = eyeY, h = 2; if (eyeStyle === 1) { y += 1; h = 1; } if (eyeStyle === 2) { y -= 1; h = 3; }
              if (hasWhiteEye) { drawRect(eyeX, y, 3, h, '#fff'); drawRect(eyeX + 1, y, 1, h, eyeColor); } else { drawRect(eyeX, y, 2, h, eyeColor); }
              
              if (hasFangs || baseType === 4 || baseType === 7) drawPixel(eyeX + 1, eyeY + 3, '#fff');
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
                    if (helmet === 1) { drawShadedRect(9, headY - 3, 14, 6, helmetColor); drawRect(15, headY - 4, 2, 9, '#2c3e50'); } 
                    else if (helmet === 2) { drawShadedRect(9, headY - 2, 14, 4, helmetColor); drawRect(8, headY - 4, 2, 4, '#fff'); drawRect(22, headY - 4, 2, 4, '#fff'); } 
                    else if (helmet === 3) { drawRect(7, headY - 1, 18, 2, helmetColor); drawRect(10, headY - 8, 12, 7, helmetColor); drawRect(12, headY - 12, 8, 4, helmetColor); } 
                    else if (helmet === 4) { drawRect(8, headY - 3, 16, 13, helmetColor); drawRect(11, headY, 10, 8, 'rgba(0,0,0,0.3)'); } 
                } else if (drawMode === 1) { 
                    if (helmet === 1) { drawShadedRect(10, headY - 3, 12, 6, helmetColor); }
                    else if (helmet === 2) { drawShadedRect(10, headY - 2, 12, 4, helmetColor); drawRect(12, headY - 4, 2, 4, '#fff'); }
                    else if (helmet === 3) { drawRect(9, headY - 1, 14, 2, helmetColor); drawRect(11, headY - 8, 10, 7, helmetColor); drawRect(13, headY - 12, 6, 4, helmetColor); }
                    else if (helmet === 4) { 
                        drawRect(10, headY - 3, 13, 13, helmetColor); 
                        drawRect(10, headY + 1, 2, 6, adjustColor(helmetColor, -30));
                    }
                } else if (drawMode === 3) { 
                    if (helmet === 1) { drawShadedRect(9, headY - 3, 14, 10, helmetColor); }
                    else if (helmet === 2) { drawShadedRect(9, headY - 2, 14, 8, helmetColor); }
                    else if (helmet === 3) { drawRect(7, headY - 1, 18, 2, helmetColor); drawRect(10, headY - 8, 12, 7, helmetColor); }
                    else if (helmet === 4) { drawRect(8, headY - 3, 16, 14, helmetColor); }
                }
            } else {
                const fillHair = (x, y, w, h) => { drawRect(x, y, w, h, hairColor); if (bitMode !== '8' && h >= 3) { const ctx = ctxs[currentLayer]; ctx.fillStyle = cHairLight; ctx.fillRect((x+OFFSET_X), (y+OFFSET_Y+1), w, 1); } };
                if (hairStyle !== 4) { // Not Skinhead
                    if (drawMode === 0) { 
                        fillHair(10, headY - 2, 12, 3); drawPixel(13, headY+1, hairColor); drawPixel(15, headY+1, hairColor); drawPixel(17, headY+1, hairColor);
                        if (hairStyle === 1) fillHair(11, headY, 10, 2); else if (hairStyle === 2) { drawRect(14, headY - 4, 4, 4, hairColor); drawRect(10, headY - 1, 12, 2, hairColor); } else if (hairStyle === 3) { drawRect(11, headY, 3, 3, hairColor); drawRect(18, headY, 3, 3, hairColor); } 
                    } else if (drawMode === 1) { 
                        // 横向きの髪を、後頭部の隙間を埋めるように調整
                        
                        fillHair(11, headY - 2, 10, 3); // Top
                        drawRect(10, headY, 2, 4, hairColor); // Front bang
                        
                        if (hairStyle === 0) { // Short
                             drawRect(15, headY, 6, 7, hairColor); 
                        }
                        else if (hairStyle === 1) { // Long
                             drawRect(15, headY, 8, 12, hairColor);
                        }
                        else if (hairStyle === 2) { // Spiky
                             drawRect(13, headY - 4, 6, 4, hairColor); 
                             drawRect(11, headY - 1, 10, 2, hairColor); 
                        }
                        else if (hairStyle === 3) { // Bob
                             drawRect(15, headY + 1, 6, 8, hairColor);
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
      ctx.globalAlpha = 1.0;
    };

    compositeLayers();

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