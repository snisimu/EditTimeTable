import { useEffect } from 'react'
import { Pane, Menu } from 'evergreen-ui'
import { MenuState, Subject } from '../types'
import { fromPosKey } from '../logic/posKey'
import { colors } from '../types/constants'

export const ContextMenu: React.FC<{
  menu: MenuState;
  menuRef: React.MutableRefObject<HTMLDivElement | null>;
  setMenu: React.Dispatch<React.SetStateAction<MenuState>>;
  closeMenu: () => void;
  subjects: Map<string, Subject>;
  onTogglePinned: (posKey: string) => void;
}> = ({ menu, menuRef, setMenu, closeMenu, subjects, onTogglePinned }) => {
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
          {(() => {
            const parsed = menu.dragKey ? fromPosKey(menu.dragKey) : null;
            const isSidebar = parsed ? parsed[1][0] < 0 : false;
            const isPinned = menu.dragKey ? !!subjects.get(menu.dragKey)?.pinned : false;
            return (
              <Menu.Item
                disabled={isSidebar}
                onSelect={() => {
                  if (menu.dragKey) onTogglePinned(menu.dragKey);
                  closeMenu();
                }}
              >
                <span style={isSidebar ? { color: "#94A3B8" } : undefined}>
                  {isPinned ? "固定を解除" : "固定する"}
                </span>
              </Menu.Item>
            );
          })()}
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
