import React, { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw, Dices, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Wand2, Skull, Shield, Sword, User, Smile, Sparkles, PaintBucket, Ban, Globe, Shirt } from 'lucide-react';

// --- Components ---

const SubColorSelector = ({ value, options, onChange }) => (
  <div className="flex flex-wrap gap-1 mt-1 pl-2 border-l-2 border-gray-200">
    {options.map((color, idx) => (
      <button
        key={idx}
        onClick={() => onChange(color)}
        className={`w-4 h-4 rounded-full border border-gray-300 ${value === color ? 'border-black ring-1 ring-blue-200' : ''}`}
        style={{ backgroundColor: color }}
      />
    ))}
  </div>
);

const Selector = ({ label, value, options, onChange, type = 'index', subSelector = null, category = '', disabled = false }) => {
  return (
      <div className={`mb-4 transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      </div>
      <div className="flex flex-col gap-2">
          {type === 'color' ? (
          <div className="flex flex-wrap gap-2">
              {options.map((color, idx) => (
              <button
                  key={idx}
                  onClick={() => onChange(color)}
                  className={`w-6 h-6 rounded-full border border-gray-300 transition-transform hover:scale-110 ${value === color ? 'border-2 border-black scale-110 shadow-md ring-2 ring-blue-100' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                  disabled={disabled}
              />
              ))}
          </div>
          ) : (
          <select
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full p-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          >
              {options.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {opt}
                </option>
              ))}
          </select>
          )}
          {subSelector}
      </div>
      </div>
  );
};

