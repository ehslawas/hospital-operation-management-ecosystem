// src/modules/myphis/services/myphisService.ts
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import type { ApiResponse } from '@/types';

export interface DiskChangeLog {
  id: string;
  tarikh: string; // YYYY-MM-DD
  waktu: string;  // HH:MM
  disk_label: string;
  status: 'completed' | 'failed' | 'pending';
  petugas_nama: string;
  dicatat_oleh?: string | null;
  nota?: string | null;
  hospital_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface NavigationLog {
  id: string;
  tarikh_masa: string;
  destination_url: string;
  destination_name: string;
  petugas_nama: string;
  dicatat_oleh?: string | null;
  hospital_id: string;
}

const STORAGE_PREFIX = 'myphis_';

const getLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(STORAGE_PREFIX + key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalData = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
};

// Seed initial mock logs if not present in localStorage
export const initMockData = (hospitalId: string) => {
  if (!localStorage.getItem(STORAGE_PREFIX + 'disk_changes')) {
    const today = new Date();
    const mockChanges: DiskChangeLog[] = [];
    
    // Generate mock changes for the last 14 days
    // Skip yesterday (simulating a missed disk change) and one weekend day to demonstrate status tracking
    for (let i = 14; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      
      // Skip yesterday's disk change (day = today - 1)
      if (i === 1) {
        continue;
      }
      // Skip Saturday (simulating a missed weekend disk change)
      if (i === 6) {
        continue;
      }
      
      const labels = ['DISK-SUN', 'DISK-MON', 'DISK-TUE', 'DISK-WED', 'DISK-THU', 'DISK-FRI', 'DISK-SAT'];
      const label = labels[dayOfWeek];
      
      mockChanges.push({
        id: `mock-disk-${i}`,
        tarikh: dateString,
        waktu: '09:15',
        disk_label: label,
        status: 'completed',
        petugas_nama: i % 2 === 0 ? 'Muhammad Farhan' : 'Amirul Azhar',
        dicatat_oleh: 'user-1',
        nota: 'PHiS Server backup disk swap completed successfully.',
        hospital_id: hospitalId,
        created_at: new Date(d.setHours(9, 15, 0)).toISOString(),
        updated_at: new Date(d.setHours(9, 15, 0)).toISOString(),
      });
    }
    
    setLocalData('disk_changes', mockChanges);
  }

  if (!localStorage.getItem(STORAGE_PREFIX + 'nav_logs')) {
    const mockNavs: NavigationLog[] = [
      {
        id: 'mock-nav-1',
        tarikh_masa: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        destination_url: 'https://myphis.gov.my',
        destination_name: 'Official PHiS Web Portal',
        petugas_nama: 'Muhammad Farhan',
        dicatat_oleh: 'user-1',
        hospital_id: hospitalId,
      },
      {
        id: 'mock-nav-2',
        tarikh_masa: new Date(Date.now() - 3600000 * 24).toISOString(),
        destination_url: 'https://helpdesk.myphis.gov.my',
        destination_name: 'PHiS Helpdesk & Support',
        petugas_nama: 'Amirul Azhar',
        dicatat_oleh: 'user-2',
        hospital_id: hospitalId,
      }
    ];
    setLocalData('nav_logs', mockNavs);
  }
};

/**
 * Logs when a user clicks to navigate to an external PHiS portal
 */
export async function logExternalNavigation(
  destinationUrl: string,
  destinationName: string,
  petugasNama: string,
  userId: string,
  hospitalId: string
): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('myphis_navigation_logs').insert({
        destination_url: destinationUrl,
        destination_name: destinationName,
        petugas_nama: petugasNama,
        dicatat_oleh: userId,
        hospital_id: hospitalId,
      });
      if (error) throw error;
      return { data: true, error: null };
    } else {
      initMockData(hospitalId);
      const navLogs = getLocalData<NavigationLog[]>('nav_logs', []);
      const newLog: NavigationLog = {
        id: `nav-${Date.now()}`,
        tarikh_masa: new Date().toISOString(),
        destination_url: destinationUrl,
        destination_name: destinationName,
        petugas_nama: petugasNama,
        dicatat_oleh: userId,
        hospital_id: hospitalId,
      };
      setLocalData('nav_logs', [newLog, ...navLogs]);
      return { data: true, error: null };
    }
  } catch (err: any) {
    console.error('Error logging external navigation:', err);
    return { data: false, error: err.message || 'Failed to log external navigation' };
  }
}

