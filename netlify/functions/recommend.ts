import type { Handler } from "@netlify/functions"
import { StateGraph, Annotation, START, END } from "@langchain/langgraph"
import { ChatAnthropic } from "@langchain/anthropic"

// Types
type Mood = "cozy" | "thrilling" | "funny" | "dramatic" | "romantic" | "thought-provoking"
type WatchingWith = "solo" | "date" | "family" | "friends"

interface UserPreferences {
  mood: Mood
  watchingWith: WatchingWith
  availableTime: number
  recentlyEnjoyed?: string
}

interface MovieRecommendation {
  title: string
  year: number
  runtime: number
  streamingPlatforms: string[]
  rating: number
  genres: string[]
  whyItFits: string
  plot: string
  imdbId: string
}

interface MovieSearchResult {
  title: string
  year: number
  imdbId: string
  runtime: number
  genres: string[]
  streamingPlatforms: string[]
  rating: number
}

interface MovieReview {
  movieTitle: string
  source: string
  summary: string
  sentiment: "positive" | "mixed" | "negative"
}

type AgentStep =
  | "idle"
  | "analyzing_preferences"
  | "searching_movies"
  | "reading_reviews"
  | "generating_recommendations"
  | "complete"
  | "error"

// Define the state schema
const AgentStateAnnotation = Annotation.Root({
  userPreferences: Annotation<UserPreferences>,
  searchResults: Annotation<MovieSearchResult[]>({
    default: () => [],
    reducer: (_, y) => y,
  }),
  reviews: Annotation<MovieReview[]>({
    default: () => [],
    reducer: (_, y) => y,
  }),
  recommendations: Annotation<MovieRecommendation[]>({
    default: () => [],
    reducer: (_, y) => y,
  }),
  currentStep: Annotation<AgentStep>({
    default: () => "idle" as AgentStep,
    reducer: (_, y) => y,
  }),
  error: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_, y) => y,
  }),
})

type AgentState = typeof AgentStateAnnotation.State

// Initialize the LLM
function getLLM() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set")
  }
  return new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    anthropicApiKey: apiKey,
    maxTokens: 8192,
  })
}

// Helper to extract text content from LLM response
function getResponseText(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block
        if (block && typeof block === "object" && "text" in block) return block.text
        return ""
      })
      .join("")
  }
  return String(content)
}

// Node: Analyze user preferences
async function analyzePreferences(_state: AgentState): Promise<Partial<AgentState>> {
  return {
    currentStep: "searching_movies",
  }
}

// Node: Search for movies
async function searchMovies(state: AgentState): Promise<Partial<AgentState>> {
  const llm = getLLM()
  const { mood, watchingWith, availableTime, recentlyEnjoyed } = state.userPreferences

  const prompt = `You are a movie recommendation expert. Based on the following preferences, suggest 5-7 movies that would be good candidates:

Mood: ${mood}
Watching with: ${watchingWith}
Available time: ${availableTime} minutes
${recentlyEnjoyed ? `Recently enjoyed: ${recentlyEnjoyed}` : ""}

Return a JSON array of movies with this structure:
[
  {
    "title": "Movie Title",
    "year": 2023,
    "imdbId": "tt1234567",
    "runtime": 120,
    "genres": ["Drama", "Comedy"],
    "streamingPlatforms": ["Netflix", "Hulu"],
    "rating": 8.5
  }
]

Only return valid JSON, no other text.`

  try {
    const response = await llm.invoke(prompt)
    const content = getResponseText(response.content)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const searchResults = JSON.parse(jsonMatch[0]) as MovieSearchResult[]
      return {
        searchResults,
        currentStep: "reading_reviews",
      }
    }
  } catch (error) {
    console.error("Error searching movies:", error)
  }

  return {
    searchResults: [],
    currentStep: "reading_reviews",
  }
}

// Node: Read reviews
async function readReviews(state: AgentState): Promise<Partial<AgentState>> {
  const llm = getLLM()
  const movieTitles = state.searchResults.map((m) => m.title).join(", ")

  const prompt = `For these movies: ${movieTitles}

Provide a brief review summary for each movie that would help someone decide if it fits a ${state.userPreferences.mood} mood when watching with ${state.userPreferences.watchingWith}.

Return as JSON array:
[
  {
    "movieTitle": "Movie Title",
    "source": "Aggregated Reviews",
    "summary": "Brief 1-2 sentence summary of critical consensus",
    "sentiment": "positive"
  }
]

sentiment must be one of: "positive", "mixed", "negative"
Only return valid JSON, no other text.`

  try {
    const response = await llm.invoke(prompt)
    const content = getResponseText(response.content)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const reviews = JSON.parse(jsonMatch[0]) as MovieReview[]
      return {
        reviews,
        currentStep: "generating_recommendations",
      }
    }
  } catch (error) {
    console.error("Error reading reviews:", error)
  }

  return {
    reviews: [],
    currentStep: "generating_recommendations",
  }
}

