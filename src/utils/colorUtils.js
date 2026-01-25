// src/utils/colorUtils.js

// ヘルパー: RGBをHSLに変換
const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
};

// ヘルパー: HSLをRGBに変換
const hslToRgb = (h, s, l) => {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    // hは0-360なので、0-1に正規化して渡す
    r = hue2rgb(p, q, h / 360 + 1/3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export const adjustColor = (color, amount) => {
  if (!color) return '#000000';
  
  const hex = color.replace('#', '');
  // エラーハンドリング
  if (hex.length !== 6) return color;

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  let [h, s, l] = rgbToHsl(r, g, b);

  // amount (-255〜255) を明度(L: 0.0〜1.0)の変化量に変換
  // 従来のamount=40 は 40/255 ≒ 0.15 程度の変化になります
  const lightnessDelta = amount / 255; 
  l += lightnessDelta;

  // 【クオリティアップの肝】色相(Hue)と彩度(Saturation)のシフト
  // 記事のテクニック「明度だけでなく色相も変える」を適用
  if (amount > 0) {
    // ハイライト: 黄色(60度)寄りにずらし、白飛び表現のため彩度を少し下げる
    h -= 8; // 赤〜黄方向へシフト
    s -= 0.05; 
  } else if (amount < 0) {
    // 影: 青紫(240度)寄りにずらし、リッチな影にするため彩度を少し上げる
    h += 8; // 青〜紫方向へシフト
    s += 0.10; 
  }

  // 値の範囲制限
  l = Math.max(0, Math.min(1, l));
  s = Math.max(0, Math.min(1, s));
  h = (h % 360 + 360) % 360; // 負の値対応

  const [newR, newG, newB] = hslToRgb(h, s, l);
  
  const toHex = (c) => {
    const val = Math.max(0, Math.min(255, c));
    return ('0' + val.toString(16)).slice(-2);
  };
  
  return '#' + toHex(newR) + toHex(newG) + toHex(newB);
};