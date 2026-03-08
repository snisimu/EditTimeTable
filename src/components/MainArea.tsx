import { Fragment } from 'react'
import
  { Pane
  , Card
  , Heading
  , majorScale
  , minorScale
  } from 'evergreen-ui'
import { Class, DragState, MenuState, Subject } from '../types'
import
  { slotSettings
  , classAlls
  , heightSlot
  , widthSlot
  , heightDay
  , widthGroupHeader
  , widthClassHeader
  , widthBlockGap
  , widthDayGap
  , colors
  } from '../types/constants'
import { toPosKey, fromPosKey } from '../logic/posKey'
import { Slot } from './Slot'
import { ContextMenu } from './ContextMenu'

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

export const MainArea: React.FC<{
  drag: DragState | null;
  hoverPosKey: string | null;
  activeSidebarClass: Class;
  pinnedSidebarClass: Class | null;
  sidebarInsertMark: { top: number; height: number } | null;
  onPointerDown: (dragKey: string, e: React.PointerEvent<HTMLDivElement>) => void;
  onContextMenu: (dragKey: string, e: React.MouseEvent<HTMLDivElement>) => void;
  onPointerMove: any;
  onPointerUp: any;
  onPointerCancel: any;
  onClickClassHeader: (cls: Class) => void;
  sidebarRef: React.RefObject<HTMLDivElement>;
  tableAreaRef: React.RefObject<HTMLDivElement>;
  menuRef: React.MutableRefObject<HTMLDivElement | null>;
  menu: MenuState;
  setMenu: React.Dispatch<React.SetStateAction<MenuState>>;
  closeMenu: () => void;
  onTogglePinned: (posKey: string) => void;
  subjects: Map<string, Subject>;
  highlighted: Map<string, number>;
}> = (props) => {

  const drag = props.drag;
  const hoverPosKey = props.hoverPosKey;
  const activeSidebarClass = props.activeSidebarClass;
  const pinnedSidebarClass = props.pinnedSidebarClass;
  const sidebarInsertMark = props.sidebarInsertMark;
  const onPointerDown = props.onPointerDown;
  const onContextMenu = props.onContextMenu;
  const onTogglePinned = props.onTogglePinned;
  const onPointerMove = props.onPointerMove;
  const onPointerUp = props.onPointerUp;
  const onPointerCancel = props.onPointerCancel;
  const onClickClassHeader = props.onClickClassHeader;
  const sidebarRef = props.sidebarRef;
  const tableAreaRef = props.tableAreaRef;
  const menuRef = props.menuRef;
  const menu = props.menu;
  const setMenu = props.setMenu;
  const closeMenu = props.closeMenu;
  const subjects = props.subjects;
  const highlighted = props.highlighted;

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

    const start = indices.length ? 4 + Math.min(...indices) : 4;
    const span = indices.length;

    return { dayLabel, dayIndex, start, span };
  });

  const makePosKey = (
    cls: Class,
    dayIndex: number,
    blockIndex: number,
    posIndex: number
  ) => toPosKey(cls, [dayIndex, blockIndex, posIndex]);

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
        backgroundColor={colors.surface}
        display="flex"
        flexDirection="column"
        position="relative"
        paddingTop={majorScale(4)}
        paddingBottom={majorScale(4)}
        paddingLeft={majorScale(2)}
        paddingRight={majorScale(2)}
        flex="none"
        elevation={2}
        overflowY="auto"
        minHeight={0}
        width={widthSlot + majorScale(4)}
        minWidth={widthSlot + majorScale(4)}
        gap={majorScale(4)}
      >
        {sidebarInsertMark != null && sidebarInsertMark.height > 0 && (
          <Pane
            position="absolute"
            left={majorScale(2)}
            width={widthSlot}
            top={sidebarInsertMark.top}
            height={sidebarInsertMark.height}
            pointerEvents="none"
            backgroundColor={colors.surfaceAlt}
          />
        )}
        {sidebarSubjects.map(({ posKey, subj }) => (
          <Slot key={posKey} dragKey={posKey} text={subj.name} pinned={subj.pinned}
            drag={drag} hoverPosKey={hoverPosKey}
            onPointerDown={onPointerDown} onPointerUp={onPointerUp} onContextMenu={onContextMenu}
            highlightCount={highlighted.get(posKey)}
          />
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
          gridTemplateColumns={`${widthGroupHeader}px ${minorScale(1)}px ${widthClassHeader}px ${gridTemplateColumnsForSlots}`}
          gridAutoRows="auto"
          gap={0}
          alignItems="stretch"
        >
          {rows.map((row, rowIndex) => {
            const gridRow = rowIndex + 1;

            if (row.kind === "block-gap") {
              const totalCols = 3 + gridCols.length;
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
              const totalCols = 3 + gridCols.length;
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
              const totalCols = 3 + gridCols.length;
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
                  <Pane gridColumn={3} gridRow={gridRow}>
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
                {(() => {
                  const rowCls: Class = [row.clsGroup, row.cls];
                  const isPinned = pinnedSidebarClass !== null &&
                    pinnedSidebarClass[0] === rowCls[0] &&
                    pinnedSidebarClass[1] === rowCls[1];
                  return (
                    <Pane gridColumn={3} gridRow={gridRow}>
                      <Card
                        width="100%"
                        height={heightSlot}
                        minHeight={heightSlot}
                        maxHeight={heightSlot}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        padding={majorScale(1)}
                        backgroundColor={isPinned ? colors.primarySoft : colors.surfaceAlt}
                        cursor="pointer"
                        onClick={() => onClickClassHeader(rowCls)}
                      >
                        <Heading>{row.cls}</Heading>
                      </Card>
                    </Pane>
                  );
                })()}

                {/* 本体セル：slot列だけ Slot を置く / gap列は空白 */}
                {gridCols.map((col, colIndex) => {
                  const gridColumn = 4 + colIndex;

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
                        return <Slot dragKey={posKey} text={text} pinned={subj?.pinned}
                          drag={drag} hoverPosKey={hoverPosKey}
                          onPointerDown={onPointerDown} onPointerUp={onPointerUp} onContextMenu={onContextMenu}
                          highlightCount={highlighted.get(posKey)}
                        />;
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
        menuRef={menuRef}
        setMenu={setMenu}
        closeMenu={closeMenu}
        subjects={subjects}
        onTogglePinned={onTogglePinned}
      />

    </Pane>
  );
}
