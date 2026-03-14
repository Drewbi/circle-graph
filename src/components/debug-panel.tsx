import { useEffect, useState } from "react"

import { type Transform } from "@/hooks/use-draw-circle"

type Props = {
  transformRef: React.RefObject<Transform | null>
  show: boolean
}

export function DebugPanel({ transformRef, show }: Props) {
  const [transform, setTransform] = useState<Transform | null>(null)

  useEffect(() => {
    if (!show) { setTransform(null); return }
    let raf: number
    const loop = () => {
      setTransform({ ...transformRef.current! })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [show, transformRef])

  if (!transform) return null

  return (
    <div className="absolute bottom-3 right-3 rounded-none bg-popover px-3 py-2 font-mono text-xs text-popover-foreground ring-1 ring-foreground/10">
      <div>zoom &nbsp;{transform.scale.toFixed(3)}</div>
      <div>pan x &nbsp;{transform.x.toFixed(1)}</div>
      <div>pan y &nbsp;{transform.y.toFixed(1)}</div>
    </div>
  )
}
