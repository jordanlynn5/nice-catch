import { useEffect, useRef, useState } from 'react'
import type { ScoreBand } from '@/types/scoring'
import { getBandColor, getBandLabel } from '@/services/scoring/scoreEngine'

interface Props {
  score: number
  band: ScoreBand
  size?: number
  animate?: boolean
}

// Mediterranean color palette for bands
const MEDITERRANEAN_BANDS = {
  avoid: '#ff6b6b',    // Coral
  think: '#dc6b4a',    // Terracotta
  good: '#6b7c59',     // Olive
  best: '#1e3a5f',     // Navy
}

const BAND_SEGMENTS = [
  { band: 'avoid' as ScoreBand, start: 0, end: 25, color: MEDITERRANEAN_BANDS.avoid },
  { band: 'think' as ScoreBand, start: 25, end: 50, color: MEDITERRANEAN_BANDS.think },
  { band: 'good' as ScoreBand, start: 50, end: 75, color: MEDITERRANEAN_BANDS.good },
  { band: 'best' as ScoreBand, start: 75, end: 100, color: MEDITERRANEAN_BANDS.best },
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

export function SustainabilityGauge({ score, band, size = 260, animate = true }: Props) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const shouldAnimate = animate && !prefersReducedMotion
  const [displayScore, setDisplayScore] = useState(shouldAnimate ? 0 : score)
  const [labelVisible, setLabelVisible] = useState(false)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayScore(score)
      setLabelVisible(true)
      return
    }

    const start = performance.now()
    const duration = 1200
    const from = 0
    const to = score

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3.5)
      setDisplayScore(Math.round(from + (to - from) * eased))
      if (progress > 0.7 && !labelVisible) {
        setLabelVisible(true)
      }
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      }
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score, shouldAnimate, labelVisible])

  const cx = size / 2
  const cy = size * 0.58
  const r = size * 0.38
  const strokeWidth = size * 0.08
  const color = MEDITERRANEAN_BANDS[band]
  const needleAngle = scoreToAngle(displayScore)

  const needleTip = polarToXY(needleAngle - 90, r + 8, cx, cy)
  const needleBase1 = polarToXY(needleAngle - 90 + 92, strokeWidth * 0.15, cx, cy)
  const needleBase2 = polarToXY(needleAngle - 90 - 92, strokeWidth * 0.15, cx, cy)

  // ═══════════════════════════════════════════════════════════════
  // MEDITERRANEAN EDITORIAL GAUGE — Refined & Elegant
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Decorative circle backdrop */}
        <div
          className="absolute -inset-8 rounded-full opacity-5"
          style={{
            background: `radial-gradient(circle, ${color}30, transparent 70%)`
          }}
        />

        <svg
          width={size}
          height={size * 0.7}
          viewBox={`0 0 ${size} ${size * 0.7}`}
          aria-label={`Puntuación de sostenibilidad: ${displayScore}`}
          role="img"
        >
          {/* Background arcs — subtle and refined */}
          {BAND_SEGMENTS.map((seg) => (
            <path
              key={seg.band}
              d={describeArc(cx, cy, r, -180 + (seg.start / 100) * 180, -180 + (seg.end / 100) * 180)}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={0.12}
            />
          ))}

          {/* Active score arc — elegant with gradient */}
          <defs>
            <linearGradient id={`scoreGradient-${band}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <path
            d={describeArc(cx, cy, r, -180, -180 + (displayScore / 100) * 180)}
            fill="none"
            stroke={`url(#scoreGradient-${band})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Refined needle — slender and elegant */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.9}
          />

          {/* Center hub — double circle */}
          <circle cx={cx} cy={cy} r={strokeWidth * 0.5} fill="white" stroke={color} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={strokeWidth * 0.25} fill={color} />

          {/* Score display — editorial typography */}
          <text
            x={cx}
            y={cy - r * 0.4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-display"
            style={{
              fontSize: size * 0.22,
              fill: color,
              fontStyle: 'italic',
              fontWeight: '400'
            }}
          >
            {displayScore}
          </text>

          <text
            x={cx}
            y={cy - r * 0.15}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: size * 0.05,
              fill: color,
              opacity: 0.5,
              letterSpacing: '0.15em'
            }}
          >
            POINTS
          </text>
        </svg>

        {/* Band label — clean and elegant */}
        <div
          className={`mt-6 text-center transition-all duration-500 ${
            labelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div
            className="inline-block px-8 py-3 rounded-xl font-serif text-lg"
            style={{
              background: `linear-gradient(135deg, ${color}15, ${color}08)`,
              color: color,
              border: `2px solid ${color}25`
            }}
          >
            {getBandLabel(band, 'es')}
          </div>
        </div>
      </div>
    </div>
  )
}