const RetroCharGen = () => {
  // キャンバス設定
  const CANVAS_SIZE = 48; 
  const SCALE = 8; 
  
  const OFFSET_X = 8; 
  const OFFSET_Y = 8;

  // 状態管理
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationFrame, setAnimationFrame] = useState(0); 
  const [direction, setDirection] = useState(0); 
  const [is16Bit, setIs16Bit] = useState(true); 
  const [bgColor, setBgColor] = useState('#ffffff'); 
  const [language, setLanguage] = useState('ja'); 
  
  const [charState, setCharState] = useState({
    baseType: 0, // 0:Human, 1:Slime, 2:Skeleton, 3:Ghost, 4:Goblin, 5:Lizardman, 6:Birdman, 7:Demon, 8:Elf, 9:Dwarf
    skinColor: '#ffdbac',
    hairStyle: 0,
    hairColor: '#e74c3c',
    eyeStyle: 0,
    eyeColor: '#2c3e50',
    hasWhiteEye: false,    
    // --- Outfit ---
    chestStyle: 1, 
    chestColor: '#3498db',
    waistStyle: 1, 
    waistColor: '#f1c40f',
    legColor: '#2c3e50',   
    shoeStyle: 1,          
    shoeColor: '#5d4037',  
    // --- Accessories ---
    accessory: 0, 
    eyeAccessory: 0, 
    earAccessory: 0, 
    // --- Equipment ---
    weapon: 0, 
    shield: 0, 
    helmet: 0, 
    helmetColor: '#bdc3c7',
    weaponColor: '#bdc3c7', 
    shieldColor: '#bdc3c7',
    // --- Monster Parts ---
    horns: 0, 
    hornColor: '#ffffff',
    wings: 0, 
    wingColor: '#a29bfe',
    tail: 0,  
    tailColor: '#a29bfe',
    hasFangs: false,
    hasClaws: false,
  });

  const canvasRef = useRef(null);

  // --- 翻訳データ ---
  const t = {
    en: {
      title: "RPG Sprite Maker",
      subtitle: "Create your 8-bit hero or monster",
      anim: "Anim",
      random: "Random",
      download: "Download PNG",
      core: "Core",
      bit16: "16-BIT",
      race: "Race",
      chest: "Chest",
      waist: "Waist",
      appearance: "Appearance",
      skinTone: "Skin Tone",
      hairStyle: "Hair Style",
      hairColor: "Hair Color",
      eyes: "Eyes",
      eyeColor: "Eye Color",
      hasSclera: "Has Sclera",
      outfit: "Outfit",
      chestColor: "Chest Color",
      waistColor: "Waist Color",
      pantsColor: "Pants Color",
      shoes: "Shoes",
      shoeColor: "Shoe Color",
      accessories: "Accessories",
      head: "Head",
      eye: "Eye",
      ear: "Ear",
      monsterParts: "Monster Parts",
      horns: "Horns",
      wings: "Wings",
      tail: "Tail",
      partsColor: "Parts Color",
      fangs: "Fangs",
      claws: "Claws",
      equipment: "Equipment",
      weapon: "Weapon",
      shield: "Shield",
      helmet: "Helmet",
      weaponColor: "Weapon Color",
      shieldColor: "Shield Color",
      helmetColor: "Helmet Color",
      // Options
      races: ['Human', 'Slime', 'Skeleton', 'Ghost', 'Goblin', 'Lizardman', 'Birdman', 'Demon', 'Elf', 'Dwarf'],
      chestOpt: ['Bare', 'Tunic', 'Armor', 'Robe', 'Coat', 'Bikini'],
      waistOpt: ['Pants Only', 'Belt', 'Skirt', 'Loincloth', 'Armor Skirt'],
      hairStyles: ['Short', 'Long', 'Spiky', 'Bob', 'Bald', 'None'],
      eyeStyles: ['Normal', 'Sleepy', 'Tall', 'Patch'],
      shoeStyles: ['Barefoot', 'Shoes', 'Boots'],
      accHead: ['None', 'Cat Ears', 'Crown'],
      accEye: ['None', 'Glasses', 'Sunglasses', 'Monocle', 'Scouter'],
      accEar: ['None', 'Gold Ring', 'Silver Stud', 'Red Gem', 'Blue Gem'],
      optHorns: ['None', 'Small', 'Bull', 'Unicorn', 'Demon'],
      optWings: ['None', 'Bat', 'Angel', 'Fairy', 'Dragon'],
      optTail: ['None', 'Demon', 'Beast', 'Lizard'],
      optWeapon: ['None', 'Sword', 'Staff', 'Bow', 'Spear', 'Axe', 'Dagger'],
      optShield: ['None', 'Buckler', 'Kite Shield', 'Tower Shield'],
      optHelmet: ['None', 'Iron Helm', 'Viking', 'Mage Hat', 'Hood'],
    },
    ja: {
      title: "RPG スプライトメーカー",
      subtitle: "8bit風の勇者やモンスターを作ろう",
      anim: "アニメ",
      random: "ランダム",
      download: "PNG保存",
      core: "基本設定",
      bit16: "16-BIT (陰影)",
      race: "種族",
      chest: "胸 (上半身)",
      waist: "腰 (下半身)",
      appearance: "外見",
      skinTone: "肌の色",
      hairStyle: "髪型",
      hairColor: "髪色",
      eyes: "目の形",
      eyeColor: "目の色",
      hasSclera: "白目あり",
      outfit: "服装",
      chestColor: "胸の色",
      waistColor: "腰の色",
      pantsColor: "ズボンの色",
      shoes: "靴",
      shoeColor: "靴の色",
      accessories: "アクセサリー",
      head: "頭",
      eye: "目",
      ear: "耳",
      monsterParts: "モンスターパーツ",
      horns: "ツノ",
      wings: "羽",
      tail: "尻尾",
      partsColor: "パーツの色",
      fangs: "牙",
      claws: "爪",
      equipment: "装備",
      weapon: "武器",
      shield: "盾",
      helmet: "兜・帽子",
      weaponColor: "武器の色",
      shieldColor: "盾の色",
      helmetColor: "兜の色",
      // Options
      races: ['人間', 'スライム', 'スケルトン', 'ゴースト', 'ゴブリン', 'リザードマン', '鳥人', '悪魔', 'エルフ', 'ドワーフ'],
      chestOpt: ['裸', 'チュニック', '鎧', 'ローブ', 'コート', 'ビキニ'],
      waistOpt: ['ズボンのみ', 'ベルト', 'スカート', '腰布', '垂れ'],
      hairStyles: ['ショート', 'ロング', 'ツンツン', 'ボブ', 'スキンヘッド', 'なし'],
      eyeStyles: ['普通', '眠そう', '縦長', '眼帯'],
      shoeStyles: ['裸足', '靴', 'ブーツ'],
      accHead: ['なし', '猫耳', '王冠'],
      accEye: ['なし', 'メガネ', 'サングラス', 'モノクル', 'スカウター'],
      accEar: ['なし', '金の輪', '銀の鋲', '赤宝石', '青宝石'],
      optHorns: ['なし', '小', '牛', 'ユニコーン', '悪魔'],
      optWings: ['なし', 'コウモリ', '天使', '妖精', 'ドラゴン'],
      optTail: ['なし', '悪魔', '獣', 'トカゲ'],
      optWeapon: ['なし', '剣', '杖', '弓', '槍', '斧', '短剣'],
      optShield: ['なし', '小盾', 'カイト', '大盾'],
      optHelmet: ['なし', '鉄兜', 'バイキング', '帽子', 'フード'],
    }
  };

  const text = t[language];

  // --- カラーパレット ---
  const universalPalette = [
    // Mono / Metal
    '#ffffff', '#dfe6e9', '#bdc3c7', '#95a5a6', '#7f8c8d', '#636e72', '#2d3436', '#2c3e50', '#000000',
    // Red / Pink
    '#ff7675', '#d63031', '#c0392b', '#e84393', '#fd79a8',
    // Skin / Brown / Orange
    '#ffdbac', '#f1c27d', '#e0ac69', '#f39c12', '#e67e22', '#d35400', '#8d5524', '#523826', '#5d4037', 
    // Yellow
    '#ffeaa7', '#f1c40f', 
    // Green
    '#55efc4', '#00b894', '#00cec9', '#1abc9c', '#16a085', '#2ecc71', '#27ae60', '#6ab04c',
    // Blue
    '#74b9ff', '#0984e3', '#2980b9', '#3498db', '#34495e', '#48dbfb',
    // Purple
    '#a29bfe', '#6c5ce7', '#8e44ad', '#9b59b6', 
  ];

  const palettes = {
    skin: universalPalette.filter(c => ['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#523826', '#6ab04c', '#48dbfb', '#a29bfe', '#b2bec3', '#eb4d4b', '#2d3436', '#dfe6e9', '#ffffff'].includes(c) || true), 
    hair: universalPalette,
    outfit: universalPalette,
    shoes: universalPalette,
    eyes: universalPalette,
    monster: universalPalette,
    metal: universalPalette,
  };

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setAnimationFrame((prev) => (prev === 0 ? 1 : 0));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const adjustColor = (color, amount) => {
    if (!color) return '#000000';
    const clamp = (val) => Math.min(255, Math.max(0, val));
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    return '#' + (0x1000000 + clamp(r) * 0x10000 + clamp(g) * 0x100 + clamp(b)).toString(16).slice(1);
  };

  // 描画ロジック
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // キャンバス初期化
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
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

    // 16bit風シェーディング描画ヘルパー
    const drawShadedRect = (x, y, w, h, baseColor) => {
      if (!is16Bit) {
        drawRect(x, y, w, h, baseColor);
        return;
      }
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
    const cOutfitShadow = adjustColor(chestColor, -30);
    const cGold = '#f1c40f';
    const cSilver = '#95a5a6';
    const cWood = '#8d5524';
    const cDarkMetal = '#2c3e50';
    
    if (direction === 2) {
      ctxs.forEach(c => {
        c.translate(CANVAS_SIZE, 0);
        c.scale(-1, 1);
      });
    }

    const drawMode = direction === 2 ? 1 : direction; 

    // アニメーション
    let yOffset = animationFrame === 1 ? 1 : 0;
    let walkOffset = animationFrame === 1 ? 1 : -1; 
    let wingOffset = animationFrame === 1 ? -1 : 0; 
    let tailOffset = animationFrame === 1 ? 1 : 0; 
    let itemBob = animationFrame === 1 ? 1 : 0; 

    // スライム用の変数
    let slimeHeadY = 4 + yOffset; 
    if (baseType === 1) { // Slime
       yOffset = 0; 
       // スライムの頭頂部座標目安 (20くらい)
       slimeHeadY = 18 + (animationFrame === 0 ? 0 : 1);
    } else if (baseType === 3) { // Ghost
       yOffset = animationFrame === 1 ? 1 : -1;
       walkOffset = 0;
    }

    // 描画位置調整用Y座標 (通常 or スライム)
    const activeHeadY = (baseType === 1) ? slimeHeadY : (4 + yOffset);
    // Main headY (used for Humanoid body positioning relative to head)
    const headY = 4 + yOffset;
    const baseHandY = 19; 

    const drawShoeOnLeg = (legX, legY, legW, legH) => {
        if (shoeStyle === 0) return; 
        if (baseType === 2 || baseType === 3 || baseType === 1) return; 
        
        const shoeH = shoeStyle === 2 ? 3 : 2; 
        const shoeY = legY + legH - shoeH;
        if (is16Bit && shoeH > 1) {
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
        
        // Vertical Drawing
        if (weapon === 1) { // Sword
            drawRect(x, y - 8, 2, 8, wc); drawRect(x - 2, y, 6, 1, cGold); drawRect(x, y + 1, 2, 2, handleC); 
        } else if (weapon === 2) { // Staff
            drawRect(x, y - 8, 2, 12, handleC); drawRect(x - 1, y - 10, 4, 3, cGold); drawPixel(x + 1, y - 9, '#e74c3c'); 
        } else if (weapon === 3) { // Bow
            drawRect(x + 1, y - 6, 1, 12, cWood); drawPixel(x, y - 5, cWood); drawPixel(x, y + 5, cWood); drawPixel(x - 1, y - 4, cWood); drawPixel(x - 1, y + 4, cWood); drawRect(x - 1, y - 3, 1, 6, '#fff'); 
        } else if (weapon === 4) { // Spear
            drawRect(x, y - 10, 1, 14, handleC); drawRect(x - 1, y - 13, 3, 3, wc); drawPixel(x, y - 14, wc);
        } else if (weapon === 5) { // Axe
            drawRect(x, y - 6, 2, 10, handleC); drawRect(x + 2, y - 7, 3, 6, wc); drawRect(x - 3, y - 7, 3, 6, wc); 
        } else if (weapon === 6) { // Dagger
            drawRect(x, y - 3, 2, 3, wc); drawRect(x - 1, y, 4, 1, cGold); drawRect(x, y + 1, 2, 1, handleC); 
        }
    };

    const drawShield = (x, y) => {
        if (shield === 0) return;
        const sc = shieldColor; 
        const trim = cGold;

        if (shield === 1) { // Buckler
            drawShadedRect(x - 1, y - 2, 6, 6, sc); drawPixel(x + 1, y + 1, trim);
        } else if (shield === 2) { // Kite
            drawShadedRect(x - 2, y - 2, 8, 5, sc); drawRect(x - 1, y + 3, 6, 2, sc); drawRect(x, y + 5, 4, 2, sc); drawRect(x - 2, y - 2, 8, 1, trim); drawPixel(x + 2, y + 2, trim); 
        } else if (shield === 3) { // Tower
            drawShadedRect(x - 3, y - 4, 10, 12, sc); drawRect(x - 2, y - 3, 8, 10, adjustColor(sc, -20));
        }
    };

    // --- PARTS DRAWING ---

    const drawWings = (isBackLayer) => {
      if (wings === 0) return;
      const wc = wingColor;
      const wcDark = adjustColor(wc, -30);
      setLayer(isBackLayer ? 0 : 2); 
      // Slime adjustments
      const sY = baseType === 1 ? 16 : 0;

      const fillWing = (x, y, w, h, c) => {
        drawRect(x, y, w, h, c);
        if (is16Bit && w > 2 && h > 2) { drawRect(x+1, y+h-1, w-1, 1, wcDark); }
      };

      if (drawMode === 0) { // Front
        if (!isBackLayer) return; 
        const wy = 14 + wingOffset + sY;
        if (wings === 1) { 
          fillWing(4, wy, 6, 1, wc); fillWing(22, wy, 6, 1, wc);
          fillWing(3, wy+1, 2, 4, wc); fillWing(27, wy+1, 2, 4, wc);
          fillWing(5, wy+1, 1, 1, wc); fillWing(26, wy+1, 1, 1, wc);
          fillWing(6, wy+2, 1, 1, wc); fillWing(25, wy+2, 1, 1, wc);
        } else if (wings === 2) { 
          fillWing(5, wy-2, 5, 8, '#ecf0f1'); fillWing(22, wy-2, 5, 8, '#ecf0f1');
          drawPixel(4, wy-1, '#bdc3c7'); drawPixel(27, wy-1, '#bdc3c7');
        } else if (wings === 3) { 
          fillWing(6, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)'); fillWing(22, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)');
        } else if (wings === 4) { 
          fillWing(2, wy-4, 8, 2, wc); fillWing(22, wy-4, 8, 2, wc);
          fillWing(1, wy-2, 2, 6, wc); fillWing(29, wy-2, 2, 6, wc);
          fillWing(3, wy-2, 6, 4, wc); fillWing(23, wy-2, 6, 4, wc);
        }
      } 
      else if (drawMode === 1) { // Side
        const backX = 18; 
        const wy = wingOffset + sY;
        const drawSingleWing = (offsetX, offsetY, color) => {
             if (wings === 1) { fillWing(backX + offsetX, 14 + wy + offsetY, 6, 6, color); } 
             else if (wings === 2) { fillWing(backX + offsetX - 1, 13 + wy + offsetY, 5, 8, color === wc ? '#ecf0f1' : '#bdc3c7'); } 
             else if (wings === 3) { fillWing(backX + offsetX, 13 + wy + offsetY, 4, 6, 'rgba(162, 155, 254, 0.4)'); } 
             else if (wings === 4) { fillWing(backX + offsetX - 1, 11 + wy + offsetY, 8, 8, color); }
        };
        if (isBackLayer) { drawSingleWing(4, -2, wcDark); } else { drawSingleWing(0, 0, wc); }
      }
      else if (drawMode === 3) { // Back
        if (isBackLayer) return; 
        const wy = 14 + wingOffset + sY;
        if (wings === 1) { fillWing(4, wy, 24, 1, wc); fillWing(2, wy-1, 10, 6, wc); fillWing(20, wy-1, 10, 6, wc); } 
        else if (wings === 2) { fillWing(6, wy-1, 8, 8, '#ecf0f1'); fillWing(18, wy-1, 8, 8, '#ecf0f1'); } 
        else if (wings === 3) { fillWing(8, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)'); fillWing(20, wy-1, 4, 6, 'rgba(162, 155, 254, 0.6)'); } 
        else if (wings === 4) { fillWing(3, wy-3, 10, 8, wc); fillWing(19, wy-3, 10, 8, wc); }
      }
    };

    const drawTail = (isBackLayer) => {
      if (tail === 0 && baseType !== 5) return; 
      const useTail = (baseType === 5 && tail === 0) ? 3 : tail; 
      if (useTail === 0) return;

      const tc = tailColor;
      setLayer(isBackLayer ? 0 : 2); 
      const sY = baseType === 1 ? 16 : 0;

      if (drawMode === 0) { 
        if (!isBackLayer) return;
        if (useTail === 1) { drawRect(21, 22 + tailOffset + sY, 4, 1, tc); drawRect(24, 20 + tailOffset + sY, 1, 2, tc); drawRect(23, 19 + tailOffset + sY, 3, 2, tc); } 
        else if (useTail === 2) { drawRect(20, 23 + tailOffset + sY, 6, 3, tc); } 
        else if (useTail === 3) { drawRect(20, 24 + sY, 8, 2, tc); }
      }
      else if (drawMode === 1) { 
        if (!isBackLayer) return;
        if (useTail === 1) { drawRect(18, 22 + tailOffset + sY, 4, 1, tc); drawRect(21, 18 + tailOffset + sY, 2, 4, tc); } 
        else if (useTail === 2) { drawRect(17, 23 + tailOffset + sY, 5, 3, tc); } 
        else if (useTail === 3) { drawRect(17, 25 + sY, 8, 3, tc); }
      }
      else if (drawMode === 3) { 
        if (isBackLayer) return;
        if (useTail === 1) { drawRect(16, 22 + tailOffset + sY, 6, 1, tc); drawRect(21, 19 + tailOffset + sY, 2, 3, tc); } 
        else if (useTail === 2) { drawRect(15, 23 + tailOffset + sY, 2, 6, tc); } 
        else if (useTail === 3) { drawRect(15, 24 + sY, 2, 6, tc); }
      }
    };

    const drawHorns = () => {
      if (horns === 0 && baseType !== 7) return; 
      const useHorns = (baseType === 7 && horns === 0) ? 4 : horns; 
      if (useHorns === 0) return;

      setLayer(2); 
      const hc = hornColor;
      
      const hY = activeHeadY; // Use active head Y
      const dh = (x,y,w,h,c) => drawRect(x,y,w,h,c);

      // Slime specific X adjustments if side view
      // Side view slime is centered but horns should be on head
      const sX = (baseType === 1 && drawMode === 1) ? 4 : 0; 
      const sY = (baseType === 1) ? -4 : 0; // Move horns slightly up relative to slime head surface

      if (drawMode === 0 || drawMode === 3) { 
        if (useHorns === 1) { dh(11, hY - 2 + sY, 2, 2, hc); dh(19, hY - 2 + sY, 2, 2, hc); } 
        else if (useHorns === 2) { dh(9, hY - 2 + sY, 3, 2, hc); dh(20, hY - 2 + sY, 3, 2, hc); dh(8, hY - 4 + sY, 1, 3, hc); dh(23, hY - 4 + sY, 1, 3, hc); } 
        else if (useHorns === 3) { dh(15, hY - 6 + sY, 2, 6, hc); } 
        else if (useHorns === 4) { dh(10, hY - 4 + sY, 2, 4, hc); dh(20, hY - 4 + sY, 2, 4, hc); dh(11, hY - 5 + sY, 4, 2, hc); dh(17, hY - 5 + sY, 4, 2, hc); }
      } else if (drawMode === 1) { 
         if (useHorns === 1) { dh(12+sX, hY - 2 + sY, 2, 2, hc); } 
         else if (useHorns === 2) { dh(11+sX, hY - 2 + sY, 3, 2, hc); dh(10+sX, hY - 4 + sY, 1, 3, hc); } 
         else if (useHorns === 3) { dh(11+sX, hY - 6 + sY, 2, 6, hc); } 
         else if (useHorns === 4) { dh(11+sX, hY - 4 + sY, 3, 4, hc); dh(12+sX, hY - 5 + sY, 4, 2, hc); }
      }
    };

    const drawEyeAccessory = (hY) => {
        if (eyeAccessory === 0 || drawMode === 3) return; 
        setLayer(2);
        
        let eyeY = hY + 5;
        if(baseType === 1) eyeY = hY + 4; // Slime eye pos

        const color = '#333'; 
        const glassColor = 'rgba(100, 200, 255, 0.5)';
        
        // Slime width adjust
        const sOff = baseType === 1 ? 4 : 0;
        const sY = baseType === 1 && drawMode === 1 ? 4 : 0; // Side view shift

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
    
    // --- Head Accessory (Crown/CatEars) ---
    const drawHeadAccessory = (hY) => {
        if (accessory === 0) return;
        setLayer(2);
        
        // Slime adjustment
        const sY = baseType === 1 ? -4 : 0; 
        const sX = (baseType === 1 && drawMode === 1) ? 4 : 0; 

        if (drawMode !== 3) { 
          if (accessory === 1) { // Cat Ears
            if (drawMode === 0) { drawPixel(11, hY - 3 + sY, hairColor); drawPixel(10, hY - 2 + sY, hairColor); drawPixel(20, hY - 3 + sY, hairColor); drawPixel(21, hY - 2 + sY, hairColor); } 
            else { drawPixel(12+sX, hY - 3 + sY, hairColor); drawPixel(11+sX, hY - 2 + sY, hairColor); } 
          } else if (accessory === 2) { // Crown
             if (drawMode === 0) { drawRect(11, hY - 4 + sY, 10, 2, '#f1c40f'); drawPixel(11, hY - 5 + sY, '#f1c40f'); drawPixel(15, hY - 5 + sY, '#f1c40f'); drawPixel(20, hY - 5 + sY, '#f1c40f'); } 
             else { drawRect(11+sX, hY - 4 + sY, 8, 2, '#f1c40f'); drawPixel(11+sX, hY - 5 + sY, '#f1c40f'); drawPixel(14+sX, hY - 5 + sY, '#f1c40f'); } 
          }
        } else { // Back
             if (accessory === 1) { drawPixel(11, hY - 3 + sY, hairColor); drawPixel(10, hY - 2 + sY, hairColor); drawPixel(20, hY - 3 + sY, hairColor); drawPixel(21, hY - 2 + sY, hairColor); }
             else if (accessory === 2) { drawRect(11, hY - 4 + sY, 10, 2, '#f1c40f'); drawPixel(11, hY - 5 + sY, '#f1c40f'); drawPixel(15, hY - 5 + sY, '#f1c40f'); drawPixel(20, hY - 5 + sY, '#f1c40f'); } 
        }
    };


    // --- MAIN RENDER SEQUENCE ---

    drawWings(true);
    drawTail(true);
    
    setLayer(0); 
    if (baseType !== 1 && baseType !== 2) { // Hair back
        if (hairStyle !== 5) {
            if (drawMode === 1) { 
                 if (hairStyle === 0) { drawRect(17, headY, 4, 7, hairColor); if(is16Bit) drawRect(17, headY+6, 4, 1, cHairShadow); }
                 else if (hairStyle === 1) { drawRect(16, headY, 5, 12, hairColor); if(is16Bit) { drawRect(16, headY+11, 5, 1, cHairShadow); drawRect(16, headY+3, 5, 1, cHairLight); } }
                 else if (hairStyle === 2) { drawRect(18, headY, 3, 5, hairColor); }
                 else if (hairStyle === 3) { drawRect(15, headY + 1, 6, 8, hairColor); if(is16Bit) { drawRect(15, headY+8, 6, 1, cHairShadow); } }
            } else if (drawMode === 0) { 
                 if (hairStyle === 0) { drawRect(9, headY, 2, 6, hairColor); drawRect(21, headY, 2, 6, hairColor); }
                 else if (hairStyle === 1) { drawRect(9, headY, 2, 12, hairColor); drawRect(21, headY, 2, 12, hairColor); }
                 else if (hairStyle === 2) { drawRect(9, headY, 2, 4, hairColor); drawRect(21, headY, 2, 4, hairColor); }
                 else if (hairStyle === 3) { drawRect(8, headY + 1, 3, 8, hairColor); drawRect(21, headY + 1, 3, 8, hairColor); }
            }
        }
    } else if (baseType === 1 && hairStyle !== 5) { // Slime Back Hair
        const hY = activeHeadY - 2;
        const sX = 4; // Side view shift
        if (drawMode === 3) {
            // Back view slime hair
             if (hairStyle === 0) { drawRect(13, hY, 6, 3, hairColor); }
             else if (hairStyle === 1) { drawRect(13, hY, 6, 8, hairColor); }
             else if (hairStyle === 2) { drawRect(12, hY, 8, 4, hairColor); }
             else if (hairStyle === 3) { drawRect(12, hY, 8, 5, hairColor); }
        } else if (drawMode === 1) { // Side view back part
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
                if (shield > 0) drawShield(22, baseHandY + yOffset + itemBob);
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
        if(is16Bit) drawPixel(sX + 3, sY + 3, cSkinLight);
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
    
    // Front Equipment
    const drawHands = (isFrontLayer) => {
        setLayer(isFrontLayer ? 2 : 0);
        const hColor = getHandColor();
        const hLen = getHandLen();
        if (baseType === 1) return; 

        // 袖口の描画ロジックを Chest Style に連動
        const isSleeved = [1, 2, 3, 4].includes(chestStyle);
        const handY = 19 + yOffset; // Standard hand height
        
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
    drawHands(true);

    if (baseType === 1) { // Slime
        const sW = animationFrame === 0 ? 16 : 18;
        const sH = animationFrame === 0 ? 14 : 12;
        const sX = (32 - sW) / 2;
        const sY = 32 - sH;
        // Eyes logic for slime
        const eyeY = sY + 4;
        if (drawMode !== 3) {
             // Use eyeStyle
             const eC = eyeColor;
             if (eyeStyle === 0) {
                 drawRect(sX + 4, eyeY, 2, 2, eC); drawRect(sX + sW - 6, eyeY, 2, 2, eC);
             } else if (eyeStyle === 1) { // Sleepy
                 drawRect(sX + 4, eyeY+1, 2, 1, eC); drawRect(sX + sW - 6, eyeY+1, 2, 1, eC);
             } else if (eyeStyle === 2) { // Tall
                 drawRect(sX + 4, eyeY-1, 2, 3, eC); drawRect(sX + sW - 6, eyeY-1, 2, 3, eC);
             } else if (eyeStyle === 3) { // Patch
                 drawRect(sX + 4, eyeY, 2, 2, eC); drawRect(sX + sW - 6, eyeY, 2, 2, '#333');
             }

             if(hasWhiteEye && eyeStyle !== 1) { 
                 drawPixel(sX+4, eyeY, '#fff'); drawPixel(sX+sW-6, eyeY, '#fff'); 
             }
             drawRect(sX + 7, eyeY + 4, 4, 1, '#7f8c8d');
        }
        
        // --- Slime Hair ---
        if (hairStyle !== 5) {
             const hY = sY - 2; 
             const hColor = hairColor;
             const fillHair = (x, y, w, h) => { drawRect(x, y, w, h, hColor); };
             
             // Simple mapping of hair styles to slime width
             if (hairStyle === 0) { // Short
                fillHair(sX+2, hY, sW-4, 3);
             } else if (hairStyle === 1) { // Long
                fillHair(sX+2, hY, sW-4, 8); // Drapes down
             } else if (hairStyle === 2) { // Spiky
                fillHair(sX+4, hY-2, sW-8, 5);
             } else if (hairStyle === 3) { // Bob
                fillHair(sX+1, hY, sW-2, 6);
             } else if (hairStyle === 4) { // Bald (Shine)
                drawRect(sX+4, hY+2, 2, 2, 'rgba(255,255,255,0.4)');
             }
        }
    } 
    else {
        const fillHead = (x, y, w, h, c) => {
            drawRect(x, y, w, h, c);
            if (is16Bit) { drawRect(x+1, y, w-2, 1, cSkinShadow); drawRect(x+1, y+h-1, w-2, 1, cSkinShadow); if (baseType !== 2) drawPixel(x+2, y+2, cSkinLight); }
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
          fillHead(11, headY, 10, 10, headColor);
          if (baseType === 5) { drawRect(18, headY + 5, 4, 3, headColor); }
          else if (baseType === 6) { // Birdman Beak: Front (Left)
              drawRect(8, headY + 5, 3, 2, '#f1c40f'); 
          }
          else if (baseType === 4 || baseType === 8) { drawRect(10, headY + 3, 2, 4, headColor); }
          if (baseType !== 2) { drawPixel(11, headY, 'rgba(0,0,0,0)'); drawPixel(20, headY, 'rgba(0,0,0,0)'); drawPixel(11, headY + 9, 'rgba(0,0,0,0)'); drawPixel(20, headY + 9, 'rgba(0,0,0,0)'); }
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
                 if (eyeStyle === 0) { if (hasWhiteEye) { drawRect(11, eyeY, 4, 2, '#fff'); drawRect(17, eyeY, 4, 2, '#fff'); } drawRect(12, eyeY, 2, 2, eyeColor); drawRect(18, eyeY, 2, 2, eyeColor); if(is16Bit) { drawPixel(12, eyeY, '#fff'); drawPixel(18, eyeY, '#fff'); } }
                 else if (eyeStyle === 1) { if (hasWhiteEye) { drawRect(11, eyeY + 1, 4, 1, '#fff'); drawRect(17, eyeY + 1, 4, 1, '#fff'); } drawRect(12, eyeY + 1, 2, 1, eyeColor); drawRect(18, eyeY + 1, 2, 1, eyeColor); }
                 else if (eyeStyle === 2) { if (hasWhiteEye) { drawRect(11, eyeY - 1, 4, 3, '#fff'); drawRect(17, eyeY - 1, 4, 3, '#fff'); } drawRect(12, eyeY - 1, 2, 3, eyeColor); drawRect(18, eyeY - 1, 2, 3, eyeColor); }
                 else if (eyeStyle === 3) { if (hasWhiteEye) { drawRect(11, eyeY, 4, 2, '#fff'); } drawRect(12, eyeY, 2, 2, eyeColor); drawRect(18, eyeY, 2, 1, '#000'); drawRect(17, eyeY, 3, 2, '#333'); }
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
              if (eyeStyle !== 3) { if (hasWhiteEye) { drawRect(eyeX, y, 3, h, '#fff'); drawRect(eyeX + 1, y, 1, h, eyeColor); } else { drawRect(eyeX, y, 2, h, eyeColor); } } else { drawRect(eyeX, eyeY, 10, 1, '#000'); }
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
                const fillHair = (x, y, w, h) => { drawRect(x, y, w, h, hairColor); if (is16Bit && h >= 3) { const ctx = ctxs[currentLayer]; ctx.fillStyle = cHairLight; ctx.fillRect((x+OFFSET_X), (y+OFFSET_Y+1), w, 1); } };
                if (hairStyle !== 5) { // Not None
                    if (drawMode === 0) { 
                        fillHair(10, headY - 2, 12, 3); drawPixel(13, headY+1, hairColor); drawPixel(15, headY+1, hairColor); drawPixel(17, headY+1, hairColor);
                        if (hairStyle === 1) fillHair(11, headY, 10, 2); else if (hairStyle === 2) { drawRect(14, headY - 4, 4, 4, hairColor); drawRect(10, headY - 1, 12, 2, hairColor); } else if (hairStyle === 3) { drawRect(11, headY, 3, 3, hairColor); drawRect(18, headY, 3, 3, hairColor); } 
                    } else if (drawMode === 1) { 
                        fillHair(11, headY - 2, 10, 3); drawRect(10, headY, 2, 4, hairColor); if (hairStyle === 2) { drawRect(13, headY - 4, 6, 4, hairColor); drawRect(11, headY - 1, 10, 2, hairColor); } 
                    } else if (drawMode === 3) { 
                        if (hairStyle === 0) { fillHair(10, headY - 2, 12, 3); drawRect(9, headY, 14, 6, hairColor); drawRect(11, headY + 6, 10, 2, hairColor); } else if (hairStyle === 1) { fillHair(10, headY - 2, 12, 3); drawRect(9, headY, 14, 12, hairColor); } else if (hairStyle === 2) { drawRect(14, headY - 4, 4, 4, hairColor); drawRect(10, headY - 1, 12, 2, hairColor); drawRect(9, headY, 14, 5, hairColor); } else if (hairStyle === 3) { fillHair(10, headY - 2, 12, 4); drawRect(8, headY + 1, 16, 8, hairColor); } 
                    }
                }
                if (hairStyle === 4 && drawMode !== 3) {
                     drawRect(12, headY + 1, 2, 2, 'rgba(255,255,255,0.3)');
                }
            }
        }
    }

    drawHorns();
    drawEyeAccessory(activeHeadY);
    drawHeadAccessory(activeHeadY);

    if (drawMode !== 3 && baseType !== 1) { 
       // Normal characters equipment drawing at end of layer 2?
       // Front Equipment should be here.
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

    // --- COMPOSITING ---
    const compositeLayers = () => {
      ctx.drawImage(buffers[0], 0, 0);
      ctx.drawImage(buffers[1], 0, 0);
      ctx.drawImage(buffers[2], 0, 0);
    };

    compositeLayers();

  }, [charState, animationFrame, direction, is16Bit, bgColor]); 

  // ... (handleDownload, handleRandom, Selector, SubColorSelector remain same) ...
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pixel-character-${['front','left','right','back'][direction]}.png`;
    const tempCanvas = document.createElement('canvas');
    const exportSize = 480; 
    tempCanvas.width = exportSize;
    tempCanvas.height = exportSize;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.imageSmoothingEnabled = false;
    const currentImage = new Image();
    currentImage.src = canvas.toDataURL();
    currentImage.onload = () => {
        tCtx.drawImage(currentImage, 0, 0, exportSize, exportSize);
        link.href = tempCanvas.toDataURL();
        link.click();
    };
  };

  const handleRandom = () => {
    setCharState({
      baseType: Math.floor(Math.random() * 10), 
      skinColor: palettes.skin[Math.floor(Math.random() * palettes.skin.length)],
      hairStyle: Math.floor(Math.random() * 6),
      hairColor: palettes.hair[Math.floor(Math.random() * palettes.hair.length)],
      eyeStyle: Math.floor(Math.random() * 4),
      eyeColor: palettes.eyes[Math.floor(Math.random() * palettes.eyes.length)],
      hasWhiteEye: Math.random() > 0.7, 
      chestStyle: Math.floor(Math.random() * 6), 
      chestColor: palettes.outfit[Math.floor(Math.random() * palettes.outfit.length)],
      waistStyle: Math.floor(Math.random() * 5), 
      waistColor: palettes.outfit[Math.floor(Math.random() * palettes.outfit.length)],
      legColor: palettes.outfit[Math.floor(Math.random() * palettes.outfit.length)],
      shoeStyle: Math.floor(Math.random() * 3),
      shoeColor: palettes.shoes[Math.floor(Math.random() * palettes.shoes.length)],
      accessory: Math.floor(Math.random() * 3),
      eyeAccessory: Math.floor(Math.random() * 5),
      earAccessory: Math.floor(Math.random() * 5),
      horns: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0,
      hornColor: palettes.monster[Math.floor(Math.random() * palettes.monster.length)],
      wings: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0,
      wingColor: palettes.monster[Math.floor(Math.random() * palettes.monster.length)],
      tail: Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0,
      tailColor: palettes.monster[Math.floor(Math.random() * palettes.monster.length)],
      hasFangs: Math.random() > 0.8,
      hasClaws: Math.random() > 0.8,
      weapon: Math.floor(Math.random() * 7),
      shield: Math.floor(Math.random() * 4),
      helmet: Math.floor(Math.random() * 5),
      helmetColor: palettes.metal[Math.floor(Math.random() * 4)], 
      weaponColor: palettes.metal[Math.floor(Math.random() * 4)],
      shieldColor: palettes.metal[Math.floor(Math.random() * 4)],
    });
  };

  const isControlDisabled = (category) => {
      const { baseType } = charState;
      if (baseType === 1) { // Slime
          return ['outfit', 'pants', 'shoes', 'weapon', 'shield', 'ear'].includes(category);
      }
      if (baseType === 2) { // Skeleton
          return ['shoes'].includes(category);
      }
      if (baseType === 3) { // Ghost
          return ['shoes', 'pants'].includes(category);
      }
      return false;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight flex items-center justify-center gap-3">
          <span className="text-blue-500 pixel-font">👾</span>
          {text.title}
        </h1>
        <p className="text-gray-500 mt-2 text-sm">{text.subtitle}</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 max-w-6xl w-full items-start">
        {/* LEFT: Preview */}
        <div className="flex flex-col items-center gap-4 sticky top-4">
          <div className="relative bg-white p-4 rounded-xl shadow-lg border-4 border-gray-200" style={{
            backgroundImage: bgColor === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            backgroundColor: 'white'
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="image-pixelated bg-transparent max-w-full"
              style={{ 
                width: `${CANVAS_SIZE * SCALE}px`, 
                height: `${CANVAS_SIZE * SCALE}px`,
                imageRendering: 'pixelated' 
              }}
            />
            <div className="absolute inset-0 pointer-events-none opacity-10" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }} 
            />
          </div>

          <div className="flex gap-2">
             <button onClick={() => setBgColor('transparent')} className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center ${bgColor==='transparent' ? 'ring-2 ring-blue-500' : ''}`} style={{background: '#fff'}} title="Transparent"><Ban size={16} className="text-gray-400"/></button>
             <button onClick={() => setBgColor('#ffffff')} className={`w-8 h-8 rounded-full border shadow-sm ${bgColor==='#ffffff' ? 'ring-2 ring-blue-500' : ''}`} style={{background: '#ffffff'}} title="White"></button>
             <button onClick={() => setBgColor('#d1d5db')} className={`w-8 h-8 rounded-full border shadow-sm ${bgColor==='#d1d5db' ? 'ring-2 ring-blue-500' : ''}`} style={{background: '#d1d5db'}} title="Gray"></button>
             <button onClick={() => setBgColor('#4b5563')} className={`w-8 h-8 rounded-full border shadow-sm ${bgColor==='#4b5563' ? 'ring-2 ring-blue-500' : ''}`} style={{background: '#4b5563'}} title="Dark Gray"></button>
          </div>

          <div className="bg-gray-200 p-2 rounded-full grid grid-cols-3 gap-1 shadow-inner">
             <div />
             <button onClick={() => setDirection(3)} className={`p-2 rounded hover:bg-white transition ${direction === 3 ? 'bg-white shadow' : ''}`}><ChevronUp size={20}/></button>
             <div />
             <button onClick={() => setDirection(1)} className={`p-2 rounded hover:bg-white transition ${direction === 1 ? 'bg-white shadow' : ''}`}><ChevronLeft size={20}/></button>
             <button onClick={() => setDirection(0)} className={`p-2 rounded hover:bg-white transition ${direction === 0 ? 'bg-white shadow' : ''}`}><ChevronDown size={20}/></button>
             <button onClick={() => setDirection(2)} className={`p-2 rounded hover:bg-white transition ${direction === 2 ? 'bg-white shadow' : ''}`}><ChevronRight size={20}/></button>
          </div>

          <div className="flex gap-4 w-full justify-center">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition shadow"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span className="text-sm font-bold">{text.anim}</span>
            </button>
            
            <button 
              onClick={handleRandom}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition shadow"
            >
              <Dices size={18} />
              <span className="text-sm font-bold">{text.random}</span>
            </button>
          </div>

          <button 
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition shadow-lg transform hover:-translate-y-1"
          >
            <Download size={20} />
            <span className="font-bold">{text.download}</span>
          </button>
        </div>

        {/* RIGHT: Controls */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200 overflow-y-auto max-h-[800px] w-full">
          
          {/* SECTION: Core */}
          <div className="mb-8 border-b pb-4">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <User size={20} className="text-blue-500" /> {text.core}
               </h2>
               <div className="flex gap-2">
                   <button 
                      onClick={() => setLanguage(l => l === 'en' ? 'ja' : 'en')}
                      className="flex items-center gap-1 cursor-pointer bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition border border-gray-300"
                   >
                      <Globe size={14} /> <span className="text-xs font-bold">{language === 'en' ? 'EN' : 'JP'}</span>
                   </button>
                   <label className="flex items-center gap-2 cursor-pointer bg-yellow-100 px-3 py-1 rounded-full hover:bg-yellow-200 transition border border-yellow-300">
                      <input type="checkbox" checked={is16Bit} onChange={(e) => setIs16Bit(e.target.checked)} className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500" />
                      <span className="font-bold text-xs text-yellow-800">{text.bit16}</span>
                   </label>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Selector label={text.race} value={charState.baseType} options={text.races} onChange={(v) => setCharState({...charState, baseType: v})} category="race" />
            </div>
          </div>

          {/* SECTION: Appearance */}
          <div className="mb-8 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Smile size={20} className="text-pink-500" /> {text.appearance}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Selector label={text.skinTone} type="color" value={charState.skinColor} options={palettes.skin} onChange={(c) => setCharState({...charState, skinColor: c})} />
                <div>
                    <Selector label={text.hairStyle} type="index" value={charState.hairStyle} options={text.hairStyles} onChange={(v) => setCharState({...charState, hairStyle: v})} category="hair"
                      subSelector={<SubColorSelector value={charState.hairColor} options={palettes.hair} onChange={(c) => setCharState({...charState, hairColor: c})} />}
                    />
                </div>
                <div>
                    <Selector label={text.eyes} type="index" value={charState.eyeStyle} options={text.eyeStyles} onChange={(v) => setCharState({...charState, eyeStyle: v})} 
                      subSelector={<SubColorSelector value={charState.eyeColor} options={palettes.eyes} onChange={(c) => setCharState({...charState, eyeColor: c})} />}
                    />
                    <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs text-gray-600">
                        <input type="checkbox" checked={charState.hasWhiteEye} onChange={(e) => setCharState({...charState, hasWhiteEye: e.target.checked})} className="rounded" />
                        {text.hasSclera}
                    </label>
                </div>
            </div>
          </div>

          {/* SECTION: Outfit (Split) */}
          <div className="mb-8 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shirt size={20} className="text-green-500" /> {text.outfit}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chest */}
                <div>
                    <Selector label={text.chest} type="index" value={charState.chestStyle} options={text.chestOpt} onChange={(v) => setCharState({...charState, chestStyle: v})} category="outfit" 
                      subSelector={<SubColorSelector value={charState.chestColor} options={palettes.outfit} onChange={(c) => setCharState({...charState, chestColor: c})} />}
                    />
                </div>
                {/* Waist */}
                <div>
                    <Selector label={text.waist} type="index" value={charState.waistStyle} options={text.waistOpt} onChange={(v) => setCharState({...charState, waistStyle: v})} category="outfit" 
                      subSelector={<SubColorSelector value={charState.waistColor} options={palettes.outfit} onChange={(c) => setCharState({...charState, waistColor: c})} />}
                    />
                </div>

                <Selector label={text.pantsColor} type="color" value={charState.legColor} options={palettes.outfit} onChange={(c) => setCharState({...charState, legColor: c})} category="pants" />
                
                <div>
                    <Selector label={text.shoes} type="index" value={charState.shoeStyle} options={text.shoeStyles} onChange={(v) => setCharState({...charState, shoeStyle: v})} category="shoes"
                        subSelector={<SubColorSelector value={charState.shoeColor} options={palettes.shoes} onChange={(c) => setCharState({...charState, shoeColor: c})} />}
                    />
                </div>
            </div>
          </div>

          {/* SECTION: Accessories */}
          <div className="mb-8 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-500" /> {text.accessories}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Selector label={text.head} type="index" value={charState.accessory} options={text.accHead} onChange={(v) => setCharState({...charState, accessory: v})} />
                <Selector label={text.eye} type="index" value={charState.eyeAccessory} options={text.accEye} onChange={(v) => setCharState({...charState, eyeAccessory: v})} />
                <Selector label={text.ear} type="index" value={charState.earAccessory} options={text.accEar} onChange={(v) => setCharState({...charState, earAccessory: v})} category="ear" />
            </div>
          </div>

          {/* SECTION: Monster Parts */}
          <div className="mb-8 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Wand2 size={20} className="text-purple-500" /> {text.monsterParts}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Selector label={text.horns} value={charState.horns} options={text.optHorns} onChange={(v) => setCharState({...charState, horns: v})} 
                        subSelector={<SubColorSelector value={charState.hornColor} options={palettes.monster} onChange={(c) => setCharState({...charState, hornColor: c})} />}
                    />
                </div>
                <div>
                    <Selector label={text.wings} value={charState.wings} options={text.optWings} onChange={(v) => setCharState({...charState, wings: v})} 
                        subSelector={<SubColorSelector value={charState.wingColor} options={palettes.monster} onChange={(c) => setCharState({...charState, wingColor: c})} />}
                    />
                </div>
                <div>
                    <Selector label={text.tail} value={charState.tail} options={text.optTail} onChange={(v) => setCharState({...charState, tail: v})} 
                        subSelector={<SubColorSelector value={charState.tailColor} options={palettes.monster} onChange={(c) => setCharState({...charState, tailColor: c})} />}
                    />
                </div>
                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded">
                        <input type="checkbox" checked={charState.hasFangs} onChange={(e) => setCharState({...charState, hasFangs: e.target.checked})} className="rounded" /> {text.fangs}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded">
                        <input type="checkbox" checked={charState.hasClaws} onChange={(e) => setCharState({...charState, hasClaws: e.target.checked})} className="rounded" /> {text.claws}
                    </label>
                </div>
            </div>
          </div>

          {/* SECTION: Equipment */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sword size={20} className="text-orange-500" /> {text.equipment}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Selector label={text.weapon} value={charState.weapon} options={text.optWeapon} onChange={(v) => setCharState({...charState, weapon: v})} category="weapon"
                    subSelector={<SubColorSelector value={charState.weaponColor} options={palettes.metal} onChange={(c) => setCharState({...charState, weaponColor: c})} />}
                />
                <Selector label={text.shield} value={charState.shield} options={text.optShield} onChange={(v) => setCharState({...charState, shield: v})} category="shield"
                    subSelector={<SubColorSelector value={charState.shieldColor} options={palettes.metal} onChange={(c) => setCharState({...charState, shieldColor: c})} />}
                />
                <Selector label={text.helmet} value={charState.helmet} options={text.optHelmet} onChange={(v) => setCharState({...charState, helmet: v})} category="helmet"
                    subSelector={<SubColorSelector value={charState.helmetColor} options={palettes.metal} onChange={(c) => setCharState({...charState, helmetColor: c})} />}
                />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RetroCharGen;