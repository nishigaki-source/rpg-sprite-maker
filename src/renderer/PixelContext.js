// src/renderer/PixelContext.js
import { adjustColor } from '../utils/colorUtils';

export class PixelContext {
  constructor(ctxs, bitMode) {
    this.ctxs = ctxs; 
    this.bitMode = bitMode;
    this.currentLayer = 2; 
    this.OFFSET_X = 8;
    this.OFFSET_Y = 8;
  }

  setLayer(layerIndex) {
    this.currentLayer = layerIndex;
  }

  getCurrentCtx() {
    return this.ctxs[this.currentLayer];
  }

  isEraseColor(color) {
    return color === 'transparent' || color === 'rgba(0,0,0,0)';
  }

  drawPixel(x, y, color) {
    const c = this.getCurrentCtx();
    if (this.isEraseColor(color)) {
      c.clearRect(x + this.OFFSET_X, y + this.OFFSET_Y, 1, 1);
      return;
    }
    c.fillStyle = color;
    c.fillRect(x + this.OFFSET_X, y + this.OFFSET_Y, 1, 1);
  }

  drawRect(x, y, w, h, color) {
    const c = this.getCurrentCtx();
    if (this.isEraseColor(color)) {
      c.clearRect(x + this.OFFSET_X, y + this.OFFSET_Y, w, h);
      return;
    }
    c.fillStyle = color;
    c.fillRect(x + this.OFFSET_X, y + this.OFFSET_Y, w, h);
  }

  drawDitherPattern(x, y, w, h, color) {
    const ctx = this.getCurrentCtx();
    ctx.fillStyle = color;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (((x + dx) + (y + dy)) % 2 === 0) {
          ctx.fillRect(x + dx + this.OFFSET_X, y + dy + this.OFFSET_Y, 1, 1);
        }
      }
    }
  }

  makeRamp(base, { shadow = -38, mid = -16, light = 26, highlight = 44 } = {}) {
    return [
      adjustColor(base, shadow),
      adjustColor(base, mid),
      base,
      adjustColor(base, light),
    ];
  }

  drawShadedRect(x, y, w, h, baseColor, isMetal = false) {
    const c = this.getCurrentCtx();
    
    if (this.bitMode === '8') {
      c.fillStyle = baseColor;
      c.fillRect(x + this.OFFSET_X, y + this.OFFSET_Y, w, h);
      return;
    }
    
    if (this.bitMode === '32') {
      const gradient = c.createLinearGradient(
        x + this.OFFSET_X, 
        y + this.OFFSET_Y, 
        x + this.OFFSET_X + w, 
        y + this.OFFSET_Y + h
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
      c.fillRect(x + this.OFFSET_X, y + this.OFFSET_Y, w, h);
      return;
    }

    const ramp = isMetal
      ? this.makeRamp(baseColor, { shadow: -70, mid: -28, light: 34, highlight: 70 })
      : this.makeRamp(baseColor, { shadow: -40, mid: -16, light: 24, highlight: 48 });

    const dark = ramp[0];
    const light = ramp[3];
      
    this.drawRect(x, y, w, h, baseColor); 
    this.drawRect(x, y, w, 1, light); 
    this.drawRect(x, y, 1, h, light); 

    if (w > 2 && h > 2) {
        this.drawDitherPattern(x + w - 1, y, 1, h, dark);
        this.drawDitherPattern(x, y + h - 1, w, 1, dark);
    } else {
        this.drawRect(x + w - 1, y, 1, h, dark);
        this.drawRect(x, y + h - 1, w, 1, dark); 
    }
    
    if (isMetal && w > 2 && h > 2) {
        this.drawPixel(x + 1, y + 1, '#ffffff'); 
    } else {
        this.drawPixel(x + w - 1, y, baseColor); 
        this.drawPixel(x, y + h - 1, baseColor);
    }
  }

  drawAntiAliasedBlock(x, y, w, h, color) {
    this.drawRect(x + 1, y, w - 2, h, color);
    this.drawRect(x, y + 1, 1, h - 2, color);
    this.drawRect(x + w - 1, y + 1, 1, h - 2, color);

    if (this.bitMode === '32') {
      const ctx = this.getCurrentCtx();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = color;

      ctx.fillRect(x + this.OFFSET_X, y + this.OFFSET_Y, 1, 1);
      ctx.fillRect((x + w - 1) + this.OFFSET_X, y + this.OFFSET_Y, 1, 1);
      ctx.fillRect(x + this.OFFSET_X, (y + h - 1) + this.OFFSET_Y, 1, 1);
      ctx.fillRect((x + w - 1) + this.OFFSET_X, (y + h - 1) + this.OFFSET_Y, 1, 1);

      ctx.globalAlpha = 1.0;
    }
  }

  drawSoftTorso(x, y, w, h, color) {
    this.drawRect(x, y, w, 1, color);
    if (h > 2) {
        this.drawRect(x, y + 1, w, h - 2, color);
    }
    if (h > 1) {
        this.drawRect(x + 1, y + h - 1, w - 2, 1, color);
    }

    if (this.bitMode !== '8') {
      if (h > 1) {
          this.drawRect(x + 2, y + h - 1, w - 4, 1, adjustColor(color, -18));
      }
      this.drawPixel(x + 2, y + 1, adjustColor(color, 16));
    }
  }

  drawSoftHips(x, y, w, h, color) {
    this.drawAntiAliasedBlock(x, y, w, h, color);
    if (w >= 8 && h >= 4) {
      this.drawPixel(x + 1, y + h - 2, color);
      this.drawPixel(x + w - 2, y + h - 2, color);
    }
    if (this.bitMode !== '8') {
      this.drawRect(x + 2, y + h - 1, w - 4, 1, adjustColor(color, -22));
    }
  }

  drawRoundedLeg(x, y, color, width = 3) {
    const h = 4;
    // Main leg body
    this.drawRect(x, y, width, h, color);
    
    // Round top corners
    this.drawPixel(x, y, 'rgba(0,0,0,0)');
    this.drawPixel(x + width - 1, y, 'rgba(0,0,0,0)');

    if (this.bitMode !== '8') {
      this.drawPixel(x + 1, y, adjustColor(color, 18));
      
      // 修正: 影の幅を削らず、足の幅いっぱいに描画する（段差をなくすため）
      // Y+3 (足の裏/影)
      this.drawRect(x, y + 3, width, 1, adjustColor(color, -18));
    }
  }

  drawPart(asset, x, y, { flipX = false, palette = {}, erase = false } = {}) {
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
            const c = this.getCurrentCtx();
            c.clearRect((x + ax) + this.OFFSET_X, (y + ay) + this.OFFSET_Y, 1, 1);
          }
          continue;
        }

        this.drawPixel(x + ax, y + ay, palette[ch]);
      }
    }
  }
}