import { useState, useCallback } from "react"
import { createMovieRecommendationGraph, type AgentState } from "@/agent/graph"
import type { UserPreferences, MovieRecommendation, AgentStep } from "@/types"

interface UseMovieAgentReturn {
  recommendations: MovieRecommendation[]
  currentStep: AgentStep
  isLoading: boolean
  error: string | undefined
  getRecommendations: (preferences: UserPreferences) => Promise<void>
  reset: () => void
}

export function useMovieAgent(): UseMovieAgentReturn {
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([])
  const [currentStep, setCurrentStep] = useState<AgentStep>("idle")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const getRecommendations = useCallback(async (preferences: UserPreferences) => {
    setIsLoading(true)
    setError(undefined)
    setRecommendations([])
    setCurrentStep("analyzing_preferences")

    try {
      const graph = createMovieRecommendationGraph()

      const initialState: Partial<AgentState> = {
        userPreferences: preferences,
        searchResults: [],
        reviews: [],
        recommendations: [],
        currentStep: "analyzing_preferences",
      }

      // Stream the state updates
      const stream = await graph.stream(initialState, {
        streamMode: "values",
      })

      let finalState: AgentState | null = null

      for await (const state of stream) {
        finalState = state as AgentState
        setCurrentStep(finalState.currentStep)

        if (finalState.error) {
          setError(finalState.error)
        }
      }

      if (finalState?.recommendations) {
        setRecommendations(finalState.recommendations)
      }
    } catch (err) {
      console.error("Agent error:", err)
      setError(err instanceof Error ? err.message : "Failed to get recommendations")
      setCurrentStep("error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setRecommendations([])
    setCurrentStep("idle")
    setIsLoading(false)
    setError(undefined)
  }, [])

  return {
    recommendations,
    currentStep,
    isLoading,
    error,
    getRecommendations,
    reset,
  }
}
