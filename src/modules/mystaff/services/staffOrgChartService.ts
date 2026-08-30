// src/modules/mystaff/services/staffOrgChartService.ts
// Enterprise Organizational Chart Cloud Persistence & Realtime Synchronization

import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { OrgNode } from '../pages/StaffOrgChartPage'

export const DEFAULT_HOSPITAL_ID = '85bb6adc-b868-428b-83f4-e5af2f5cf904' // Hospital Lawas
export const DEFAULT_CHART_KEY = 'main_org_chart'
const CACHE_KEY_PREFIX = 'mystaff_org_chart_cache_'

const getCacheKey = (hospitalId: string, chartKey: string) =>
  `${CACHE_KEY_PREFIX}${hospitalId}_${chartKey}`

/**
 * Retrieve cached org chart from localStorage for immediate 0ms load
 */
export const getCachedOrgChart = (
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  chartKey: string = DEFAULT_CHART_KEY
): OrgNode | null => {
  try {
    const raw = localStorage.getItem(getCacheKey(hospitalId, chartKey))
    if (!raw) return null
    return JSON.parse(raw) as OrgNode
  } catch (err) {
    console.warn('[StaffOrgChartService] Failed to read localStorage cache:', err)
    return null
  }
}

/**
 * Cache org chart locally in localStorage
 */
export const setCachedOrgChart = (
  chartData: OrgNode,
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  chartKey: string = DEFAULT_CHART_KEY
): void => {
  try {
    localStorage.setItem(getCacheKey(hospitalId, chartKey), JSON.stringify(chartData))
  } catch (err) {
    console.warn('[StaffOrgChartService] Failed to write localStorage cache:', err)
  }
}

/**
 * Fetch the latest organizational chart from Supabase Postgres cloud database
 */
export async function fetchOrgChartFromCloud(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  chartKey: string = DEFAULT_CHART_KEY
): Promise<{ data: OrgNode | null; source: 'cloud' | 'cache' | 'none'; error?: any }> {
  if (!isSupabaseConfigured()) {
    const cached = getCachedOrgChart(hospitalId, chartKey)
    return { data: cached, source: cached ? 'cache' : 'none' }
  }

  try {
    const { data, error } = await supabase
      .from('staff_org_chart')
      .select('chart_data, version, updated_at')
      .eq('hospital_id', hospitalId)
      .eq('chart_key', chartKey)
      .maybeSingle()

    if (error) {
      console.warn('[StaffOrgChartService] Cloud fetch error, using cache:', error.message)
      const cached = getCachedOrgChart(hospitalId, chartKey)
      return { data: cached, source: cached ? 'cache' : 'none', error }
    }

    if (data?.chart_data) {
      const tree = data.chart_data as OrgNode
      setCachedOrgChart(tree, hospitalId, chartKey)
      return { data: tree, source: 'cloud' }
    }

    const cached = getCachedOrgChart(hospitalId, chartKey)
    return { data: cached, source: cached ? 'cache' : 'none' }
  } catch (err) {
    console.error('[StaffOrgChartService] Exception fetching cloud org chart:', err)
    const cached = getCachedOrgChart(hospitalId, chartKey)
    return { data: cached, source: cached ? 'cache' : 'none', error: err }
  }
}

/**
 * Save / Upsert organizational chart to Supabase cloud database & update local cache
 */
export async function saveOrgChartToCloud(
  chartData: OrgNode,
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  chartKey: string = DEFAULT_CHART_KEY,
  userId?: string
): Promise<{ success: boolean; error?: any }> {
  // Always update local cache immediately
  setCachedOrgChart(chartData, hospitalId, chartKey)

  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase
      .from('staff_org_chart')
      .upsert(
        {
          hospital_id: hospitalId,
          chart_key: chartKey,
          chart_data: chartData,
          updated_by: userId || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'hospital_id,chart_key' }
      )

    if (error) {
      console.error('[StaffOrgChartService] Failed to upsert org chart to cloud:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (err) {
    console.error('[StaffOrgChartService] Exception saving org chart to cloud:', err)
    return { success: false, error: err }
  }
}

/**
 * Subscribe to realtime updates on staff_org_chart for instant cross-device synchronization
 */
export function subscribeToOrgChartCloud(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  chartKey: string = DEFAULT_CHART_KEY,
  onUpdate: (chartData: OrgNode) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {}
  }

  const channelName = `realtime:staff_org_chart:${hospitalId}:${chartKey}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'staff_org_chart',
        filter: `hospital_id=eq.${hospitalId}`,
      },
      (payload: any) => {
        if (payload?.new && payload.new.chart_key === chartKey && payload.new.chart_data) {
          const freshTree = payload.new.chart_data as OrgNode
          setCachedOrgChart(freshTree, hospitalId, chartKey)
          onUpdate(freshTree)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
