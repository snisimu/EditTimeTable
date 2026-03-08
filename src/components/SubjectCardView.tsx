import { useRef, useLayoutEffect, useState } from 'react'

const MIN_SCALE_X = 0.65

export const SubjectCardView: React.FC<{
  text: string;
  color?: string;
}> = ({ text, color }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [scaleX, setScaleX] = useState(1)

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return
    const available = container.clientWidth
    const natural = textEl.scrollWidth
    setScaleX(natural > available && natural > 0 ? available / natural : 1)
  }, [text])

  const useEllipsis = scaleX < MIN_SCALE_X

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      <span
        ref={textRef}
        title={useEllipsis ? text : undefined}
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
  )
}
