// src/RetroCharGen.jsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Dices, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Wand2, Sword, User, Smile, Sparkles, Shirt, Ban, Globe, RotateCcw 
} from 'lucide-react';
import { PALETTES, TRANSLATIONS } from './constants/assets';
import { Selector, SubColorSelector } from './components/UIComponents';
import SpriteRenderer from './components/SpriteRenderer';

const INITIAL_CHAR_STATE = {
  baseType: 0,
  skinColor: '#ffdbac',
  hairStyle: 0,
  hairColor: '#e74c3c',
  eyeStyle: 0,
  eyeColor: '#2c3e50',
  faceShape: 0,
  chestStyle: 1, 
  chestColor: '#3498db',
  waistStyle: 1, 
  waistColor: '#f1c40f',
  legColor: '#2c3e50',   
  shoeStyle: 1,          
  shoeColor: '#5d4037',  
  accessory: 0, 
  eyeAccessory: 0, 
  earAccessory: 0, 
  weapon: 0, 
  shield: 0, 
  helmet: 0, 
  helmetColor: '#bdc3c7',
  weaponColor: '#bdc3c7', 
  shieldColor: '#bdc3c7',
  horns: 0, 
  hornColor: '#ffffff',
  wings: 0, 
  wingColor: '#a29bfe',
  tail: 0,  
  tailColor: '#a29bfe',
  hasFangs: false,
  hasClaws: false,
};

