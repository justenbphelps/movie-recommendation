import type { AgentStep } from "@/types"
import { cn } from "@/lib/utils"
import { Film } from "lucide-react"

interface AgentProgressProps {
  currentStep: AgentStep
}

const STEPS = [
  { key: "analyzing_preferences", label: "Understanding your vibe" },
  { key: "searching_movies", label: "Searching thousands of titles" },
  { key: "reading_reviews", label: "Reading critic reviews" },
  { key: "generating_recommendations", label: "Picking your perfect matches" },
] as const

export function AgentProgress({ currentStep }: AgentProgressProps) {
  if (currentStep === "idle" || currentStep === "complete" || currentStep === "error") {
    return null
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)
  const currentLabel = STEPS[currentIndex]?.label || "Loading..."

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Netflix-style loading animation */}
      <div className="relative">
        {/* Outer ring */}
        <div className="h-24 w-24 animate-spin rounded-full border-4 border-muted border-t-primary" />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-xl font-medium text-white">{currentLabel}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This usually takes about 10-15 seconds
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {STEPS.map((step, index) => (
          <div
            key={step.key}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              index < currentIndex && "bg-primary",
              index === currentIndex && "w-6 bg-primary",
              index > currentIndex && "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  )
}
