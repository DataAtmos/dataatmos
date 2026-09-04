"use client"

import { Slot } from "@radix-ui/react-slot"
import {
  type ComponentProps,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils/common"

type DoubleChevronProps = {
  index: number
  dotColor: string
}

function DoubleChevron({ index, dotColor }: DoubleChevronProps) {
  const base = index * 0.12
  const dots = [
    { cx: 2, cy: 2, d: 0 },
    { cx: 5, cy: 5, d: 0.05 },
    { cx: 8, cy: 8, d: 0.1 },
    { cx: 5, cy: 11, d: 0.15 },
    { cx: 2, cy: 14, d: 0.2 },
    { cx: 6, cy: 2, d: 0.05 },
    { cx: 9, cy: 5, d: 0.1 },
    { cx: 12, cy: 8, d: 0.15 },
    { cx: 9, cy: 11, d: 0.2 },
    { cx: 6, cy: 14, d: 0.25 },
  ]

  return (
    <svg
      width="11"
      height="12"
      viewBox="0 0 14 16"
      aria-hidden="true"
      focusable="false"
      className="shrink-0 overflow-visible"
    >
      <g fill={dotColor}>
        {dots.map(point => (
          <circle
            key={`${point.cx}-${point.cy}-${point.d}`}
            cx={point.cx}
            cy={point.cy}
            r="1"
            className="bd-dot"
            style={{ animationDelay: `${base + point.d}s` }}
          />
        ))}
      </g>
    </svg>
  )
}

type AntiMetalButtonProps = ComponentProps<"button"> & {
  asChild?: boolean
  label?: ReactNode
  accentFrom?: string
  accentTo?: string
  dotColor?: string
}

export const AntiMetalButton = forwardRef<HTMLButtonElement, AntiMetalButtonProps>(
  (
    {
      className,
      children,
      label,
      asChild = false,
      accentFrom = "#66b3ff",
      accentTo = "#1f6feb",
      dotColor = "#ffffff",
      ...props
    },
    ref
  ) => {
    const content = label ?? (asChild ? undefined : children) ?? "Book a demo"
    const classes = cn(
      "group/btn relative inline-flex h-8 min-h-8 shrink-0 items-center overflow-hidden rounded-lg transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-9 sm:min-h-9",
      "bg-[linear-gradient(180deg,#1a1a1a_0%,#0a0a0a_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.18)]",
      "dark:bg-[linear-gradient(180deg,#ffffff_0%,#ededed_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.35)]",
      className
    )
    const internals = (
      <>
        <style>{`
          @keyframes bd-dot-wave {
            0%, 70%, 100% { opacity: 0.25; transform: scale(0.85); }
            35% { opacity: 1; transform: scale(1); }
          }
          .bd-dot {
            transform-box: fill-box;
            transform-origin: center;
            animation: bd-dot-wave 1.4s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .bd-dot { animation: none; opacity: 1; }
          }
        `}</style>

        <span
          aria-hidden="true"
          className="invisible inline-flex items-center whitespace-nowrap pl-9 pr-2.5 text-[12px] font-medium leading-none tracking-tight sm:pl-10 sm:pr-3 sm:text-[13px]"
        >
          {content}
        </span>

        <span className="absolute inset-y-0 right-2.5 flex items-center whitespace-nowrap text-[12px] font-medium leading-none tracking-tight text-white sm:right-3 sm:text-[13px] dark:text-[#0a0a0a]">
          {content}
        </span>

        <span
          aria-hidden="true"
          className="absolute bottom-0.5 left-0.5 top-0.5 z-10 flex w-7 items-center justify-start gap-1.5 overflow-hidden rounded-[5px] pl-2 pr-1.5 transition-[width,gap] duration-200 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/btn:w-[calc(100%-0.25rem)] sm:w-8"
          style={{
            background: `linear-gradient(180deg, ${accentFrom} 0%, ${accentTo} 100%)`,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
          }}
        >
          <DoubleChevron index={0} dotColor={dotColor} />
          <DoubleChevron index={1} dotColor={dotColor} />
          <DoubleChevron index={2} dotColor={dotColor} />
          <DoubleChevron index={3} dotColor={dotColor} />
          <DoubleChevron index={4} dotColor={dotColor} />
        </span>
      </>
    )

    if (asChild) {
      if (!isValidElement(children)) {
        return null
      }

      return (
        <Slot ref={ref} className={classes} {...props}>
          {cloneElement(children as ReactElement<{ children?: ReactNode }>, {
            children: internals,
          })}
        </Slot>
      )
    }

    return (
      <button ref={ref} type="button" className={classes} {...props}>
        {internals}
      </button>
    )
  }
)

AntiMetalButton.displayName = "AntiMetalButton"

export default AntiMetalButton
