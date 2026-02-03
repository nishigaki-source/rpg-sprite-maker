// src/renderer/layers/EquipmentLayer.js
import { adjustColor } from '../../utils/colorUtils';
import { COLORS } from '../../constants/commonColors';

/**
 * 武器を描画する
 * @param {object} renderer - PixelContext インスタンス
 * @param {number} weaponId - 武器のID
 * @param {number} x - 描画基準X座標
 * @param {number} y - 描画基準Y座標
 * @param {string} color - 武器のメインカラー
 * @param {boolean} isSideView - 横向きかどうか
 */
export const drawWeapon = (renderer, weaponId, x, y, color, isSideView) => {
  if (weaponId === 0) return;
  // Layering:
  // Side view: draw the weapon slightly behind the hand so the grip doesn't look like it's floating.
  // Front view: default equipment layer is front (3). For the Sword we will split layers per-part.
  const weaponLayerBack = 2;
  const weaponLayerFront = 3;
  renderer.setLayer(isSideView ? weaponLayerBack : weaponLayerFront);
  const isMetal = true; 

  // --- 描画位置の微調整 ---
  // BodyLayer.js の drawHands と同期させ、手に握っているように見せる
  // NOTE:
  // - 正面: 肩位置は固定のまま、武器持ち側の腕を短くして手先が上がる
  // - 横向き: 肩を体の中心に寄せ、前腕が -X 方向へ曲がる（手先は少し左＆少し下寄り）
  let ox = x;
  let oy = y;

  if (isSideView) {
    // 横向き: 現在の手先に合わせて「左へ」「少し下へ」寄せる
    ox -= 3;
    oy -= 1;
  } else {
    // 正面: 腕を短くして手先位置が変わったため、武器の基準点を手元に合わせる
    // 以前の "持ち上げ" 前提より上に行き過ぎるので、さらに下げて握り位置を合わせる
    ox -= 1;
    oy += 1;
  }

  if (weaponId === 1) { // Sword (剣)
    if (!isSideView) {
      // FRONT view: draw grip (柄) and guard (鍔) behind the hand, then blade (刃) in front.
      renderer.setLayer(weaponLayerBack);
      renderer.drawRect(ox - 2, oy, 6, 1, COLORS.gold); // 鍔（手の内側へ）
      renderer.drawRect(ox, oy + 1, 2, 2, COLORS.wood); // 柄（手の内側へ）

      renderer.setLayer(weaponLayerFront);
      renderer.drawShadedRect(ox, oy - 10, 2, 10, color, isMetal); // 刃（手の外側へ）

      // Draw the full guard on the front layer so all 6px are visible
      renderer.drawRect(ox - 2, oy, 6, 1, COLORS.gold);
    } else {
      // SIDE view: keep sword behind the hand so grip doesn't float
      renderer.setLayer(weaponLayerBack);
      renderer.drawShadedRect(ox, oy - 10, 2, 10, color, isMetal);
      renderer.drawRect(ox - 2, oy, 6, 1, COLORS.gold); // 鍔
      renderer.drawRect(ox, oy + 1, 2, 2, COLORS.wood); // 柄
    }
  } else if (weaponId === 2) { // Staff (杖)
    renderer.drawRect(ox, oy - 10, 2, 14, COLORS.wood); 
    renderer.drawRect(ox - 1, oy - 12, 4, 3, COLORS.gold); 
    renderer.drawPixel(ox + 1, oy - 11, COLORS.redGem); 
  } else if (weaponId === 3) { // Bow (弓)
    renderer.drawRect(ox + 1, oy - 6, 1, 12, COLORS.wood); 
    renderer.drawPixel(ox, oy - 5, COLORS.wood); 
    renderer.drawPixel(ox, oy + 5, COLORS.wood); 
    renderer.drawPixel(ox - 1, oy - 4, COLORS.wood); 
    renderer.drawPixel(ox - 1, oy + 4, COLORS.wood); 
    renderer.drawRect(ox - 1, oy - 3, 1, 6, '#fff'); // 弦
  } else if (weaponId === 4) { // Spear (槍)
    renderer.drawRect(ox, oy - 12, 1, 16, COLORS.wood); 
    renderer.drawShadedRect(ox - 1, oy - 15, 3, 3, color, isMetal); 
    renderer.drawPixel(ox, oy - 16, color);
  } else if (weaponId === 5) { // Axe (斧)
    renderer.drawRect(ox, oy - 6, 2, 10, COLORS.wood); 
    renderer.drawShadedRect(ox + 2, oy - 7, 3, 6, color, isMetal); 
    renderer.drawShadedRect(ox - 3, oy - 7, 3, 6, color, isMetal); 
  } else if (weaponId === 6) { // Dagger (短剣)
    renderer.drawShadedRect(ox, oy - 4, 2, 4, color, isMetal); 
    renderer.drawRect(ox - 1, oy, 4, 1, COLORS.gold); 
    renderer.drawRect(ox, oy + 1, 2, 1, COLORS.wood); 
  }
};

