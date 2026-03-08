import { TimetableDropCheck } from '../types'
import { fromPosKey } from './posKey'

export const checkSubjectDrop = (
  dragKeyFrom?: string,
  posKeyTo?: string | null,
  targetPinned?: boolean
): TimetableDropCheck => {
  if (!posKeyTo) {
    return { ok: false, reason: "invalid-target" };
  }

  if (targetPinned) {
    return { ok: false, reason: "pinned-target" };
  }

  const toParsed = fromPosKey(posKeyTo);
  if (!toParsed) {
    return { ok: false, reason: "invalid-target" };
  }

  const fromParsed = dragKeyFrom ? fromPosKey(dragKeyFrom) : null;

  // plain sidebar item（posKey でない項目）は timetable に置ける
  if (!fromParsed) {
    return { ok: true };
  }

  // sidebar pool -> timetable も class 一致が必要
  const fromCls = fromParsed[0];
  const toCls = toParsed[0];
  const sameClass =
    fromCls[0] === toCls[0] &&
    fromCls[1] === toCls[1];

  if (!sameClass) {
    return { ok: false, reason: "different-class" };
  }

  return { ok: true };
};
