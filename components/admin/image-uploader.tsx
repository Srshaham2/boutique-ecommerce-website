"use client"

import { useRef, useState, useTransition } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { uploadProductImage } from "@/app/admin/(panel)/products/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function ImageUploader({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [hint, setHint] = useState<string | null>(null)

  function handleFile(file: File) {
    const formData = new FormData()
    formData.set("file", file)
    startTransition(async () => {
      const res = await uploadProductImage(formData)
      if (res.ok) {
        onChange(res.url)
        setHint(null)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-md border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImagePlus className="size-6" />
            </div>
          )}
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onChange(null)}
                className="gap-1 text-muted-foreground"
              >
                <X className="size-4" /> Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {hint ?? "JPG or PNG, up to 5 MB."}
          </p>
        </div>
      </div>
    </div>
  )
}
