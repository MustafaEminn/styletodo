import { create } from "zustand"

import {
  deleteBackgroundImage,
  listBackgroundImages,
  putBackgroundImage,
  type BackgroundImageRecord,
} from "@/stores/backgroundImageDb"

export const MAX_BACKGROUND_BYTES = 10 * 1024 * 1024
export const MAX_CUSTOM_BACKGROUNDS = 8

export const STORAGE_UNAVAILABLE_MESSAGE =
  "Background uploads are unavailable in this browser or storage mode."
export const STORAGE_WRITE_FAILED_MESSAGE =
  "Could not save this image to browser storage."
export const STORAGE_READ_FAILED_MESSAGE =
  "Could not access saved backgrounds from browser storage."

export type SetCustomBackgroundError =
  | "FILE_TOO_LARGE"
  | "INVALID_IMAGE_FILE"
  | "STORAGE_UNAVAILABLE"
  | "STORAGE_WRITE_FAILED"

export type SetCustomBackgroundInput = {
  file: File
}

export type SetCustomBackgroundResult =
  | { ok: true; backgroundId: string }
  | { ok: false; error: SetCustomBackgroundError }

export type RemoveCustomBackgroundResult =
  | { ok: true }
  | { ok: false; error: "STORAGE_WRITE_FAILED" }

export type CustomBackground = {
  id: string
  objectUrl: string
  createdAt: number
  mimeType: string
  sizeBytes: number
}

export type BackgroundStorageStatus = "idle" | "loading" | "ready" | "blocked"

type BackgroundStore = {
  customBackgrounds: CustomBackground[]
  storageStatus: BackgroundStorageStatus
  storageErrorMessage: string | null
  hasHydratedCustomBackgrounds: boolean
  hydrateCustomBackgroundsFromDb: () => Promise<void>
  addCustomBackground: (
    input: SetCustomBackgroundInput
  ) => Promise<SetCustomBackgroundResult>
  removeCustomBackground: (id: string) => Promise<RemoveCustomBackgroundResult>
}

function createBackgroundId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `background-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isImageFile(file: File) {
  return file.type.startsWith("image/")
}

function revokeObjectUrl(objectUrl: string) {
  if (typeof window === "undefined") {
    return
  }

  URL.revokeObjectURL(objectUrl)
}

function revokeObjectUrls(backgrounds: CustomBackground[]) {
  for (const background of backgrounds) {
    revokeObjectUrl(background.objectUrl)
  }
}

function toCustomBackgroundPreview(record: BackgroundImageRecord): CustomBackground {
  return {
    id: record.id,
    objectUrl: URL.createObjectURL(record.blob),
    createdAt: record.createdAt,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
  }
}

async function ensureCustomBackgroundLimit() {
  const backgroundRecords = await listBackgroundImages()
  if (backgroundRecords.length <= MAX_CUSTOM_BACKGROUNDS) {
    return
  }

  const recordsToDelete = backgroundRecords.slice(MAX_CUSTOM_BACKGROUNDS)
  await Promise.all(recordsToDelete.map((record) => deleteBackgroundImage(record.id)))
}

export const useBackgroundStore = create<BackgroundStore>()((set, get) => ({
  customBackgrounds: [],
  storageStatus: "idle",
  storageErrorMessage: null,
  hasHydratedCustomBackgrounds: false,
  hydrateCustomBackgroundsFromDb: async () => {
    const { storageStatus, hasHydratedCustomBackgrounds } = get()

    if (storageStatus === "loading") {
      return
    }

    if (hasHydratedCustomBackgrounds && storageStatus === "ready") {
      return
    }

    set({
      storageStatus: "loading",
      storageErrorMessage: null,
    })

    try {
      const customBackgroundRecords = await listBackgroundImages()
      const limitedRecords = customBackgroundRecords.slice(0, MAX_CUSTOM_BACKGROUNDS)
      const nextCustomBackgrounds = limitedRecords.map(toCustomBackgroundPreview)

      set((state) => {
        revokeObjectUrls(state.customBackgrounds)

        return {
          customBackgrounds: nextCustomBackgrounds,
          storageStatus: "ready",
          storageErrorMessage: null,
          hasHydratedCustomBackgrounds: true,
        }
      })
    } catch {
      set((state) => {
        revokeObjectUrls(state.customBackgrounds)

        return {
          storageStatus: "blocked",
          storageErrorMessage: STORAGE_READ_FAILED_MESSAGE,
          hasHydratedCustomBackgrounds: true,
          customBackgrounds: [],
        }
      })
    }
  },
  addCustomBackground: async ({ file }) => {
    const state = get()

    if (state.storageStatus === "blocked") {
      return { ok: false, error: "STORAGE_UNAVAILABLE" }
    }

    if (file.size > MAX_BACKGROUND_BYTES) {
      return { ok: false, error: "FILE_TOO_LARGE" }
    }

    if (!isImageFile(file)) {
      return { ok: false, error: "INVALID_IMAGE_FILE" }
    }

    const nextRecord: BackgroundImageRecord = {
      id: createBackgroundId(),
      createdAt: Date.now(),
      blob: file,
      mimeType: file.type,
      sizeBytes: file.size,
    }

    try {
      await putBackgroundImage(nextRecord)
      await ensureCustomBackgroundLimit()
    } catch {
      set({
        storageStatus: "blocked",
        storageErrorMessage: STORAGE_WRITE_FAILED_MESSAGE,
      })
      return { ok: false, error: "STORAGE_WRITE_FAILED" }
    }

    try {
      const customBackgroundRecords = await listBackgroundImages()
      const limitedRecords = customBackgroundRecords.slice(0, MAX_CUSTOM_BACKGROUNDS)
      const nextCustomBackgrounds = limitedRecords.map(toCustomBackgroundPreview)

      set((previousState) => {
        revokeObjectUrls(previousState.customBackgrounds)

        return {
          customBackgrounds: nextCustomBackgrounds,
          storageStatus: "ready",
          storageErrorMessage: null,
          hasHydratedCustomBackgrounds: true,
        }
      })

      return { ok: true, backgroundId: nextRecord.id }
    } catch {
      set({
        storageStatus: "blocked",
        storageErrorMessage: STORAGE_READ_FAILED_MESSAGE,
      })
      return { ok: false, error: "STORAGE_UNAVAILABLE" }
    }
  },
  removeCustomBackground: async (id) => {
    const existingBackground = get().customBackgrounds.find(
      (background) => background.id === id
    )

    if (!existingBackground) {
      return { ok: true }
    }

    try {
      await deleteBackgroundImage(id)
    } catch {
      set({
        storageStatus: "blocked",
        storageErrorMessage: STORAGE_WRITE_FAILED_MESSAGE,
      })
      return { ok: false, error: "STORAGE_WRITE_FAILED" }
    }

    set((state) => ({
      customBackgrounds: state.customBackgrounds.filter(
        (background) => background.id !== id
      ),
    }))

    revokeObjectUrl(existingBackground.objectUrl)

    return { ok: true }
  },
}))
