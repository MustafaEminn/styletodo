import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { CustomBackground } from "@/stores/background"

export type DrawingThemeId = "leaf" | "theme-2"
export type DrawingThemeEffectKind = "leaf-burst" | "cloud-burst" | "none"

export type ThemeBackgroundSelection =
  | { type: "default" }
  | { type: "custom"; id: string }

export type ThemeVisualState = {
  background: ThemeBackgroundSelection
  overlayOpacity: number
}

export type DrawingThemeImageStripStyle = {
  backgroundImage: string
  backgroundRepeat: string
  backgroundSize: string
  backgroundPosition: string
}

export type DrawingThemeDecoration = {
  kind: "image-strip"
  style: DrawingThemeImageStripStyle
}

export type DrawingThemeDefinition = {
  id: DrawingThemeId
  label: string
  defaultBackgroundUrl: string
  topDecoration: DrawingThemeDecoration | null
  cardTopDecoration: DrawingThemeDecoration | null
  checkboxEffectKind: DrawingThemeEffectKind
}

export const MIN_OVERLAY_OPACITY = 0
export const MAX_OVERLAY_OPACITY = 100
export const DEFAULT_OVERLAY_OPACITY = 35

const LEGACY_BACKGROUND_STORE_KEY = "background-store"
const DRAWING_THEME_STORE_KEY = "drawing-theme-store"

const DRAWING_THEME_IDS: DrawingThemeId[] = ["leaf", "theme-2"]

function publicAssetUrl(fileName: string) {
  return `${import.meta.env.BASE_URL}${fileName}`
}

function publicAssetCssUrl(fileName: string) {
  return `url('${publicAssetUrl(fileName)}')`
}

function repeatedPublicAssetCssUrl(fileName: string) {
  const assetUrl = publicAssetCssUrl(fileName)

  return `${assetUrl}, ${assetUrl}`
}

export const DRAWING_THEME_DEFINITIONS: Record<
  DrawingThemeId,
  DrawingThemeDefinition
> = {
  leaf: {
    id: "leaf",
    label: "Leaf",
    defaultBackgroundUrl: publicAssetUrl("defaultbg.jpg"),
    topDecoration: {
      kind: "image-strip",
      style: {
        backgroundImage: repeatedPublicAssetCssUrl("topLeafs.png"),
        backgroundRepeat: "repeat-x, repeat-x",
        backgroundSize: "560px 100%, 560px 100%",
        backgroundPosition: "0 -40px, 280px -40px",
      },
    },
    cardTopDecoration: {
      kind: "image-strip",
      style: {
        backgroundImage: repeatedPublicAssetCssUrl("smallTopLeafs.png"),
        backgroundRepeat: "repeat-x, repeat-x",
        backgroundSize: "340px 100%, 340px 100%",
        backgroundPosition: "0 -8px, 170px -8px",
      },
    },
    checkboxEffectKind: "leaf-burst",
  },
  "theme-2": {
    id: "theme-2",
    label: "Cloud",
    defaultBackgroundUrl: publicAssetUrl("cloudDefaultBg.png"),
    topDecoration: {
      kind: "image-strip",
      style: {
        backgroundImage: repeatedPublicAssetCssUrl("topClouds.png"),
        backgroundRepeat: "repeat-x, repeat-x",
        backgroundSize: "auto 125%, auto 125%",
        backgroundPosition: "0 -104px, 240px -104px",
      },
    },
    cardTopDecoration: {
      kind: "image-strip",
      style: {
        backgroundImage: repeatedPublicAssetCssUrl("smallTopClouds.png"),
        backgroundRepeat: "repeat-x, repeat-x",
        backgroundSize: "auto 125%, auto 125%",
        backgroundPosition: "0 -14px, 80px -14px",
      },
    },
    checkboxEffectKind: "cloud-burst",
  },
}

type ThemeVisualStateById = Record<DrawingThemeId, ThemeVisualState>

type DrawingThemeStore = {
  activeThemeId: DrawingThemeId
  themeVisualStateById: ThemeVisualStateById
  setActiveTheme: (themeId: DrawingThemeId) => void
  selectDefaultBackgroundForActiveTheme: () => void
  selectCustomBackgroundForActiveTheme: (id: string) => void
  setOverlayOpacityForActiveTheme: (value: number) => void
  removeCustomBackgroundReference: (id: string) => void
  getThemeDefinition: (themeId: DrawingThemeId) => DrawingThemeDefinition
  getActiveThemeDefinition: () => DrawingThemeDefinition
  getThemeVisualState: (themeId: DrawingThemeId) => ThemeVisualState
  getActiveThemeVisualState: () => ThemeVisualState
  getActiveBackgroundSelection: () => ThemeBackgroundSelection
  resolveThemeBackgroundUrl: (
    themeId: DrawingThemeId,
    customBackgrounds: CustomBackground[]
  ) => string
  resolveActiveBackgroundUrl: (customBackgrounds: CustomBackground[]) => string
}

