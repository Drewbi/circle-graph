import { useEffect, useRef } from "react"

export function useResizeCanvas(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: () => void,
  onInit: (width: number, height: number) => void,
) {
  const onInitRef = useRef(onInit)
  onInitRef.current = onInit

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    let initialized = false

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      canvas.width = width
      canvas.height = height

      if (!initialized) {
        onInitRef.current(width, height)
        initialized = true
      }

      draw()
    })

    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [wrapperRef, canvasRef, draw])
}
