// src/renderer/layers/EquipmentLayer.js
import { adjustColor } from '../../utils/colorUtils';
import { COLORS } from '../../constants/commonColors';

export const drawWeapon = (renderer, weaponId, x, y, color, isSideView) => {
  if (weaponId === 0) return;
  const isMetal = true; 

  if (weaponId === 1) { // Sword
    renderer.drawShadedRect(x, y - 8, 2, 8, color, isMetal); 
    renderer.drawRect(x - 2, y, 6, 1, COLORS.gold); 
    renderer.drawRect(x, y + 1, 2, 2, COLORS.wood); 
  } else if (weaponId === 2) { // Staff
    renderer.drawRect(x, y - 8, 2, 12, COLORS.wood); 
    renderer.drawRect(x - 1, y - 10, 4, 3, COLORS.gold); 
    renderer.drawPixel(x + 1, y - 9, COLORS.redGem); 
  } else if (weaponId === 3) { // Bow
    renderer.drawRect(x + 1, y - 6, 1, 12, COLORS.wood); 
    renderer.drawPixel(x, y - 5, COLORS.wood); 
    renderer.drawPixel(x, y + 5, COLORS.wood); 
    renderer.drawPixel(x - 1, y - 4, COLORS.wood); 
    renderer.drawPixel(x - 1, y + 4, COLORS.wood); 
    renderer.drawRect(x - 1, y - 3, 1, 6, '#fff'); 
  } else if (weaponId === 4) { // Spear
    renderer.drawRect(x, y - 10, 1, 14, COLORS.wood); 
    renderer.drawShadedRect(x - 1, y - 13, 3, 3, color, isMetal); 
    renderer.drawPixel(x, y - 14, color);
  } else if (weaponId === 5) { // Axe
    renderer.drawRect(x, y - 6, 2, 10, COLORS.wood); 
    renderer.drawShadedRect(x + 2, y - 7, 3, 6, color, isMetal); 
    renderer.drawShadedRect(x - 3, y - 7, 3, 6, color, isMetal); 
  } else if (weaponId === 6) { // Dagger
    renderer.drawShadedRect(x, y - 3, 2, 3, color, isMetal); 
    renderer.drawRect(x - 1, y, 4, 1, COLORS.gold); 
    renderer.drawRect(x, y + 1, 2, 1, COLORS.wood); 
  }
};

export const drawShield = (renderer, shieldId, x, y, color) => {
  if (shieldId === 0) return;
  const isMetal = true;

  if (shieldId === 1) { // Buckler
    renderer.drawShadedRect(x - 1, y - 2, 6, 6, color, isMetal); 
    renderer.drawPixel(x + 1, y + 1, COLORS.gold);
  } else if (shieldId === 2) { // Kite
    renderer.drawShadedRect(x - 2, y - 2, 8, 5, color, isMetal); 
    renderer.drawRect(x - 1, y + 3, 6, 2, color); 
    renderer.drawRect(x, y + 5, 4, 2, color); 
    renderer.drawRect(x - 2, y - 2, 8, 1, COLORS.gold); 
    renderer.drawPixel(x + 2, y + 2, COLORS.gold); 
  } else if (shieldId === 3) { // Tower
    renderer.drawShadedRect(x - 3, y - 4, 10, 12, color, isMetal); 
    renderer.drawRect(x - 2, y - 3, 8, 10, adjustColor(color, -20));
  }
};

export const drawHelmet = (renderer, helmetId, headY, color, drawMode) => {
  if (helmetId === 0) return;
  const isMetal = true;

  if (drawMode === 0) { // Front
    if (helmetId === 1) { renderer.drawShadedRect(9, headY - 3, 14, 6, color, isMetal); renderer.drawRect(15, headY - 4, 2, 9, '#2c3e50'); } 
    else if (helmetId === 2) { renderer.drawShadedRect(9, headY - 2, 14, 4, color, isMetal); renderer.drawRect(8, headY - 4, 2, 4, '#fff'); renderer.drawRect(22, headY - 4, 2, 4, '#fff'); } 
    else if (helmetId === 3) { renderer.drawRect(7, headY - 1, 18, 2, color); renderer.drawRect(10, headY - 8, 12, 7, color); renderer.drawRect(12, headY - 12, 8, 4, color); } 
    else if (helmetId === 4) { renderer.drawRect(8, headY - 3, 16, 13, color); renderer.drawRect(11, headY, 10, 8, 'rgba(0,0,0,0.3)'); } 
  } else if (drawMode === 1) { // Side
    if (helmetId === 1) { renderer.drawShadedRect(10, headY - 3, 12, 6, color, isMetal); }
    else if (helmetId === 2) { renderer.drawShadedRect(10, headY - 2, 12, 4, color, isMetal); renderer.drawRect(12, headY - 4, 2, 4, '#fff'); }
    else if (helmetId === 3) { renderer.drawRect(9, headY - 1, 14, 2, color); renderer.drawRect(11, headY - 8, 10, 7, color); renderer.drawRect(13, headY - 12, 6, 4, color); }
    else if (helmetId === 4) { 
        renderer.drawRect(10, headY - 3, 13, 13, color); 
        renderer.drawRect(10, headY + 1, 2, 6, adjustColor(color, -30));
    }
  } else if (drawMode === 3) { // Back
    if (helmetId === 1) { renderer.drawShadedRect(9, headY - 3, 14, 10, color, isMetal); }
    else if (helmetId === 2) { renderer.drawShadedRect(9, headY - 2, 14, 8, color, isMetal); }
    else if (helmetId === 3) { renderer.drawRect(7, headY - 1, 18, 2, color); renderer.drawRect(10, headY - 8, 12, 7, color); }
    else if (helmetId === 4) { renderer.drawRect(8, headY - 3, 16, 14, color); }
  }
};

