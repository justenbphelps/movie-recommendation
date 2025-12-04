import { useState, useMemo } from "react"
import { PreferencesForm } from "@/components/PreferencesForm"
import { RecommendationCard } from "@/components/RecommendationCard"
import { MovieDetailModal } from "@/components/MovieDetailModal"
import { AgentProgress } from "@/components/AgentProgress"
import { Button } from "@/components/ui/button"
import { useMovieAgent } from "@/hooks/useMovieAgent"
import type { MovieRecommendation } from "@/types"
import { RotateCcw, Shuffle } from "lucide-react"

function App() {
  const { recommendations, currentStep, isLoading, error, getRecommendations, reset } =
    useMovieAgent()
  const [shuffleKey, setShuffleKey] = useState(0)
  const [selectedMovie, setSelectedMovie] = useState<MovieRecommendation | null>(null)

  const showResults = currentStep === "complete" && recommendations.length > 0
  const showProgress = isLoading && currentStep !== "idle"

  // Shuffle recommendations when shuffleKey changes
  const shuffledRecommendations = useMemo(() => {
    if (!recommendations.length) return []
    const shuffled = [...recommendations]
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendations, shuffleKey])

  const handleShuffle = () => {
    setShuffleKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Hero / Main Content */}
      <main>
        {!showResults && !showProgress && (
          <div className="relative">
            {/* Hero Background */}
            <div className="absolute inset-0 h-[70vh] bg-gradient-to-b from-zinc-900 via-zinc-900/50 to-background" />

            {/* Hero Content */}
            <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
              <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
                What should we watch tonight?
              </h2>
              <p className="mb-8 max-w-xl text-lg text-muted-foreground md:text-xl">
                Tell us your mood and we'll find the perfect movie for you.
              </p>
            </div>

            {/* Form Section */}
            <div className="relative z-10 -mt-20 px-4 pb-12">
              <PreferencesForm onSubmit={getRecommendations} isLoading={isLoading} />
            </div>
          </div>
        )}

        {showProgress && (
          <div className="flex min-h-[80vh] items-center justify-center px-4">
            <AgentProgress currentStep={currentStep} />
          </div>
        )}

        {error && (
          <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
            <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={reset}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="px-4 pb-12 pt-8 md:px-8">
            {/* Results Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Your Perfect Picks</h2>
                <p className="mt-1 text-muted-foreground">
                  {recommendations.length} movies matched to your vibe
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShuffle}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Shuffle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-muted-foreground hover:text-white"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Search
                </Button>
              </div>
            </div>

            {/* Responsive grid: 1 col mobile, 2 cols tablet, 3-4 cols desktop */}
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shuffledRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.imdbId || rec.title}
                  recommendation={rec}
                  onClick={() => setSelectedMovie(rec)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Movie Detail Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        open={!!selectedMovie}
        onOpenChange={(open) => !open && setSelectedMovie(null)}
      />
    </div>
  )
}

export default App
