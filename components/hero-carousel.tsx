"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type Slide = {
  image: string
  title: string
}

const slides: Slide[] = [
  {
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2000&q=80",
    title: "Luxury, in bloom",
  },
  {
    image:
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=2000&q=80",
    title: "Endless Summer",
  },
]

export function HeroCarousel() {
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      6000
    )
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative h-[50vh] min-h-[300px] w-full overflow-hidden bg-muted sm:h-[40vh]">
      {slides.map((slide, i) => (
        <div
          key={slide.title}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === current ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== current}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover object-center"
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <h1 className="font-script text-5xl text-white drop-shadow-md sm:text-6xl md:text-7xl">
              {slide.title}
            </h1>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-6 right-6 z-10 flex gap-2.5">
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={cn(
              "size-2.5 rounded-full border border-white/80 transition-colors",
              i === current ? "bg-white" : "bg-transparent hover:bg-white/50"
            )}
          />
        ))}
      </div>

      {/* Scroll-down chevron */}
      <a
        href="#shop"
        aria-label="Scroll to products"
        className="absolute bottom-0 left-1/2 z-10 flex size-12 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-background text-foreground shadow-md transition-transform hover:translate-y-[55%]"
      >
        <ChevronDownIcon className="size-5" />
      </a>
    </section>
  )
}
