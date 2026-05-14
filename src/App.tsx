import { BurgerMenu } from "@/components/BurgerMenu"
import { WaitlistSection } from "@/components/WaitlistSection"
import { Cloud } from "@/components/svg/Cloud"
import { Leaf } from "@/components/svg/Leaf"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  TypographyH1,
  TypographyMuted,
  TypographyP,
} from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import { useBackgroundStore } from "@/stores/background"
import {
  DRAWING_THEME_DEFINITIONS,
  type DrawingThemeDecoration,
  type DrawingThemeEffectKind,
  useDrawingThemeStore,
} from "@/stores/drawingTheme"
import { type TodoColStore } from "@/stores/todoCol"
import { DEFAULT_TODO_COLUMNS } from "@/stores/todoDefaults"
import { useTodoManagerStore } from "@/stores/todoManager"
import { ArrowRight, Pencil, Plus } from "lucide-react"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
} from "react"
import { toast } from "sonner"

type TodoCheckboxElement = HTMLButtonElement
type EditingTodoTarget = {
  columnId: string
  todoId: string
}

type CheckboxBurstVisual = "leaf" | "cloud"

type CheckboxBurstParticle = {
  id: number
  visual: CheckboxBurstVisual
  startX: number
  startY: number
  driftX: number
  dropDistance: number
  durationMs: number
  rotationStartDeg: number
  rotationEndDeg: number
  scale: number
}

type CheckboxBurstParticleStyle = CSSProperties & {
  "--checkbox-burst-drift-x": string
  "--checkbox-burst-drop-distance": string
  "--checkbox-burst-rotation-start": string
  "--checkbox-burst-rotation-end": string
  "--checkbox-burst-scale": string
}

const CHECKBOX_BURST_COUNT = 5
const MAX_ACTIVE_CHECKBOX_BURST_PARTICLES = 80
const CHECKBOX_BURST_SPAWN_RADIUS_MIN = 18
const CHECKBOX_BURST_SPAWN_RADIUS_MAX = 52
const CHECKBOX_BURST_SPAWN_ANGLE_JITTER = Math.PI / 10
const CHECKBOX_BURST_OFFSCREEN_PADDING = 160
const CHECKBOX_BURST_FALL_SPEED_MIN = 0.16
const CHECKBOX_BURST_FALL_SPEED_MAX = 0.24
const CHECKBOX_BURST_MIN_DURATION_MS = 5000
const SPOTIFY_PLAYLIST_EMBED_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator"

function getCheckboxBurstVisual(
  effectKind: DrawingThemeEffectKind
): CheckboxBurstVisual | null {
  if (effectKind === "leaf-burst") {
    return "leaf"
  }

  if (effectKind === "cloud-burst") {
    return "cloud"
  }

  return null
}

type LayoutRowProps = ComponentProps<"section">

function LayoutRow({ className, ...props }: LayoutRowProps) {
  return (
    <section
      className={cn("grid w-full gap-4 lg:grid-cols-3", className)}
      {...props}
    />
  )
}

type LayoutColumnProps = ComponentProps<"div">

function LayoutColumn({ className, ...props }: LayoutColumnProps) {
  return <div className={cn("h-[420px]", className)} {...props} />
}

function QuoteCard() {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-white/35 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:p-5 lg:p-7">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5 opacity-80" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <span className="text-3xl leading-none font-black text-white/80 sm:text-4xl lg:text-5xl">
          "
        </span>
        <TypographyP className="mt-2 text-sm leading-snug !text-white sm:text-base lg:mt-4 lg:text-lg lg:leading-relaxed">
          The only way to do great work is to love what you do.
        </TypographyP>
        <div className="mt-4 lg:mt-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-white/90 uppercase lg:text-sm lg:tracking-[0.22em]">
            Steve Jobs
          </p>
          <p className="mt-1 text-[0.65rem] tracking-[0.12em] text-white/70 uppercase lg:text-xs lg:tracking-[0.14em]">
            Apple Co-Founder
          </p>
        </div>
      </div>
    </div>
  )
}

