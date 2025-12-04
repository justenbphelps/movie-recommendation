import type { MovieRecommendation } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, Star, ExternalLink, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface MovieDetailModalProps {
  movie: MovieRecommendation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getColor(title: string) {
  const colors = [
    { bg: "bg-gradient-to-br from-violet-600 to-purple-900", text: "text-violet-200" },
    { bg: "bg-gradient-to-br from-blue-600 to-indigo-900", text: "text-blue-200" },
    { bg: "bg-gradient-to-br from-indigo-600 to-violet-900", text: "text-indigo-200" },
    { bg: "bg-gradient-to-br from-purple-600 to-fuchsia-900", text: "text-purple-200" },
    { bg: "bg-gradient-to-br from-fuchsia-600 to-pink-900", text: "text-fuchsia-200" },
    { bg: "bg-gradient-to-br from-cyan-600 to-blue-900", text: "text-cyan-200" },
    { bg: "bg-gradient-to-br from-teal-600 to-cyan-900", text: "text-teal-200" },
    { bg: "bg-gradient-to-br from-emerald-600 to-teal-900", text: "text-emerald-200" },
  ]
  const index = title.length % colors.length
  return colors[index]
}

export function MovieDetailModal({ movie, open, onOpenChange }: MovieDetailModalProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [posterError, setPosterError] = useState(false)

  useEffect(() => {
    if (!movie) {
      setPosterUrl(null)
      setPosterError(false)
      return
    }

    const fetchPoster = async () => {
      try {
        const response = await fetch(
          `https://www.omdbapi.com/?i=${movie.imdbId}&apikey=3e974fca`
        )
        const data = await response.json()
        if (data.Poster && data.Poster !== "N/A") {
          setPosterUrl(data.Poster)
        }
      } catch {
        // Silently fail
      }
    }

    if (movie.imdbId && movie.imdbId.startsWith("tt")) {
      fetchPoster()
    }
  }, [movie])

  if (!movie) return null

  const color = getColor(movie.title)
  const initials = movie.title
    .split(" ")
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const imdbUrl = `https://www.imdb.com/title/${movie.imdbId}/`
  const rtUrl = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(movie.title)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-zinc-800 bg-zinc-900 p-0">
        <div className="flex max-h-[90vh] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          {/* Large Poster */}
          <div className="relative h-64 w-full flex-shrink-0 md:h-auto md:w-64">
            {posterUrl && !posterError ? (
              <img
                src={posterUrl}
                alt={movie.title}
                className="h-full w-full object-cover"
                onError={() => setPosterError(true)}
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center",
                  color.bg
                )}
              >
                <Film className={cn("mb-2 h-12 w-12 opacity-50", color.text)} />
                <span className={cn("text-4xl font-black", color.text)}>{initials}</span>
              </div>
            )}
            {/* Rating Badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-white">{movie.rating}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-white">
                {movie.title}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span className="font-medium">{movie.year}</span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {movie.runtime} min
                </span>
                <span className="text-zinc-600">•</span>
                <span>{movie.genres.join(", ")}</span>
              </div>
            </DialogHeader>

            {/* Plot */}
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Plot
              </h4>
              <p className="text-sm leading-relaxed text-zinc-300">{movie.plot}</p>
            </div>

            {/* Why It Fits */}
            <div className="mb-6 rounded-lg bg-purple-500/10 p-4">
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-400">
                Why It's Perfect For You
              </h4>
              <p className="text-sm leading-relaxed text-purple-200">
                ✨ {movie.whyItFits}
              </p>
            </div>

            {/* Streaming Platforms */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Available On
              </h4>
              <div className="flex flex-wrap gap-2">
                {movie.streamingPlatforms.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full bg-purple-500/20 px-3 py-1.5 text-sm font-medium text-purple-300"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* External Links */}
            <div className="mt-auto flex gap-3">
              <a
                href={imdbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-yellow-500/20 px-4 py-2 text-sm font-bold text-yellow-400 transition-colors hover:bg-yellow-500/30"
              >
                IMDb
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={rtUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/30"
              >
                Rotten Tomatoes
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
