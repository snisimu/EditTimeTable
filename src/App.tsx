import { useRef, useState, useEffect, type PointerEvent } from 'react'
import
  { Pane
  , Card
  , Heading
  , Paragraph
  , majorScale
  } from 'evergreen-ui'

const slotSettings: [string, number[]][] =
  [ ["Mon",
      [ 2
      , 1
      ]
    ]
  , ["Tue",
      [ 2
      , 1
      ]
    ]
  ]
const classAlls: string[] = ["A", "B"];

const heightSlot = 40;
const heightDay = 20;
const gapClass = majorScale(1);
const paddingDay = majorScale(1);

type DragState = {
  pointerId: number;
  toRectX: number;
  toRectY: number;
  el?: HTMLDivElement;
}

// auxiliary

const slotPositions: (() => [number, number[][]][]) = () => {
  let r: [number, number[][]][] = new Array();
  let d = 0;
  slotSettings.forEach(([day, slotNums]) => {
    r.push([d, slotNums.map(n => Array.from({ length: n }, (_, i) => i))]);
    d += 1;
  });
  return r;
}

// components

export default function App() {
  return (
    <Pane display="flex" flexDirection="column" height="100vh">
      {/* Top Pane/Header */}
      <Pane
        background="blue50"
        padding={16}
        elevation={2}
        display="flex"
        alignItems="center"
      >
        <Heading size={600}>Top Pane</Heading>
      </Pane>

      <MainArea />

    </Pane>
  )
}

const MainArea: React.FC = () => {
  return (
    <Pane display="flex" flex={1} minHeight={0}>
      {/* Sidebar */}
      <Pane
        background="tint1"
        display="flex"
        flexDirection="column"
        padding={majorScale(2)}
        elevation={2}
        overflowY="auto"
        minHeight={0}
        gap={majorScale(4)}
      >
        <Heading size={500} marginBottom={majorScale(2)}>Sidebar</Heading>
          <Slot label="itemX" />
          <Slot label="itemY" />
      </Pane>

      <TableArea />

    </Pane>
  );
}  

const TableArea: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement; // itemRef.current
    if (!el) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();

    // Pointer capture：要素外に出てもmove/upを受け取れる
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    const r = el.getBoundingClientRect();

    // console.log("onPointerDown", { toRectY: e.clientY - r.top });
    setDrag({
      pointerId: e.pointerId,
      toRectX: e.clientX - r.left,
      toRectY: e.clientY - r.top,
      el,
    });
    setPointer({ x: e.clientX, y: e.clientY });
    document.body.style.cursor = "grabbing";
    e.currentTarget.style.cursor = "grabbing";
    // updateAutoScrollSpeed(e.clientX, e.clientY);
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;
    setPointer({ x: e.clientX, y: e.clientY });
    // updateAutoScrollSpeed(e.clientX, e.clientY);
    console.log("onPointerMove", { eclientY: e.clientY });
  }

  const endDrag = () => {
    if (drag?.el) drag.el.style.cursor = "grab";
    setDrag(null);
    setPointer(null);
    document.body.style.cursor = "";
    // stopAutoScroll();
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;
    endDrag();
  }

  const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;
    endDrag();
  };

  return (
    <Pane
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      flex={1}
      overflowY="auto"
      overflowX="auto"
      padding={majorScale(2)}
      display="flex"
      flexDirection="row"
      gap={majorScale(1)}
    >

      {/* class headers */}
      <Pane
        display="flex"
        flexDirection="column"
        gap={gapClass}
        padding={paddingDay}
      >
        <Card key="topleft" height={heightDay}>
          <Heading>　</Heading>
        </Card>
        { classAlls.map(cls => (
          <Card
            key={cls+"header"}
            height={heightSlot}
            minHeight={heightSlot}
            maxHeight={heightSlot}
            padding={majorScale(1)}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Heading>{cls}</Heading>
          </Card>
        ))}
      </Pane>

      { slotPositions().map(slotPositionDay => (
        <Day key={slotPositionDay[0]} slotPositionDay={slotPositionDay} />
      ))}

      <div
        ref={itemRef}
        onPointerDown={onPointerDown}
        // onContextMenu={onContextMenu}
        style={{
          border: "solid",
          padding: 10,
          width: 80,
          height: 30,
          textAlign: "center",
          cursor: "grab",
        }}
      >
        drag me
      </div>

      {/* ghost */}
      {drag && pointer && (
        <div
          style={{
            position: "fixed",
            top: pointer.y - drag.toRectY,
            left: pointer.x - drag.toRectX,
            border: "solid",
            padding: 10,
            width: 80,
            height: 30,
            textAlign: "center",
            background: "lightgray",
            pointerEvents: "none",
          }}
        >
          dragging
        </div>
      )}

    </Pane>
  );
}

const Day: React.FC<{slotPositionDay: [number, number[][]]}> = ({slotPositionDay}) => {
  const [d, pss] = slotPositionDay;
  const pIdxss = () => {
    let r: [number, number[]][] = new Array();
    let idx = 0;
    pss.forEach(ps => {
      r.push([idx, ps]);
      idx += 1;
    });
    return r;
  }
  return (
    <Pane
      display="flex"
      flexDirection="column"
      gap={gapClass}
      padding={paddingDay}
      background='tint2'
      borderRadius={8}
    >
      <Card
        height={heightDay}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Heading textAlign="center">{slotSettings[d][0]}</Heading>
      </Card>
      { classAlls.map(cls => (
        <Pane display="flex" flexDirection="row" gap={majorScale(1)}>
          { pIdxss().map(([i, ps]) => (
            <Pane display="flex" flexDirection="row">
              { ps.map(p => (
                <Slot label={cls + d + i + p} />
              ))}
            </Pane>
          ))}
        </Pane>
      ))}
    </Pane>
  );
}

const Slot: React.FC<{ label: string }> = ({ label }) => (
  <Card
    height={heightSlot}
    padding={majorScale(1)}
    width={80}
    elevation={1}
    background="white"
  >
    <Paragraph textAlign="center" fontSize="small">{label}</Paragraph>
  </Card>
);