export const drawHeadAccessory = (renderer, accId, headY, hairColor, drawMode, baseType) => {
  if (accId === 0) return;
  renderer.setLayer(3);
  
  const sY = baseType === 1 ? -4 : 0; 
  const sX = (baseType === 1 && drawMode === 1) ? 4 : 0; 

  if (drawMode !== 3) { 
    if (accId === 1) { 
      if (drawMode === 0) { renderer.drawPixel(11, headY - 3 + sY, hairColor); renderer.drawPixel(10, headY - 2 + sY, hairColor); renderer.drawPixel(20, headY - 3 + sY, hairColor); renderer.drawPixel(21, headY - 2 + sY, hairColor); } 
      else { renderer.drawPixel(12+sX, headY - 3 + sY, hairColor); renderer.drawPixel(11+sX, headY - 2 + sY, hairColor); } 
    } else if (accId === 2) { 
       if (drawMode === 0) { renderer.drawRect(11, headY - 4 + sY, 10, 2, COLORS.gold); renderer.drawPixel(11, headY - 5 + sY, COLORS.gold); renderer.drawPixel(15, headY - 5 + sY, COLORS.gold); renderer.drawPixel(20, headY - 5 + sY, COLORS.gold); } 
       else { renderer.drawRect(11+sX, headY - 4 + sY, 8, 2, COLORS.gold); renderer.drawPixel(11+sX, headY - 5 + sY, COLORS.gold); renderer.drawPixel(14+sX, headY - 5 + sY, COLORS.gold); } 
    }
  } else { 
       if (accId === 1) { renderer.drawPixel(11, headY - 3 + sY, hairColor); renderer.drawPixel(10, headY - 2 + sY, hairColor); renderer.drawPixel(20, headY - 3 + sY, hairColor); renderer.drawPixel(21, headY - 2 + sY, hairColor); }
       else if (accId === 2) { renderer.drawRect(11, headY - 4 + sY, 10, 2, COLORS.gold); renderer.drawPixel(11, headY - 5 + sY, COLORS.gold); renderer.drawPixel(15, headY - 5 + sY, COLORS.gold); renderer.drawPixel(20, headY - 5 + sY, COLORS.gold); } 
  }
};

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
        if (accId === 1) { 
            renderer.drawRect(11+sOff, eyeY, 4, 3, glassColor); renderer.drawRect(11+sOff, eyeY, 4, 1, color); 
            renderer.drawRect(17-sOff, eyeY, 4, 3, glassColor); renderer.drawRect(17-sOff, eyeY, 4, 1, color); 
            renderer.drawRect(15, eyeY + 1, 2, 1, color); 
        } else if (accId === 2) { 
            renderer.drawRect(11+sOff, eyeY, 4, 3, '#000'); renderer.drawRect(17-sOff, eyeY, 4, 3, '#000');
            renderer.drawRect(15, eyeY + 1, 2, 1, '#000');
        } else if (accId === 3) { 
            renderer.drawRect(17-sOff, eyeY, 4, 3, glassColor);
            renderer.drawRect(17-sOff, eyeY, 4, 1, COLORS.gold); renderer.drawRect(17-sOff, eyeY+2, 4, 1, COLORS.gold); renderer.drawRect(17-sOff, eyeY, 1, 3, COLORS.gold); renderer.drawRect(20-sOff, eyeY, 1, 3, COLORS.gold);
        } else if (accId === 4) { 
            renderer.drawRect(11+sOff, eyeY, 4, 2, COLORS.glassRed);
            renderer.drawRect(10+sOff, eyeY, 1, 4, '#555'); renderer.drawRect(9+sOff, headY + 3, 1, 4, '#555'); 
        } else if (accId === 5) { 
            renderer.drawRect(17-sOff, eyeY, 4, 2, '#333');
            renderer.drawRect(18-sOff, eyeY, 2, 1, '#000');
            renderer.drawPixel(16-sOff, eyeY+1, '#333');
            renderer.drawRect(11+sOff, eyeY, 4, 1, 'rgba(0,0,0,0.3)'); 
        }
    } else if (drawMode === 1) { 
        const eyeX = 11 + sY;
        if (accId === 1) { 
            renderer.drawRect(eyeX, eyeY, 3, 3, glassColor); renderer.drawRect(eyeX, eyeY, 3, 1, color);
            renderer.drawRect(eyeX - 1, eyeY, 1, 1, color); 
        } else if (accId === 2) {
            renderer.drawRect(eyeX, eyeY, 3, 3, '#000'); renderer.drawRect(eyeX - 1, eyeY, 1, 1, '#000');
        } else if (accId === 4) {
            renderer.drawRect(eyeX, eyeY, 3, 2, COLORS.glassRed);
            renderer.drawRect(10+sY, headY + 4, 2, 2, '#555');
        } else if (accId === 5) { 
            renderer.drawRect(eyeX, eyeY, 3, 2, '#333');
            renderer.drawRect(eyeX-1, eyeY, 1, 1, '#333');
        }
    }
};

export const drawEarAccessory = (renderer, accId, headY, drawMode, baseType, helmetId) => {
    if (accId === 0 || drawMode === 3 || baseType === 1 || baseType === 2) return;
    renderer.setLayer(3);
    
    let c = COLORS.gold;
    if (accId === 2) c = COLORS.silver;
    if (accId === 3) c = COLORS.redGem;
    if (accId === 4) c = COLORS.blueGem;

    if (helmetId === 1 || helmetId === 2 || helmetId === 4) return;

    if (drawMode === 0) {
        renderer.drawPixel(9, headY + 7, c);
        renderer.drawPixel(22, headY + 7, c);
    } else if (drawMode === 1) {
        renderer.drawPixel(10, headY + 7, c);
    }
};