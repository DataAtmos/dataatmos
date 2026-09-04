import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils/common"

export function PageLoader({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-1 items-center justify-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Spinner />
      <span>{text}</span>
    </div>
  )
}
