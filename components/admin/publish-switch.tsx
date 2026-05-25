"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setProductPublished } from "@/app/admin/(panel)/products/actions"
import { Switch } from "@/components/ui/switch"

export function PublishSwitch({
  id,
  checked,
}: {
  id: string
  checked: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Switch
      checked={checked}
      disabled={pending}
      onCheckedChange={(next) =>
        startTransition(async () => {
          const res = await setProductPublished(id, next)
          if (res.ok) router.refresh()
          else toast.error(res.error)
        })
      }
    />
  )
}
