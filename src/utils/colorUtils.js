export const adjustColor = (color, amount) => {
  if (!color) return '#000000';
  const clamp = (val) => Math.min(255, Math.max(0, val));
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  return '#' + (0x1000000 + clamp(r) * 0x10000 + clamp(g) * 0x100 + clamp(b)).toString(16).slice(1);
};