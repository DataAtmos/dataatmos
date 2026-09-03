"use client"

import { type CSSProperties, useEffect, useState } from "react"

const phrases = [
  "all your data needs.",
  "managed databases.",
  "real-time analytics.",
  "data connectors.",
  "AI workloads.",
]

function getOffset(item: number, active: number) {
  let offset = item - active
  const half = phrases.length / 2

  if (offset > half) offset -= phrases.length
  if (offset < -half) offset += phrases.length

  return offset
}

export function HeroTitle() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const compact = window.matchMedia("(width < 64rem)")
    let timer = 0

    const stop = () => {
      if (timer) {
        window.clearInterval(timer)
        timer = 0
      }
    }

    const start = () => {
      stop()
      if (motion.matches || compact.matches) {
        setActive(0)
        return
      }

      timer = window.setInterval(() => {
        setActive(current => (current + 1) % phrases.length)
      }, 1500)
    }

    start()
    motion.addEventListener("change", start)
    compact.addEventListener("change", start)

    return () => {
      stop()
      motion.removeEventListener("change", start)
      compact.removeEventListener("change", start)
    }
  }, [])

  return (
    <h1 className="marketing-hero-title">
      Data Atmos is a single platform for{" "}
      <span className="marketing-word-slot">
        <span className="marketing-word-sizer" aria-hidden="true">
          {phrases[active]}
        </span>

        <span className="marketing-selected-word" aria-live="polite">
          {phrases[active]}
        </span>

        <span className="marketing-wheel" aria-hidden="true">
          <span className="marketing-stage">
            <span className="marketing-drum">
              {phrases.map((phrase, index) => {
                const offset = getOffset(index, active)

                return (
                  <span
                    className="marketing-wheel-row"
                    key={phrase}
                    style={{ "--offset": offset } as CSSProperties}
                  >
                    {phrase}
                  </span>
                )
              })}
            </span>
          </span>
        </span>
      </span>
    </h1>
  )
}
