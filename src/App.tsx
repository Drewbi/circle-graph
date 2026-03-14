import { useMemo, useState } from "react"
import { Dot, Grid2X2, MinusIcon, MoonIcon, PlusIcon, ScanEyeIcon, SlidersHorizontalIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { CircleCanvas } from "@/components/circle-canvas"
import type { GridStyle } from "@/hooks/use-draw-circle"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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
          className="w-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button variant="outline" size="icon" onClick={() => set(value - step(value, "down"))}>
          <MinusIcon />
        </Button>
        <Button variant="outline" size="icon" onClick={() => set(value + step(value, "up"))}>
          <PlusIcon />
        </Button>
      </ButtonGroup>
    </Field>
  )
}

function SettingsPopover({ gridStyle, onGridStyleChange, showDebug, onShowDebugChange }: {
  gridStyle: GridStyle
  onGridStyleChange: (style: GridStyle) => void
  showDebug: boolean
  onShowDebugChange: (show: boolean) => void
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
          <span className="text-xs text-muted-foreground">Debug</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={showDebug ? "debug" : ""}
            onValueChange={(value) => onShowDebugChange(value === "debug")}
          >
            <ToggleGroupItem value="debug" aria-label="Show debug info">
              <ScanEyeIcon />
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
  const [gridStyle, setGridStyle] = useState<GridStyle>("dots")
  const [showDebug, setShowDebug] = useState(false)

  const maxThickness = Math.ceil(diameter / 2)
  const clampedThickness = Math.min(thickness, maxThickness)

  const cells = useMemo(
    () => computeCircleCells({ diameter, thickness: clampedThickness }),
    [diameter, clampedThickness]
  )

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-6 border-b px-4">
        <span className="text-sm font-semibold">Circle Graph</span>
        <div className="flex items-center gap-4 mr-auto">
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
        </div>
        <SettingsPopover
          gridStyle={gridStyle}
          onGridStyleChange={setGridStyle}
          showDebug={showDebug}
          onShowDebugChange={setShowDebug}
        />
      </header>
      <main className="flex-1 overflow-hidden">
        <CircleCanvas cells={cells} diameter={diameter} render={RENDER_CONFIG} gridStyle={gridStyle} showDebug={showDebug} />
      </main>
    </div>
  )
}
