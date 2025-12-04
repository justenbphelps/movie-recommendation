# Movie Night Agent 🎬

End the endless scrolling. Get personalized movie recommendations in seconds.

## What it does

Movie Night Agent helps users cut through streaming decision paralysis. Input your mood (cozy, thrilling, funny), who you're watching with (solo, date, family), how much time you have, and optionally what you've enjoyed recently. The agent searches across streaming platforms, reads reviews, and returns 3 tailored recommendations with a personalized explanation of why each fits your situation.

## Core Value

Solves a real nightly frustration. The "why this fits" reasoning makes it feel personal rather than algorithmic.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **AI Agent**: LangChain + LangGraph
- **LLM**: Anthropic Claude
- **Observability**: LangSmith (optional)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Anthropic API key

### Installation

1. Clone the repository and navigate to the project:
   ```bash
   cd movie-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your Anthropic API key:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-api-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5173 in your browser.

## Project Structure

```
movie-agent/
├── src/
│   ├── agent/
│   │   └── graph.ts          # LangGraph agent definition
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── AgentProgress.tsx # Progress indicator
│   │   ├── PreferencesForm.tsx
│   │   └── RecommendationCard.tsx
│   ├── hooks/
│   │   └── useMovieAgent.ts  # React hook for agent
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Agent Architecture

The movie recommendation agent uses LangGraph to orchestrate a multi-step workflow:

```
┌─────────────────────┐
│   User Preferences  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Analyze Preferences │ ← Understand mood & context
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Search Movies     │ ← Find candidates matching criteria
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Read Reviews      │ ← Gather sentiment & insights
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Generate Recs       │ ← Craft personalized "why it fits"
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3 Recommendations  │
└─────────────────────┘
```

## Customization

### Adding More Moods

Edit `src/types/index.ts` to add new mood options:

```typescript
export type Mood = "cozy" | "thrilling" | "funny" | "dramatic" | "romantic" | "thought-provoking" | "your-new-mood"
```

Then update `src/components/PreferencesForm.tsx` to include the new option in the `MOODS` array.

### Integrating Real APIs

The agent currently uses LLM-generated recommendations. To integrate real streaming APIs:

1. Add API clients in `src/lib/` for services like JustWatch, TMDB, etc.
2. Modify `searchMovies` node in `src/agent/graph.ts` to call real APIs
3. Add actual review aggregation in `readReviews` node

### Enabling LangSmith Tracing

1. Create an account at [smith.langchain.com](https://smith.langchain.com)
2. Create a new project
3. Add your API key to `.env`:
   ```
   VITE_LANGSMITH_API_KEY=lsv2_your-key
   VITE_LANGSMITH_PROJECT=movie-agent
   LANGCHAIN_TRACING_V2=true
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Adding More shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

## License

MIT