/**
 * 盾を描画する
 */
export const drawShield = (renderer, shieldId, x, y, color) => {
  if (shieldId === 0) return;
  const isMetal = true;

  if (shieldId === 1) { // Buckler (小盾)
    renderer.drawShadedRect(x - 1, y - 2, 6, 6, color, isMetal); 
    renderer.drawPixel(x + 1, y + 1, COLORS.gold);
  } else if (shieldId === 2) { // Kite Shield (カイトシールド)
    renderer.drawShadedRect(x - 2, y - 2, 8, 5, color, isMetal); 
    renderer.drawRect(x - 1, y + 3, 6, 2, color); 
    renderer.drawRect(x, y + 5, 4, 2, color); 
    renderer.drawRect(x - 2, y - 2, 8, 1, COLORS.gold); 
    renderer.drawPixel(x + 2, y + 2, COLORS.gold); 
  } else if (shieldId === 3) { // Tower Shield (大盾)
    renderer.drawShadedRect(x - 3, y - 4, 10, 12, color, isMetal); 
    renderer.drawRect(x - 2, y - 3, 8, 10, adjustColor(color, -20));
  }
};

/**
 * 兜・帽子を描画する
 */
export const drawHelmet = (renderer, helmetId, headY, color, drawMode) => {
  if (helmetId === 0) return;
  const isMetal = true;

  if (drawMode === 0) { // 正面
    if (helmetId === 1) { // Iron Helm
      renderer.drawShadedRect(9, headY - 3, 14, 6, color, isMetal); 
      renderer.drawRect(15, headY - 4, 2, 9, '#2c3e50'); 
    } else if (helmetId === 2) { // Viking
      renderer.drawShadedRect(9, headY - 2, 14, 4, color, isMetal); 
      renderer.drawRect(8, headY - 4, 2, 4, '#fff'); 
      renderer.drawRect(22, headY - 4, 2, 4, '#fff'); 
    } else if (helmetId === 3) { // Mage Hat
      renderer.drawRect(7, headY - 1, 18, 2, color); 
      renderer.drawRect(10, headY - 8, 12, 7, color); 
      renderer.drawRect(12, headY - 12, 8, 4, color); 
    } else if (helmetId === 4) { // Hood
      renderer.drawRect(8, headY - 3, 16, 13, color); 
      renderer.drawRect(11, headY, 10, 8, 'rgba(0,0,0,0.3)'); 
    }
  } else if (drawMode === 1) { // 横向き
    if (helmetId === 1) {
      renderer.drawShadedRect(10, headY - 3, 12, 6, color, isMetal); 
    } else if (helmetId === 2) {
      renderer.drawShadedRect(10, headY - 2, 12, 4, color, isMetal); 
      renderer.drawRect(12, headY - 4, 2, 4, '#fff'); 
    } else if (helmetId === 3) {
      renderer.drawRect(9, headY - 1, 14, 2, color); 
      renderer.drawRect(11, headY - 8, 10, 7, color); 
      renderer.drawRect(13, headY - 12, 6, 4, color); 
    } else if (helmetId === 4) { 
      renderer.drawRect(10, headY - 3, 13, 13, color); 
      renderer.drawRect(10, headY + 1, 2, 6, adjustColor(color, -30));
    }
  } else if (drawMode === 3) { // 背面
    if (helmetId === 1) {
      renderer.drawShadedRect(9, headY - 3, 14, 10, color, isMetal); 
    } else if (helmetId === 2) {
      renderer.drawShadedRect(9, headY - 2, 14, 8, color, isMetal); 
    } else if (helmetId === 3) {
      renderer.drawRect(7, headY - 1, 18, 2, color); 
      renderer.drawRect(10, headY - 8, 12, 7, color); 
    } else if (helmetId === 4) {
      renderer.drawRect(8, headY - 3, 16, 14, color); 
    }
  }
};

/**
 * 頭部アクセサリーを描画する
 */
export const drawHeadAccessory = (renderer, accId, headY, hairColor, drawMode, baseType) => {
  if (accId === 0) return;
  renderer.setLayer(3);
  
  const sY = baseType === 1 ? -4 : 0; 
  const sX = (baseType === 1 && drawMode === 1) ? 4 : 0; 

  if (accId === 1) { // Cat Ears
    if (drawMode === 0 || drawMode === 3) {
      renderer.drawPixel(11, headY - 3 + sY, hairColor); 
      renderer.drawPixel(10, headY - 2 + sY, hairColor); 
      renderer.drawPixel(20, headY - 3 + sY, hairColor); 
      renderer.drawPixel(21, headY - 2 + sY, hairColor); 
    } else {
      renderer.drawPixel(12+sX, headY - 3 + sY, hairColor); 
      renderer.drawPixel(11+sX, headY - 2 + sY, hairColor); 
    }
  } else if (accId === 2) { // Crown
     if (drawMode === 0 || drawMode === 3) {
       renderer.drawRect(11, headY - 4 + sY, 10, 2, COLORS.gold); 
       renderer.drawPixel(11, headY - 5 + sY, COLORS.gold); 
       renderer.drawPixel(15, headY - 5 + sY, COLORS.gold); 
       renderer.drawPixel(20, headY - 5 + sY, COLORS.gold); 
     } else {
       renderer.drawRect(11+sX, headY - 4 + sY, 8, 2, COLORS.gold); 
       renderer.drawPixel(11+sX, headY - 5 + sY, COLORS.gold); 
       renderer.drawPixel(14+sX, headY - 5 + sY, COLORS.gold); 
     }
  }
};

