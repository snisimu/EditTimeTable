import { useRef, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const MIN_SCALE_X = 0.65
const TOOLTIP_DELAY_MS = 300

export const SubjectCardView: React.FC<{
  text: string;
  color?: string;
}> = ({ text, color }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [displayText, setDisplayText] = useState(text)
  const [scaleX, setScaleX] = useState(1)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const timerRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return
    const available = container.clientWidth

    // Measure natural text width
    textEl.textContent = text
    const natural = textEl.scrollWidth

    if (natural <= available) {
      setDisplayText(text)
      setScaleX(1)
      return
    }

    const clampedScale = available / natural
    if (clampedScale >= MIN_SCALE_X) {
      setDisplayText(text)
      setScaleX(clampedScale)
      return
    }

    // scaleX を MIN_SCALE_X に固定してバイナリサーチで最大文字数を探す
    const maxWidth = available / MIN_SCALE_X
    let lo = 0, hi = text.length - 1
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      textEl.textContent = text.slice(0, mid) + '…'
      if (textEl.scrollWidth <= maxWidth) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }
    const truncated = text.slice(0, lo) + '…'
    textEl.textContent = truncated
    setDisplayText(truncated)
    setScaleX(MIN_SCALE_X)
  }, [text])

  const isEllipsis = displayText !== text

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isEllipsis) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    timerRef.current = window.setTimeout(() => {
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
    }, TOOLTIP_DELAY_MS)
  }

  const handleMouseLeave = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setTooltipPos(null)
  }

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        <span
          ref={textRef}
          style={{
            whiteSpace: 'nowrap',
            fontSize: 'small',
            color,
            display: 'inline-block',
            transformOrigin: 'center',
            transform: `scaleX(${scaleX})`,
          }}
        >
          {displayText}
        </span>
      </div>
      {tooltipPos && createPortal(
        <div style={{
          position: 'fixed',
          left: tooltipPos.x,
          top: tooltipPos.y - 6,
          transform: 'translate(-50%, -100%)',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 'small',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          {text}
        </div>,
        document.body
      )}
    </>
  )
}
