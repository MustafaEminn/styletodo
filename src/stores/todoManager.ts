import { create } from "zustand"

import {
  createTodoColStore,
  type TodoColStore,
  type TodoColumnSnapshot,
  type TodoItem,
} from "@/stores/todoCol"

export type TodoTotals = {
  total: number
  completed: number
  remaining: number
}

const TODO_COLUMNS_STORAGE_KEY = "todo-columns-store-v1"
const columnStoreUnsubscribersById = new Map<string, () => void>()

type PersistedTodoColumnsReadResult =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "valid"; columns: TodoColumnSnapshot[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isTodoItem(value: unknown): value is TodoItem {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.id !== "string") {
    return false
  }

  if (typeof value.label !== "string") {
    return false
  }

  if (typeof value.description !== "string") {
    return false
  }

  if (value.done !== undefined && typeof value.done !== "boolean") {
    return false
  }

  return true
}

function isTodoColumnSnapshot(value: unknown): value is TodoColumnSnapshot {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.id !== "string" || typeof value.title !== "string") {
    return false
  }

  if (!Array.isArray(value.items)) {
    return false
  }

  return value.items.every(isTodoItem)
}

function cloneTodoItems(items: TodoItem[]) {
  return items.map((item) => ({ ...item }))
}

function cloneTodoColumns(columns: TodoColumnSnapshot[]) {
  return columns.map((column) => ({
    id: column.id,
    title: column.title,
    items: cloneTodoItems(column.items),
  }))
}

function getBrowserLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage
}

function readPersistedTodoColumns(): PersistedTodoColumnsReadResult {
  const localStorageApi = getBrowserLocalStorage()
  if (!localStorageApi) {
    return { status: "missing" }
  }

  try {
    const persistedRawValue = localStorageApi.getItem(TODO_COLUMNS_STORAGE_KEY)
    if (persistedRawValue === null) {
      return { status: "missing" }
    }

    const parsedValue: unknown = JSON.parse(persistedRawValue)

    if (!Array.isArray(parsedValue) || !parsedValue.every(isTodoColumnSnapshot)) {
      return { status: "invalid" }
    }

    return {
      status: "valid",
      columns: cloneTodoColumns(parsedValue),
    }
  } catch {
    return { status: "invalid" }
  }
}

function writePersistedTodoColumns(columns: TodoColumnSnapshot[]) {
  const localStorageApi = getBrowserLocalStorage()
  if (!localStorageApi) {
    return
  }

  try {
    localStorageApi.setItem(
      TODO_COLUMNS_STORAGE_KEY,
      JSON.stringify(cloneTodoColumns(columns))
    )
  } catch {
    // Ignore storage write failures in MVP flow.
  }
}

function cleanupColumnSubscription(columnId: string) {
  const unsubscribe = columnStoreUnsubscribersById.get(columnId)
  if (!unsubscribe) {
    return
  }

  unsubscribe()
  columnStoreUnsubscribersById.delete(columnId)
}

function cleanupAllColumnSubscriptions() {
  for (const unsubscribe of columnStoreUnsubscribersById.values()) {
    unsubscribe()
  }

  columnStoreUnsubscribersById.clear()
}

export type TodoManagerStoreState = {
  isInitialized: boolean
  columnOrder: string[]
  columnStoresById: Record<string, TodoColStore>
  initialize: (defaultColumns: TodoColumnSnapshot[]) => void
  registerColumnStore: (columnId: string, store: TodoColStore) => void
  unregisterColumnStore: (columnId: string) => void
  getColumnStore: (columnId: string) => TodoColStore | undefined
  clearColumnStores: () => void
  persistNow: () => void
  getAllColumnsSnapshot: () => TodoColumnSnapshot[]
  setColumnTitle: (columnId: string, title: string) => void
  toggleTodo: (columnId: string, todoId: string, nextDone?: boolean) => void
  updateTodo: (
    columnId: string,
    todoId: string,
    update: Partial<Omit<TodoItem, "id">>
  ) => void
  addTodo: (columnId: string, todo: TodoItem) => void
  removeTodo: (columnId: string, todoId: string) => void
  getTotals: () => TodoTotals
}

