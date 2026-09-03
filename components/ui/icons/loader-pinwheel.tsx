"use client"

import type { Transition, Variants } from "motion/react"
import { motion, useAnimation } from "motion/react"
import type React from "react"
import type { HTMLAttributes } from "react"
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react"
import { cn } from "@/lib/utils/common"

export interface LoaderPinwheelIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface LoaderPinwheelIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const gVariants: Variants = {
  normal: {
    rotate: 360,
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      duration: 1,
      ease: "linear",
    },
  },
  animate: {
    rotate: 360,
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      duration: 0.8,
      ease: "linear",
    },
  },
}

const defaultTransition: Transition = {
  type: "spring",
  stiffness: 50,
  damping: 10,
}

const LoaderPinwheelIcon = forwardRef<LoaderPinwheelIconHandle, LoaderPinwheelIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 20, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      }
    })

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start("animate")
        } else {
          onMouseEnter?.(e)
        }
      },
      [controls, onMouseEnter]
    )

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start("normal")
        } else {
          onMouseLeave?.(e)
        }
      },
      [controls, onMouseLeave]
    )

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-hidden="true"
        {...props}
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.g
            transition={defaultTransition}
            variants={gVariants}
            animate="normal"
            initial="normal"
          >
            <circle cx="12" cy="6" r="2" />
            <circle cx="18" cy="12" r="2" opacity="0.7" />
            <circle cx="12" cy="18" r="2" opacity="0.4" />
            <circle cx="6" cy="12" r="2" opacity="0.1" />
          </motion.g>
        </svg>
      </div>
    )
  }
)

LoaderPinwheelIcon.displayName = "LoaderPinwheelIcon"

export { LoaderPinwheelIcon }
