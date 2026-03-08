export type Class = [string, string];
export type SlotPosition = [number, number, number]; // dayIndex, blockIndex, posIndex

export type Subject = {
  id: number;
  name: string;
  pinned?: boolean;
  posKey: string;
};

export type Config {
  // configParallels: number[][];
  configContinuous: number[][];
}

export type DragState = {
  pointerId: number;
  toRectX: number;
  toRectY: number;
  el?: HTMLDivElement;
  dragKey?: string;
  subjectName?: string;
};

export type MenuState = {
  open: boolean;
  x: number;
  y: number;
  dragKey?: string;
};

export type TimetableDropCheck =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "invalid-target"
        | "pinned-target"
        | "different-class"
        | "etc";
    };

export type AreaOnMain = "Sidebar" | "TableArea" | null;
