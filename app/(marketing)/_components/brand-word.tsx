import Image from "next/image"
import { cn } from "@/lib/utils/common"

function BrandMark({
  src,
  srcDark,
  inset = false,
  size = "default",
}: {
  src: string
  srcDark?: string
  inset?: boolean
  size?: "default" | "sm"
}) {
  const imageClass = cn("col-start-1 row-start-1 size-full object-contain", inset && "p-[12%]")

  return (
    <span
      className={cn("marketing-brand-mark", size === "sm" && "marketing-brand-mark-sm")}
      aria-hidden="true"
    >
      <span className="inline-grid size-full">
        <Image
          src={src}
          alt=""
          width={20}
          height={20}
          unoptimized
          className={cn(imageClass, srcDark && "dark:hidden")}
        />
        {srcDark ? (
          <Image
            src={srcDark}
            alt=""
            width={20}
            height={20}
            unoptimized
            className={cn(imageClass, "hidden dark:block")}
          />
        ) : null}
      </span>
    </span>
  )
}

function BrandWord({
  src,
  srcDark,
  label,
  inset,
  size,
}: {
  src: string
  srcDark?: string
  label: string
  inset?: boolean
  size?: "default" | "sm"
}) {
  return (
    <span className="marketing-brand-word">
      <BrandMark src={src} srcDark={srcDark} inset={inset} size={size} />
      {label}
    </span>
  )
}

export function PostgresWord() {
  return <BrandWord src="/brands/postgresql.svg" label="PostgreSQL" />
}

export function AwsWord() {
  return <BrandWord src="/brands/aws.svg" srcDark="/brands/aws-white.svg" label="AWS" inset />
}

export function ClickHouseWord() {
  return (
    <BrandWord
      src="/brands/clickhouse.svg"
      srcDark="/brands/clickhouse-yellow.svg"
      label="ClickHouse"
      inset
    />
  )
}

export function UsEast1Word() {
  return <BrandWord src="/brands/flag-us.svg" label="us-east-1" size="sm" />
}

export function ApSouth2Word() {
  return <BrandWord src="/brands/flag-in.svg" label="ap-south-2" size="sm" />
}
