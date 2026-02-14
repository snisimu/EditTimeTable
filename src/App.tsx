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
  ]
const classAlls: string[] = ["A", "B", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C"];

const heightSlot = 40;
const widthSlot = 80;
const heightDay = 20;
const gapClass = majorScale(1);
const paddingDay = majorScale(1);

// auxiliary

const slotPositions: (() => [number, number[][]][]) = () => {
  let r: [number, number[][]][] = new Array();
  let d = 0;
  slotSettings.forEach(([_, slotNums]) => {
    r.push([d, slotNums.map(n => Array.from({ length: n }, (_, i) => i))]);
    d += 1;
  });
  return r;
}

// components

export default function App() {

  type DragState = {
    pointerId: number;
    toRectX: number;
    toRectY: number;
    el?: HTMLDivElement;
    label?: string;
  }
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

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

  const onPointerDown = (label: string, e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    if (!el) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    console.log("onPointerDown", { label, clientX: e.clientX, clientY: e.clientY });
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
      label,
    });
    setPointer({ x: e.clientX, y: e.clientY });
    document.body.style.cursor = "grabbing";
    e.currentTarget.style.cursor = "grabbing";
    // updateAutoScrollSpeed(e.clientX, e.clientY); // a matter of preference
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (e.pointerId !== drag.pointerId) return;
    setPointer({ x: e.clientX, y: e.clientY });
    updateAutoScrollSpeed(e.clientX, e.clientY);
    // console.log("onPointerMove", { eclientY: e.clientY });
  }

  const endDrag = () => {
    if (drag?.el) drag.el.style.cursor = "grab";
    setDrag(null);
    setPointer(null);
    document.body.style.cursor = "";
    stopAutoScroll();
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

  type MenuState = {
    open: boolean;
    x: number;
    y: number;
    label?: string;
  };

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

  // drag or context menu 以外の要因でドラッグ終了
  useEffect(() => {
    if (!drag) return;

    const onWinPointerUp = (ev: PointerEvent) => {
      if (ev.pointerId !== drag.pointerId) return;
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
        pointer={pointer}
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

    </Pane>
  )
}

const MainArea: React.FC<{
  drag: DragState | null;
  pointer: {x:number;y:number} | null;
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
  const pointer = props.pointer;
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

  const Slot: React.FC<{label: string}> = ({label}) => {
    const dragging = drag !== null && drag.label === label;
    return (
      <Card
        onPointerDown={(e) => onPointerDown(label, e)}
        onContextMenu={(e) => onContextMenu(label, e)}
        height={heightSlot}
        width={widthSlot}
        padding={majorScale(1)}
        elevation={dragging ? 0 : 1}
        background="white"
        cursor="grab"
      >
        <Paragraph
          textAlign="center"
          fontSize="small"
          color={dragging ? "silver" : "black"}
        >
          {label}
        </Paragraph>
      </Card>
    );
  }
  const Ghost: React.FC<{
    label: string
    x: number
    y: number
  }> = ({label, x, y}) => (
    <Card
      position="fixed"
      top={y}
      left={x}
      height={heightSlot}
      width={widthSlot}
      padding={majorScale(1)}
      elevation={4}
      background="white"
      pointerEvents="none"
    >
      <Paragraph textAlign="center" fontSize="small">{label}</Paragraph>
    </Card>
  )

  const ContextMenu: React.FC = () => {
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
          <Slot label="itemX" />
          <Slot label="itemY" />
          <Slot label="itemZ" />
          <Slot label="itemZ" />
          <Slot label="itemZ" />
          <Slot label="itemZ" />
          <Slot label="itemZ" />
      </Pane>

      {/* table area */}

      <Pane
        ref={tableAreaRef}
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
          <Day
            key={slotPositionDay[0]}
            slotPositionDay={slotPositionDay}
          />
        ))}

      </Pane>

      {drag && pointer && <Ghost
        label={drag.label}
        x={pointer.x - drag.toRectX}
        y={pointer.y - drag.toRectY}
      />}

      {menu.open && <ContextMenu />}

    </Pane>
  );
}  
