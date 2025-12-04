import type { MovieRecommendation } from "@/types"
import { Clock, ExternalLink, Star, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface RecommendationCardProps {
  recommendation: MovieRecommendation
  onClick?: () => void
}

// Generate a color based on movie title for the poster placeholder
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

export function RecommendationCard({ recommendation, onClick }: RecommendationCardProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [posterError, setPosterError] = useState(false)

  const color = getColor(recommendation.title)
  const initials = recommendation.title
    .split(" ")
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const imdbUrl = `https://www.imdb.com/title/${recommendation.imdbId}/`
  const rtUrl = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(recommendation.title)}`

  // Fetch poster from OMDb API
  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const response = await fetch(
          `https://www.omdbapi.com/?i=${recommendation.imdbId}&apikey=3e974fca`
        )
        const data = await response.json()
        if (data.Poster && data.Poster !== "N/A") {
          setPosterUrl(data.Poster)
        }
      } catch {
        // Silently fail, will show placeholder
      }
    }

    if (recommendation.imdbId && recommendation.imdbId.startsWith("tt")) {
      fetchPoster()
    }
  }, [recommendation.imdbId])

  return (
    <div className="group relative h-full">
      <div
        onClick={onClick}
        className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-zinc-900 transition-all duration-300 hover:bg-zinc-800 hover:shadow-xl hover:shadow-purple-500/10"
      >
        {/* Top Section: Poster + Info */}
        <div className="flex gap-4 p-4">
          {/* Poster */}
          <div className="relative h-36 w-24 flex-shrink-0 overflow-hidden rounded-lg">
            {posterUrl && !posterError ? (
              <img
                src={posterUrl}
                alt={recommendation.title}
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
                <Film className={cn("mb-1 h-6 w-6 opacity-50", color.text)} />
                <span className={cn("text-xl font-black", color.text)}>{initials}</span>
              </div>
            )}
            {/* Rating Badge */}
            <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-white">{recommendation.rating}</span>
            </div>
          </div>

          {/* Movie Info */}
          <div className="flex flex-1 flex-col min-w-0">
            <h3 className="font-bold text-white line-clamp-2 leading-tight">
              {recommendation.title}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-medium">{recommendation.year}</span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {recommendation.runtime}m
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {recommendation.genres.slice(0, 3).join(" • ")}
            </p>

            {/* Plot Summary */}
            <p className="mt-2 text-sm leading-relaxed text-zinc-300 line-clamp-2">
              {recommendation.plot}
            </p>
          </div>
        </div>

        {/* Why It Fits Section */}
        <div className="flex-1 border-t border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <p className="text-sm leading-relaxed text-purple-300 line-clamp-3">
            ✨ {recommendation.whyItFits}
          </p>
        </div>

        {/* Bottom Section: Platforms + Links */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
          {/* Streaming Platforms */}
          <div className="flex flex-wrap gap-1.5">
            {recommendation.streamingPlatforms.slice(0, 3).map((platform) => (
              <span
                key={platform}
                className="rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-300"
              >
                {platform}
              </span>
            ))}
            {recommendation.streamingPlatforms.length > 3 && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                +{recommendation.streamingPlatforms.length - 3}
              </span>
            )}
          </div>

          {/* External Links */}
          <div className="flex items-center gap-2">
            <a
              href={imdbUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400 transition-colors hover:bg-yellow-500/30"
            >
              IMDb
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={rtUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/30"
            >
              RT
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
