import { useRef } from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: (value: number, dir: "up" | "down") => number
  onChange: (value: number) => void
  compact?: boolean
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = () => 1,
  onChange,
  compact = false,
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

  if (compact) {
    return (
      <Field orientation="vertical">
        <FieldLabel className="text-xs">{label}</FieldLabel>
        <ButtonGroup>
          <Button
            variant="outline"
            size="icon-sm"
            onPointerDown={() => startHold("down")}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
          >
            <MinusIcon />
          </Button>
          <Input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => set(parseFloat(e.target.value))}
            className="w-12 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon-sm"
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
