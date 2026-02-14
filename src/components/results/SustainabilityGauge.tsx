import { useEffect, useRef, useState } from 'react'
import type { ScoreBand } from '@/types/scoring'
import { getBandColor, getBandLabel } from '@/services/scoring/scoreEngine'

interface Props {
  score: number
  band: ScoreBand
  size?: number
  animate?: boolean
}

const BAND_SEGMENTS = [
  { band: 'avoid' as ScoreBand, start: 0, end: 25, color: '#ef4444' },
  { band: 'think' as ScoreBand, start: 25, end: 50, color: '#b97f5f' },
  { band: 'good' as ScoreBand, start: 50, end: 75, color: '#80b8a2' },
  { band: 'best' as ScoreBand, start: 75, end: 100, color: '#106c72' },
]

function scoreToAngle(score: number): number {
  return -180 + (score / 100) * 180
}

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToXY(startAngle, r, cx, cy)
  const end = polarToXY(endAngle, r, cx, cy)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export function SustainabilityGauge({ score, band, size = 220, animate = true }: Props) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const shouldAnimate = animate && !prefersReducedMotion
  const [displayScore, setDisplayScore] = useState(shouldAnimate ? 0 : score)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayScore(score)
      return
    }

    const start = performance.now()
    const duration = 800
    const from = 0
    const to = score

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayScore(Math.round(from + (to - from) * eased))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      }
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score, shouldAnimate])

  const cx = size / 2
  const cy = size * 0.58
  const r = size * 0.38
  const strokeWidth = size * 0.085
  const color = getBandColor(band)
  const needleAngle = scoreToAngle(displayScore)

  // Needle tip and base
  const needleTip = polarToXY(needleAngle - 90, r - 4, cx, cy)
  const needleLeft = polarToXY(needleAngle - 90 + 90, strokeWidth * 0.18, cx, cy)
  const needleRight = polarToXY(needleAngle - 90 - 90, strokeWidth * 0.18, cx, cy)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size * 0.65}
        viewBox={`0 0 ${size} ${size * 0.65}`}
        aria-label={`Puntuación de sostenibilidad: ${displayScore}`}
        role="img"
      >
        {/* Track arcs */}
        {BAND_SEGMENTS.map((seg) => (
          <path
            key={seg.band}
            d={describeArc(cx, cy, r, -180 + (seg.start / 100) * 180, -180 + (seg.end / 100) * 180)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={0.25}
          />
        ))}

        {/* Score fill arc */}
        <path
          d={describeArc(cx, cy, r, -180, -180 + (displayScore / 100) * 180)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleLeft.x},${needleLeft.y} ${needleRight.x},${needleRight.y}`}
          fill={color}
          opacity={0.9}
        />

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={strokeWidth * 0.4} fill={color} />

        {/* Score text */}
        <text
          x={cx}
          y={cy - r * 0.35}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold"
          style={{ fontSize: size * 0.18, fill: color, fontFamily: 'Inter, sans-serif' }}
        >
          {displayScore}
        </text>

        {/* Band label */}
        <text
          x={cx}
          y={cy - r * 0.08}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: size * 0.07, fill: '#6b7280', fontFamily: 'Inter, sans-serif' }}
        >
          {getBandLabel(band, 'es')}
        </text>
      </svg>
    </div>
  )
}
