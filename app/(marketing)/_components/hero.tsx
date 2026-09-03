"use client"

import { useAuth } from "@clerk/nextjs"
import { Dithering } from "@paper-design/shaders-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { HeroTitle } from "./hero-title"
import "./hero.css"

const GITHUB_URL = "https://github.com/DataAtmos"
const X_URL = "https://x.com/dataatmos"

const socialLinkClass =
  "text-sm font-mono text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"

export function Hero() {
  const { resolvedTheme } = useTheme()
  const { isSignedIn } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = !mounted || resolvedTheme !== "light"
  const dashboardHref = mounted && isSignedIn ? "/dashboard" : "/auth"

  return (
    <div className="relative min-h-full h-full overflow-y-auto lg:overflow-hidden scrollbar-none flex flex-col lg:flex-row bg-background text-foreground">
      <div className="w-full h-[10vh] min-h-[72px] shrink-0 lg:h-full lg:min-h-0 lg:w-1/2 relative order-1 lg:order-2">
        <Dithering
          style={{ height: "100%", width: "100%" }}
          colorBack={isDark ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
          colorFront="hsl(220, 100%, 70%)"
          shape="warp"
          type="4x4"
          size={2}
          offsetX={0}
          offsetY={0}
          scale={1.15}
          rotation={0}
          speed={0.22}
        />
      </div>

      <div className="w-full shrink-0 lg:shrink lg:w-1/2 lg:h-full lg:overflow-y-auto scrollbar-none order-2 lg:order-1 px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="marketing-copy marketing-landing-screen flex flex-col lg:min-h-full">
          <header className="flex items-center justify-between shrink-0">
            <Link href="/" aria-label="Data Atmos home">
              <Logo className="h-8 w-8 sm:h-9 sm:w-9" />
            </Link>
            <Button size="lg" asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          </header>

          <div className="marketing-hero-stage">
            <HeroTitle />
          </div>

          <div className="marketing-landing-blurb marketing-measure shrink-0 pb-2">
            <p>
              Managed databases, real-time analytics, data connectors and AI workloads in one place.
              Run it inside your own AWS account, or use our hosted service. Fully managed by us
              either way.
            </p>
            <p>
              We are building. Our first release will support PostgreSQL on AWS in us-east-1 and
              ap-south-2, with analytics powered by ClickHouse. More databases, clouds and regions
              will follow.
            </p>
          </div>
        </div>

        <div className="marketing-copy marketing-measure">
          <section>
            <h2>What are we building?</h2>
            <p>
              A platform that combines managed databases and analytics, so you do not need separate
              services for databases, CDC, storage, warehousing and BI.
            </p>
            <p>
              You enable analytics on the tables you choose. Data Atmos synchronizes them
              automatically and lets you query them with SQL, on separate compute from your
              application workload.
            </p>
            <p>
              The transactional engine handles application workloads, the analytical engine handles
              queries, and object storage holds historical data. Each layer scales on its own, so
              you pay only for what each workload uses.
            </p>
            <p>
              Data is stored in open formats such as Iceberg and Parquet, inside your own cloud
              account. It follows a simple medallion architecture: Bronze for raw synchronized data,
              Silver for cleaned and transformed data, Gold for business ready datasets. Any
              compatible query engine, BI tool, notebook or AI workload can read it directly.
            </p>
            <p>
              We use native engines, not forks or emulations. Infrastructure runs in your account or
              on our hosted service, while provisioning, monitoring, maintenance and recovery are
              managed by us. Compute and storage are metered separately, so pricing stays
              transparent.
            </p>
          </section>

          <section>
            <h2>Why are we building this?</h2>
            <p>
              Analytics does not belong on production, so teams build a pipeline instead. A CDC
              service, object storage, a warehouse, an orchestrator, a BI tool, and the code that
              connects them.
            </p>
            <p>
              That stack has to be run by someone. Connectors break on schema changes. Syncs fall
              behind. Costs are spread across five vendors and hard to attribute. Small teams end up
              spending engineering time on infrastructure rather than on their product.
            </p>
            <p>
              We are building one platform that handles both workloads, keeps the data in open
              formats in your own cloud account, and removes the pipeline from the equation.
            </p>
          </section>
        </div>

        <div className="flex items-center justify-between gap-4 mt-14">
          <div className="flex items-center gap-5">
            <Link href="/auth" className="text-sm font-mono text-primary hover:text-primary/80">
              Start for Free
            </Link>
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
            >
              github.com/DataAtmos
            </Link>
            <Link
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClass}
            >
              x.com/dataatmos
            </Link>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}
