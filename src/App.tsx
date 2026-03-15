import { useEffect, useMemo, useState } from "react"
import { SlidersHorizontalIcon } from "lucide-react"

import { CircleCanvas } from "@/components/circle-canvas"
import { DisplaySettingsContent, SettingsPopover } from "@/components/display-settings"
import { NumberField } from "@/components/number-field"
import type { GridStyle } from "@/hooks/use-draw-circle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { computeCircleCells } from "@/lib/circle"
import type { RenderConfig } from "@/lib/render"

const RENDER_CONFIG: RenderConfig = { cellSize: 16, padding: 2 }

export default function App() {
  const [diameter, setDiameter] = useState(20)
  const [thickness, setThickness] = useState(1)
  const [gridStyle, setGridStyle] = useState<GridStyle>(
    () => (localStorage.getItem("gridStyle") as GridStyle) ?? "dots"
  )
  const [algorithm, setAlgorithm] = useState<"distance" | "midpoint">("distance")
  const [showDebug, setShowDebug] = useState(false)
  const [showCircleOverlay, setShowCircleOverlay] = useState(false)

  useEffect(() => { localStorage.setItem("gridStyle", gridStyle) }, [gridStyle])

  const maxThickness = Math.ceil(diameter / 2)
  const clampedThickness = Math.min(thickness, maxThickness)

  const cells = useMemo(
    () => computeCircleCells({ diameter, thickness: clampedThickness, algorithm }),
    [diameter, clampedThickness, algorithm]
  )

  const controls = (
    <>
      <NumberField
        label="Diameter"
        value={diameter}
        min={2}
        max={200}
        onChange={setDiameter}
      />
      <NumberField
        label="Thickness"
        value={clampedThickness}
        min={0}
        max={maxThickness}
        step={(v, dir) => (dir === "down" ? v <= 1 : v < 1) ? 0.1 : 1}
        onChange={setThickness}
      />
    </>
  )

  const displaySettingsProps = {
    gridStyle,
    onGridStyleChange: setGridStyle,
    algorithm,
    onAlgorithmChange: setAlgorithm,
    showDebug,
    onShowDebugChange: setShowDebug,
    showCircleOverlay,
    onShowCircleOverlayChange: setShowCircleOverlay,
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="hidden h-12 shrink-0 items-center gap-3 border-b px-4 sm:flex justify-between">
        <span className="shrink-0 text-sm font-semibold">Circle Graph</span>
        <div className="flex items-center gap-4">
          {controls}
        </div>
        <SettingsPopover {...displaySettingsProps} />
      </header>
      <main className="flex-1 overflow-hidden">
        <CircleCanvas cells={cells} diameter={diameter} thickness={clampedThickness} render={RENDER_CONFIG} gridStyle={gridStyle} showDebug={showDebug} showCircleOverlay={showCircleOverlay} />
      </main>

      {/* Mobile bottom bar */}
      <div className="flex shrink-0 items-center gap-2 border-t bg-background px-3 py-2 sm:hidden">
        <div className="flex flex-1 items-center justify-around">
          {controls}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <SlidersHorizontalIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-4 pt-2">
              {controls}
              <Separator />
              <DisplaySettingsContent {...displaySettingsProps} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
