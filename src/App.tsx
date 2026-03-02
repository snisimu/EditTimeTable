import
  { useRef
  , useState
  , useEffect
  , Fragment
  } from 'react'
import
  { Pane
  , Card
  , Menu
  , Heading
  , Paragraph
  , majorScale
  , minorScale
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
const classAlls: [string, string[]][][] = 
  [ [ ["1",
        [ "A"
        , "B"
        , "C"
        ]
      ]
    , ["2",
        [ "A"
        , "B"
        , "C"
        ]
      ]
    ]
  , [ ["3",
        [ "A"
        , "B"
        , "C"
        ]
      ]
    ]
  , [ ["4",
        [ "A"
        , "B"
        , "C"
        , "D"
        , "E"
        , "F"
        , "G"
        , "H"
        , "I"
        , "J"
        , "K"
        , "L"
        , "M"
        , "N"
        , "O"
        , "P"
        , "Q"
        , "R"
        , "S"
        , "T"
        ]
      ]
    ]
  ]

const heightSlot = 40;
const widthSlot = 80;
const heightDay = 30;
const widthGroupHeader = 30;
const widthClassHeader = 40;
const widthBlockGap = minorScale(1); // AM/PM（ブロック間）の gap 幅
const widthDayGap = majorScale(1); // 曜日間の gap 幅

export const colors = {
  // Background
  background: "#F5F7FA",   // 極薄ブルーグレー
  surface:    "#FFFFFF",
  surfaceAlt: "#F1F5F9",

  // Borders
  border:     "#E2E8F0",

  // Text
  textMain:   "#0F172A",
  textSub:    "#475569",

  // Primary
  primary:    "#1E3A8A",    // 深いネイビー
  primaryHover:"#1D4ED8",
  primarySoft: "#DBEAFE",

  // Semantic
  success:    "#166534",
  warning:    "#B45309",
  danger:     "#B91C1C"
}

// subjects

type Class = [string, string];
type SlotPosition = [number, number, number]; // dayIndex, blockIndex, posIndex
type Subject = {
  id: number;
  name: string;
  pinned?: boolean;
  posKey?: string;
};
const toPosKey = (cls: Class, pos: SlotPosition) =>
  `${cls[0]}|${cls[1]}|${pos[0]}|${pos[1]}|${pos[2]}`;

const fromPosKey = (key: string): [Class, SlotPosition] | null => {
  const parts = key.split("|");
  if (parts.length !== 5) return null;
  const [g, c, d, b, p] = parts;
  const dayIndex = Number(d);
  const blockIndex = Number(b);
  const posIndex = Number(p);
  if (![dayIndex, blockIndex, posIndex].every(Number.isFinite)) return null;
  return [[g, c], [dayIndex, blockIndex, posIndex]];
};

// types

type DragState = {
  pointerId: number;
  toRectX: number;
  toRectY: number;
  el?: HTMLDivElement;
  dragKey?: string;
  subjectName?: string;
}

type MenuState = {
  open: boolean;
  x: number;
  y: number;
  dragKey?: string;
};

const SubjectCardView: React.FC<{
  text: string;
  color?: string;
}> = ({
  text,
  color,
}) => {
  return (
    <Paragraph textAlign="center" fontSize="small" color={color}>
      {text}
    </Paragraph>
  );
};

// components

export default function App() {

  const [subjects, setSubjects] = useState<Map<string, Subject>>(
    new Map(
    [ [ toPosKey(["1", "A"], [0, 0, 0]),
        { id: 1, name: "Math", posKey: toPosKey(["1", "A"], [0, 0, 0]) },
      ]
    , [ toPosKey(["1", "A"], [0, 0, 1]),
        { id: 2, name: "Math", posKey: toPosKey(["1", "A"], [0, 0, 1]) },
      ]
    , [ toPosKey(["1", "A"], [1, 0, 0]),
        { id: 3, name: "Literature", posKey: toPosKey(["1", "A"], [1, 0, 0]) },
      ]
    , [ toPosKey(["1", "A"], [1, 0, 1]),
        { id: 4, name: "Literature", posKey: toPosKey(["1", "A"], [1, 0, 1]) },
      ]
    , [ toPosKey(["1", "A"], [-1, 0, 0]),
        { id: 5, name: "History", posKey: toPosKey(["1", "A"], [-1, 0, 0]) },
      ]
    , [ toPosKey(["1", "A"], [-2, 0, 0]),
        { id: 6, name: "Art", posKey: toPosKey(["1", "A"], [-2, 0, 0]) },
      ]
    , [ toPosKey(["1", "A"], [-3, 0, 0]),
        { id: 7, name: "Music", posKey: toPosKey(["1", "A"], [-3, 0, 0]) },
      ]
    , [ toPosKey(["2", "B"], [1, 0, 0]),
        { id: 8, name: "Science", posKey: toPosKey(["2", "B"], [1, 0, 0]) },
      ]
    , [ toPosKey(["2", "B"], [1, 1, 0]),
        { id: 9, name: "Science", posKey: toPosKey(["2", "B"], [1, 1, 0]) },
      ]
    , [ toPosKey(["2", "B"], [-1, 0, 0]),
        { id: 10, name: "Geography", posKey: toPosKey(["2", "B"], [-1, 0, 0]) },
      ]
    ])
  );

  // subjects の更新後（state反映後）にログする
  useEffect(() => {
    console.log("subjects(updated)", Array.from(subjects.entries()));
  }, [subjects]);
  
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverPosKey, setHoverPosKey] = useState<string | null>(null);
  const hoverPosKeyRef = useRef<string | null>(null);

  const [activeSidebarClass, setActiveSidebarClass] = useState<Class>(["1", "A"]);
  const activeSidebarClassRef = useRef<Class>(["1", "A"]);
  const sidebarHoverClassRef = useRef<Class | null>(null);
  const pendingSidebarClassRef = useRef<Class | null>(null);
  const sidebarSwitchTimerRef = useRef<number | null>(null);
  const sidebarClassLockRef = useRef<{ locked: boolean; cls: Class | null }>({
    locked: false,
    cls: null,
  });

  const clearSidebarSwitchTimer = () => {
    if (sidebarSwitchTimerRef.current != null) {
      window.clearTimeout(sidebarSwitchTimerRef.current);
      sidebarSwitchTimerRef.current = null;
    }
  };

  useEffect(() => {
    activeSidebarClassRef.current = activeSidebarClass;
  }, [activeSidebarClass]);

  useEffect(() => {
    return () => {
      clearSidebarSwitchTimer();
    };
  }, []);

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
      g.style.transform = `translate(${x - d.toRectX}px, ${y - d.toRectY}px) scale(1.03)`;
    });
  };

  const onPointerDown = (dragKey: string, e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    if (!el) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    // console.log("onPointerDown", { label, clientX: e.clientX, clientY: e.clientY });
    e.preventDefault();

    // Pointer capture：要素外に出てもmove/upを受け取れる
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    const r = el.getBoundingClientRect();

    // console.log("onPointerDown", { toRectY: e.clientY - r.top });

    const parsed = fromPosKey(dragKey);
    const subjectName = parsed ? (subjects.get(dragKey)?.name ?? dragKey) : dragKey;

    // Lock Sidebar content to the dragged class during drag
    if (parsed) {
      const dragCls = parsed[0];
      sidebarClassLockRef.current = { locked: true, cls: dragCls };

      pendingSidebarClassRef.current = null;
      sidebarHoverClassRef.current = null;
      clearSidebarSwitchTimer();

      const cur = activeSidebarClassRef.current;
      const already = cur[0] === dragCls[0] && cur[1] === dragCls[1];
      if (!already) {
        activeSidebarClassRef.current = dragCls;
        setActiveSidebarClass(dragCls);
      }
    }

    const nextDrag: DragState = {
      pointerId: e.pointerId,
      toRectX: e.clientX - r.left,
      toRectY: e.clientY - r.top,
      el,
      dragKey,
      subjectName,
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
    const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;

    const draggingNow = dragRef.current != null;

    // Track which class row the pointer is on (for Sidebar filtering)
    if (!draggingNow && !sidebarClassLockRef.current.locked) {
      const inTableArea = !!el && !!tableAreaRef.current && tableAreaRef.current.contains(el);
      if (inTableArea) {
        const slotEl = el?.closest("[data-pos-key]") as Element | null;
        const key = slotEl?.getAttribute("data-pos-key") ?? null;
        const parsed = key ? fromPosKey(key) : null;

        if (parsed && parsed[1][0] >= 0) {
          const nextCls = parsed[0];
          sidebarHoverClassRef.current = nextCls;

          const curActive = activeSidebarClassRef.current;
          const activeIsSame = curActive[0] === nextCls[0] && curActive[1] === nextCls[1];

          if (activeIsSame) {
            pendingSidebarClassRef.current = null;
            clearSidebarSwitchTimer();
          } else {
            const pending = pendingSidebarClassRef.current;
            const pendingIsSame =
              !!pending && pending[0] === nextCls[0] && pending[1] === nextCls[1];

            if (!pendingIsSame) {
              pendingSidebarClassRef.current = nextCls;
              clearSidebarSwitchTimer();

              sidebarSwitchTimerRef.current = window.setTimeout(() => {
                const stillHover = sidebarHoverClassRef.current;
                const stillPending = pendingSidebarClassRef.current;
                if (!stillHover || !stillPending) return;

                const stillSame =
                  stillHover[0] === stillPending[0] && stillHover[1] === stillPending[1];
                if (!stillSame) return;

                const cur = activeSidebarClassRef.current;
                const alreadyActive = cur[0] === stillPending[0] && cur[1] === stillPending[1];
                if (alreadyActive) return;

                activeSidebarClassRef.current = stillPending;
                setActiveSidebarClass(stillPending);
              }, 500);
            }
          }
        } else {
          sidebarHoverClassRef.current = null;
          pendingSidebarClassRef.current = null;
          clearSidebarSwitchTimer();
        }
      } else {
        sidebarHoverClassRef.current = null;
        pendingSidebarClassRef.current = null;
        clearSidebarSwitchTimer();
      }
    }

    // Drag-only updates
    const d = dragRef.current;
    if (!d) return;
    if (e.pointerId !== d.pointerId) return;

    pointerRef.current = { x: e.clientX, y: e.clientY };
    updateAutoScrollSpeed(e.clientX, e.clientY);
    scheduleGhostMove();

    const slotEl = el?.closest("[data-pos-key]") as Element | null;
    const key = slotEl?.getAttribute("data-pos-key") ?? null;
    const parsed = key ? fromPosKey(key) : null;
    const nextHover = parsed ? key : null;

    if (hoverPosKeyRef.current !== nextHover) {
      hoverPosKeyRef.current = nextHover;
      setHoverPosKey(nextHover);
    }
    // console.log("onPointerMove", { eclientY: e.clientY });
  }

  const endDrag = () => {
    if (drag?.el) drag.el.style.cursor = "grab";
    setDrag(null);
    dragRef.current = null;

    sidebarClassLockRef.current = { locked: false, cls: null };
    sidebarHoverClassRef.current = null;
    pendingSidebarClassRef.current = null;
    clearSidebarSwitchTimer();

    hoverPosKeyRef.current = null;
    setHoverPosKey(null);

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
    dragKey: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (drag) return;
    e.preventDefault();
    setMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      dragKey,
    });
    console.log("onContextMenu", { dragKey, clientX: e.clientX, clientY: e.clientY });
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
    const el = document.elementFromPoint(x, y) as Element | null;
    if (!el) {
      console.log("DROP: elementFromPoint returned null", { x, y });
      return;
    }

    const slotEl = el.closest("[data-pos-key]") as Element | null;
    if (slotEl) {
      const posKeyTo = slotEl.getAttribute("data-pos-key");
      const dragKeyFrom = drag.dragKey;
      console.log({ dragKeyFrom, posKeyTo });

      if (!posKeyTo || !dragKeyFrom) return;

      const fromParsed = fromPosKey(dragKeyFrom);
      const toParsed = fromPosKey(posKeyTo);
      const fromIsSidebarPool = !!fromParsed && fromParsed[1][0] < 0;

      if (!toParsed) {
        console.log("DROP: posKeyTo is not a timetable posKey", { posKeyTo });
        return;
      }

      // sidebar item -> timetable slot: place a subject
      if (!fromParsed || fromIsSidebarPool) {
        setSubjects((prev) => {
          const next = new Map(prev);

          // subject from sidebar pool (dayIndex < 0): move/swap
          if (fromIsSidebarPool) {
            const fromKey = dragKeyFrom;
            const toKey = posKeyTo;

            if (fromKey === toKey) return prev;

            const fromSubj = next.get(fromKey);
            if (!fromSubj) return prev;

            const toSubj = next.get(toKey);

            next.set(toKey, { ...fromSubj, posKey: toKey });

            if (toSubj) {
              next.set(fromKey, { ...toSubj, posKey: fromKey });
            } else {
              next.delete(fromKey);
            }

            return next;
          }

          // plain sidebar item (not a posKey): create a new subject
          next.set(posKeyTo, { id: Date.now(), name: dragKeyFrom, posKey: posKeyTo });
          return next;
        });
        return;
      }

      // timetable slot -> timetable slot: move subject
      if (fromParsed) {
        setSubjects((prev) => {
          const next = new Map(prev);
          if (dragKeyFrom === posKeyTo) return prev;

          const fromKey = dragKeyFrom;
          const toKey = posKeyTo;

          const fromSubj = next.get(fromKey);
          if (!fromSubj) return prev;

          const toSubj = next.get(toKey);

          // move from -> to
          next.set(toKey, { ...fromSubj, posKey: toKey });

          // if destination had a subject, move it back to from (swap)
          if (toSubj) {
            next.set(fromKey, { ...toSubj, posKey: fromKey });
          } else {
            next.delete(fromKey);
          }

          return next;
        });
      }
    } else {
      const trail: string[] = [];
      let cur: Element | null = el;
      for (let i = 0; i < 6 && cur; i++) {
        const key = cur.getAttribute("data-pos-key");
        trail.push(`${cur.tagName.toLowerCase()}${key ? `[data-pos-key=${key}]` : ""}`);
        cur = cur.parentElement;
      }
      console.log("DROP OUTSIDE (no [data-pos-key] found)", { x, y, hit: el.tagName, trail });
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
        background={colors.primarySoft}
        padding={16}
        elevation={2}
        display="flex"
        alignItems="center"
      >
        <Heading size={600}>Top Pane</Heading>
      </Pane>

      <MainArea
        drag={drag}
        hoverPosKey={hoverPosKey}
        activeSidebarClass={activeSidebarClass}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        sidebarRef={sidebarRef}
        tableAreaRef={tableAreaRef}
        menuRef={menuRef}
        menu={menu}
        setMenu={setMenu}
        closeMenu={closeMenu}
        subjects={subjects}
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
  hoverPosKey: string | null;
  activeSidebarClass: Class;
  onPointerDown: (dragKey: string, e: React.PointerEvent<HTMLDivElement>) => void;
  onContextMenu: (dragKey: string, e: React.MouseEvent<HTMLDivElement>) => void;
  onPointerMove: any;
  onPointerUp: any;
  onPointerCancel: any;
  sidebarRef: React.RefObject<HTMLDivElement>;
  tableAreaRef: React.RefObject<HTMLDivElement>;
  menuRef: React.MutableRefObject<HTMLDivElement | null>;
  menu: MenuState;
  setMenu: React.Dispatch<React.SetStateAction<MenuState>>;
  closeMenu: () => void;
  subjects: Map<string, Subject>;
}> = (props) => {

  const drag = props.drag;
  const hoverPosKey = props.hoverPosKey;
  const activeSidebarClass = props.activeSidebarClass;
  const onPointerDown = props.onPointerDown;
  const onContextMenu = props.onContextMenu;
  const onPointerMove = props.onPointerMove;
  const onPointerUp = props.onPointerUp;
  const onPointerCancel = props.onPointerCancel;
  const sidebarRef = props.sidebarRef;
  const tableAreaRef = props.tableAreaRef;
  const menuRef = props.menuRef;
  const menu = props.menu;
  const setMenu = props.setMenu;
  const closeMenu = props.closeMenu;
  const subjects = props.subjects;

  const sidebarSubjects = Array.from(subjects.entries())
    .map(([posKey, subj]) => ({ posKey, subj, parsed: fromPosKey(posKey) }))
    .filter(({ parsed }) => {
      if (!parsed) return false;
      const [cls, pos] = parsed;
      if (pos[0] >= 0) return false;
      return cls[0] === activeSidebarClass[0] && cls[1] === activeSidebarClass[1];
    })
    .sort((a, b) => {
      const ap = a.parsed!;
      const bp = b.parsed!;
      const aPos = ap[1];
      const bPos = bp[1];

      // Sidebar ordering: [-1,*,*] first, then [-2,*,*], ... (dayIndex descending)
      if (aPos[0] !== bPos[0]) return bPos[0] - aPos[0];

      // Within the same dayIndex, keep deterministic ordering
      if (aPos[1] !== bPos[1]) return aPos[1] - bPos[1];
      if (aPos[2] !== bPos[2]) return aPos[2] - bPos[2];

      return a.subj.name.localeCompare(b.subj.name) || a.subj.id - b.subj.id;
    });

  type GridSlotCol = {
    kind: "slot";
    dayIndex: number;
    blockIndex: number;
    posIndex: number;
  };

  type GridGapCol = {
    kind: "gap";
    dayIndex: number;
    blockIndex: number; // このgapは「このblockの前」にある
  };

  type GridDayGapCol = {
    kind: "day-gap";
    dayIndex: number; // このgapは「このdayの前」にある（dayIndex > 0）
  };

  type GridCol = GridSlotCol | GridGapCol | GridDayGapCol;

  const gridCols: GridCol[] = (() => {
    const cols: GridCol[] = [];

    slotSettings.forEach(([_, blockSizes], dayIndex) => {
      // 曜日と曜日の間 + 先頭曜日の前にもスペーサー列を入れる
      cols.push({
        kind: "day-gap",
        dayIndex,
      });

      blockSizes.forEach((count, blockIndex) => {
        // 先頭ブロック以外の前にスペーサー列を入れる
        if (blockIndex > 0) {
          cols.push({
            kind: "gap",
            dayIndex,
            blockIndex,
          });
        }

        for (let posIndex = 0; posIndex < count; posIndex++) {
          cols.push({
            kind: "slot",
            dayIndex,
            blockIndex,
            posIndex,
          });
        }
      });
    });

    return cols;
  })();

  const gridTemplateColumnsForSlots = gridCols
    .map((c) => {
      if (c.kind === "slot") return `${widthSlot}px`;
      if (c.kind === "gap") return `${widthBlockGap}px`;
      return `${widthDayGap}px`;
    })
    .join(" ");

  const dayHeaderRanges = slotSettings.map(([dayLabel], dayIndex) => {
    const indices = gridCols
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.kind !== "day-gap" && c.dayIndex === dayIndex)
      .map(({ i }) => i);

    const start = indices.length ? 3 + Math.min(...indices) : 3;
    const span = indices.length;

    return { dayLabel, dayIndex, start, span };
  });

  const makePosKey = (
    cls: Class,
    dayIndex: number,
    blockIndex: number,
    posIndex: number
  ) => toPosKey(cls, [dayIndex, blockIndex, posIndex]);

  type GridRow =
    | { kind: "block-gap"; blockIndex: number }
    | { kind: "grade-gap"; blockIndex: number; clsGroup: string }
    | { kind: "class-gap"; blockIndex: number; clsGroup: string; cls: string; idx: number }
    | { kind: "day-header"; blockIndex: number }
    | {
        kind: "class";
        blockIndex: number;
        clsGroup: string;
        cls: string;
        groupFirst: boolean;
        groupSize: number;
      };

  const rows: GridRow[] = classAlls.flatMap((blockGroups, blockIndex) => {
    const blockRows: GridRow[] = [];

    // 2ブロック目以降の曜日ヘッダの上にだけ gap を入れる
    if (blockIndex > 0) {
      blockRows.push({ kind: "block-gap", blockIndex });
    }

    blockRows.push({ kind: "day-header", blockIndex });

    blockGroups.forEach(([clsGroup, classes], groupIndex) => {
      // 学年（clsGroup）と学年の間にだけ gap を入れる（最初の学年の前は入れない）
      if (groupIndex > 0) {
        blockRows.push({ kind: "grade-gap", blockIndex, clsGroup });
      }

      classes.forEach((cls, idx) => {
        blockRows.push({
          kind: "class",
          blockIndex,
          clsGroup,
          cls,
          groupFirst: idx === 0,
          groupSize: classes.length,
        });

        // 各クラス行の「行間」: 次が同一学年内のクラス行なら挿入
        // （学年切替時は grade-gap があるので二重にしない）
        if (idx < classes.length - 1) {
          blockRows.push({ kind: "class-gap", blockIndex, clsGroup, cls, idx });
        }
      });
    });

    return blockRows;
  });

  const Slot: React.FC<{ dragKey: string; text?: string }> = ({ dragKey, text }) => {
    const dragging = drag !== null && drag.dragKey === dragKey;
    const hasSubject = (text ?? "").trim().length > 0;
    const isDropTarget = !!drag && hoverPosKey === dragKey && drag.dragKey !== dragKey;
    return (
      <Card
        data-pos-key={dragKey}
        onPointerDown={(e) => onPointerDown(dragKey, e)}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => onContextMenu(dragKey, e)}
        height={heightSlot}
        width={widthSlot}
        padding={majorScale(1)}
        elevation={dragging ? 0 : hasSubject ? 1 : 0}
        background={colors.surface}
        opacity={dragging ? 0.5 : 1}
        cursor="grab"
        style={
          isDropTarget
            ? {
                outline: `2px solid ${colors.primary}`,
                outlineOffset: 1,
                borderRadius: 0,
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
  }

  const ContextMenu: React.FC<{menu: MenuState}> = ({menu}) => {
    useEffect(() => {
      if (!menu.open) return;
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
        setMenu((m) => ({ ...m, x: nextX, y: nextY }));
      }
    }, [menu.open, menu.x, menu.y]);

    if (!menu.open) return null;
    return (
      <Pane
        ref={(node) => {
          menuRef.current = node;
        }}
        position="fixed"
        top={menu.y}
        left={menu.x}
        zIndex={9999}
        backgroundColor={colors.surface}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Menu>
          <Menu.Group>
            <Menu.Item
              onSelect={() => {
                console.log("A");
                closeMenu();
              }}
            >
              A
            </Menu.Item>
            <Menu.Item
              onSelect={() => {
                console.log("B");
                closeMenu();
              }}
            >
              B
            </Menu.Item>
          </Menu.Group>

          <Menu.Divider />

          <Menu.Item onSelect={closeMenu}>close</Menu.Item>
        </Menu>
      </Pane>
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
        backgroundColor={colors.surfaceAlt}
        display="flex"
        flexDirection="column"
        padding={majorScale(2)}
        flex="none"
        elevation={2}
        overflowY="auto"
        minHeight={0}
        width={widthSlot + majorScale(4)}
        minWidth={widthSlot + majorScale(4)}
        gap={majorScale(4)}
      >
        {sidebarSubjects.map(({ posKey, subj }) => (
          <Slot key={posKey} dragKey={posKey} text={subj.name} />
        ))}
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
          gridTemplateColumns={`${widthGroupHeader}px ${widthClassHeader}px ${gridTemplateColumnsForSlots}`}
          gridAutoRows="auto"
          gap={0}
          alignItems="stretch"
        >
          {rows.map((row, rowIndex) => {
            const gridRow = rowIndex + 1;

            if (row.kind === "block-gap") {
              const totalCols = 2 + gridCols.length;
              return (
                <Pane
                  key={`block-gap-${row.blockIndex}`}
                  gridColumn={`1 / span ${totalCols}`}
                  gridRow={gridRow}
                  height={majorScale(1)}
                  pointerEvents="none"
                />
              );
            }

            if (row.kind === "grade-gap") {
              const totalCols = 2 + gridCols.length;
              return (
                <Pane
                  key={`grade-gap-${row.blockIndex}-${row.clsGroup}`}
                  gridColumn={`1 / span ${totalCols}`}
                  gridRow={gridRow}
                  height={minorScale(1)}
                  pointerEvents="none"
                />
              );
            }

            if (row.kind === "class-gap") {
              const totalCols = 2 + gridCols.length;
              return (
                <Pane
                  key={`class-gap-${row.blockIndex}-${row.clsGroup}-${row.cls}-${row.idx}`}
                  gridColumn={`1 / span ${totalCols}`}
                  gridRow={gridRow}
                  height={minorScale(1)}
                  pointerEvents="none"
                />
              );
            }

            if (row.kind === "day-header") {
              return (
                <Fragment key={`day-header-${row.blockIndex}`}
                >
                  <Pane gridColumn={1} gridRow={gridRow}>
                    <Card height={heightDay} /* background="gray200" */ />
                  </Pane>
                  <Pane gridColumn={2} gridRow={gridRow}>
                    <Card height={heightDay} /* background="gray300" */ />
                  </Pane>

                  {dayHeaderRanges.map(({ dayLabel, dayIndex, start, span }) => {
                    if (span <= 0) return null;
                    return (
                      <Pane
                        key={`day-header-${row.blockIndex}-${dayIndex}`}
                        gridColumn={`${start} / span ${span}`}
                        gridRow={gridRow}
                      >
                        <Card
                          height={heightDay}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          backgroundColor={colors.surfaceAlt}
                        >
                          <Heading textAlign="center">{dayLabel}</Heading>
                        </Card>
                      </Pane>
                    );
                  })}
                </Fragment>
              );
            }

            return (
              <Fragment key={`row-${row.blockIndex}-${row.clsGroup}-${row.cls}`}>
                {/* 学年ヘッダ（グループ先頭行のみ描画、縦にspan） */}
                {row.groupFirst && (
                  <Pane
                    gridColumn={1}
                    gridRow={`${gridRow} / span ${Math.max(1, row.groupSize * 2 - 1)}`}
                    display="flex"
                  >
                    <Card
                      width="100%"
                      height="100%"
                      minHeight={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={colors.primarySoft}
                    >
                      <Heading>{row.clsGroup}</Heading>
                    </Card>
                  </Pane>
                )}

                {/* クラスヘッダ */}
                <Pane gridColumn={2} gridRow={gridRow}>
                  <Card
                    width="100%"
                    height={heightSlot}
                    minHeight={heightSlot}
                    maxHeight={heightSlot}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    padding={majorScale(1)}
                    backgroundColor={colors.surfaceAlt}
                  >
                    <Heading>{row.cls}</Heading>
                  </Card>
                </Pane>

                {/* 本体セル：slot列だけ Slot を置く / gap列は空白 */}
                {gridCols.map((col, colIndex) => {
                  const gridColumn = 3 + colIndex;

                  if (col.kind !== "slot") {
                    return (
                      <Pane
                        key={
                          col.kind === "day-gap"
                            ? `daygap-${row.blockIndex}-${row.cls}-${col.dayIndex}`
                            : `gap-${row.blockIndex}-${row.cls}-${col.dayIndex}-${col.blockIndex}`
                        }
                        gridColumn={gridColumn}
                        gridRow={gridRow}
                      />
                    );
                  }

                  return (
                    <Pane
                      key={`slot-${row.blockIndex}-${row.cls}-${col.dayIndex}-${col.blockIndex}-${col.posIndex}`}
                      gridColumn={gridColumn}
                      gridRow={gridRow}
                    >
                      {(() => {
                        const posKey = makePosKey(
                          [row.clsGroup, row.cls],
                          col.dayIndex,
                          col.blockIndex,
                          col.posIndex
                        );
                        const subj = subjects.get(posKey);
                        const text = subj?.name ?? "";
                        return <Slot dragKey={posKey} text={text} />;
                      })()}
                    </Pane>
                  );
                })}
              </Fragment>
            );
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