/**
 * 眼部アクセサリーを描画する
 */
export const drawEyeAccessory = (renderer, accId, headY, drawMode, baseType) => {
    if (accId === 0 || drawMode === 3) return; 
    renderer.setLayer(3);
    
    let eyeY = headY + 5;
    if(baseType === 1) eyeY = headY + 4; 

    const color = COLORS.darkGray; 
    const glassColor = COLORS.glass;
    const sOff = baseType === 1 ? 4 : 0;
    const sY = baseType === 1 && drawMode === 1 ? 4 : 0; 

    if (drawMode === 0) { 
        if (accId === 1) { // Glasses
            renderer.drawRect(11+sOff, eyeY, 4, 3, glassColor); 
            renderer.drawRect(11+sOff, eyeY, 4, 1, color); 
            renderer.drawRect(17-sOff, eyeY, 4, 3, glassColor); 
            renderer.drawRect(17-sOff, eyeY, 4, 1, color); 
            renderer.drawRect(15, eyeY + 1, 2, 1, color); 
        } else if (accId === 2) { // Sunglasses
            renderer.drawRect(11+sOff, eyeY, 4, 3, '#000'); 
            renderer.drawRect(17-sOff, eyeY, 4, 3, '#000');
            renderer.drawRect(15, eyeY + 1, 2, 1, '#000');
        } else if (accId === 3) { // Monocle
            renderer.drawRect(17-sOff, eyeY, 4, 3, glassColor);
            renderer.drawRect(17-sOff, eyeY, 4, 1, COLORS.gold); 
            renderer.drawRect(17-sOff, eyeY+2, 4, 1, COLORS.gold); 
            renderer.drawRect(17-sOff, eyeY, 1, 3, COLORS.gold); 
            renderer.drawRect(20-sOff, eyeY, 1, 3, COLORS.gold);
        } else if (accId === 4) { // Scouter
            renderer.drawRect(11+sOff, eyeY, 4, 2, COLORS.glassRed);
            renderer.drawRect(10+sOff, eyeY, 1, 4, '#555'); 
            renderer.drawRect(9+sOff, headY + 3, 1, 4, '#555'); 
        } else if (accId === 5) { // Eyepatch
            renderer.drawRect(17-sOff, eyeY, 4, 2, '#333');
            renderer.drawRect(18-sOff, eyeY, 2, 1, '#000');
            renderer.drawPixel(16-sOff, eyeY+1, '#333');
            renderer.drawRect(11+sOff, eyeY, 4, 1, 'rgba(0,0,0,0.3)'); 
        }
    } else if (drawMode === 1) { 
        const eyeX = 11 + sY;
        if (accId === 1) { 
            renderer.drawRect(eyeX, eyeY, 3, 3, glassColor); 
            renderer.drawRect(eyeX, eyeY, 3, 1, color);
            renderer.drawRect(eyeX - 1, eyeY, 1, 1, color); 
        } else if (accId === 2) {
            renderer.drawRect(eyeX, eyeY, 3, 3, '#000'); 
            renderer.drawRect(eyeX - 1, eyeY, 1, 1, '#000');
        } else if (accId === 4) {
            renderer.drawRect(eyeX, eyeY, 3, 2, COLORS.glassRed);
            renderer.drawRect(10+sY, headY + 4, 2, 2, '#555');
        } else if (accId === 5) { 
            renderer.drawRect(eyeX, eyeY, 3, 2, '#333');
            renderer.drawRect(eyeX-1, eyeY, 1, 1, '#333');
        }
    }
};

/**
 * 耳部アクセサリーを描画する
 */
export const drawEarAccessory = (renderer, accId, headY, drawMode, baseType, helmetId) => {
    if (accId === 0 || drawMode === 3 || baseType === 1 || baseType === 2) return;
    renderer.setLayer(3);
    
    let c = COLORS.gold;
    if (accId === 2) c = COLORS.silver;
    if (accId === 3) c = COLORS.redGem;
    if (accId === 4) c = COLORS.blueGem;

    // 特定の兜を被っている場合は描画しない
    if (helmetId === 1 || helmetId === 2 || helmetId === 4) return;

    if (drawMode === 0) {
        renderer.drawPixel(9, headY + 7, c);
        renderer.drawPixel(22, headY + 7, c);
    } else if (drawMode === 1) {
        renderer.drawPixel(10, headY + 7, c);
    }
};