type PersistedDrawingThemeStoreState = Pick<
  DrawingThemeStore,
  "activeThemeId" | "themeVisualStateById"
>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDrawingThemeId(value: unknown): value is DrawingThemeId {
  return (
    typeof value === "string" &&
    DRAWING_THEME_IDS.some((themeId) => themeId === value)
  )
}

function clampOverlayOpacity(value: number) {
  return Math.min(MAX_OVERLAY_OPACITY, Math.max(MIN_OVERLAY_OPACITY, value))
}

function normalizeThemeBackgroundSelection(
  value: unknown
): ThemeBackgroundSelection | null {
  if (!isRecord(value) || typeof value.type !== "string") {
    return null
  }

  if (value.type === "default") {
    return { type: "default" }
  }

  if (
    value.type === "custom" &&
    typeof value.id === "string" &&
    value.id.length > 0
  ) {
    return { type: "custom", id: value.id }
  }

  return null
}

function createDefaultThemeVisualStateById(): ThemeVisualStateById {
  return {
    leaf: {
      background: { type: "default" },
      overlayOpacity: DEFAULT_OVERLAY_OPACITY,
    },
    "theme-2": {
      background: { type: "default" },
      overlayOpacity: DEFAULT_OVERLAY_OPACITY,
    },
  }
}

function normalizeThemeVisualState(
  value: unknown,
  fallbackState: ThemeVisualState
): ThemeVisualState {
  if (!isRecord(value)) {
    return fallbackState
  }

  const background =
    normalizeThemeBackgroundSelection(value.background) ??
    fallbackState.background
  const overlayOpacity =
    typeof value.overlayOpacity === "number"
      ? clampOverlayOpacity(value.overlayOpacity)
      : fallbackState.overlayOpacity

  return {
    background,
    overlayOpacity,
  }
}

function normalizeThemeVisualStateById(
  value: unknown
): ThemeVisualStateById | null {
  if (!isRecord(value)) {
    return null
  }

  const fallback = createDefaultThemeVisualStateById()

  return {
    leaf: normalizeThemeVisualState(value.leaf, fallback.leaf),
    "theme-2": normalizeThemeVisualState(value["theme-2"], fallback["theme-2"]),
  }
}

function readLegacyLeafThemeVisualState(): ThemeVisualState | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const persistedRaw = window.localStorage.getItem(
      LEGACY_BACKGROUND_STORE_KEY
    )
    if (!persistedRaw) {
      return null
    }

    const parsedPersistedState: unknown = JSON.parse(persistedRaw)

    let candidateState: unknown = parsedPersistedState
    if (
      isRecord(parsedPersistedState) &&
      "state" in parsedPersistedState &&
      parsedPersistedState.state !== undefined
    ) {
      candidateState = parsedPersistedState.state
    }

    if (!isRecord(candidateState)) {
      return null
    }

    const background =
      normalizeThemeBackgroundSelection(candidateState.activeBackground) ??
      ({ type: "default" } as const)
    const overlayOpacity =
      typeof candidateState.overlayOpacity === "number"
        ? clampOverlayOpacity(candidateState.overlayOpacity)
        : DEFAULT_OVERLAY_OPACITY

    return {
      background,
      overlayOpacity,
    }
  } catch {
    return null
  }
}

function createInitialDrawingThemeStoreState(): PersistedDrawingThemeStoreState {
  const defaultThemeVisualStateById = createDefaultThemeVisualStateById()
  const legacyLeafThemeVisualState = readLegacyLeafThemeVisualState()

  if (legacyLeafThemeVisualState) {
    defaultThemeVisualStateById.leaf = legacyLeafThemeVisualState
  }

  return {
    activeThemeId: "theme-2",
    themeVisualStateById: defaultThemeVisualStateById,
  }
}