const RetroCharGen = () => {
  const canvasRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [animationFrame, setAnimationFrame] = useState(0); 
  const [direction, setDirection] = useState(0); 
  const [bgColor, setBgColor] = useState('#ffffff'); 
  const [language, setLanguage] = useState('ja'); 
  
  const [bitMode, setBitMode] = useState('16');

  const [charState, setCharState] = useState(() => {
    const saved = localStorage.getItem('rpg-sprite-maker-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.savedBitMode) {
           setBitMode(parsed.savedBitMode);
        } else if (parsed.is16Bit !== undefined) {
           setBitMode(parsed.is16Bit ? '16' : '8');
        }
        const { is16Bit, savedBitMode, savedOutlineMode, ...rest } = parsed;
        return { ...INITIAL_CHAR_STATE, ...rest, faceShape: rest.faceShape ?? 0 };
      } catch (e) {
        console.error("Failed to load save data", e);
      }
    }
    return INITIAL_CHAR_STATE;
  });

  const text = TRANSLATIONS[language];

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setAnimationFrame((prev) => (prev === 0 ? 1 : 0));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const dataToSave = { 
      ...charState, 
      savedBitMode: bitMode
    };
    localStorage.setItem('rpg-sprite-maker-data', JSON.stringify(dataToSave));
  }, [charState, bitMode]);

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
      skinColor: PALETTES.skin[Math.floor(Math.random() * PALETTES.skin.length)],
      hairStyle: Math.floor(Math.random() * 5), 
      hairColor: PALETTES.hair[Math.floor(Math.random() * PALETTES.hair.length)],
      eyeStyle: Math.floor(Math.random() * 5), 
      eyeColor: PALETTES.eyes[Math.floor(Math.random() * PALETTES.eyes.length)],
      faceShape: Math.floor(Math.random() * 4), 
      chestStyle: Math.floor(Math.random() * 6), 
      chestColor: PALETTES.outfit[Math.floor(Math.random() * PALETTES.outfit.length)],
      waistStyle: Math.floor(Math.random() * 5), 
      waistColor: PALETTES.outfit[Math.floor(Math.random() * PALETTES.outfit.length)],
      legColor: PALETTES.outfit[Math.floor(Math.random() * PALETTES.outfit.length)],
      shoeStyle: Math.floor(Math.random() * 3),
      shoeColor: PALETTES.shoes[Math.floor(Math.random() * PALETTES.shoes.length)],
      accessory: Math.floor(Math.random() * 3),
      eyeAccessory: Math.floor(Math.random() * 6), 
      earAccessory: Math.floor(Math.random() * 5),
      horns: Math.random() > 0.7 ? Math.floor(Math.random() * 7) : 0, 
      hornColor: PALETTES.monster[Math.floor(Math.random() * PALETTES.monster.length)],
      wings: Math.random() > 0.7 ? Math.floor(Math.random() * 7) : 0, 
      wingColor: PALETTES.monster[Math.floor(Math.random() * PALETTES.monster.length)],
      tail: Math.random() > 0.7 ? Math.floor(Math.random() * 6) : 0, 
      tailColor: PALETTES.monster[Math.floor(Math.random() * PALETTES.monster.length)],
      hasFangs: Math.random() > 0.8,
      hasClaws: Math.random() > 0.8,
      weapon: Math.floor(Math.random() * 7),
      shield: Math.floor(Math.random() * 4),
      helmet: Math.floor(Math.random() * 5),
      helmetColor: PALETTES.metal[Math.floor(Math.random() * 4)], 
      weaponColor: PALETTES.metal[Math.floor(Math.random() * 4)],
      shieldColor: PALETTES.metal[Math.floor(Math.random() * 4)],
    });
  };

  const handleReset = () => {
    if (window.confirm(language === 'en' ? 'Reset character to default?' : 'キャラクターを初期状態に戻しますか？')) {
      setCharState(INITIAL_CHAR_STATE);
    }
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
            <SpriteRenderer
              ref={canvasRef}
              charState={charState}
              animationFrame={animationFrame}
              direction={direction}
              bitMode={bitMode}
              bgColor={bgColor}
              scale={8}
              className="max-w-full"
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

          <div className="flex gap-2 w-full justify-center">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition shadow"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span className="text-sm font-bold">{text.anim}</span>
            </button>
            
            <button 
              onClick={handleRandom}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition shadow"
            >
              <Dices size={18} />
              <span className="text-sm font-bold">{text.random}</span>
            </button>

            <button 
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition shadow border border-red-200"
              title={text.reset}
            >
              <RotateCcw size={18} />
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
               <div className="flex gap-2 items-center flex-wrap justify-end">
                   <button 
                      onClick={() => setLanguage(l => l === 'en' ? 'ja' : 'en')}
                      className="flex items-center gap-1 cursor-pointer bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition border border-gray-300"
                   >
                      <Globe size={14} /> <span className="text-xs font-bold">{language === 'en' ? 'EN' : 'JP'}</span>
                   </button>
                   
                   <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-300">
                      {['8', '16', '32'].map((mode, idx) => (
                        <button
                          key={mode}
                          onClick={() => setBitMode(mode)}
                          className={`px-3 py-1 text-xs font-bold rounded transition-all ${bitMode === mode ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {text.bitModes[idx]}
                        </button>
                      ))}
                   </div>
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
                <Selector label={text.skinTone} type="color" value={charState.skinColor} options={PALETTES.skin} onChange={(c) => setCharState({...charState, skinColor: c})} />
                <div>
                    <Selector label={text.hairStyle} type="index" value={charState.hairStyle} options={text.hairStyles} onChange={(v) => setCharState({...charState, hairStyle: v})} category="hair"
                      subSelector={<SubColorSelector value={charState.hairColor} options={PALETTES.hair} onChange={(c) => setCharState({...charState, hairColor: c})} />}
                    />
                </div>
                <div>
                    {/* 修正: スケルトン(baseType 2)の時は目を無効化 */}
                    <Selector 
                      label={text.eyes} 
                      type="index" 
                      value={charState.eyeStyle} 
                      options={text.eyeStyles} 
                      onChange={(v) => setCharState({...charState, eyeStyle: v})} 
                      disabled={charState.baseType === 2}
                      subSelector={<SubColorSelector value={charState.eyeColor} options={PALETTES.eyes} onChange={(c) => setCharState({...charState, eyeColor: c})} />}
                    />
                </div>
                <Selector
                  label={text.faceShape}
                  type="index"
                  value={charState.faceShape}
                  options={text.faceShapes}
                  onChange={(v) => setCharState({ ...charState, faceShape: v })}
                  category="face"
                />
            </div>
          </div>

          {/* SECTION: Outfit */}
          <div className="mb-8 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shirt size={20} className="text-green-500" /> {text.outfit}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Selector label={text.chest} type="index" value={charState.chestStyle} options={text.chestOpt} onChange={(v) => setCharState({...charState, chestStyle: v})} category="outfit" 
                      subSelector={<SubColorSelector value={charState.chestColor} options={PALETTES.outfit} onChange={(c) => setCharState({...charState, chestColor: c})} />}
                    />
                </div>
                <div>
                    <Selector label={text.waist} type="index" value={charState.waistStyle} options={text.waistOpt} onChange={(v) => setCharState({...charState, waistStyle: v})} category="outfit" 
                      subSelector={<SubColorSelector value={charState.waistColor} options={PALETTES.outfit} onChange={(c) => setCharState({...charState, waistColor: c})} />}
                    />
                </div>

                <Selector label={text.pantsColor} type="color" value={charState.legColor} options={PALETTES.outfit} onChange={(c) => setCharState({...charState, legColor: c})} category="pants" />
                
                <div>
                    <Selector label={text.shoes} type="index" value={charState.shoeStyle} options={text.shoeStyles} onChange={(v) => setCharState({...charState, shoeStyle: v})} category="shoes"
                        subSelector={<SubColorSelector value={charState.shoeColor} options={PALETTES.shoes} onChange={(c) => setCharState({...charState, shoeColor: c})} />}
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
                        subSelector={<SubColorSelector value={charState.hornColor} options={PALETTES.monster} onChange={(c) => setCharState({...charState, hornColor: c})} />}
                    />
                </div>
                <div>
                    <Selector label={text.wings} value={charState.wings} options={text.optWings} onChange={(v) => setCharState({...charState, wings: v})} 
                        subSelector={<SubColorSelector value={charState.wingColor} options={PALETTES.monster} onChange={(c) => setCharState({...charState, wingColor: c})} />}
                    />
                </div>
                <div>
                    <Selector label={text.tail} value={charState.tail} options={text.optTail} onChange={(v) => setCharState({...charState, tail: v})} 
                        subSelector={<SubColorSelector value={charState.tailColor} options={PALETTES.monster} onChange={(c) => setCharState({...charState, tailColor: c})} />}
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
                    subSelector={<SubColorSelector value={charState.weaponColor} options={PALETTES.metal} onChange={(c) => setCharState({...charState, weaponColor: c})} />}
                />
                <Selector label={text.shield} value={charState.shield} options={text.optShield} onChange={(v) => setCharState({...charState, shield: v})} category="shield"
                    subSelector={<SubColorSelector value={charState.shieldColor} options={PALETTES.metal} onChange={(c) => setCharState({...charState, shieldColor: c})} />}
                />
                <Selector label={text.helmet} value={charState.helmet} options={text.optHelmet} onChange={(v) => setCharState({...charState, helmet: v})} category="helmet"
                    subSelector={<SubColorSelector value={charState.helmetColor} options={PALETTES.metal} onChange={(c) => setCharState({...charState, helmetColor: c})} />}
                />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RetroCharGen;