export const useTodoManagerStore = create<TodoManagerStoreState>()(
  (set, get) => ({
    isInitialized: false,
    columnOrder: [],
    columnStoresById: {},
    initialize: (defaultColumns) => {
      if (get().isInitialized) {
        return
      }

      cleanupAllColumnSubscriptions()
      set({
        columnOrder: [],
        columnStoresById: {},
      })

      const persistedColumnsResult = readPersistedTodoColumns()
      const shouldPersistDefaults = persistedColumnsResult.status !== "valid"
      const resolvedInitialColumns =
        persistedColumnsResult.status === "valid"
          ? persistedColumnsResult.columns
          : cloneTodoColumns(defaultColumns)

      for (const column of resolvedInitialColumns) {
        get().registerColumnStore(column.id, createTodoColStore(column))
      }

      set({ isInitialized: true })

      if (shouldPersistDefaults) {
        get().persistNow()
      }
    },
    registerColumnStore: (columnId, store) => {
      cleanupColumnSubscription(columnId)

      const unsubscribe = store.subscribe((state, previousState) => {
        const hasTitleChanged = state.title !== previousState.title
        const hasItemsChanged = state.items !== previousState.items

        if (!hasTitleChanged && !hasItemsChanged) {
          return
        }

        get().persistNow()
      })
      columnStoreUnsubscribersById.set(columnId, unsubscribe)

      set((state) => ({
        columnOrder: state.columnOrder.includes(columnId)
          ? state.columnOrder
          : [...state.columnOrder, columnId],
        columnStoresById: {
          ...state.columnStoresById,
          [columnId]: store,
        },
      }))
    },
    unregisterColumnStore: (columnId) => {
      set((state) => {
        if (!(columnId in state.columnStoresById)) {
          return state
        }

        cleanupColumnSubscription(columnId)

        const rest = { ...state.columnStoresById }
        delete rest[columnId]
        return {
          columnOrder: state.columnOrder.filter((id) => id !== columnId),
          columnStoresById: rest,
        }
      })
    },
    getColumnStore: (columnId) => {
      return get().columnStoresById[columnId]
    },
    clearColumnStores: () => {
      cleanupAllColumnSubscriptions()
      set({
        isInitialized: false,
        columnOrder: [],
        columnStoresById: {},
      })
    },
    persistNow: () => {
      writePersistedTodoColumns(get().getAllColumnsSnapshot())
    },
    getAllColumnsSnapshot: () => {
      const { columnOrder, columnStoresById } = get()

      return columnOrder.flatMap((columnId) => {
        const columnStore = columnStoresById[columnId]
        if (!columnStore) {
          return []
        }

        const { title, items } = columnStore.getState()

        return [
          {
            id: columnId,
            title,
            items: cloneTodoItems(items),
          },
        ]
      })
    },
    setColumnTitle: (columnId, title) => {
      const columnStore = get().columnStoresById[columnId]
      if (!columnStore) {
        return
      }

      columnStore.getState().setTitle(title)
    },
    toggleTodo: (columnId, todoId, nextDone) => {
      const columnStore = get().columnStoresById[columnId]
      if (!columnStore) {
        return
      }

      columnStore.getState().toggleTodo(todoId, nextDone)
    },
    updateTodo: (columnId, todoId, update) => {
      const columnStore = get().columnStoresById[columnId]
      if (!columnStore) {
        return
      }

      columnStore.getState().updateTodo(todoId, update)
    },
    addTodo: (columnId, todo) => {
      const columnStore = get().columnStoresById[columnId]
      if (!columnStore) {
        return
      }

      columnStore.getState().addTodo(todo)
    },
    removeTodo: (columnId, todoId) => {
      const columnStore = get().columnStoresById[columnId]
      if (!columnStore) {
        return
      }

      columnStore.getState().removeTodo(todoId)
    },
    getTotals: () => {
      const { columnOrder, columnStoresById } = get()
      let total = 0
      let completed = 0

      for (const columnId of columnOrder) {
        const columnStore = columnStoresById[columnId]
        if (!columnStore) {
          continue
        }

        const { items } = columnStore.getState()

        total += items.length
        completed += items.filter((item) => item.done === true).length
      }

      return {
        total,
        completed,
        remaining: total - completed,
      }
    },
  })
)
