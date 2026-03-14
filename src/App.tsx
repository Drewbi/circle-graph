import { useEffect, useMemo, useRef, useState } from "react"
import { CircleIcon, CrosshairIcon, Dot, Grid2X2, LayoutGridIcon, MinusIcon, MoonIcon, PlusIcon, ScanEyeIcon, SlidersHorizontalIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { CircleCanvas } from "@/components/circle-canvas"
import type { GridStyle } from "@/hooks/use-draw-circle"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { computeCircleCells } from "@/lib/circle"
import type { RenderConfig } from "@/lib/render"

const RENDER_CONFIG: RenderConfig = { cellSize: 16, padding: 2 }

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: (value: number, dir: "up" | "down") => number
  onChange: (value: number) => void
}

function NumberField({
  label,
  value,
  min,
  max,
  step = () => 1,
  onChange,
}: NumberFieldProps) {
  const set = (next: number) =>
    onChange(Math.min(Math.max(parseFloat(next.toFixed(10)), min), max))

  const valueRef = useRef(value)
  valueRef.current = value

  const holdRef = useRef<{ timeout: ReturnType<typeof setTimeout>; interval?: ReturnType<typeof setInterval> } | null>(null)

  const startHold = (dir: "up" | "down") => {
    const tick = () => {
      const v = valueRef.current
      set(dir === "up" ? v + step(v, "up") : v - step(v, "down"))
    }
    tick()
    holdRef.current = {
      timeout: setTimeout(() => {
        holdRef.current!.interval = setInterval(tick, 50)
      }, 200),
    }
  }

  const stopHold = () => {
    if (!holdRef.current) return
    clearTimeout(holdRef.current.timeout)
    clearInterval(holdRef.current.interval)
    holdRef.current = null
  }

  return (
    <Field orientation="horizontal">
      <FieldLabel>{label}</FieldLabel>
      <ButtonGroup>
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => set(parseFloat(e.target.value))}
          className="w-16 text-base sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          variant="outline"
          size="icon"
          onPointerDown={() => startHold("down")}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
        >
          <MinusIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onPointerDown={() => startHold("up")}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
        >
          <PlusIcon />
        </Button>
      </ButtonGroup>
    </Field>
  )
}

function SettingsPopover({ gridStyle, onGridStyleChange, algorithm, onAlgorithmChange, showDebug, onShowDebugChange, showCircleOverlay, onShowCircleOverlayChange }: {
  gridStyle: GridStyle
  onGridStyleChange: (style: GridStyle) => void
  algorithm: "distance" | "midpoint"
  onAlgorithmChange: (algorithm: "distance" | "midpoint") => void
  showDebug: boolean
  onShowDebugChange: (show: boolean) => void
  showCircleOverlay: boolean
  onShowCircleOverlayChange: (show: boolean) => void
}) {
  const { theme, setTheme } = useTheme()
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Display settings">
          <SlidersHorizontalIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <PopoverHeader>
          <PopoverTitle>Display</PopoverTitle>
        </PopoverHeader>
        <Separator />
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={resolvedTheme}
            onValueChange={(value) => value && setTheme(value as "light" | "dark")}
          >
            <ToggleGroupItem value="light" aria-label="Light">
              <SunIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark">
              <MoonIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Grid</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={gridStyle}
            onValueChange={(value) => value && onGridStyleChange(value as GridStyle)}
          >
            <ToggleGroupItem value="dots" aria-label="Dots">
              <Dot />
            </ToggleGroupItem>
            <ToggleGroupItem value="lines" aria-label="Lines">
              <Grid2X2 />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Circle</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={algorithm}
            onValueChange={(value) => value && onAlgorithmChange(value as "distance" | "midpoint")}
          >
            <ToggleGroupItem value="distance" aria-label="Distance algorithm">
              <LayoutGridIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="midpoint" aria-label="Midpoint algorithm">
              <CrosshairIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Debug</span>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={[showDebug ? "debug" : "", showCircleOverlay ? "circle" : ""].filter(Boolean)}
            onValueChange={(values) => {
              onShowDebugChange(values.includes("debug"))
              onShowCircleOverlayChange(values.includes("circle"))
            }}
          >
            <ToggleGroupItem value="debug" aria-label="Show debug info">
              <ScanEyeIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="circle" aria-label="Show circle overlay">
              <CircleIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  )
}

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

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="hidden h-12 shrink-0 items-center gap-3 border-b px-4 sm:flex justify-between">
        <span className="shrink-0 text-sm font-semibold">Circle Graph</span>
        <div className="flex items-center gap-4">
          {controls}
        </div>
        <SettingsPopover
          gridStyle={gridStyle}
          onGridStyleChange={setGridStyle}
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          showDebug={showDebug}
          onShowDebugChange={setShowDebug}
          showCircleOverlay={showCircleOverlay}
          onShowCircleOverlayChange={setShowCircleOverlay}
        />
      </header>
      <main className="flex-1 overflow-hidden">
        <CircleCanvas cells={cells} diameter={diameter} thickness={clampedThickness} render={RENDER_CONFIG} gridStyle={gridStyle} showDebug={showDebug} showCircleOverlay={showCircleOverlay} />
      </main>

      {/* Mobile bottom bar */}
      <div className="flex items-center shrink-0 border-t bg-background sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              aria-label="Circle settings"
              className="flex min-w-0 flex-1 flex-col items-center gap-2 py-3 pl-4"
            >
              <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-6 text-sm">
                <span><span className="text-muted-foreground">Diameter </span>{diameter}</span>
                <span><span className="text-muted-foreground">Thickness </span>{clampedThickness}</span>
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader>
              <SheetTitle>Circle Graph</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-4 pt-2">
              {controls}
            </div>
          </SheetContent>
        </Sheet>
        <SettingsPopover
          gridStyle={gridStyle}
          onGridStyleChange={setGridStyle}
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          showDebug={showDebug}
          onShowDebugChange={setShowDebug}
          showCircleOverlay={showCircleOverlay}
          onShowCircleOverlayChange={setShowCircleOverlay}
        />
      </div>
    </div>
  )
}
