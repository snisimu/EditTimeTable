import { useRef, useState, useEffect } from 'react'
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
  , ["Wed",
      [ 2
      , 1
      ]
    ]
  , ["Thu",
      [ 2
      , 1
      ]
    ]
  , ["Fri",
      [ 2
      , 1
      ]
    ]
  ]
const classAlls: [string, string[]][] = 
  [ ["1",
      [ "A"
      , "B"
      ]
    ]
  , ["2",
      [ "A"
      , "B"
      ]
    ]
  ]

const heightSlot = 40;
const widthSlot = 80;
const heightDay = 20;
const gapClass = majorScale(1);
const paddingDay = majorScale(1);

// auxiliary

const slotPositions: [number, number[][]][] = (() => {
  let r: [number, number[][]][] = new Array();
  let d = 0;
  slotSettings.forEach(([_, slotNums]) => {
    r.push([d, slotNums.map(n => Array.from({ length: n }, (_, i) => i))]);
    d += 1;
  });
  return r;
})();

const widthGroupHeader = 48;
const widthClassHeader = 56;

type RowItem =
  | { kind: "header" }
  | {
      kind: "class";
      clsGroup: string;
      cls: string;
      groupFirst: boolean;
      groupRowSpan: number;
    };

type SlotCol = {
  dayIndex: number;
  dayLabel: string;
  blockIndex: number;
  posIndex: number;
};

const buildRows = (groups: [string, string[]][]): RowItem[] => {
  const rows: RowItem[] = [{ kind: "header" }];

  groups.forEach(([clsGroup, classes]) => {
    classes.forEach((cls, idx) => {
      rows.push({
        kind: "class",
        clsGroup,
        cls,
        groupFirst: idx === 0,
        groupRowSpan: classes.length,
      });
    });
  });

  return rows;
};

const buildSlotCols = (settings: [string, number[]][]): SlotCol[] => {
  return settings.flatMap(([dayLabel, slotNums], dayIndex) =>
    slotNums.flatMap((n, blockIndex) =>
      Array.from({ length: n }, (_, posIndex) => ({
        dayIndex,
        dayLabel,
        blockIndex,
        posIndex,
      }))
    )
  );
};

const makeSlotLabel = (
  cls: string,
  dayIndex: number,
  blockIndex: number,
  posIndex: number
) => `${cls}${dayIndex}${blockIndex}${posIndex}:id`;

// types

type DragState = {
  pointerId: number;
  toRectX: number;
  toRectY: number;
  el?: HTMLDivElement;
  label?: string;
}

type MenuState = {
  open: boolean;
  x: number;
  y: number;
  label?: string;
};

// components

