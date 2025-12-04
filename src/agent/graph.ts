import { StateGraph, Annotation, START, END } from "@langchain/langgraph/web"
import { ChatAnthropic } from "@langchain/anthropic"
import type {
  UserPreferences,
  MovieSearchResult,
  MovieReview,
  MovieRecommendation,
  AgentStep,
} from "@/types"

// Define the state schema using Annotation
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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("Anthropic API key not found. Add VITE_ANTHROPIC_API_KEY to your .env file.")
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

// Node: Analyze user preferences and determine search strategy
async function analyzePreferences(_state: AgentState): Promise<Partial<AgentState>> {
  console.log("[Agent] Analyzing user preferences...")
  
  // In a real implementation, this would use the LLM to understand
  // nuanced preferences and map them to search criteria
  return {
    currentStep: "searching_movies",
  }
}

// Node: Search for movies across streaming platforms
async function searchMovies(state: AgentState): Promise<Partial<AgentState>> {
  console.log("[Agent] Searching for movies...")
  
  const llm = getLLM()
  const { mood, watchingWith, availableTime, recentlyEnjoyed } = state.userPreferences

  // Use LLM to generate movie suggestions based on preferences
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
    const content = response.content as string
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const searchResults = JSON.parse(jsonMatch[0]) as MovieSearchResult[]
      return {
        searchResults,
        currentStep: "reading_reviews",
      }
    }
  } catch (error) {
    console.error("[Agent] Error searching movies:", error)
  }

  // Fallback mock data for development
  const mockResults: MovieSearchResult[] = [
    {
      title: "The Grand Budapest Hotel",
      year: 2014,
      imdbId: "tt2278388",
      runtime: 99,
      genres: ["Comedy", "Drama"],
      streamingPlatforms: ["Disney+"],
      rating: 8.1,
    },
    {
      title: "Knives Out",
      year: 2019,
      imdbId: "tt8946378",
      runtime: 130,
      genres: ["Comedy", "Crime", "Drama"],
      streamingPlatforms: ["Prime Video"],
      rating: 7.9,
    },
    {
      title: "Everything Everywhere All at Once",
      year: 2022,
      imdbId: "tt6710474",
      runtime: 139,
      genres: ["Action", "Adventure", "Comedy"],
      streamingPlatforms: ["Paramount+"],
      rating: 7.8,
    },
  ]

  return {
    searchResults: mockResults,
    currentStep: "reading_reviews",
  }
}

// Node: Read and analyze reviews for top candidates
async function readReviews(state: AgentState): Promise<Partial<AgentState>> {
  console.log("[Agent] Reading reviews...")

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
    const content = response.content as string

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const reviews = JSON.parse(jsonMatch[0]) as MovieReview[]
      return {
        reviews,
        currentStep: "generating_recommendations",
      }
    }
  } catch (error) {
    console.error("[Agent] Error reading reviews:", error)
  }

  return {
    reviews: [],
    currentStep: "generating_recommendations",
  }
}

// Node: Generate final personalized recommendations
async function generateRecommendations(state: AgentState): Promise<Partial<AgentState>> {
  console.log("[Agent] Generating personalized recommendations...")

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
    console.log("[Agent] Recommendations response length:", content.length)

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]) as MovieRecommendation[]
      console.log("[Agent] Parsed", recommendations.length, "recommendations")
      return {
        recommendations,
        currentStep: "complete",
      }
    } else {
      console.error("[Agent] No JSON array found in response")
    }
  } catch (error) {
    console.error("[Agent] Error generating recommendations:", error)
  }

  return {
    recommendations: [],
    currentStep: "error",
    error: "Failed to generate recommendations. Please try again.",
  }
}

// Handle errors
async function handleError(state: AgentState): Promise<Partial<AgentState>> {
  return {
    currentStep: "error",
    error: state.error || "An unexpected error occurred",
  }
}

// Routing function
function routeAfterAnalysis(state: AgentState): string {
  if (state.error) return "handleError"
  return "searchMovies"
}

function routeAfterSearch(state: AgentState): string {
  if (state.error) return "handleError"
  if (state.searchResults.length === 0) return "handleError"
  return "readReviews"
}

function routeAfterReviews(state: AgentState): string {
  if (state.error) return "handleError"
  return "generateRecommendations"
}

// Build the graph
export function createMovieRecommendationGraph() {
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

export type { AgentState }
