import Image from "next/image"
import { cn } from "@/lib/utils/common"

function BrandMark({
  src,
  srcDark,
  inset = false,
}: {
  src: string
  srcDark?: string
  inset?: boolean
}) {
  const imageClass = cn("col-start-1 row-start-1 size-full object-contain", inset && "p-[12%]")

  return (
    <span className="marketing-brand-mark" aria-hidden="true">
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
}: {
  src: string
  srcDark?: string
  label: string
  inset?: boolean
}) {
  return (
    <span className="marketing-brand-word">
      <BrandMark src={src} srcDark={srcDark} inset={inset} />
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