/**
 * Fetches disk change logs for a hospital
 */
export async function getDiskChangeLogs(
  hospitalId: string
): Promise<ApiResponse<DiskChangeLog[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('myphis_disk_changes')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('tarikh', { ascending: false });
      if (error) throw error;
      return { data: data || [], error: null };
    } else {
      initMockData(hospitalId);
      const logs = getLocalData<DiskChangeLog[]>('disk_changes', []);
      // Filter by hospital and sort descending by date
      const filtered = logs
        .filter(l => l.hospital_id === hospitalId)
        .sort((a, b) => b.tarikh.localeCompare(a.tarikh));
      return { data: filtered, error: null };
    }
  } catch (err: any) {
    console.error('Error fetching disk change logs:', err);
    return { data: [], error: err.message || 'Failed to retrieve disk change logs' };
  }
}

/**
 * Saves a new daily disk change log (uses upsert to enforce uniqueness per date per hospital)
 */
export async function saveDiskChangeLog(
  log: Omit<DiskChangeLog, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<DiskChangeLog>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('myphis_disk_changes')
        .upsert(
          {
            tarikh: log.tarikh,
            waktu: log.waktu,
            disk_label: log.disk_label,
            status: log.status,
            petugas_nama: log.petugas_nama,
            dicatat_oleh: log.dicatat_oleh,
            nota: log.nota,
            hospital_id: log.hospital_id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tarikh,hospital_id' }
        )
        .select()
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } else {
      initMockData(log.hospital_id);
      const logs = getLocalData<DiskChangeLog[]>('disk_changes', []);
      
      // Check if a record for this date and hospital already exists
      const existingIdx = logs.findIndex(l => l.tarikh === log.tarikh && l.hospital_id === log.hospital_id);
      
      const savedLog: DiskChangeLog = {
        id: existingIdx !== -1 ? logs[existingIdx].id : `disk-${Date.now()}`,
        tarikh: log.tarikh,
        waktu: log.waktu,
        disk_label: log.disk_label,
        status: log.status,
        petugas_nama: log.petugas_nama,
        dicatat_oleh: log.dicatat_oleh,
        nota: log.nota,
        hospital_id: log.hospital_id,
        created_at: existingIdx !== -1 ? logs[existingIdx].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (existingIdx !== -1) {
        logs[existingIdx] = savedLog;
      } else {
        logs.unshift(savedLog);
      }
      
      setLocalData('disk_changes', logs);
      return { data: savedLog, error: null };
    }
  } catch (err: any) {
    console.error('Error saving disk change log:', err);
    return { data: null, error: err.message || 'Failed to save disk change log' };
  }
}

/**
 * Fetches navigation history logs for audit display
 */
export async function getNavigationLogs(
  hospitalId: string
): Promise<ApiResponse<NavigationLog[]>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('myphis_navigation_logs')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('tarikh_masa', { ascending: false })
        .limit(20);
      if (error) throw error;
      return { data: data || [], error: null };
    } else {
      initMockData(hospitalId);
      const logs = getLocalData<NavigationLog[]>('nav_logs', []);
      const filtered = logs
        .filter(l => l.hospital_id === hospitalId)
        .sort((a, b) => b.tarikh_masa.localeCompare(a.tarikh_masa))
        .slice(0, 20);
      return { data: filtered, error: null };
    }
  } catch (err: any) {
    console.error('Error fetching navigation logs:', err);
    return { data: [], error: err.message || 'Failed to retrieve navigation logs' };
  }
}