export default function App() {

  const [drag, setDrag] = useState<DragState | null>(null);

  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // ★ rAF でゴーストDOMを動かすための ref
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const rafMoveRef = useRef<number | null>(null);
  // ★ rAF の中で最新 drag を読むため（安全策）
  const dragRef = useRef<DragState | null>(null);
  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  type AreaOnMain = "Sidebar" | "TableArea" | null;
  const scrollSpeedRefInit = new Map<AreaOnMain, { x: number; y: number }>([
    ["Sidebar", { x: 0, y: 0 }],
    ["TableArea", { x: 0, y: 0 }],
  ]);
  const tableAreaRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const containerOf = (area: AreaOnMain) => {
    return area === "Sidebar" ? sidebarRef.current : tableAreaRef.current;
  }
  const scrollSpeedRef = useRef(
    new Map<AreaOnMain, { x: number; y: number }>(scrollSpeedRefInit)
  );
  const rafIdRef = useRef<number | null>(null);

  const scheduleGhostMove = () => {
    if (rafMoveRef.current != null) return;

    rafMoveRef.current = requestAnimationFrame(() => {
      // console.log("ghostRef", ghostRef.current, "dragRef", dragRef.current);
      rafMoveRef.current = null;

      const g = ghostRef.current;
      const d = dragRef.current;
      if (!g || !d) return;

      const { x, y } = pointerRef.current;
      g.style.transform = `translate(${x - d.toRectX}px, ${y - d.toRectY}px)`;
    });
  };

  const onPointerDown = (label: string, e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    if (!el) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    // console.log("onPointerDown", { label, clientX: e.clientX, clientY: e.clientY });
    e.preventDefault();

    // Pointer capture：要素外に出てもmove/upを受け取れる
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    const r = el.getBoundingClientRect();

    // console.log("onPointerDown", { toRectY: e.clientY - r.top });

    const nextDrag: DragState = {
      pointerId: e.pointerId,
      toRectX: e.clientX - r.left,
      toRectY: e.clientY - r.top,
      el,
      label,
    };
    setDrag(nextDrag);
    dragRef.current = nextDrag; // ★ 即座に最新化（useEffect待ちしない）

    pointerRef.current = { x: e.clientX, y: e.clientY }; // ★ stateじゃない
    document.body.style.cursor = "grabbing";
    e.currentTarget.style.cursor = "grabbing";

    scheduleGhostMove(); // ★ 初回位置反映
    // updateAutoScrollSpeed(e.clientX, e.clientY); // a matter of preference
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (e.pointerId !== d.pointerId) return;

    pointerRef.current = { x: e.clientX, y: e.clientY };
    updateAutoScrollSpeed(e.clientX, e.clientY);
    scheduleGhostMove();
    // console.log("onPointerMove", { eclientY: e.clientY });
  }

  const endDrag = () => {
    if (drag?.el) drag.el.style.cursor = "grab";
    setDrag(null);
    dragRef.current = null;

    document.body.style.cursor = "";
    stopAutoScroll();

    // ゴーストの移動予約が残っていれば止める
    if (rafMoveRef.current != null) {
      cancelAnimationFrame(rafMoveRef.current);
      rafMoveRef.current = null;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;
    endDrag();
  }

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;
    endDrag();
  };

  const startAutoScroll = () => {
    if (rafIdRef.current !== null) return;

    const tick = () => {
      let any = false;

      (["Sidebar", "TableArea"] as const).forEach((area) => {
        const container = containerOf(area);
        const speed = scrollSpeedRef.current.get(area);
        if (!container || !speed) return;

        const { x: sx, y: sy } = speed;
        if (sx === 0 && sy === 0) return;

        any = true;

        const maxTop = container.scrollHeight - container.clientHeight;
        const maxLeft = container.scrollWidth - container.clientWidth;

        container.scrollTop = Math.max(0, Math.min(maxTop, container.scrollTop + sy));
        container.scrollLeft = Math.max(0, Math.min(maxLeft, container.scrollLeft + sx));
      });

      if (!any) {
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  };

  const updateAutoScrollSpeed = (clientX: number, clientY: number) => {
    updateAutoScrollSpeedOn("Sidebar", clientX, clientY);
    updateAutoScrollSpeedOn("TableArea", clientX, clientY);

    const s1 = scrollSpeedRef.current.get("Sidebar");
    const s2 = scrollSpeedRef.current.get("TableArea");

    const allZero =
      (!s1 || (s1.x === 0 && s1.y === 0)) &&
      (!s2 || (s2.x === 0 && s2.y === 0));

    if (allZero) stopAutoScroll();
    else startAutoScroll();          // ← これが重要
  };
  const updateAutoScrollSpeedOn = (area: AreaOnMain, clientX: number, clientY: number) => {
    if (!area) return;
    const container = containerOf(area);
    if (!container) return;

    const rect = container.getBoundingClientRect(); // viewport基準
    if (clientX < rect.left || clientX > rect.right /* || clientY < rect.top || clientY > rect.bottom */) {
      scrollSpeedRef.current.set(area, { x: 0, y: 0 });
      return;
    }

    const threshold = 48; // 端からこのpx以内でスクロール
    const maxSpeed = 18; // px/frame

    const distLeft = clientX - rect.left;
    const distRight = rect.right - clientX;
    const distTop = clientY - rect.top;
    const distBottom = rect.bottom - clientY;

    let sx = 0;
    let sy = 0;

    // horizontal
    if (distLeft >= 0 && distLeft < threshold) {
      const t = 1 - distLeft / threshold;
      sx = -maxSpeed * t;
    } else if (distRight >= 0 && distRight < threshold) {
      const t = 1 - distRight / threshold;
      sx = maxSpeed * t;
    }

    // vertical
    if (distTop < threshold) {
      const t = 1 - Math.max(0, distTop) / threshold;
      sy = -maxSpeed * t;
    } else if (distBottom < threshold) {
      const t = 1 - Math.max(0, distBottom) / threshold;
      sy = maxSpeed * t;
    }

    // 小さい値は0に丸める
    sx = Math.abs(sx) < 0.5 ? 0 : sx;
    sy = Math.abs(sy) < 0.5 ? 0 : sy;

    scrollSpeedRef.current.set(area, { x: sx, y: sy });
    // console.log("updateAutoScrollSpeedOn", { area, sx, sy });
  };

  const stopAutoScroll = () => {
    scrollSpeedRef.current = new Map<AreaOnMain, { x: number; y: number }>(scrollSpeedRefInit);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAutoScroll();
  }, []);

  // context menu

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menu, setMenu] = useState<MenuState>({ open: false, x: 0, y: 0 });

  const onContextMenu = (
    label: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (drag) return;
    e.preventDefault();
    setMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      label,
    });
    console.log("onContextMenu", { label, clientX: e.clientX, clientY: e.clientY });
  };

  const closeMenu = () => setMenu((m) => ({ ...m, open: false }));

  useEffect(() => {
    if (!menu.open) return;

    const onPointerDownMenu = (ev: globalThis.PointerEvent) => {
      // メニュー内クリックは無視、それ以外は閉じる
      const target = ev.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      closeMenu();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeMenu();
    };

    window.addEventListener("pointerdown", onPointerDownMenu, { capture: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDownMenu, { capture: true } as any);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu.open]);

  // WinPointer
  useEffect(() => {
    if (!drag) return;

    const onWinPointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== drag.pointerId) return;
      handleDrop(ev.clientX, ev.clientY);
      endDrag();
    };
    const onWinPointerCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== drag.pointerId) return;
      endDrag();
    };
    const onBlur = () => endDrag();
    const onVis = () => { if (document.hidden) endDrag(); };
    const onContextMenu = () => endDrag();

    window.addEventListener("pointerup", onWinPointerUp, { capture: true });
    window.addEventListener("pointercancel", onWinPointerCancel, { capture: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("contextmenu", onContextMenu);

    return () => {
      window.removeEventListener("pointerup", onWinPointerUp, { capture: true } as any);
      window.removeEventListener("pointercancel", onWinPointerCancel, { capture: true } as any);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [drag]);

  const handleDrop = (x: number, y: number) => {
    if (!drag) return;
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    const slotEl = el.closest("[data-slot-id]");
    if (slotEl) {
      const labelTo = slotEl.getAttribute("data-slot-id");
      console.log({labelFrom: drag.label, labelTo});
    } else {
      console.log("DROP OUTSIDE");
    }
  };

  /* App */
  return (
    <Pane
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      display="flex"
      flexDirection="column"
      height="97vh"
    >
      {/* Top Pane */}
      <Pane
        background="blue50"
        padding={16}
        elevation={2}
        display="flex"
        alignItems="center"
      >
        <Heading size={600}>Top Pane</Heading>
      </Pane>

      <MainArea
        drag={drag}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        sidebarRef={sidebarRef}
        tableAreaRef={tableAreaRef}
        menuRef={menuRef}
        menu={menu}
        closeMenu={closeMenu}
      />

      <Ghost
        drag={drag}
        ghostRef={ghostRef}
      />

    </Pane>
  )
}

const MainArea: React.FC<{
  drag: DragState | null;
  onPointerDown: (label: string, e: React.PointerEvent<HTMLDivElement>) => void;
  onContextMenu: (label: string, e: React.MouseEvent<HTMLDivElement>) => void;
  onPointerMove: any;
  onPointerUp: any;
  onPointerCancel: any;
  sidebarRef: React.RefObject<HTMLDivElement>;
  tableAreaRef: React.RefObject<HTMLDivElement>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menu: MenuState;
  closeMenu: () => void;
}> = (props) => {

  const drag = props.drag;
  const onPointerDown = props.onPointerDown;
  const onContextMenu = props.onContextMenu;
  const onPointerMove = props.onPointerMove;
  const onPointerUp = props.onPointerUp;
  const onPointerCancel = props.onPointerCancel;
  const sidebarRef = props.sidebarRef;
  const tableAreaRef = props.tableAreaRef;
  const menuRef = props.menuRef;
  const menu = props.menu;
  const closeMenu = props.closeMenu;

  const Slot: React.FC<{label: string | null}> = ({label}) => {
    const dragging = drag !== null && drag.label === label;
    return (
      <Card
        data-slot-id={label}
        onPointerDown={(e) => onPointerDown(label, e)}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => onContextMenu(label, e)}
        height={heightSlot}
        width={widthSlot}
        padding={majorScale(1)}
        elevation={(dragging || !label) ? 0 : 1}
        background="white"
        cursor="grab"
      >
        <Paragraph
          textAlign="center"
          fontSize="small"
          color={dragging ? "silver" : "black"}
        >
          {label ? label.split(":")[0] : "　"}
        </Paragraph>
      </Card>
    );
  }

  const rows = buildRows(classAlls);
  const slotCols = buildSlotCols(slotSettings);

  // 左2列（学年 / クラス）+ 右側にスロット列
  const gridTemplateColumns = [
    `${widthGroupHeader}px`,
    `${widthClassHeader}px`,
    ...slotCols.map(() => `${widthSlot}px`),
  ].join(" ");

  // 先頭行は曜日ヘッダ、それ以降はクラス行
  const gridTemplateRows = rows
    .map((r) => (r.kind === "header" ? `${heightDay}px` : `${heightSlot}px`))
    .join(" ");

  // dayIndexごとの列開始位置・列数を作る（曜日ヘッダspan用）
  const dayColMeta = slotSettings.map(([dayLabel, slotNums], dayIndex) => {
    const beforeCount = slotSettings
      .slice(0, dayIndex)
      .reduce((acc, [, nums]) => acc + nums.reduce((a, b) => a + b, 0), 0);

    const colCount = slotNums.reduce((a, b) => a + b, 0);

    // Gridの列番号は1始まり。左2列分あるので +3 から開始
    const gridColStart = 3 + beforeCount;

    return {
      dayIndex,
      dayLabel,
      gridColStart,
      colCount,
    };
  });
  
  const ContextMenu: React.FC<{menu: MenuState}> = ({menu}) => {
    if (!menu.open) return null;
    const MenuItem: React.FC<{
      funcLabel: string;
      onClick: () => void
    }> = ({ funcLabel, onClick }) => {

      useEffect(() => {
        if (!menuRef.current) return;

        const rect = menuRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let nextX = menu.x;
        let nextY = menu.y;

        if (rect.right > vw) {
          nextX = Math.max(0, vw - rect.width);
        }
        if (rect.bottom > vh) {
          nextY = Math.max(0, vh - rect.height);
        }

        if (nextX !== menu.x || nextY !== menu.y) {
          setMenu(m => ({ ...m, x: nextX, y: nextY }));
        }
      }, [menu.x, menu.y]);
      return (
        <button
          onClick={onClick}
          style={{
            display: "block",
            width: "100%",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "lightgray")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {funcLabel}
        </button>
      );
    };
    return (
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: menu.y,
          left: menu.x,
          background: "white",
          zIndex: 9999,
          border: "1px solid lightgray",
        }}
      >
        <MenuItem
          funcLabel="A"
          onClick={() => {
            console.log("A");
            closeMenu();
          }}
        />
        <MenuItem
          funcLabel="B"
          onClick={() => {
            console.log("B");
            closeMenu();
          }}
        />
        <hr />
        <MenuItem funcLabel="close" onClick={closeMenu} />
      </div>
    );
  };

  /* MainArea */
  return (
    <Pane
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      display="flex"
      flex={1}
      minHeight={0}
    >

      {/* Sidebar */}

      <Pane
        ref={sidebarRef}
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
        <Slot label="itemA:" />
        <Slot label="itemB:" />
        <Slot label="itemC:" />
        <Slot label="itemD:" />
        <Slot label="itemE:" />
        <Slot label="itemF:" />
        <Slot label="itemG:" />
        <Slot label="itemH:" />
        <Slot label="itemI:" />
        <Slot label="itemJ:" />
        <Slot label="itemK:" />
        <Slot label="itemL:" />
        <Slot label="itemM:" />
        <Slot label="itemN:" />
        <Slot label="itemO:" />
        <Slot label="itemP:" />
        <Slot label="itemQ:" />
        <Slot label="itemR:" />
        <Slot label="itemS:" />
        <Slot label="itemT:" />
      </Pane>

      {/* table area */}
      <Pane
        ref={tableAreaRef}
        flex={1}
        overflowY="auto"
        overflowX="auto"
        padding={majorScale(1)}
      >
        <Pane
          display="grid"
          gridTemplateColumns={gridTemplateColumns}
          gridTemplateRows={gridTemplateRows}
          gap={majorScale(1)}
          alignItems="stretch"
          width="max-content"
        >
          {/* 左上の空白（学年列ヘッダ） */}
          <Card
            gridColumn={1}
            gridRow={1}
            height={heightDay}
            display="flex"
            alignItems="center"
            justifyContent="center"
            background="gray100"
          >
            <Heading>　</Heading>
          </Card>

          {/* 左上の空白（クラス列ヘッダ） */}
          <Card
            gridColumn={2}
            gridRow={1}
            height={heightDay}
            display="flex"
            alignItems="center"
            justifyContent="center"
            background="gray100"
          >
            <Heading>　</Heading>
          </Card>

          {/* 曜日ヘッダ（span） */}
          {dayColMeta.map(({ dayIndex, dayLabel, gridColStart, colCount }) => (
            <Card
              key={`day-header-${dayIndex}`}
              gridColumn={`${gridColStart} / span ${colCount}`}
              gridRow={1}
              height={heightDay}
              display="flex"
              alignItems="center"
              justifyContent="center"
              background="tint2"
            >
              <Heading>{dayLabel}</Heading>
            </Card>
          ))}

          {/* 左側の行ヘッダ（学年 / クラス） */}
          {rows.map((row, rowIndex) => {
            // rows[0] は header 行なので class 行は rowIndex >= 1
            if (row.kind !== "class") return null;

            return (
              <Pane key={`row-left-${rowIndex}`} display="contents">
                {/* 学年（先頭クラス行のみ表示し、縦に結合） */}
                {row.groupFirst && (
                  <Card
                    gridColumn={1}
                    gridRow={`${rowIndex + 1} / span ${row.groupRowSpan}`} // +1は1始まり補正
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    background="gray300"
                    minHeight={heightSlot * row.groupRowSpan + majorScale(1) * (row.groupRowSpan - 1)}
                  >
                    <Heading>{row.clsGroup}</Heading>
                  </Card>
                )}

                {/* クラス名 */}
                <Card
                  gridColumn={2}
                  gridRow={rowIndex + 1}
                  height={heightSlot}
                  padding={majorScale(1)}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  background="white"
                >
                  <Heading>{row.cls}</Heading>
                </Card>
              </Pane>
            );
          })}

          {/* 本体セル（Slot） */}
          {rows.map((row, rowIndex) => {
            if (row.kind !== "class") return null;

            return slotCols.map((col, colIndex) => (
              <Slot
                key={`slot-${row.cls}-${col.dayIndex}-${col.blockIndex}-${col.posIndex}`}
                label={makeSlotLabel(row.cls, col.dayIndex, col.blockIndex, col.posIndex)}
                // Evergreen の Card は style/grid props が通るので直接置ける
                // ※ Slotコンポーネント側に gridColumn / gridRow を渡すため props追加してもOK
              />
            )).map((slotEl, colIndex) => {
              const col = slotCols[colIndex];
              return (
                <Pane
                  key={`slot-wrap-${row.cls}-${col.dayIndex}-${col.blockIndex}-${col.posIndex}`}
                  gridColumn={3 + colIndex}
                  gridRow={rowIndex + 1}
                >
                  {slotEl}
                </Pane>
              );
            });
          })}
        </Pane>
      </Pane>

      <ContextMenu
        menu={menu}
      />

    </Pane>
  );
}  

function Ghost({
  drag,
  ghostRef,
}: {
  drag: DragState | null;
  ghostRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!drag) return null;
  return (
    <Card
      ref={ghostRef}
      position="fixed"
      top={0}
      left={0}
      height={heightSlot}
      width={widthSlot}
      padding={majorScale(1)}
      elevation={4}
      background="white"
      pointerEvents="none"
      style={{
        transform: "translate(-9999px, -9999px)", // 初期は画面外
        willChange: "transform",
        zIndex: 9998,
      }}
    >
      <Paragraph textAlign="center" fontSize="small">
        {drag.label?.split(":")[0]}
      </Paragraph>
    </Card>
  )
}