// Node: Generate recommendations
async function generateRecommendations(state: AgentState): Promise<Partial<AgentState>> {
  const llm = getLLM()
  const { mood, watchingWith, availableTime, recentlyEnjoyed } = state.userPreferences

  const prompt = `You are a movie recommendation expert. Based on the user's preferences, recommend exactly 20 movies.

USER PREFERENCES:
- Mood: ${mood}
- Watching with: ${watchingWith}
- Available time: ${availableTime} minutes
${recentlyEnjoyed ? `- Recently enjoyed: ${recentlyEnjoyed}` : ""}

IMPORTANT REQUIREMENTS:
1. Recommend exactly 20 movies that fit within the ${availableTime} minute time limit
2. Each movie must have a valid IMDb ID (format: tt followed by 7-8 digits)
3. Include a variety of movies - mix classics and recent films
4. The "whyItFits" should be personal, explaining why this movie fits their ${mood} mood for ${watchingWith} viewing
5. The "plot" should be a 1-2 sentence non-spoiler summary
6. Include realistic streaming platforms where the movie might be available

Return exactly 20 recommendations as a JSON array:
[
  {
    "title": "Movie Title",
    "year": 2023,
    "runtime": 120,
    "streamingPlatforms": ["Netflix", "Prime Video"],
    "rating": 8.5,
    "genres": ["Drama", "Comedy"],
    "whyItFits": "Personal 1-2 sentence explanation",
    "plot": "Brief 1-2 sentence plot summary without spoilers",
    "imdbId": "tt1234567"
  }
]

Only return valid JSON, no other text.`

  try {
    const response = await llm.invoke(prompt)
    const content = getResponseText(response.content)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]) as MovieRecommendation[]
      return {
        recommendations,
        currentStep: "complete",
      }
    }
  } catch (error) {
    console.error("Error generating recommendations:", error)
  }

  return {
    recommendations: [],
    currentStep: "error",
    error: "Failed to generate recommendations. Please try again.",
  }
}

// Error handler
async function handleError(state: AgentState): Promise<Partial<AgentState>> {
  return {
    currentStep: "error",
    error: state.error || "An unexpected error occurred",
  }
}

// Routing functions
function routeAfterAnalysis(state: AgentState): string {
  if (state.error) return "handleError"
  return "searchMovies"
}

function routeAfterSearch(state: AgentState): string {
  if (state.error) return "handleError"
  if (state.searchResults.length === 0) return "generateRecommendations" // Skip to recommendations if no search results
  return "readReviews"
}

function routeAfterReviews(state: AgentState): string {
  if (state.error) return "handleError"
  return "generateRecommendations"
}

// Build the graph
function createMovieRecommendationGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode("analyzePreferences", analyzePreferences)
    .addNode("searchMovies", searchMovies)
    .addNode("readReviews", readReviews)
    .addNode("generateRecommendations", generateRecommendations)
    .addNode("handleError", handleError)
    .addEdge(START, "analyzePreferences")
    .addConditionalEdges("analyzePreferences", routeAfterAnalysis)
    .addConditionalEdges("searchMovies", routeAfterSearch)
    .addConditionalEdges("readReviews", routeAfterReviews)
    .addEdge("generateRecommendations", END)
    .addEdge("handleError", END)

  return workflow.compile()
}

// Netlify function handler
export const handler: Handler = async (event) => {
  // Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  }

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  try {
    const preferences = JSON.parse(event.body || "{}") as UserPreferences

    if (!preferences.mood || !preferences.watchingWith || !preferences.availableTime) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required preferences" }),
      }
    }

    const graph = createMovieRecommendationGraph()

    const initialState = {
      userPreferences: preferences,
      searchResults: [],
      reviews: [],
      recommendations: [],
      currentStep: "analyzing_preferences" as AgentStep,
    }

    const result = await graph.invoke(initialState)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        recommendations: result.recommendations,
        error: result.error,
      }),
    }
  } catch (error) {
    console.error("Function error:", error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
    }
  }
}
