/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_SERPER_API_KEY?: string // For web search integration
  readonly VITE_TAVILY_API_KEY?: string // Alternative web search
  readonly VITE_GROK_API_KEY?: string // Grok Vision API for LPO analysis
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

