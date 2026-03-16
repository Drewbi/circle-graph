import { CircleIcon, Dot, Grid2X2, MoonIcon, ScanEyeIcon, SlidersHorizontalIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import type { GridStyle } from "@/hooks/use-draw-circle"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type DisplaySettingsProps = {
  gridStyle: GridStyle
  onGridStyleChange: (style: GridStyle) => void
  showDebug: boolean
  onShowDebugChange: (show: boolean) => void
  showCircleOverlay: boolean
  onShowCircleOverlayChange: (show: boolean) => void
}

export function DisplaySettingsContent({
  gridStyle,
  onGridStyleChange,
  showDebug,
  onShowDebugChange,
  showCircleOverlay,
  onShowCircleOverlayChange,
}: DisplaySettingsProps) {
  const { theme, setTheme } = useTheme()
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme

  return (
    <>
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
    </>
  )
}

export function SettingsPopover(props: DisplaySettingsProps) {
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
        <DisplaySettingsContent {...props} />
      </PopoverContent>
    </Popover>
  )
}
