import { Card, majorScale } from 'evergreen-ui'
import { DragState } from '../types'
import { colors, heightSlot, widthSlot } from '../types/constants'
import { SubjectCardView } from './SubjectCardView'

export function Ghost({
  drag,
  ghostRef,
}: {
  drag: DragState | null;
  ghostRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  if (!drag) return null;
  return (
    <Card
      ref={(node) => {
        ghostRef.current = node;
      }}
      position="fixed"
      top={0}
      left={0}
      height={heightSlot}
      width={widthSlot}
      padding={majorScale(1)}
      elevation={3}
      background={colors.surface}
      opacity={0.7}
      pointerEvents="none"
      style={{
        transform: "translate(-9999px, -9999px)", // 初期は画面外
        willChange: "transform",
        zIndex: 9998,
      }}
    >
      <SubjectCardView text={drag.subjectName ?? drag.dragKey ?? ""} />
    </Card>
  )
}
