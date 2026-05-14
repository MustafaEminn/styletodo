import { create, type StoreApi, type UseBoundStore } from "zustand"

export type TodoItem = {
  id: string
  label: string
  description: string
  done?: boolean
}

export type TodoColumnSnapshot = {
  id: string
  title: string
  items: TodoItem[]
}

type TodoItemUpdate = Partial<Omit<TodoItem, "id">>

export type TodoColStoreState = {
  columnId: string
  title: string
  items: TodoItem[]
  setTitle: (title: string) => void
  setItems: (items: TodoItem[]) => void
  addTodo: (todo: TodoItem) => void
  updateTodo: (todoId: string, update: TodoItemUpdate) => void
  removeTodo: (todoId: string) => void
  toggleTodo: (todoId: string, nextDone?: boolean) => void
  reset: () => void
}

export type TodoColStore = UseBoundStore<StoreApi<TodoColStoreState>>

function cloneTodoItems(items: TodoItem[]) {
  return items.map((item) => ({ ...item }))
}

export function createTodoColStore(
  initialColumn: TodoColumnSnapshot
): TodoColStore {
  const initialTitle = initialColumn.title
  const initialItems = cloneTodoItems(initialColumn.items)

  return create<TodoColStoreState>()((set) => ({
    columnId: initialColumn.id,
    title: initialTitle,
    items: initialItems,
    setTitle: (title) => {
      set({ title })
    },
    setItems: (items) => {
      set({ items: cloneTodoItems(items) })
    },
    addTodo: (todo) => {
      set((state) => ({
        items: [...state.items, { ...todo }],
      }))
    },
    updateTodo: (todoId, update) => {
      set((state) => {
        let found = false

        const nextItems = state.items.map((item) => {
          if (item.id !== todoId) {
            return item
          }

          found = true
          return {
            ...item,
            ...update,
            id: item.id,
          }
        })

        if (!found) {
          return state
        }

        return { items: nextItems }
      })
    },
    removeTodo: (todoId) => {
      set((state) => {
        const nextItems = state.items.filter((item) => item.id !== todoId)

        if (nextItems.length === state.items.length) {
          return state
        }

        return { items: nextItems }
      })
    },
    toggleTodo: (todoId, nextDone) => {
      set((state) => {
        let found = false

        const nextItems = state.items.map((item) => {
          if (item.id !== todoId) {
            return item
          }

          found = true
          const currentDone = item.done === true
          const resolvedDone = nextDone ?? !currentDone
          return {
            ...item,
            done: resolvedDone,
          }
        })

        if (!found) {
          return state
        }

        return { items: nextItems }
      })
    },
    reset: () => {
      set({
        title: initialTitle,
        items: cloneTodoItems(initialItems),
      })
    },
  }))
}
