import { useEffect, useRef, useState } from 'react'
import type { ScoreBand } from '@/types/scoring'
import { getBandColor, getBandLabel } from '@/services/scoring/scoreEngine'
import { useI18n } from '@/hooks/useI18n'

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
  const { language } = useI18n()
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const shouldAnimate = animate && !prefersReducedMotion
  const [displayScore, setDisplayScore] = useState(score)
  const [labelVisible, setLabelVisible] = useState(!shouldAnimate)
  const animRef = useRef<number | null>(null)
  const prevScoreRef = useRef<number>(score)
  const initialMountRef = useRef<boolean>(true)

  useEffect(() => {
    // Skip animation if no animation needed or score hasn't changed
    if (!shouldAnimate || prevScoreRef.current === score) {
      setDisplayScore(score)
      setLabelVisible(true)
      prevScoreRef.current = score
      return
    }

    // Determine animation parameters
    const isFirstLoad = initialMountRef.current
    const from = isFirstLoad ? 0 : prevScoreRef.current
    const to = score
    const duration = isFirstLoad ? 1200 : 600 // Faster for subsequent changes

    initialMountRef.current = false
    prevScoreRef.current = score

    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(from + (to - from) * eased))

      if (isFirstLoad && progress > 0.6 && !labelVisible) {
        setLabelVisible(true)
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        setLabelVisible(true)
      }
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score, shouldAnimate])

  const cx = size / 2
  const cy = size * 0.42  // Moved up to prevent clipping
  const r = size * 0.38
  const strokeWidth = size * 0.1
  const color = MEDITERRANEAN_BANDS[band]

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
          height={size * 0.6}
          viewBox={`0 0 ${size} ${size * 0.9}`}
          preserveAspectRatio="xMidYMin meet"
          aria-label={`Puntuación de sostenibilidad: ${displayScore}`}
          role="img"
        >
          {/* Background arcs — subtle and refined with gaps */}
          {BAND_SEGMENTS.map((seg, idx) => {
            const startAngle = -180 + (seg.start / 100) * 180
            const endAngle = -180 + (seg.end / 100) * 180
            // Add small gap between segments (1.5 degrees)
            const gapAdjustStart = idx > 0 ? 0.75 : 0
            const gapAdjustEnd = idx < BAND_SEGMENTS.length - 1 ? -0.75 : 0
            return (
              <path
                key={seg.band}
                d={describeArc(cx, cy, r, startAngle + gapAdjustStart, endAngle + gapAdjustEnd)}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={0.08}
              />
            )
          })}

          {/* Active score arc — bold and prominent */}
          <path
            d={describeArc(cx, cy, r, -180, -180 + (displayScore / 100) * 180)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 1.05}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.15))' }}
          />

          {/* Score display — editorial typography, centered */}
          <text
            x={cx}
            y={cy - r * 0.2}
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
            y={cy + r * 0.2}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: size * 0.05,
              fill: color,
              opacity: 0.6,
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
            {getBandLabel(band, language as 'es' | 'en')}
          </div>
        </div>
      </div>
    </div>
  )
}
