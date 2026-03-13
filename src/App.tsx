import { useMemo, useState } from "react"
import { MinusIcon, MoonIcon, PlusIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { CircleCanvas } from "@/components/circle-canvas"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { computeCircleCells } from "@/lib/circle"
import type { RenderConfig } from "@/lib/render"

const RENDER_CONFIG: RenderConfig = { cellSize: 16, padding: 2 }

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  const set = (next: number) => onChange(Math.min(Math.max(next, min), max))

  return (
    <Field orientation="horizontal">
      <FieldLabel>{label}</FieldLabel>
      <ButtonGroup>
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => set(parseInt(e.target.value, 10))}
          className="w-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button variant="outline" size="icon" onClick={() => set(value - 1)}>
          <MinusIcon />
        </Button>
        <Button variant="outline" size="icon" onClick={() => set(value + 1)}>
          <PlusIcon />
        </Button>
      </ButtonGroup>
    </Field>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export default function App() {
  const [diameter, setDiameter] = useState(20)
  const [thickness, setThickness] = useState(1)

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
            min={1}
            max={maxThickness}
            onChange={setThickness}
          />
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-hidden">
        <CircleCanvas cells={cells} diameter={diameter} render={RENDER_CONFIG} />
      </main>
    </div>
  )
}
