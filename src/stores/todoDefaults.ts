import type { TodoColumnSnapshot } from "@/stores/todoCol"

export const DEFAULT_TODO_COLUMNS: TodoColumnSnapshot[] = [
  {
    id: "today",
    title: "Today",
    items: [
      {
        id: "plan-the-day",
        label: "Plan the day",
        description: "Pick the few tasks that would make today feel complete.",
      },
      {
        id: "reply-priority-messages",
        label: "Reply to priority messages",
        description: "Clear the notes and emails that need a real response.",
        done: true,
      },
      {
        id: "finish-important-task",
        label: "Finish one important task",
        description: "Move the main thing forward before smaller chores pile up.",
      },
      {
        id: "take-real-break",
        label: "Take a real break",
        description: "Step away long enough to come back with a clearer head.",
      },
      {
        id: "check-calendar",
        label: "Check calendar",
        description: "Review meetings and make room for focused work.",
      },
      {
        id: "tidy-workspace",
        label: "Tidy workspace",
        description: "Clear the desk or tabs before starting the next task.",
      },
      {
        id: "drink-water",
        label: "Drink water",
        description: "Keep a glass nearby and reset for a minute.",
      },
      {
        id: "wrap-up-notes",
        label: "Write wrap-up notes",
        description: "Capture what changed, what finished, and what carries over.",
      },
    ],
  },
  {
    id: "work",
    title: "Work",
    items: [
      {
        id: "draft-project-brief",
        label: "Draft project brief",
        description: "Capture the goal, next steps, and open questions.",
      },
      {
        id: "review-design-notes",
        label: "Review design notes",
        description: "Check spacing, copy, and mobile behavior before handoff.",
      },
      {
        id: "send-weekly-update",
        label: "Send weekly update",
        description: "Share progress, blockers, and the next milestone.",
        done: true,
      },
      {
        id: "prep-tomorrows-meeting",
        label: "Prep tomorrow's meeting",
        description: "Write the agenda and pull together the key context.",
      },
      {
        id: "prioritize-inbox",
        label: "Prioritize inbox",
        description: "Flag the messages that need action before the day ends.",
      },
      {
        id: "update-task-status",
        label: "Update task status",
        description: "Mark progress so teammates know what is moving.",
      },
      {
        id: "review-open-feedback",
        label: "Review open feedback",
        description: "Scan comments and decide what needs a reply.",
      },
      {
        id: "block-focus-time",
        label: "Block focus time",
        description: "Protect a quiet window for deeper work.",
      },
    ],
  },
  {
    id: "personal",
    title: "Personal",
    items: [
      {
        id: "pick-up-groceries",
        label: "Pick up groceries",
        description: "Restock the basics for quick breakfasts and dinners.",
      },
      {
        id: "thirty-minute-workout",
        label: "30-minute workout",
        description: "Do a simple strength and mobility session.",
        done: true,
      },
      {
        id: "pay-utility-bill",
        label: "Pay utility bill",
        description: "Confirm the payment before the due date.",
      },
      {
        id: "read-before-bed",
        label: "Read before bed",
        description: "End the day with a few quiet pages.",
      },
      {
        id: "start-laundry",
        label: "Start laundry",
        description: "Run one load before the evening gets busy.",
      },
      {
        id: "call-family",
        label: "Call family",
        description: "Check in with someone you have been meaning to call.",
      },
      {
        id: "prep-tomorrows-outfit",
        label: "Prep tomorrow's outfit",
        description: "Set out what you need for an easier morning.",
      },
      {
        id: "clean-kitchen-counter",
        label: "Clean kitchen counter",
        description: "Reset the kitchen after meals and errands.",
      },
    ],
  },
  {
    id: "later",
    title: "Later",
    items: [
      {
        id: "organize-bookmarks",
        label: "Organize bookmarks",
        description: "Save the useful links and remove the clutter.",
      },
      {
        id: "research-weekend-ideas",
        label: "Research weekend ideas",
        description: "Collect a few low-effort options for free time.",
      },
      {
        id: "clean-up-backlog",
        label: "Clean up backlog",
        description: "Archive old tasks so the useful ones are easier to see.",
      },
      {
        id: "try-new-recipe",
        label: "Try a new recipe",
        description: "Pick something simple that still feels a little special.",
        done: true,
      },
      {
        id: "plan-small-upgrade",
        label: "Plan a small upgrade",
        description: "Pick one tiny improvement for home, work, or routine.",
      },
      {
        id: "save-gift-idea",
        label: "Save gift idea",
        description: "Write down a thoughtful idea before it disappears.",
      },
      {
        id: "compare-tool-options",
        label: "Compare tool options",
        description: "Keep notes on choices worth revisiting.",
      },
      {
        id: "schedule-maintenance",
        label: "Schedule maintenance",
        description: "Set a reminder for a future chore or appointment.",
      },
    ],
  },
]
