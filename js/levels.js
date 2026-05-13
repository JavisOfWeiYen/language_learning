// 等級系統：依 XP 決定當前等級
export const LEVELS = [
  { name: '入門', min: 0 },
  { name: '初階', min: 100 },
  { name: '中階', min: 250 },
  { name: '進階', min: 500 },
  { name: '熟練', min: 900 },
  { name: '精通', min: 1500 },
];

export function getLevel(xp) {
  let lv = LEVELS[0];
  let nextXp = 100;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) { lv = LEVELS[i]; break; }
  }
  const idx = LEVELS.indexOf(lv);
  const nextLv = LEVELS[idx + 1];
  if (nextLv) {
    nextXp = nextLv.min;
    const pct = Math.round(((xp - lv.min) / (nextXp - lv.min)) * 100);
    return { name: lv.name, pct, label: `${xp - lv.min} / ${nextXp - lv.min} XP`, num: `Lv.${idx + 1}` };
  }
  return { name: lv.name, pct: 100, label: `${xp} XP`, num: `Lv.${idx + 1}` };
}
