export type Mood = "cozy" | "thrilling" | "funny" | "dramatic" | "romantic" | "thought-provoking"

export type WatchingWith = "solo" | "date" | "family" | "friends"

export interface UserPreferences {
  mood: Mood
  watchingWith: WatchingWith
  availableTime: number // in minutes
  recentlyEnjoyed?: string // optional: recent movies/shows they liked
}

export interface MovieRecommendation {
  title: string
  year: number
  runtime: number // in minutes
  streamingPlatforms: string[]
  rating: number
  genres: string[]
  whyItFits: string // personalized explanation
  plot: string // brief plot summary
  posterUrl?: string
  imdbId: string
}

export interface AgentState {
  userPreferences: UserPreferences
  searchResults: MovieSearchResult[]
  reviews: MovieReview[]
  recommendations: MovieRecommendation[]
  currentStep: AgentStep
  error?: string
}

export interface MovieSearchResult {
  title: string
  year: number
  imdbId: string
  runtime: number
  genres: string[]
  streamingPlatforms: string[]
  rating: number
  posterUrl?: string
}

export interface MovieReview {
  movieTitle: string
  source: string
  summary: string
  sentiment: "positive" | "mixed" | "negative"
}

export type AgentStep =
  | "idle"
  | "analyzing_preferences"
  | "searching_movies"
  | "reading_reviews"
  | "generating_recommendations"
  | "complete"
  | "error"
