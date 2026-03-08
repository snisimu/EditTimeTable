import { Class, SlotPosition } from '../types'

export const toPosKey = (cls: Class, pos: SlotPosition) =>
  `${cls[0]}|${cls[1]}|${pos[0]}|${pos[1]}|${pos[2]}`;

export const fromPosKey = (key: string): [Class, SlotPosition] | null => {
  const parts = key.split("|");
  if (parts.length !== 5) return null;
  const [g, c, d, b, p] = parts;
  const dayIndex = Number(d);
  const blockIndex = Number(b);
  const posIndex = Number(p);
  if (![dayIndex, blockIndex, posIndex].every(Number.isFinite)) return null;
  return [[g, c], [dayIndex, blockIndex, posIndex]];
};
