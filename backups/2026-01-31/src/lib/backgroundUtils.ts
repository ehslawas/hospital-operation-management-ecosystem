/**
 * Get time-based background configuration
 * Changes based on time of day to create dynamic, government-appropriate backgrounds
 */

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night'

export interface BackgroundConfig {
  timeOfDay: TimeOfDay
  gradient: string
  overlay: string
  accentColor: string
  greeting: string
}

/**
 * Get current time of day
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'evening'
  return 'night'
}

/**
 * Get background configuration based on time of day
 */
export function getBackgroundConfig(): BackgroundConfig {
  const timeOfDay = getTimeOfDay()

  const configs: Record<TimeOfDay, BackgroundConfig> = {
    dawn: {
      timeOfDay: 'dawn',
      gradient: 'from-blue-900 via-purple-800 to-pink-700',
      overlay: 'bg-gradient-to-br from-blue-900/90 via-purple-800/90 to-pink-700/90',
      accentColor: 'text-yellow-300',
      greeting: 'Selamat Pagi',
    },
    morning: {
      timeOfDay: 'morning',
      gradient: 'from-blue-600 via-cyan-500 to-teal-600',
      overlay: 'bg-gradient-to-br from-blue-600/95 via-cyan-500/95 to-teal-600/95',
      accentColor: 'text-yellow-200',
      greeting: 'Selamat Pagi',
    },
    afternoon: {
      timeOfDay: 'afternoon',
      gradient: 'from-teal-600 via-emerald-500 to-green-600',
      overlay: 'bg-gradient-to-br from-teal-600/95 via-emerald-500/95 to-green-600/95',
      accentColor: 'text-yellow-200',
      greeting: 'Selamat Petang',
    },
    evening: {
      timeOfDay: 'evening',
      gradient: 'from-orange-600 via-red-500 to-pink-600',
      overlay: 'bg-gradient-to-br from-orange-600/95 via-red-500/95 to-pink-600/95',
      accentColor: 'text-yellow-200',
      greeting: 'Selamat Petang',
    },
    night: {
      timeOfDay: 'night',
      gradient: 'from-indigo-900 via-purple-900 to-blue-900',
      overlay: 'bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-blue-900/95',
      accentColor: 'text-blue-200',
      greeting: 'Selamat Malam',
    },
  }

  return configs[timeOfDay]
}

/**
 * Get greeting message based on time
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Selamat Pagi'
  if (hour >= 12 && hour < 15) return 'Selamat Tengah Hari'
  if (hour >= 15 && hour < 19) return 'Selamat Petang'
  return 'Selamat Malam'
}

