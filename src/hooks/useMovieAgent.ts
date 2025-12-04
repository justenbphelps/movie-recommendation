import { useState, useCallback } from "react"
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
      // Simulate progress through steps while the API call is made
      const progressSteps: AgentStep[] = [
        "searching_movies",
        "reading_reviews",
        "generating_recommendations",
      ]

      let stepIndex = 0
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setCurrentStep(progressSteps[stepIndex])
          stepIndex++
        }
      }, 2000)

      const response = await fetch("/.netlify/functions/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setCurrentStep("error")
      } else {
        setRecommendations(data.recommendations || [])
        setCurrentStep("complete")
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
