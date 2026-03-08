import { Class, Subject } from '../types'
import { toPosKey, fromPosKey } from './posKey'

export const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const normalizeGroup = (
  map: Map<string, Subject>,
  cls: Class,
  dayIndex: number,
  insert?: { index: number; subj: Subject }
) => {
  const items: { key: string; posIndex: number; subj: Subject }[] = [];
  for (const [key, subj] of map.entries()) {
    const parsed = fromPosKey(key);
    if (!parsed) continue;
    const [kCls, pos] = parsed;
    if (kCls[0] !== cls[0] || kCls[1] !== cls[1]) continue;
    if (pos[0] !== dayIndex) continue;
    if (pos[1] !== 0) continue;
    items.push({ key, posIndex: pos[2], subj });
  }
  items.sort((a, b) => a.posIndex - b.posIndex || a.subj.id - b.subj.id);

  // delete old keys
  for (const it of items) map.delete(it.key);

  const list = items.map((it) => it.subj);
  if (insert) {
    const idx = Math.max(0, Math.min(insert.index, list.length));
    list.splice(idx, 0, insert.subj);
  }

  // reinsert
  list.forEach((subj, i) => {
    const key = toPosKey(cls, [dayIndex, 0, i]);
    map.set(key, { ...subj, posKey: key });
  });
};
