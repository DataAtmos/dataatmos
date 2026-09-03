import Image from "next/image"
import { cn } from "@/lib/utils/common"

interface LogoProps {
  width?: number
  height?: number
  className?: string
  alt?: string
}

export function Logo({
  width = 24,
  height = 24,
  className = "h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-200 group-hover:scale-110",
  alt = "Data Atmos",
}: LogoProps) {
  return (
    <span className="inline-grid">
      <Image
        src="/logo.svg"
        alt={alt}
        width={width}
        height={height}
        className={cn("col-start-1 row-start-1 dark:hidden", className)}
      />
      <Image
        src="/logo-white.svg"
        alt=""
        width={width}
        height={height}
        className={cn("col-start-1 row-start-1 hidden dark:block", className)}
      />
    </span>
  )
}
