import
  { useRef
  , useState
  , useEffect
  } from 'react'
import
  { Pane
  , Heading
  } from 'evergreen-ui'
import { Class, SlotPosition, Subject, DragState, MenuState, AreaOnMain } from './types'
import { classAlls, colors } from './types/constants'
import { toPosKey, fromPosKey } from './logic/posKey'
import { checkSubjectDrop } from './logic/dropCheck'
import { seededShuffle, normalizeGroup } from './logic/normalize'
import { MainArea } from './components/MainArea'
import { Ghost } from './components/Ghost'

export default function App() {

  const [subjects, setSubjects] = useState<Map<string, Subject>>(() => {
    const names = ["Math", "Science", "Literature", "History", "Art", "Music", "PE", "English", "Geography", "Chemistry"];
    const allTableSlots: SlotPosition[] = [
      [0, 0, 0], [0, 0, 1], [0, 1, 0],
      [1, 0, 0], [1, 0, 1], [1, 1, 0],
      [2, 0, 0], [2, 0, 1], [2, 1, 0],
      [3, 0, 0], [3, 0, 1], [3, 1, 0],
      [4, 0, 0], [4, 0, 1], [4, 1, 0],
    ];
    const sidebarSlots: SlotPosition[] = [
      [-1, 0, 0], [-2, 0, 0], [-3, 0, 0],
    ];
    const map = new Map<string, Subject>();
    let id = 1;
    let clsIndex = 0;
    for (const group of classAlls) {
      for (const [grade, clsNames] of group) {
        for (const cls of clsNames) {
          const c: Class = [grade, cls];
          const seed = clsIndex * 31 + 7;
          const shuffledNames = seededShuffle(names, seed);
          const tableSlots = seededShuffle(allTableSlots, seed + 1).slice(0, 7);
          sidebarSlots.forEach((pos, i) => {
            const key = toPosKey(c, pos);
            map.set(key, { id: id++, name: shuffledNames[i], posKey: key });
          });
          tableSlots.forEach((pos, i) => {
            const key = toPosKey(c, pos);
            map.set(key, { id: id++, name: shuffledNames[i + 3], posKey: key });
          });
          clsIndex++;
        }
      }
    }
    return map;
  });

  // subjects の更新後（state反映後）にログする
  useEffect(() => {
    console.log("subjects(updated)", Array.from(subjects.entries()));
  }, [subjects]);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverPosKey, setHoverPosKey] = useState<string | null>(null);
  const hoverPosKeyRef = useRef<string | null>(null);

  const [sidebarInsertMark, setSidebarInsertMark] = useState<{ top: number; height: number } | null>(null);
  const sidebarInsertMarkRef = useRef<{ top: number; height: number } | null>(null);

  const [activeSidebarClass, setActiveSidebarClass] = useState<Class>(["1", "A"]);
  const activeSidebarClassRef = useRef<Class>(["1", "A"]);
  const [pinnedSidebarClass, setPinnedSidebarClass] = useState<Class | null>(null);
  const pinnedSidebarClassRef = useRef<Class | null>(null);
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
    if (!subjects.get(dragKey)) return;
    if (subjects.get(dragKey)?.pinned) return;

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

      // ピン中の別クラスをドラッグしたらピン解除
      const pinned = pinnedSidebarClassRef.current;
      if (pinned && (pinned[0] !== dragCls[0] || pinned[1] !== dragCls[1])) {
        pinnedSidebarClassRef.current = null;
        setPinnedSidebarClass(null);
      }

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
    if (!draggingNow && !sidebarClassLockRef.current.locked && pinnedSidebarClassRef.current === null) {
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

    // Sidebar insert indicator (any drag -> sidebar insert)
    // Highlight the gap between subjects indicating the insertion point.
    const fromKey = d.dragKey;
    const fromParsed = fromKey ? fromPosKey(fromKey) : null;
    const isFromPosKey = !!fromParsed;
    const inSidebar = !!el && !!sidebarRef.current && sidebarRef.current.contains(el);

    if (isFromPosKey && inSidebar && nextHover === null && sidebarRef.current) {
      const sidebar = sidebarRef.current;
      const nodes = Array.from(sidebar.querySelectorAll("[data-pos-key]")) as HTMLElement[];
      const els = nodes.filter((n) => n.getAttribute("data-pos-key") !== fromKey);

      const minMarkHeight = 32; // empty-case fallback (majorScale(4))

      let insertIndex = 0;
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        const midY = r.top + r.height / 2;
        if (e.clientY < midY) {
          insertIndex = i;
          break;
        }
        insertIndex = i + 1;
      }

      // Determine whether dropping here would actually change the visual order.
      // The dragged element's original position in `nodes` (= its visual index before drag)
      // equals the insertion index that would preserve the visual order.
      const wouldChange = (() => {
        if (!fromParsed) return true;
        if (!fromKey) return true;
        if (fromParsed[1][0] >= 0) return true; // from timetable -> always changes

        let originalInsertIndex = -1;
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].getAttribute("data-pos-key") === fromKey) {
            originalInsertIndex = i;
            break;
          }
        }
        if (originalInsertIndex < 0) return true;

        return insertIndex !== originalInsertIndex;
      })();

      let markTop = 0;
      let markHeight = 0;
      if (els.length === 0) {
        const padTop = Number.parseFloat(window.getComputedStyle(sidebar).paddingTop) || 0;
        const padBottom = Number.parseFloat(window.getComputedStyle(sidebar).paddingBottom) || 0;
        markTop = 0;
        markHeight = Math.max(minMarkHeight, padTop + padBottom);
      } else if (insertIndex <= 0) {
        const first = els[0];
        markTop = 0;
        markHeight = Math.max(0, first.offsetTop);
      } else if (insertIndex >= els.length) {
        const last = els[els.length - 1];
        const padBottom = Number.parseFloat(window.getComputedStyle(sidebar).paddingBottom) || 0;
        markTop = last.offsetTop + last.offsetHeight;
        markHeight = Math.max(0, padBottom);
      } else {
        const prev = els[insertIndex - 1];
        const next = els[insertIndex];
        const gapTop = prev.offsetTop + prev.offsetHeight;
        const gapBottom = next.offsetTop;
        markTop = gapTop;
        markHeight = Math.max(0, gapBottom - gapTop);
      }

      if (!wouldChange) {
        if (sidebarInsertMarkRef.current !== null) {
          sidebarInsertMarkRef.current = null;
          setSidebarInsertMark(null);
        }
      } else {
        const nextMark = { top: markTop, height: markHeight };
        const cur = sidebarInsertMarkRef.current;
        const changed = !cur || cur.top !== nextMark.top || cur.height !== nextMark.height;
        if (changed) {
          sidebarInsertMarkRef.current = nextMark;
          setSidebarInsertMark(nextMark);
        }
      }
    } else {
      if (sidebarInsertMarkRef.current !== null) {
        sidebarInsertMarkRef.current = null;
        setSidebarInsertMark(null);
      }
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

    sidebarInsertMarkRef.current = null;
    setSidebarInsertMark(null);

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
    if (!subjects.get(dragKey)) return;
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

    const dragKeyFrom = drag.dragKey;
    if (!dragKeyFrom) return;
    const fromParsed = fromPosKey(dragKeyFrom);

    // Sidebar drop (move/reorder) should be handled before slot logic.
    const inSidebar = !!sidebarRef.current && sidebarRef.current.contains(el);
    if (inSidebar) {
      if (!fromParsed) return;

      const [fromCls, fromPos] = fromParsed;
      const fromDayIndex = fromPos[0];

      const sidebar = sidebarRef.current;
      if (!sidebar) return;

      // Collect sidebar item elements for this class (negative dayIndex only), in DOM order.
      const sidebarEls = Array.from(sidebar.querySelectorAll("[data-pos-key]"))
        .map((n) => ({
          el: n as HTMLElement,
          key: (n as HTMLElement).getAttribute("data-pos-key"),
        }))
        .filter(({ key }) => {
          if (!key) return false;
          if (key === dragKeyFrom) return false; // exclude moving item
          const parsed = fromPosKey(key);
          if (!parsed) return false;
          const [cls, pos] = parsed;
          return (
            cls[0] === fromCls[0] &&
            cls[1] === fromCls[1] &&
            pos[0] < 0
          );
        });

      // Decide overall insertion index by Y (between elements).
      let overallInsertIndex = 0;
      for (let i = 0; i < sidebarEls.length; i++) {
        const r = sidebarEls[i].el.getBoundingClientRect();
        const midY = r.top + r.height / 2;
        if (y < midY) {
          overallInsertIndex = i;
          break;
        }
        overallInsertIndex = i + 1;
      }

      // Choose target dayIndex based on the element below insertion point (or edges).
      let targetDayIndex = -1;
      if (sidebarEls.length === 0) {
        targetDayIndex = -1;
      } else if (overallInsertIndex <= 0) {
        const parsed = sidebarEls[0].key ? fromPosKey(sidebarEls[0].key) : null;
        targetDayIndex = parsed ? parsed[1][0] : -1;
      } else if (overallInsertIndex >= sidebarEls.length) {
        const parsed = sidebarEls[sidebarEls.length - 1].key
          ? fromPosKey(sidebarEls[sidebarEls.length - 1].key!)
          : null;
        targetDayIndex = parsed ? parsed[1][0] : -1;
      } else {
        const parsed = sidebarEls[overallInsertIndex].key
          ? fromPosKey(sidebarEls[overallInsertIndex].key!)
          : null;
        targetDayIndex = parsed ? parsed[1][0] : -1;
      }
      if (targetDayIndex >= 0) targetDayIndex = -1;

      // Group insertion index: how many items of targetDayIndex are before overallInsertIndex
      let groupInsertIndex = 0;
      for (let i = 0; i < overallInsertIndex; i++) {
        const k = sidebarEls[i]?.key;
        if (!k) continue;
        const parsed = fromPosKey(k);
        if (!parsed) continue;
        if (parsed[1][0] === targetDayIndex) groupInsertIndex++;
      }

      setSubjects((prev) => {
        const next = new Map(prev);
        const moving = next.get(dragKeyFrom);
        if (!moving) return prev;

        // remove moving from its original location
        next.delete(dragKeyFrom);

        // If moving from sidebar group, compact its source group (if different)
        if (fromDayIndex < 0 && fromDayIndex !== targetDayIndex) {
          normalizeGroup(next, fromCls, fromDayIndex);
        }

        // Insert into target group and normalize
        normalizeGroup(next, fromCls, targetDayIndex, {
          index: groupInsertIndex,
          subj: moving,
        });

        return next;
      });

      return;
    }

    const slotEl = el.closest("[data-pos-key]") as Element | null;
    if (slotEl) {
      const posKeyTo = slotEl.getAttribute("data-pos-key");
      console.log({ dragKeyFrom, posKeyTo });

      if (!posKeyTo) return;

      const toParsed = fromPosKey(posKeyTo);
      const fromIsSidebarPool = !!fromParsed && fromParsed[1][0] < 0;

      const dropCheck = checkSubjectDrop(dragKeyFrom, posKeyTo, subjects.get(posKeyTo)?.pinned);

      if (!dropCheck.ok) {
        if (dropCheck.reason === "invalid-target") {
          console.log("DROP: posKeyTo is not a timetable posKey", { posKeyTo });
        } else if (dropCheck.reason === "different-class") {
          console.log("DROP: different class is not a valid target", {
            from: dragKeyFrom,
            to: posKeyTo,
            fromCls: fromParsed?.[0],
            toCls: toParsed?.[0],
          });
        }
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

  const onTogglePinned = (posKey: string) => {
    setSubjects((prev) => {
      const next = new Map(prev);
      const subj = next.get(posKey);
      if (!subj) return prev;
      next.set(posKey, { ...subj, pinned: !subj.pinned });
      return next;
    });
  };

  const onClickClassHeader = (cls: Class) => {
    const pinned = pinnedSidebarClassRef.current;
    const isSame = pinned && pinned[0] === cls[0] && pinned[1] === cls[1];
    if (isSame) {
      pinnedSidebarClassRef.current = null;
      setPinnedSidebarClass(null);
    } else {
      pinnedSidebarClassRef.current = cls;
      setPinnedSidebarClass(cls);
      activeSidebarClassRef.current = cls;
      setActiveSidebarClass(cls);
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
        pinnedSidebarClass={pinnedSidebarClass}
        sidebarInsertMark={sidebarInsertMark}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        onTogglePinned={onTogglePinned}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickClassHeader={onClickClassHeader}
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
