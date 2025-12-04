import type { Handler } from "@netlify/functions"
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

// Initialize the LLM
function getLLM() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set")
  }
  return new ChatAnthropic({
    model: "claude-3-5-haiku-latest",
    temperature: 0.7,
    anthropicApiKey: apiKey,
    maxTokens: 4096,
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

// Generate recommendations with a single LLM call
async function getRecommendations(preferences: UserPreferences): Promise<MovieRecommendation[]> {
  const llm = getLLM()
  const { mood, watchingWith, availableTime, recentlyEnjoyed } = preferences

  const prompt = `You are a movie expert. Recommend 10 movies based on:
- Mood: ${mood}
- Watching with: ${watchingWith}  
- Max runtime: ${availableTime} min
${recentlyEnjoyed ? `- Liked: ${recentlyEnjoyed}` : ""}

Return JSON array with 10 movies:
[{"title":"...","year":2020,"runtime":100,"streamingPlatforms":["Netflix"],"rating":8.0,"genres":["Drama"],"whyItFits":"...","plot":"...","imdbId":"tt1234567"}]

JSON only, no other text.`

  const response = await llm.invoke(prompt)
  const content = getResponseText(response.content)
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as MovieRecommendation[]
  }
  
  throw new Error("Failed to parse recommendations from LLM response")
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

    const recommendations = await getRecommendations(preferences)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recommendations }),
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