function migratePersistedDrawingThemeStoreState(
  persistedState: unknown
): PersistedDrawingThemeStoreState {
  const fallbackState = createInitialDrawingThemeStoreState()

  if (!isRecord(persistedState)) {
    return fallbackState
  }

  const activeThemeId = isDrawingThemeId(persistedState.activeThemeId)
    ? persistedState.activeThemeId
    : fallbackState.activeThemeId

  const normalizedThemeVisualStateById = normalizeThemeVisualStateById(
    persistedState.themeVisualStateById
  )

  return {
    activeThemeId,
    themeVisualStateById:
      normalizedThemeVisualStateById ?? fallbackState.themeVisualStateById,
  }
}

function resolveThemeBackgroundUrl(
  themeDefinition: DrawingThemeDefinition,
  themeVisualState: ThemeVisualState,
  customBackgrounds: CustomBackground[]
) {
  const backgroundSelection = themeVisualState.background

  if (backgroundSelection.type === "custom") {
    const customBackground = customBackgrounds.find(
      (background) => background.id === backgroundSelection.id
    )

    if (customBackground) {
      return customBackground.objectUrl
    }
  }

  return themeDefinition.defaultBackgroundUrl
}

const initialState = createInitialDrawingThemeStoreState()

export const useDrawingThemeStore = create<DrawingThemeStore>()(
  persist<DrawingThemeStore, [], [], PersistedDrawingThemeStoreState>(
    (set, get) => ({
      ...initialState,
      setActiveTheme: (themeId) => {
        set({ activeThemeId: themeId })
      },
      selectDefaultBackgroundForActiveTheme: () => {
        set((state) => ({
          themeVisualStateById: {
            ...state.themeVisualStateById,
            [state.activeThemeId]: {
              ...state.themeVisualStateById[state.activeThemeId],
              background: { type: "default" },
            },
          },
        }))
      },
      selectCustomBackgroundForActiveTheme: (id) => {
        if (id.length === 0) {
          return
        }

        set((state) => ({
          themeVisualStateById: {
            ...state.themeVisualStateById,
            [state.activeThemeId]: {
              ...state.themeVisualStateById[state.activeThemeId],
              background: { type: "custom", id },
            },
          },
        }))
      },
      setOverlayOpacityForActiveTheme: (value) => {
        set((state) => ({
          themeVisualStateById: {
            ...state.themeVisualStateById,
            [state.activeThemeId]: {
              ...state.themeVisualStateById[state.activeThemeId],
              overlayOpacity: clampOverlayOpacity(value),
            },
          },
        }))
      },
      removeCustomBackgroundReference: (id) => {
        if (id.length === 0) {
          return
        }

        set((state) => {
          const nextThemeVisualStateById = {
            ...state.themeVisualStateById,
          }

          for (const themeId of DRAWING_THEME_IDS) {
            const themeVisualState = nextThemeVisualStateById[themeId]

            if (
              themeVisualState.background.type === "custom" &&
              themeVisualState.background.id === id
            ) {
              nextThemeVisualStateById[themeId] = {
                ...themeVisualState,
                background: { type: "default" },
              }
            }
          }

          return {
            themeVisualStateById: nextThemeVisualStateById,
          }
        })
      },
      getThemeDefinition: (themeId) => {
        return DRAWING_THEME_DEFINITIONS[themeId]
      },
      getActiveThemeDefinition: () => {
        return DRAWING_THEME_DEFINITIONS[get().activeThemeId]
      },
      getThemeVisualState: (themeId) => {
        return get().themeVisualStateById[themeId]
      },
      getActiveThemeVisualState: () => {
        const state = get()
        return state.themeVisualStateById[state.activeThemeId]
      },
      getActiveBackgroundSelection: () => {
        const state = get()
        return state.themeVisualStateById[state.activeThemeId].background
      },
      resolveThemeBackgroundUrl: (themeId, customBackgrounds) => {
        const state = get()
        const themeDefinition = DRAWING_THEME_DEFINITIONS[themeId]
        const themeVisualState = state.themeVisualStateById[themeId]

        return resolveThemeBackgroundUrl(
          themeDefinition,
          themeVisualState,
          customBackgrounds
        )
      },
      resolveActiveBackgroundUrl: (customBackgrounds) => {
        const state = get()
        const themeDefinition = DRAWING_THEME_DEFINITIONS[state.activeThemeId]
        const themeVisualState = state.themeVisualStateById[state.activeThemeId]

        return resolveThemeBackgroundUrl(
          themeDefinition,
          themeVisualState,
          customBackgrounds
        )
      },
    }),
    {
      name: DRAWING_THEME_STORE_KEY,
      version: 1,
      migrate: (persistedState) =>
        migratePersistedDrawingThemeStoreState(persistedState),
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        themeVisualStateById: state.themeVisualStateById,
      }),
    }
  )
)
