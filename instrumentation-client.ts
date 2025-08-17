import posthog from "posthog-js"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: "https://us.posthog.com",
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
  capture_performance: false,
  debug: process.env.NODE_ENV === "development",
  loaded: posthog => {
    if (process.env.NODE_ENV === "development") posthog.debug()
  },
})
