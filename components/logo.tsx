"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * BieLux wordmark.
 * Renders /bielux-logo.png when present; otherwise falls back to the brand
 * name set in the calligraphic script font so the site never looks broken.
 */
export function Logo({
  className,
  imgClassName,
  fallbackClassName,
}: {
  className?: string
  imgClassName?: string
  fallbackClassName?: string
}) {
  const [imgFailed, setImgFailed] = React.useState(false)

  return (
    <Link
      href="/"
      aria-label="BieLux — home"
      className={cn("inline-flex items-center", className)}
    >
      {imgFailed ? (
        <span
          className={cn(
            "font-script text-7xl leading-none sm:text-8xl",
            fallbackClassName
          )}
        >
          BieLux
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/bielux-logo.png"
          alt="BieLux"
          onError={() => setImgFailed(true)}
          className={cn("h-20 w-auto sm:h-24", imgClassName)}
        />
      )}
    </Link>
  )
}
