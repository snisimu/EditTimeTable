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
  const [scaleX, setScaleX] = useState(1)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const timerRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return
    const available = container.clientWidth
    const natural = textEl.scrollWidth
    setScaleX(natural > available && natural > 0 ? available / natural : 1)
  }, [text])

  const useEllipsis = scaleX < MIN_SCALE_X

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!useEllipsis) return
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
          style={useEllipsis ? {
            fontSize: 'small',
            color,
            display: 'block',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center',
          } : {
            whiteSpace: 'nowrap',
            fontSize: 'small',
            color,
            display: 'inline-block',
            transformOrigin: 'center',
            transform: `scaleX(${scaleX})`,
          }}
        >
          {text}
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
