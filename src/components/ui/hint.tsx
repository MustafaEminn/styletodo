import { Info } from "lucide-react"

import { FieldDescription } from "@/components/ui/field"
import { cn } from "@/lib/utils"

function Hint({
  className,
  children,
  ...props
}: React.ComponentProps<typeof FieldDescription>) {
  return (
    <FieldDescription
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border/70 bg-muted/60 p-3",
        className
      )}
      {...props}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <span className="leading-relaxed">{children}</span>
    </FieldDescription>
  )
}

export { Hint }
