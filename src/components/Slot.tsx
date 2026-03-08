import { Card, majorScale } from 'evergreen-ui'
import { DragState } from '../types'
import { checkSubjectDrop } from '../logic/dropCheck'
import { colors, heightSlot, widthSlot } from '../types/constants'
import { SubjectCardView } from './SubjectCardView'

export const Slot: React.FC<{
  dragKey: string;
  text?: string;
  pinned?: boolean;
  drag: DragState | null;
  hoverPosKey: string | null;
  onPointerDown: (dragKey: string, e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onContextMenu: (dragKey: string, e: React.MouseEvent<HTMLDivElement>) => void;
}> = ({ dragKey, text, pinned, drag, hoverPosKey, onPointerDown, onPointerUp, onContextMenu }) => {
  const dragging = drag !== null && drag.dragKey === dragKey;
  const hasSubject = (text ?? "").trim().length > 0;

  const dropState: "none" | "allowed" | "blocked" = (() => {
    if (!drag) return "none";
    if (hoverPosKey !== dragKey) return "none";
    if (drag.dragKey === dragKey) return "none";

    const result = checkSubjectDrop(drag.dragKey, dragKey, pinned);
    return result.ok ? "allowed" : "blocked";
  })();

  return (
    <Card
      data-pos-key={dragKey}
      onPointerDown={(e) => onPointerDown(dragKey, e)}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => onContextMenu(dragKey, e)}
      height={heightSlot}
      width={widthSlot}
      padding={majorScale(1)}
      elevation={dragging ? 0 : pinned ? 0 : hasSubject ? 1 : 0}
      background={pinned ? colors.surfaceAlt : colors.surface}
      opacity={dragging ? 0.5 : 1}
      cursor={pinned || !hasSubject ? "default" : "grab"}
      style={
        dropState === "allowed"
          ? {
              outline: `2px solid ${colors.success}`,
              outlineOffset: -2,
              borderRadius: 0,
            }
          : dropState === "blocked"
            ? {
                outline: `2px dashed ${colors.danger}`,
                outlineOffset: -2,
                borderRadius: 0,
                backgroundColor: colors.surfaceAlt,
              }
            : undefined
      }
    >
      <SubjectCardView
        text={text ?? dragKey}
        color={colors.textMain}
      />
    </Card>
  );
};
