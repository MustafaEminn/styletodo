import { Check, Menu, Plus, Trash2 } from "lucide-react"
import { type ChangeEvent, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Hint } from "@/components/ui/hint"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { TypographyH4 } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import {
  MAX_BACKGROUND_BYTES,
  STORAGE_UNAVAILABLE_MESSAGE,
  STORAGE_WRITE_FAILED_MESSAGE,
  useBackgroundStore,
} from "@/stores/background"
import {
  DEFAULT_OVERLAY_OPACITY,
  DRAWING_THEME_DEFINITIONS,
  MAX_OVERLAY_OPACITY,
  MIN_OVERLAY_OPACITY,
  type DrawingThemeId,
  useDrawingThemeStore,
} from "@/stores/drawingTheme"

type BackgroundTileProps = {
  label: string
  previewUrl?: string
  isActive?: boolean
  isAddTile?: boolean
  isDisabled?: boolean
  onSelect: () => void
  onDelete?: () => void
}

function BackgroundTile({
  label,
  previewUrl,
  isActive = false,
  isAddTile = false,
  isDisabled = false,
  onSelect,
  onDelete,
}: BackgroundTileProps) {
  if (isAddTile) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onSelect}
        className="relative h-20 w-full border-dashed"
        aria-label={label}
        disabled={isDisabled}
      >
        <Plus className="size-5 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={onSelect}
        className={cn(
          "relative h-20 w-full overflow-hidden border-2 p-0 text-left",
          isActive
            ? "border-primary ring-2 ring-primary/30"
            : "border-border hover:border-primary/45"
        )}
        aria-pressed={isActive}
        aria-label={label}
      >
        {previewUrl ? (
          <span
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${previewUrl}")` }}
            aria-hidden="true"
          />
        ) : (
          <span className="absolute inset-0 bg-muted" aria-hidden="true" />
        )}
      </Button>
      {isActive && (
        <span className="pointer-events-none absolute top-2 left-2 z-20 rounded-full bg-primary/90 p-1 text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          className="absolute top-2 right-2 z-20 bg-background/95 hover:bg-background"
          onClick={onDelete}
          aria-label={`Delete ${label}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

export function BurgerMenu() {
  const customBackgrounds = useBackgroundStore((state) => state.customBackgrounds)
  const addCustomBackground = useBackgroundStore(
    (state) => state.addCustomBackground
  )
  const removeCustomBackground = useBackgroundStore(
    (state) => state.removeCustomBackground
  )
  const storageStatus = useBackgroundStore((state) => state.storageStatus)
  const storageErrorMessage = useBackgroundStore(
    (state) => state.storageErrorMessage
  )
  const activeThemeId = useDrawingThemeStore((state) => state.activeThemeId)
  const setActiveTheme = useDrawingThemeStore((state) => state.setActiveTheme)
  const themeVisualStateById = useDrawingThemeStore(
    (state) => state.themeVisualStateById
  )
  const selectDefaultBackgroundForActiveTheme = useDrawingThemeStore(
    (state) => state.selectDefaultBackgroundForActiveTheme
  )
  const selectCustomBackgroundForActiveTheme = useDrawingThemeStore(
    (state) => state.selectCustomBackgroundForActiveTheme
  )
  const setOverlayOpacityForActiveTheme = useDrawingThemeStore(
    (state) => state.setOverlayOpacityForActiveTheme
  )
  const removeCustomBackgroundReference = useDrawingThemeStore(
    (state) => state.removeCustomBackgroundReference
  )
  const [backgroundError, setBackgroundError] = useState<string | null>(null)
  const maxSizeInMb = MAX_BACKGROUND_BYTES / (1024 * 1024)
  const backgroundInputId = useId()
  const backgroundHintId = useId()
  const backgroundErrorId = useId()
  const backgroundInputRef = useRef<HTMLInputElement | null>(null)
  const activeThemeDefinition = DRAWING_THEME_DEFINITIONS[activeThemeId]
  const activeThemeVisualState = themeVisualStateById[activeThemeId]
  const activeBackground = activeThemeVisualState.background
  const overlayOpacity = activeThemeVisualState.overlayOpacity
  const activeCustomBackgroundId =
    activeBackground.type === "custom" ? activeBackground.id : null
  const isUploadDisabled = storageStatus !== "ready"
  const effectiveBackgroundError =
    backgroundError ??
    (storageStatus === "blocked"
      ? storageErrorMessage ?? STORAGE_UNAVAILABLE_MESSAGE
      : null)

  const handleBackgroundChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget
    const file = input.files?.[0]

    if (!file) {
      return
    }

    setBackgroundError(null)

    if (file.size > MAX_BACKGROUND_BYTES) {
      const errorMessage = `Image is too large. Max size is ${maxSizeInMb}MB.`
      setBackgroundError(errorMessage)
      input.value = ""
      return
    }

    try {
      const result = addCustomBackground({
        file,
      })
      const resolvedResult = await result

      if (!resolvedResult.ok) {
        if (resolvedResult.error === "FILE_TOO_LARGE") {
          const errorMessage = `Image is too large. Max size is ${maxSizeInMb}MB.`
          setBackgroundError(errorMessage)
        } else if (resolvedResult.error === "INVALID_IMAGE_FILE") {
          const errorMessage = "Please choose a valid image file."
          setBackgroundError(errorMessage)
        } else if (resolvedResult.error === "STORAGE_WRITE_FAILED") {
          setBackgroundError(storageErrorMessage ?? STORAGE_WRITE_FAILED_MESSAGE)
        } else {
          setBackgroundError(storageErrorMessage ?? STORAGE_UNAVAILABLE_MESSAGE)
        }

        return
      }

      selectCustomBackgroundForActiveTheme(resolvedResult.backgroundId)
      setBackgroundError(null)
    } finally {
      input.value = ""
    }
  }

  const handleAddBackgroundClick = () => {
    if (isUploadDisabled) {
      if (storageStatus === "loading" || storageStatus === "idle") {
        setBackgroundError("Background storage is still loading. Please try again.")
      } else {
        setBackgroundError(storageErrorMessage ?? STORAGE_UNAVAILABLE_MESSAGE)
      }
      return
    }

    backgroundInputRef.current?.click()
  }

  const handleThemeSelect = (themeId: DrawingThemeId) => {
    setActiveTheme(themeId)
  }

  const handleRemoveCustomBackground = async (id: string) => {
    const result = await removeCustomBackground(id)
    if (!result.ok) {
      setBackgroundError(storageErrorMessage ?? STORAGE_WRITE_FAILED_MESSAGE)
      return
    }

    removeCustomBackgroundReference(id)
  }

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-50 border-black/15 bg-white/90 text-black shadow-lg backdrop-blur-md hover:bg-white dark:border-white/35 dark:bg-black/60 dark:text-white dark:hover:bg-black/75"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-4">
          <TypographyH4 className="text-base">Themes</TypographyH4>
          <Field>
            <FieldLabel>Choose a theme</FieldLabel>
            <div className="grid grid-cols-2 gap-2" data-vaul-no-drag>
              {Object.values(DRAWING_THEME_DEFINITIONS).map((themeDefinition) => (
                <Button
                  key={themeDefinition.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-16 justify-between",
                    activeThemeId === themeDefinition.id &&
                      "border-primary ring-2 ring-primary/30"
                  )}
                  onClick={() => handleThemeSelect(themeDefinition.id)}
                  aria-pressed={activeThemeId === themeDefinition.id}
                >
                  <span>{themeDefinition.label}</span>
                  {activeThemeId === themeDefinition.id && (
                    <Check className="size-4 text-primary" />
                  )}
                </Button>
              ))}
            </div>
            <Hint>
              Theme controls top decorations, default background, and checkbox
              animations.
            </Hint>
          </Field>
          <TypographyH4 className="text-base">Background</TypographyH4>
          <Field data-invalid={effectiveBackgroundError ? true : undefined}>
            <FieldLabel htmlFor={backgroundInputId}>
              Choose a background for {activeThemeDefinition.label}
            </FieldLabel>
            <Input
              id={backgroundInputId}
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundChange}
              aria-invalid={Boolean(effectiveBackgroundError)}
              aria-describedby={
                effectiveBackgroundError
                  ? `${backgroundHintId} ${backgroundErrorId}`
                  : backgroundHintId
              }
              className="sr-only"
              tabIndex={-1}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-vaul-no-drag>
              <BackgroundTile
                label="Default"
                previewUrl={activeThemeDefinition.defaultBackgroundUrl}
                isActive={activeBackground.type === "default"}
                onSelect={selectDefaultBackgroundForActiveTheme}
              />
              {customBackgrounds.map((background, index) => (
                <BackgroundTile
                  key={background.id}
                  label={`Custom ${index + 1}`}
                  previewUrl={background.objectUrl}
                  isActive={activeCustomBackgroundId === background.id}
                  onSelect={() =>
                    selectCustomBackgroundForActiveTheme(background.id)
                  }
                  onDelete={() => {
                    void handleRemoveCustomBackground(background.id)
                  }}
                />
              ))}
              <BackgroundTile
                label="Add background image"
                isAddTile
                isDisabled={isUploadDisabled}
                onSelect={handleAddBackgroundClick}
              />
            </div>
            {effectiveBackgroundError && (
              <FieldError id={backgroundErrorId}>
                {effectiveBackgroundError}
              </FieldError>
            )}
            <Hint id={backgroundHintId}>
              Pick the theme default background or upload and reuse your own
              image across themes.
            </Hint>
          </Field>
          <Field>
            <FieldLabel>Overlay ({activeThemeDefinition.label})</FieldLabel>
            <div className="flex items-center gap-3" data-vaul-no-drag>
              <Slider
                value={[overlayOpacity]}
                min={MIN_OVERLAY_OPACITY}
                max={MAX_OVERLAY_OPACITY}
                step={1}
                onValueChange={(value) => {
                  const nextValue = value[0] ?? DEFAULT_OVERLAY_OPACITY
                  setOverlayOpacityForActiveTheme(nextValue)
                }}
                aria-label="Overlay opacity"
              />
              <span className="w-12 text-right text-sm font-medium text-muted-foreground tabular-nums">
                {overlayOpacity}%
              </span>
            </div>
            <Hint>
              Adjust the black overlay opacity on top of the background image.
            </Hint>
          </Field>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
