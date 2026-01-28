// src/renderer/layers/MonsterPartsLayer.js
import { adjustColor } from '../../utils/colorUtils';

export const drawWings = (renderer, charState, drawMode, yOffset, isBackLayer) => {
  const { wings, wingColor, baseType, bitMode } = charState;
  // renderer は PixelContext のインスタンス
  if (wings === 0) return;

  const wc = wingColor;
  renderer.setLayer(isBackLayer ? 1 : 3); 
  const sY = baseType === 1 ? 16 : 0;
  const wy = 14 + yOffset + sY; 

  // 左右対称描画ヘルパー
  const drawSymmetricWing = (drawFn) => {
      drawFn(false); // Left
      drawFn(true);  // Right
  };

  if (drawMode === 0 || drawMode === 3) { // Front or Back
    if (drawMode === 0 && !isBackLayer) return;
    if (drawMode === 3 && isBackLayer) return;

    if (wings === 1) { // Bat
         drawSymmetricWing((isRight) => {
             // const px = (x) => isRight ? (31 - x) : x; // unused
             if (!isRight) {
                 renderer.drawRect(4, wy-3, 7, 1, wc); 
                 renderer.drawPixel(3, wy-2, wc); renderer.drawPixel(2, wy-1, wc); 
                 renderer.drawRect(3, wy, 2, 4, wc); 
                 renderer.drawRect(5, wy-2, 5, 5, wc); 
                 renderer.drawPixel(5, wy+3, wc); renderer.drawPixel(7, wy+3, wc); renderer.drawPixel(9, wy+3, wc); 
             } else {
                 renderer.drawRect(21, wy-3, 7, 1, wc);
                 renderer.drawPixel(28, wy-2, wc); renderer.drawPixel(29, wy-1, wc);
                 renderer.drawRect(27, wy, 2, 4, wc);
                 renderer.drawRect(22, wy-2, 5, 5, wc);
                 renderer.drawPixel(26, wy+3, wc); renderer.drawPixel(24, wy+3, wc); renderer.drawPixel(22, wy+3, wc);
             }
         });
    } 
    else if (wings === 2) { // Angel
         const featherC = '#ecf0f1';
         const shadowC = '#bdc3c7'; // 修正: 変数名を正しく定義
         drawSymmetricWing((isRight) => {
             if (!isRight) {
                 renderer.drawRect(2, wy-6, 12, 2, featherC); 
                 renderer.drawRect(0, wy-4, 4, 6, featherC); 
                 renderer.drawRect(4, wy-4, 8, 10, featherC); 
                 renderer.drawRect(6, wy+6, 6, 3, featherC); 
                 renderer.drawPixel(0, wy+2, shadowC); 
                 renderer.drawPixel(1, wy+4, shadowC); 
                 renderer.drawPixel(3, wy+6, shadowC);
             } else {
                 renderer.drawRect(18, wy-6, 12, 2, featherC);
                 renderer.drawRect(28, wy-4, 4, 6, featherC);
                 renderer.drawRect(20, wy-4, 8, 10, featherC);
                 renderer.drawRect(20, wy+6, 6, 3, featherC);
                 renderer.drawPixel(31, wy+2, shadowC);
                 renderer.drawPixel(30, wy+4, shadowC);
                 renderer.drawPixel(28, wy+6, shadowC);
             }
         });
    }
    // Fairy
    else if (wings === 3) { 
         const glassC = 'rgba(162, 155, 254, 0.6)';
         drawSymmetricWing((isRight) => {
             if (!isRight) {
                 renderer.drawRect(4, wy-5, 6, 5, glassC);
                 renderer.drawRect(5, wy, 4, 3, glassC);
                 renderer.drawPixel(3, wy-4, glassC);
             } else {
                 renderer.drawRect(22, wy-5, 6, 5, glassC);
                 renderer.drawRect(23, wy, 4, 3, glassC);
                 renderer.drawPixel(28, wy-4, glassC);
             }
         });
    }
    // 必要に応じて Dragon, Butterfly, Demon のロジックも追加
  } 
  else if (drawMode === 1) { // Side
    if (isBackLayer) return; 
    
    const finalOffX = -4; 
    const finalOffY = 2;

    if (wings === 1) { // Bat
         renderer.drawRect(22 + finalOffX, wy + finalOffY, 4, 1, wc); 
         renderer.drawRect(25 + finalOffX, wy + 1 + finalOffY, 3, 1, wc); 
         renderer.drawRect(27 + finalOffX, wy + 2 + finalOffY, 2, 2, wc); 
         renderer.drawPixel(24 + finalOffX, wy + 1 + finalOffY, wc); 
         renderer.drawPixel(26 + finalOffX, wy + 3 + finalOffY, wc);
    } 
    // 必要に応じて他の羽のSideビューロジックも追加
  }
};

