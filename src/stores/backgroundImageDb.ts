import { openDB, type DBSchema, type IDBPDatabase } from "idb"

const BACKGROUND_DB_NAME = "styletodov3-backgrounds"
const BACKGROUND_DB_VERSION = 1
const BACKGROUND_STORE_NAME = "custom-backgrounds"
const BACKGROUND_CREATED_AT_INDEX = "by-created-at"

type BackgroundImageDbSchema = DBSchema & {
  [BACKGROUND_STORE_NAME]: {
    key: string
    value: BackgroundImageRecord
    indexes: {
      [BACKGROUND_CREATED_AT_INDEX]: number
    }
  }
}

export type BackgroundImageRecord = {
  id: string
  createdAt: number
  blob: Blob
  mimeType: string
  sizeBytes: number
}

let databasePromise: Promise<IDBPDatabase<BackgroundImageDbSchema>> | null = null

function ensureIndexedDbAvailability() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available outside the browser.")
  }

  if (!("indexedDB" in window)) {
    throw new Error("IndexedDB is not supported in this browser.")
  }
}

async function openBackgroundDatabase() {
  ensureIndexedDbAvailability()

  if (!databasePromise) {
    databasePromise = openDB<BackgroundImageDbSchema>(
      BACKGROUND_DB_NAME,
      BACKGROUND_DB_VERSION,
      {
        upgrade(database) {
          if (database.objectStoreNames.contains(BACKGROUND_STORE_NAME)) {
            return
          }

          const store = database.createObjectStore(BACKGROUND_STORE_NAME, {
            keyPath: "id",
          })

          store.createIndex(BACKGROUND_CREATED_AT_INDEX, "createdAt")
        },
      }
    )
  }

  return databasePromise
}

export async function listBackgroundImages() {
  const database = await openBackgroundDatabase()
  const imageRecords = await database.getAllFromIndex(
    BACKGROUND_STORE_NAME,
    BACKGROUND_CREATED_AT_INDEX
  )

  return imageRecords.sort((a, b) => b.createdAt - a.createdAt)
}

export async function putBackgroundImage(imageRecord: BackgroundImageRecord) {
  const database = await openBackgroundDatabase()
  await database.put(BACKGROUND_STORE_NAME, imageRecord)
}

export async function deleteBackgroundImage(id: string) {
  const database = await openBackgroundDatabase()
  await database.delete(BACKGROUND_STORE_NAME, id)
}

export async function clearBackgroundImages() {
  const database = await openBackgroundDatabase()
  await database.clear(BACKGROUND_STORE_NAME)
}