function SpotifyPlaylistCard() {
  return (
    <iframe
      title="Spotify playlist"
      src={SPOTIFY_PLAYLIST_EMBED_URL}
      width="100%"
      height="100%"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  )
}

type ThemeDecorationStripProps = {
  decoration: DrawingThemeDecoration
  className: string
}

function ThemeDecorationStrip({
  decoration,
  className,
}: ThemeDecorationStripProps) {
  return (
    <div className={className} style={decoration.style} aria-hidden="true" />
  )
}

function FloatingThemeSwitcher() {
  const activeThemeId = useDrawingThemeStore((state) => state.activeThemeId)
  const setActiveTheme = useDrawingThemeStore((state) => state.setActiveTheme)

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex justify-center px-4">
      <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/85 p-1 shadow-lg shadow-black/20 backdrop-blur-md dark:border-white/20 dark:bg-black/65">
        {Object.values(DRAWING_THEME_DEFINITIONS).map((themeDefinition) => {
          const isActiveTheme = activeThemeId === themeDefinition.id

          return (
            <Button
              key={themeDefinition.id}
              type="button"
              variant="ghost"
              size="xs"
              className={cn(
                "h-8 rounded-full border px-2.5 text-xs font-semibold text-black hover:bg-white dark:text-white dark:hover:bg-white/10",
                isActiveTheme
                  ? "border-black/20 bg-white shadow-sm ring-2 ring-black/10 dark:border-white/35 dark:bg-white/20 dark:ring-white/20"
                  : "border-transparent bg-transparent"
              )}
              onClick={() => setActiveTheme(themeDefinition.id)}
              aria-label={`Switch to ${themeDefinition.label} theme`}
              aria-pressed={isActiveTheme}
            >
              {themeDefinition.id === "leaf" ? (
                <Leaf className="size-3.5" aria-hidden="true" />
              ) : (
                <Cloud className="h-3.5 w-5" aria-hidden="true" />
              )}
              <span>{themeDefinition.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

type TodoColumnCardProps = {
  columnId: string
  store: TodoColStore
  cardTopDecoration: DrawingThemeDecoration | null
  onEditTitle: (columnId: string) => void
  onAddTodo: (columnId: string) => void
  onEditTodo: (columnId: string, todoId: string) => void
  onToggle: (
    columnId: string,
    todoId: string,
    checked: boolean,
    checkboxElement: TodoCheckboxElement | null
  ) => void
}

function TodoColumnCard({
  columnId,
  store,
  cardTopDecoration,
  onEditTitle,
  onAddTodo,
  onEditTodo,
  onToggle,
}: TodoColumnCardProps) {
  const title = store((state) => state.title)
  const items = store((state) => state.items)
  const checkboxElementsRef = useRef<
    Record<string, TodoCheckboxElement | null>
  >({})
  const remainingCount = items.filter((item) => item.done !== true).length

  return (
    <Card className="relative h-full gap-0 overflow-hidden !border-0 bg-card/95 py-0 backdrop-blur-sm">
      {cardTopDecoration && (
        <ThemeDecorationStrip
          decoration={cardTopDecoration}
          className="pointer-events-none absolute inset-x-0 -top-[14px] z-0 h-12"
        />
      )}
      <CardHeader className="group/todo-header relative z-10 border-b pt-8 pb-4">
        <CardTitle className="min-w-0 pr-3">{title}</CardTitle>
        <TypographyMuted className="mt-0">
          {remainingCount} task{remainingCount === 1 ? "" : "s"} left
        </TypographyMuted>
        <CardAction>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onAddTodo(columnId)}
              aria-label={`Add todo to ${title}`}
            >
              <Plus />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onEditTitle(columnId)}
              aria-label={`Edit ${title} title`}
            >
              <Pencil />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="relative z-10 min-h-0 flex-1 overflow-auto py-3">
        <ul className="space-y-1">
          {items.map((item, index) => {
            const todoKey = `${columnId}:${item.id}`
            const checkboxId = `todo-${columnId}-${item.id}`
            const isChecked = item.done === true
            const handleRowClick: ComponentProps<"div">["onClick"] = (
              event
            ) => {
              const clickTarget = event.target as HTMLElement | null

              if (
                clickTarget?.closest(
                  "button, [role='checkbox'], [data-row-ignore-edit='true']"
                )
              ) {
                return
              }

              onEditTodo(columnId, item.id)
            }

            return (
              <li key={todoKey}>
                <div
                  onClick={handleRowClick}
                  className="flex cursor-pointer items-start justify-between gap-3 rounded-md p-2 transition-colors hover:bg-muted/60"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <label
                      htmlFor={checkboxId}
                      data-row-ignore-edit="true"
                      className="-m-2 inline-flex cursor-pointer items-center justify-center self-center rounded-md p-2 touch-manipulation md:-m-1 md:p-1"
                    >
                      <Checkbox
                        id={checkboxId}
                        data-row-ignore-edit="true"
                        className="size-5 [&_svg]:size-4"
                        aria-label={`Mark ${item.label} as done`}
                        checked={isChecked}
                        ref={(checkboxElement) => {
                          checkboxElementsRef.current[todoKey] = checkboxElement
                        }}
                        onCheckedChange={(checked) =>
                          onToggle(
                            columnId,
                            item.id,
                            checked === true,
                            checkboxElementsRef.current[todoKey] ?? null
                          )
                        }
                      />
                    </label>
                    <div className="flex min-w-0 flex-1 cursor-pointer flex-col items-start text-left leading-snug">
                      <span
                        className={cn(
                          "self-start text-left",
                          isChecked && "text-muted-foreground line-through"
                        )}
                      >
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "self-start text-left text-xs text-muted-foreground",
                          isChecked && "line-through"
                        )}
                      >
                        {item.description}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-row-ignore-edit="true"
                    className="shrink-0"
                    onClick={() => onEditTodo(columnId, item.id)}
                    aria-label={`Edit ${item.label}`}
                  >
                    <ArrowRight />
                  </Button>
                </div>
                {index < items.length - 1 && (
                  <Separator className="my-1" />
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

type TodoColumnPanelProps = {
  columnId: string
  cardTopDecoration: DrawingThemeDecoration | null
  onEditTitle: (columnId: string) => void
  onAddTodo: (columnId: string) => void
  onEditTodo: (columnId: string, todoId: string) => void
  onToggle: (
    columnId: string,
    todoId: string,
    checked: boolean,
    checkboxElement: TodoCheckboxElement | null
  ) => void
}

function TodoColumnPanel({
  columnId,
  cardTopDecoration,
  onEditTitle,
  onAddTodo,
  onEditTodo,
  onToggle,
}: TodoColumnPanelProps) {
  const columnStore = useTodoManagerStore(
    (state) => state.columnStoresById[columnId]
  )

  if (!columnStore) {
    return null
  }

  return (
    <TodoColumnCard
      columnId={columnId}
      store={columnStore}
      cardTopDecoration={cardTopDecoration}
      onEditTitle={onEditTitle}
      onAddTodo={onAddTodo}
      onEditTodo={onEditTodo}
      onToggle={onToggle}
    />
  )
}

export function App() {
  const customBackgrounds = useBackgroundStore((state) => state.customBackgrounds)
  const hydrateCustomBackgroundsFromDb = useBackgroundStore(
    (state) => state.hydrateCustomBackgroundsFromDb
  )
  const activeThemeId = useDrawingThemeStore((state) => state.activeThemeId)
  const themeVisualStateById = useDrawingThemeStore(
    (state) => state.themeVisualStateById
  )
  const initializeTodos = useTodoManagerStore((state) => state.initialize)
  const getColumnStore = useTodoManagerStore((state) => state.getColumnStore)
  const setColumnTitle = useTodoManagerStore((state) => state.setColumnTitle)
  const toggleTodo = useTodoManagerStore((state) => state.toggleTodo)
  const updateTodo = useTodoManagerStore((state) => state.updateTodo)
  const addTodo = useTodoManagerStore((state) => state.addTodo)
  const todoColumnOrder = useTodoManagerStore((state) => state.columnOrder)
  const [now, setNow] = useState(() => new Date())
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingTitleDraft, setEditingTitleDraft] = useState("")
  const [addingTodoColumnId, setAddingTodoColumnId] = useState<string | null>(null)
  const [newTodoTitleDraft, setNewTodoTitleDraft] = useState("")
  const [newTodoDetailsDraft, setNewTodoDetailsDraft] = useState("")
  const [editingTodoTarget, setEditingTodoTarget] =
    useState<EditingTodoTarget | null>(null)
  const [editingTodoTitleDraft, setEditingTodoTitleDraft] = useState("")
  const [editingTodoDetailsDraft, setEditingTodoDetailsDraft] = useState("")
  const [checkboxBurstParticles, setCheckboxBurstParticles] = useState<
    CheckboxBurstParticle[]
  >([])
  const checkboxBurstParticleIdCounterRef = useRef(0)
  const activeThemeDefinition = DRAWING_THEME_DEFINITIONS[activeThemeId]
  const activeThemeVisualState = themeVisualStateById[activeThemeId]
  const overlayOpacity = activeThemeVisualState.overlayOpacity
  const backgroundImage = useMemo(() => {
    const backgroundSelection = activeThemeVisualState.background

    if (backgroundSelection.type === "custom") {
      const customBackground = customBackgrounds.find(
        (background) => background.id === backgroundSelection.id
      )

      if (customBackground) {
        return customBackground.objectUrl
      }
    }

    return activeThemeDefinition.defaultBackgroundUrl
  }, [
    activeThemeDefinition.defaultBackgroundUrl,
    activeThemeVisualState.background,
    customBackgrounds,
  ])

  useEffect(() => {
    initializeTodos(DEFAULT_TODO_COLUMNS)
  }, [initializeTodos])

  useEffect(() => {
    void hydrateCustomBackgroundsFromDb()
  }, [hydrateCustomBackgroundsFromDb])

  useEffect(() => {
    const refreshNow = () => setNow(new Date())
    const intervalId = window.setInterval(refreshNow, 30_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCheckboxBurstParticles([])
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeThemeDefinition.checkboxEffectKind])

  const timeLabel = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const dayLabel = now.toLocaleDateString("en-GB", { day: "numeric" })
  const monthLabel = now.toLocaleDateString("en-GB", { month: "short" })
  const activeEditingColumnTitle =
    editingColumnId === null ? "" : (getColumnStore(editingColumnId)?.getState().title ?? "")
  const activeAddingColumnTitle =
    addingTodoColumnId === null
      ? ""
      : (getColumnStore(addingTodoColumnId)?.getState().title ?? "")
  const isEditTitleSaveDisabled = editingTitleDraft.trim().length === 0
  const isAddTodoSaveDisabled = newTodoTitleDraft.trim().length === 0
  const isEditTodoSaveDisabled = editingTodoTitleDraft.trim().length === 0

  const handleOpenEditTitleDialog = (columnId: string) => {
    setEditingColumnId(columnId)
    setEditingTitleDraft(getColumnStore(columnId)?.getState().title ?? "")
  }

  const handleCloseEditTitleDialog = () => {
    setEditingColumnId(null)
    setEditingTitleDraft("")
  }

  const handleOpenAddTodoDialog = (columnId: string) => {
    setAddingTodoColumnId(columnId)
    setNewTodoTitleDraft("")
    setNewTodoDetailsDraft("")
  }

  const handleCloseAddTodoDialog = () => {
    setAddingTodoColumnId(null)
    setNewTodoTitleDraft("")
    setNewTodoDetailsDraft("")
  }

  const handleOpenEditTodoDialog = (columnId: string, todoId: string) => {
    const columnStore = getColumnStore(columnId)
    if (!columnStore) {
      return
    }

    const item = columnStore.getState().items.find(
      (candidateItem) => candidateItem.id === todoId
    )
    if (!item) {
      return
    }

    setEditingTodoTarget({ columnId, todoId })
    setEditingTodoTitleDraft(item.label)
    setEditingTodoDetailsDraft(item.description)
  }

  const handleCloseEditTodoDialog = () => {
    setEditingTodoTarget(null)
    setEditingTodoTitleDraft("")
    setEditingTodoDetailsDraft("")
  }

  const handleEditTitleDialogSubmit: ComponentProps<"form">["onSubmit"] = (
    event
  ) => {
    event.preventDefault()

    if (!editingColumnId) {
      return
    }

    const nextTitle = editingTitleDraft.trim()
    if (!nextTitle) {
      return
    }

    setColumnTitle(editingColumnId, nextTitle)
    toast.success("Column title updated.")
    handleCloseEditTitleDialog()
  }

  const handleAddTodoDialogSubmit: ComponentProps<"form">["onSubmit"] = (
    event
  ) => {
    event.preventDefault()

    if (!addingTodoColumnId) {
      return
    }

    const nextLabel = newTodoTitleDraft.trim()
    if (!nextLabel) {
      return
    }

    const nextId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `todo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    addTodo(addingTodoColumnId, {
      id: nextId,
      label: nextLabel,
      description: newTodoDetailsDraft.trim(),
      done: false,
    })
    toast.success("Todo created.")
    handleCloseAddTodoDialog()
  }

  const handleEditTodoDialogSubmit: ComponentProps<"form">["onSubmit"] = (
    event
  ) => {
    event.preventDefault()

    if (!editingTodoTarget) {
      return
    }

    const nextLabel = editingTodoTitleDraft.trim()
    if (!nextLabel) {
      return
    }

    updateTodo(editingTodoTarget.columnId, editingTodoTarget.todoId, {
      label: nextLabel,
      description: editingTodoDetailsDraft.trim(),
    })
    toast.success("Todo updated.")
    handleCloseEditTodoDialog()
  }

  const handleEditTitleDialogBackdropClick: ComponentProps<"div">["onClick"] = (
    event
  ) => {
    if (event.target !== event.currentTarget) {
      return
    }

    handleCloseEditTitleDialog()
  }

  const handleAddTodoDialogBackdropClick: ComponentProps<"div">["onClick"] = (
    event
  ) => {
    if (event.target !== event.currentTarget) {
      return
    }

    handleCloseAddTodoDialog()
  }

  const handleEditTodoDialogBackdropClick: ComponentProps<"div">["onClick"] = (
    event
  ) => {
    if (event.target !== event.currentTarget) {
      return
    }

    handleCloseEditTodoDialog()
  }

  const handleTodoToggle = (
    columnId: string,
    todoId: string,
    checked: boolean,
    checkboxElement: TodoCheckboxElement | null
  ) => {
    toggleTodo(columnId, todoId, checked)

    const burstVisual = getCheckboxBurstVisual(
      activeThemeDefinition.checkboxEffectKind
    )

    if (!burstVisual || !checked || !checkboxElement) {
      return
    }

    const checkboxBounds = checkboxElement.getBoundingClientRect()
    const checkboxCenterX = checkboxBounds.left + checkboxBounds.width / 2
    const checkboxCenterY = checkboxBounds.top + checkboxBounds.height / 2

    const baseAngle = Math.random() * Math.PI * 2
    const angleStep = (Math.PI * 2) / CHECKBOX_BURST_COUNT

    const burstParticles = Array.from(
      { length: CHECKBOX_BURST_COUNT },
      (_, index) => {
        const angle =
          baseAngle +
          index * angleStep +
          (Math.random() - 0.5) * CHECKBOX_BURST_SPAWN_ANGLE_JITTER
        const radius =
          CHECKBOX_BURST_SPAWN_RADIUS_MIN +
          Math.random() *
            (CHECKBOX_BURST_SPAWN_RADIUS_MAX -
              CHECKBOX_BURST_SPAWN_RADIUS_MIN)
        const startX = checkboxCenterX + Math.cos(angle) * radius
        const startY = checkboxCenterY + Math.sin(angle) * radius
        const spinDirection = Math.random() < 0.5 ? -1 : 1
        const fallSpeed =
          CHECKBOX_BURST_FALL_SPEED_MIN +
          Math.random() *
            (CHECKBOX_BURST_FALL_SPEED_MAX - CHECKBOX_BURST_FALL_SPEED_MIN)
        const dropDistance = Math.max(
          window.innerHeight - startY + CHECKBOX_BURST_OFFSCREEN_PADDING,
          260
        )

        return {
          id: checkboxBurstParticleIdCounterRef.current++,
          visual: burstVisual,
          startX,
          startY,
          driftX: (Math.random() - 0.5) * 320,
          dropDistance,
          durationMs: Math.max(
            dropDistance / fallSpeed,
            CHECKBOX_BURST_MIN_DURATION_MS
          ),
          rotationStartDeg: (Math.random() - 0.5) * 50,
          rotationEndDeg: spinDirection * (220 + Math.random() * 170),
          scale: 0.82 + Math.random() * 0.5,
        }
      }
    )

    setCheckboxBurstParticles((previousParticles) => {
      const nextParticles = [...previousParticles, ...burstParticles]
      if (nextParticles.length <= MAX_ACTIVE_CHECKBOX_BURST_PARTICLES) {
        return nextParticles
      }

      return nextParticles.slice(
        nextParticles.length - MAX_ACTIVE_CHECKBOX_BURST_PARTICLES
      )
    })
  }

  const handleCheckboxBurstParticleAnimationEnd = (particleId: number) => {
    setCheckboxBurstParticles((previousParticles) =>
      previousParticles.filter((particle) => particle.id !== particleId)
    )
  }

  return (
    <main className="relative min-h-svh w-full overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${backgroundImage}")` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})` }}
        aria-hidden="true"
      />
      {activeThemeDefinition.topDecoration && (
        <ThemeDecorationStrip
          decoration={activeThemeDefinition.topDecoration}
          className="pointer-events-none fixed inset-x-0 top-0 z-30 h-36 sm:h-40"
        />
      )}
      <div
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
        aria-hidden="true"
      >
        {checkboxBurstParticles.map((particle) => {
          const particleStyle: CheckboxBurstParticleStyle = {
            left: `${particle.startX}px`,
            top: `${particle.startY}px`,
            animationDuration: `${particle.durationMs}ms`,
            "--checkbox-burst-drift-x": `${particle.driftX}px`,
            "--checkbox-burst-drop-distance": `${particle.dropDistance}px`,
            "--checkbox-burst-rotation-start": `${particle.rotationStartDeg}deg`,
            "--checkbox-burst-rotation-end": `${particle.rotationEndDeg}deg`,
            "--checkbox-burst-scale": `${particle.scale}`,
          }
          const particleClassName = cn(
            "falling-checkbox-particle absolute drop-shadow-[0_6px_10px_rgba(0,0,0,0.26)]",
            particle.visual === "cloud" ? "h-5 w-8" : "size-6"
          )

          if (particle.visual === "cloud") {
            return (
              <Cloud
                key={particle.id}
                className={particleClassName}
                style={particleStyle}
                onAnimationEnd={() =>
                  handleCheckboxBurstParticleAnimationEnd(particle.id)
                }
              />
            )
          }

          return (
            <Leaf
              key={particle.id}
              className={particleClassName}
              style={particleStyle}
              onAnimationEnd={() =>
                handleCheckboxBurstParticleAnimationEnd(particle.id)
              }
            />
          )
        })}
      </div>
      <BurgerMenu />
      <FloatingThemeSwitcher />
      <div className="relative z-10 min-h-svh px-4 pt-4 pb-24 sm:px-6 sm:pt-6 sm:pb-28">
        <div className="mt-28 w-full sm:mt-32">
          <LayoutRow>
            <LayoutColumn className="flex h-36 w-full items-center justify-center sm:h-40 lg:col-span-2 lg:h-[420px]">
              <div className="relative z-10 text-center text-white">
                <TypographyH1 className="text-5xl leading-none !text-white tabular-nums drop-shadow-lg sm:text-6xl md:text-7xl lg:text-[10rem]">
                  {timeLabel}
                </TypographyH1>
                <p className="mt-1 flex items-end justify-center gap-2 leading-none tracking-[0.16em] uppercase lg:mt-2 lg:gap-3 lg:tracking-[0.18em]">
                  <span className="text-xl font-semibold sm:text-2xl lg:text-4xl">
                    {dayLabel}
                  </span>
                  <span className="pb-0.5 text-xs font-semibold text-white/80 lg:pb-1 lg:text-base">
                    {monthLabel}
                  </span>
                </p>
              </div>
            </LayoutColumn>
            <LayoutColumn className="h-44 w-full sm:h-48 lg:col-span-1 lg:h-[420px]">
              <QuoteCard />
            </LayoutColumn>
          </LayoutRow>
          <section className="mt-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {todoColumnOrder.map((columnId) => (
              <LayoutColumn key={columnId}>
                <TodoColumnPanel
                  columnId={columnId}
                  cardTopDecoration={activeThemeDefinition.cardTopDecoration}
                  onEditTitle={handleOpenEditTitleDialog}
                  onAddTodo={handleOpenAddTodoDialog}
                  onEditTodo={handleOpenEditTodoDialog}
                  onToggle={handleTodoToggle}
                />
              </LayoutColumn>
            ))}
            <LayoutColumn>
              <SpotifyPlaylistCard />
            </LayoutColumn>
          </section>
          <section className="mt-6 flex w-full justify-center">
            <WaitlistSection className="w-full max-w-3xl" />
          </section>
        </div>
      </div>
      {editingColumnId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={handleEditTitleDialogBackdropClick}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-column-title-heading"
          >
            <form className="space-y-4" onSubmit={handleEditTitleDialogSubmit}>
              <div>
                <h2
                  id="edit-column-title-heading"
                  className="text-base font-semibold text-foreground"
                >
                  Edit Title
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update the title for "{activeEditingColumnTitle}".
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-column-title-input">Title</Label>
                <Input
                  id="todo-column-title-input"
                  value={editingTitleDraft}
                  onChange={(event) => setEditingTitleDraft(event.target.value)}
                  autoFocus
                  maxLength={60}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEditTitleDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditTitleSaveDisabled}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {addingTodoColumnId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={handleAddTodoDialogBackdropClick}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-todo-heading"
          >
            <form className="space-y-4" onSubmit={handleAddTodoDialogSubmit}>
              <div>
                <h2
                  id="add-todo-heading"
                  className="text-base font-semibold text-foreground"
                >
                  Add Todo
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a new task to "{activeAddingColumnTitle}".
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-add-title-input">Title</Label>
                <Input
                  id="todo-add-title-input"
                  value={newTodoTitleDraft}
                  onChange={(event) => setNewTodoTitleDraft(event.target.value)}
                  autoFocus
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-add-details-textarea">Details</Label>
                <Textarea
                  id="todo-add-details-textarea"
                  value={newTodoDetailsDraft}
                  onChange={(event) =>
                    setNewTodoDetailsDraft(event.target.value)
                  }
                  maxLength={400}
                  rows={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseAddTodoDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddTodoSaveDisabled}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingTodoTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={handleEditTodoDialogBackdropClick}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-todo-heading"
          >
            <form className="space-y-4" onSubmit={handleEditTodoDialogSubmit}>
              <div>
                <h2
                  id="edit-todo-heading"
                  className="text-base font-semibold text-foreground"
                >
                  Edit Todo
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your task title and details.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-edit-title-input">Title</Label>
                <Input
                  id="todo-edit-title-input"
                  value={editingTodoTitleDraft}
                  onChange={(event) => setEditingTodoTitleDraft(event.target.value)}
                  autoFocus
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-edit-details-textarea">Details</Label>
                <Textarea
                  id="todo-edit-details-textarea"
                  value={editingTodoDetailsDraft}
                  onChange={(event) =>
                    setEditingTodoDetailsDraft(event.target.value)
                  }
                  maxLength={400}
                  rows={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEditTodoDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditTodoSaveDisabled}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
