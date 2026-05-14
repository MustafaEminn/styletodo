import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import { LoaderCircle, Sparkles } from "lucide-react"
import { useState, type ComponentProps } from "react"
import { toast } from "sonner"

const WAITLIST_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type WaitlistSectionProps = ComponentProps<"section">

type WaitlistCreateResult = "inserted" | "already-joined"

async function addToWaitlist(email: string): Promise<WaitlistCreateResult> {
  if (!supabase) {
    throw new Error("Supabase client is not configured.")
  }

  const { error } = await supabase.from("waitlist").insert({ email })

  if (!error) {
    return "inserted"
  }

  const isDuplicate =
    error.code === "23505" ||
    error.message.toLowerCase().includes("duplicate") === true

  if (isDuplicate) {
    return "already-joined"
  }

  throw new Error(error.message ?? "Could not join the waitlist.")
}

export function WaitlistSection({ className, ...props }: WaitlistSectionProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState<string | null>(
    null
  )

  const handleSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!WAITLIST_EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error("Please enter a valid email address.")
      return
    }

    if (!isSupabaseConfigured) {
      toast.error(
        "Waitlist is not configured yet. Add VITE_SUPABASE_URL and a public key."
      )
      return
    }

    setIsSubmitting(true)

    try {
      const result = await addToWaitlist(normalizedEmail)
      setLastSubmittedEmail(normalizedEmail)
      setEmail("")

      if (result === "already-joined") {
        toast.message("You're already on the waitlist.")
        return
      }

      toast.success("You are on the waitlist.")
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not join the waitlist."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/35 bg-white/12 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.3),transparent_60%),radial-gradient(circle_at_85%_10%,rgba(171,255,205,0.28),transparent_45%)]" />
      <div className="relative z-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/15 px-3 py-1 text-xs tracking-[0.15em] uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Future updates
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Join the Waitlist
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
          Get notified when new focus tools, themes, and workflow upgrades land
          in StyleTodo.
        </p>

        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={handleSubmit}
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-11 w-full border-white/55 bg-black/25 text-white placeholder:text-white/65 focus-visible:border-white/90 focus-visible:ring-white/45 sm:max-w-2xl sm:flex-1"
            aria-label="Email for waitlist"
            disabled={isSubmitting}
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 min-w-36 border border-white/55 bg-white/90 text-black hover:bg-white"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Joining...
              </span>
            ) : (
              "Join waitlist"
            )}
          </Button>
        </form>

        {lastSubmittedEmail ? (
          <p className="mt-3 text-xs text-white/80 sm:text-sm">
            Last successful submit: {lastSubmittedEmail}
          </p>
        ) : null}
      </div>
    </section>
  )
}
