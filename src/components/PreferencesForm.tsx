import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { Mood, WatchingWith, UserPreferences } from "@/types"
import { Loader2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface PreferencesFormProps {
  onSubmit: (preferences: UserPreferences) => void
  isLoading: boolean
}

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "cozy", label: "Cozy", emoji: "🛋️" },
  { value: "thrilling", label: "Thrilling", emoji: "🎢" },
  { value: "funny", label: "Funny", emoji: "😄" },
  { value: "dramatic", label: "Dramatic", emoji: "🎭" },
  { value: "romantic", label: "Romantic", emoji: "💕" },
  { value: "thought-provoking", label: "Mind-Bending", emoji: "🤔" },
]

const WATCHING_WITH: { value: WatchingWith; label: string; emoji: string }[] = [
  { value: "solo", label: "Solo", emoji: "🧘" },
  { value: "date", label: "Date Night", emoji: "💑" },
  { value: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { value: "friends", label: "Friends", emoji: "👯" },
]

export function PreferencesForm({ onSubmit, isLoading }: PreferencesFormProps) {
  const [mood, setMood] = useState<Mood>("cozy")
  const [watchingWith, setWatchingWith] = useState<WatchingWith>("solo")
  const [availableTime, setAvailableTime] = useState(120)
  const [recentlyEnjoyed, setRecentlyEnjoyed] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      mood,
      watchingWith,
      availableTime,
      recentlyEnjoyed: recentlyEnjoyed || undefined,
    })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mood Selection - Netflix-style pills */}
        <div className="space-y-3">
          <Label className="text-base text-muted-foreground">I'm in the mood for something...</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  mood === m.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-white/50 hover:text-white"
                )}
              >
                <span className="mr-1.5">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Watching With - Netflix-style pills */}
        <div className="space-y-3">
          <Label className="text-base text-muted-foreground">Watching with...</Label>
          <div className="flex flex-wrap gap-2">
            {WATCHING_WITH.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setWatchingWith(w.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  watchingWith === w.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-white/50 hover:text-white"
                )}
              >
                <span className="mr-1.5">{w.emoji}</span>
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Available */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base text-muted-foreground">I have about...</Label>
            <span className="text-lg font-bold text-white">{formatTime(availableTime)}</span>
          </div>
          <Slider
            value={[availableTime]}
            onValueChange={(v) => setAvailableTime(v[0])}
            min={60}
            max={240}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 hour</span>
            <span>4 hours</span>
          </div>
        </div>

        {/* Recently Enjoyed */}
        <div className="space-y-3">
          <Label htmlFor="recently-enjoyed" className="text-base text-muted-foreground">
            Something I've enjoyed lately...
            <span className="ml-2 text-xs text-muted-foreground/60">(optional)</span>
          </Label>
          <Input
            id="recently-enjoyed"
            placeholder="The Office, Inception, Wes Anderson films..."
            value={recentlyEnjoyed}
            onChange={(e) => setRecentlyEnjoyed(e.target.value)}
            className="h-12 border-border bg-secondary/50 text-white placeholder:text-muted-foreground focus:border-white/50"
          />
        </div>

        {/* Submit Button - Netflix red */}
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="h-14 w-full text-lg font-bold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Finding Movies...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5 fill-current" />
              Find My Movie
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