export const drawTail = (renderer, charState, drawMode, yOffset, isBackLayer) => {
  const { tail, tailColor, baseType } = charState;
  const useTail = (baseType === 5 && tail === 0) ? 3 : tail; 
  if (useTail === 0) return;

  const tc = (baseType === 5) ? charState.skinColor : tailColor;
  renderer.setLayer(isBackLayer ? 1 : 3); 
  const sY = baseType === 1 ? 16 : 0;
  
  const tailAnim = (charState.animationFrame === 1 ? 1 : 0);

  if (drawMode === 0) { 
    if (!isBackLayer) return;
    if (useTail === 1) { 
        renderer.drawRect(21, 22 + tailAnim + sY, 4, 1, tc); 
        renderer.drawRect(24, 20 + tailAnim + sY, 1, 2, tc); 
        renderer.drawRect(23, 19 + tailAnim + sY, 3, 2, tc); 
    } 
  }
  else if (drawMode === 1) { 
    if (!isBackLayer) return;
    if (useTail === 1) { 
        renderer.drawRect(18, 22 + tailAnim + sY, 3, 1, tc); 
        renderer.drawRect(20, 19 + tailAnim + sY, 2, 3, tc); 
        renderer.drawPixel(21, 18 + tailAnim + sY, tc); 
    } 
  }
  else if (drawMode === 3) { 
    if (isBackLayer) return;
    if (useTail === 1) { 
        renderer.drawRect(16, 22 + tailAnim + sY, 6, 1, tc); 
        renderer.drawRect(21, 19 + tailAnim + sY, 2, 3, tc); 
    } 
  }
};

export const drawHorns = (renderer, charState, drawMode, headY) => {
  const { horns, hornColor, baseType } = charState;
  const useHorns = (baseType === 7 && horns === 0) ? 4 : horns; 
  if (useHorns === 0) return;

  renderer.setLayer(3); 
  const hc = hornColor;
  const hY = headY; 
  const dh = (x,y,w,h,c) => renderer.drawRect(x,y,w,h,c);
  
  const sX = (baseType === 1 && drawMode === 1) ? 4 : 0; 
  const sY = (baseType === 1) ? -4 : 0; 

  if (drawMode === 0 || drawMode === 3) { 
    if (useHorns === 1) { dh(11, hY - 2 + sY, 2, 2, hc); dh(19, hY - 2 + sY, 2, 2, hc); } 
    else if (useHorns === 2) { dh(9, hY - 2 + sY, 3, 2, hc); dh(20, hY - 2 + sY, 3, 2, hc); dh(8, hY - 4 + sY, 1, 3, hc); dh(23, hY - 4 + sY, 1, 3, hc); } 
  } else if (drawMode === 1) { 
     if (useHorns === 1) { dh(12+sX, hY - 2 + sY, 2, 2, hc); } 
     else if (useHorns === 2) { dh(11+sX, hY - 2 + sY, 3, 2, hc); dh(10+sX, hY - 4 + sY, 1, 3, hc); } 
  }
};