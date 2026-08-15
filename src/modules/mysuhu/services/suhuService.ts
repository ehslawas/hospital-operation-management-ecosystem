// src/modules/mysuhu/services/suhuService.ts
// MySuhu temperature monitoring service with Supabase and localStorage fallback

import { supabase, isSupabaseConfigured } from '@/services/supabase';
import type { ApiResponse } from '@/types';
import type {
  Lokasi,
  UnitPemantauan,
  AmbangSuhu,
  BacaanSuhu,
  UnitPemantauanWithRelations,
  BacaanSuhuWithRelations,
} from '@/types/mysuhu';

// Helper to get default thresholds based on unit type
export function getDefaultThresholds(jenisUnit?: string): { min_suhu: number; max_suhu: number } {
  switch (jenisUnit) {
    case 'freezer':
      return { min_suhu: -25, max_suhu: -15 };
    case 'ambient':
      return { min_suhu: 18, max_suhu: 25 };
    case 'incubator':
      return { min_suhu: 35, max_suhu: 39 };
    case 'other':
      return { min_suhu: 0, max_suhu: 40 };
    case 'refrigerator':
    default:
      return { min_suhu: 2, max_suhu: 8 };
  }
}

// Helper to determine reading status (normal, warning, breach)
export function calculateReadingStatus(suhu: number, min: number, max: number): 'normal' | 'warning' | 'breach' {
  if (suhu < min || suhu > max) return 'breach';
  return 'normal';
}

export function calculateReadingStatusWithRange(
  suhu: number,
  suhuMin: number,
  suhuMax: number,
  minLimit: number,
  maxLimit: number
): 'normal' | 'warning' | 'breach' {
  if (suhuMin < minLimit || suhuMax > maxLimit || suhu < minLimit || suhu > maxLimit) {
    return 'breach';
  }
  return 'normal';
}

// ============================================
// LOCAL STORAGE MOCK DATA SYSTEM
// ============================================
const STORAGE_PREFIX = 'mysuhu_mock_';

const getMockData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(STORAGE_PREFIX + key);
  return data ? JSON.parse(data) : defaultValue;
};

const setMockData = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
};

// Seed initial mock data if empty
// Seed initial mock data if empty
const initMockData = () => {
  // Clear old mock data if it contains the old location names
  const existingLocations = localStorage.getItem(STORAGE_PREFIX + 'lokasi');
  if (existingLocations && (!existingLocations.includes('department_id') || existingLocations.includes('Pharmacy Logistics'))) {
    localStorage.removeItem(STORAGE_PREFIX + 'lokasi');
    localStorage.removeItem(STORAGE_PREFIX + 'unit_pemantauan');
    localStorage.removeItem(STORAGE_PREFIX + 'ambang_suhu');
    localStorage.removeItem(STORAGE_PREFIX + 'bacaan_suhu');
  }

  if (!localStorage.getItem(STORAGE_PREFIX + 'lokasi')) {
    const initialLokasi: Lokasi[] = [
      {
        id: 'loc-1',
        kod_lokasi: 'LOK-FL',
        nama_lokasi: 'Farmasi Logistik',
        jabatan: 'Farmasi',
        deskripsi: 'Stor Logistik Farmasi Utama',
        status: 'active',
        hospital_id: 'hosp-1',
        department_id: '7a3bd6c4-c8e6-491b-8441-0ee9bd73f880',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'loc-2',
        kod_lokasi: 'LOK-SF',
        nama_lokasi: 'Satelit Farmasi',
        jabatan: 'Farmasi',
        deskripsi: 'Satelit Farmasi Klinik Pakar',
        status: 'active',
        hospital_id: 'hosp-1',
        department_id: '0c6c6f1b-d3b6-4779-91c3-536956858fca',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'loc-3',
        kod_lokasi: 'LOK-GW',
        nama_lokasi: 'General Ward',
        jabatan: 'Wad',
        deskripsi: 'Wad Am / General Ward',
        status: 'active',
        hospital_id: 'hosp-1',
        department_id: '2fa7312e-8d31-4612-b66b-045706fc6401',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'loc-4',
        kod_lokasi: 'LOK-PW',
        nama_lokasi: 'Paediatric Ward',
        jabatan: 'Wad',
        deskripsi: 'Wad Kanak-Kanak / Paediatric Ward',
        status: 'active',
        hospital_id: 'hosp-1',
        department_id: '9e864dc8-6a6c-47c6-9d74-57d87ccd06e9',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'loc-5',
        kod_lokasi: 'LOK-ET',
        nama_lokasi: 'Emergency & Trauma',
        jabatan: 'Kecemasan',
        deskripsi: 'Jabatan Kecemasan & Trauma',
        status: 'active',
        hospital_id: 'hosp-1',
        department_id: '6135bb5c-864e-4926-b3d7-59394884abd4',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const initialUnits: UnitPemantauan[] = [
      {
        id: 'unit-1',
        lokasi_id: 'loc-1',
        unit_id: 'SHU-001',
        nama_unit: 'Logistics Freezer 1',
        jenis_unit: 'freezer',
        nota: 'Sanyo Biomedical Freezer model MDF-U5312',
        status: 'active',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'unit-2',
        lokasi_id: 'loc-1',
        unit_id: 'SHU-002',
        nama_unit: 'Logistics Refrigerator 2',
        jenis_unit: 'refrigerator',
        nota: 'Panasonic Pharmacy Refrigerator MPR-721',
        status: 'active',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'unit-3',
        lokasi_id: 'loc-2',
        unit_id: 'SHU-003',
        nama_unit: 'Satelit Refrigerator 1',
        jenis_unit: 'refrigerator',
        nota: 'Panasonic Pharmacy Refrigerator MPR-721',
        status: 'active',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'unit-4',
        lokasi_id: 'loc-3',
        unit_id: 'SHU-004',
        nama_unit: 'Ward Refrigerator 1',
        jenis_unit: 'refrigerator',
        nota: 'Ward vaccine and medicine fridge',
        status: 'active',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const initialThresholds: AmbangSuhu[] = [
      {
        id: 'amb-1',
        unit_id: 'unit-1',
        min_suhu: -25,
        max_suhu: -15,
        effective_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        effective_until: null,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'amb-2',
        unit_id: 'unit-2',
        min_suhu: 2,
        max_suhu: 8,
        effective_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        effective_until: null,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'amb-3',
        unit_id: 'unit-3',
        min_suhu: 2,
        max_suhu: 8,
        effective_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        effective_until: null,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'amb-4',
        unit_id: 'unit-4',
        min_suhu: 2,
        max_suhu: 8,
        effective_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        effective_until: null,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      }
    ];

    // Create 7 days of historical readings
    const initialReadings: BacaanSuhu[] = [];
    const now = Date.now();
    
    // Generating historic logs for Unit 1 and Unit 2
    for (let day = 7; day >= 0; day--) {
      // 2 readings per day (morning shift, evening shift)
      const dayMs = day * 24 * 60 * 60 * 1000;
      
      // Unit 1 Freezer (Safe: -25 to -15)
      // Morning
      let time = new Date(now - dayMs - 4 * 60 * 60 * 1000);
      let temp = -20 + Math.random() * 4 - 2; // -22 to -18
      initialReadings.push({
        id: `read-u1-m-${day}`,
        unit_id: 'unit-1',
        suhu: Number(temp.toFixed(1)),
        status_bacaan: 'normal',
        ambang_id: 'amb-1',
        tarikh_masa: time.toISOString(),
        dicatat_pada: time.toISOString(),
        dicatat_oleh: 'user-1',
        nota: null,
        is_corrected: false,
        correction_note: null,
        updated_at: time.toISOString()
      });

      // Evening
      time = new Date(now - dayMs);
      // Simulate a breach on day 3
      temp = (day === 3) ? -14.2 : -20 + Math.random() * 4 - 2;
      initialReadings.push({
        id: `read-u1-e-${day}`,
        unit_id: 'unit-1',
        suhu: Number(temp.toFixed(1)),
        status_bacaan: (day === 3) ? 'breach' : calculateReadingStatus(temp, -25, -15),
        ambang_id: 'amb-1',
        tarikh_masa: time.toISOString(),
        dicatat_pada: time.toISOString(),
        dicatat_oleh: 'user-1',
        nota: (day === 3) ? 'Temperature increased slightly after defrost cycle' : null,
        is_corrected: false,
        correction_note: null,
        updated_at: time.toISOString()
      });

      // Unit 2 Refrigerator (Safe: 2 to 8)
      // Morning
      time = new Date(now - dayMs - 5 * 60 * 60 * 1000);
      temp = 4.5 + Math.random() * 2 - 1; // 3.5 to 5.5
      initialReadings.push({
        id: `read-u2-m-${day}`,
        unit_id: 'unit-2',
        suhu: Number(temp.toFixed(1)),
        status_bacaan: 'normal',
        ambang_id: 'amb-2',
        tarikh_masa: time.toISOString(),
        dicatat_pada: time.toISOString(),
        dicatat_oleh: 'user-1',
        nota: null,
        is_corrected: false,
        correction_note: null,
        updated_at: time.toISOString()
      });

      // Evening
      time = new Date(now - dayMs - 1 * 60 * 60 * 1000);
      // Simulate warning on day 5 (near upper limit)
      temp = (day === 5) ? 7.6 : 4.5 + Math.random() * 2 - 1;
      initialReadings.push({
        id: `read-u2-e-${day}`,
        unit_id: 'unit-2',
        suhu: Number(temp.toFixed(1)),
        status_bacaan: (day === 5) ? 'warning' : calculateReadingStatus(temp, 2, 8),
        ambang_id: 'amb-2',
        tarikh_masa: time.toISOString(),
        dicatat_pada: time.toISOString(),
        dicatat_oleh: 'user-1',
        nota: (day === 5) ? 'Temperature slightly elevated due to door being open for stock-in' : null,
        is_corrected: false,
        correction_note: null,
        updated_at: time.toISOString()
      });
    }

    setMockData('lokasi', initialLokasi);
    setMockData('unit_pemantauan', initialUnits);
    setMockData('ambang_suhu', initialThresholds);
    setMockData('bacaan_suhu', initialReadings);
  }
};

initMockData();

// ============================================
// SERVICE API METHODS
// ============================================

/**
 * Get all active/inactive locations for a hospital, optionally filtered by department
 */
export async function getLokasi(hospitalId: string, departmentId?: string): Promise<ApiResponse<Lokasi[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('lokasi')
        .select('*')
        .eq('hospital_id', hospitalId);
        
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }
      
      const { data, error } = await query.order('kod_lokasi', { ascending: true });
        
      if (error) throw error;
      return { data: data || [], error: null };
    } else {
      let locations = getMockData<Lokasi[]>('lokasi', []);
      if (departmentId) {
        locations = locations.filter(l => l.department_id === departmentId);
      }
      return { data: locations, error: null };
    }
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return { data: [], error: error.message || 'Failed to fetch locations' };
  }
}

/**
 * Create a new physical location
 */
export async function createLokasi(location: Omit<Lokasi, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Lokasi>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('lokasi')
        .insert(location)
        .select('*')
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } else {
      const locations = getMockData<Lokasi[]>('lokasi', []);
      const newLoc: Lokasi = {
        ...location,
        id: 'loc-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      locations.push(newLoc);
      setMockData('lokasi', locations);
      return { data: newLoc, error: null };
    }
  } catch (error: any) {
    console.error('Error creating location:', error);
    return { data: {} as Lokasi, error: error.message || 'Failed to create location' };
  }
}

/**
 * Update an existing location
 */
export async function updateLokasi(id: string, updates: Partial<Lokasi>): Promise<ApiResponse<Lokasi>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('lokasi')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } else {
      const locations = getMockData<Lokasi[]>('lokasi', []);
      const index = locations.findIndex(l => l.id === id);
      if (index === -1) throw new Error('Location not found');
      
      const updated = {
        ...locations[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      locations[index] = updated;
      setMockData('lokasi', locations);
      return { data: updated, error: null };
    }
  } catch (error: any) {
    console.error('Error updating location:', error);
    return { data: {} as Lokasi, error: error.message || 'Failed to update location' };
  }
}

/**
 * Get monitoring units under a location, optionally filtered by department
 */
export async function getUnitPemantauan(lokasiId?: string, departmentId?: string): Promise<ApiResponse<UnitPemantauanWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from('unit_pemantauan').select(`
        *,
        lokasi:lokasi!inner(*)
      `);
      if (lokasiId) {
        query = query.eq('lokasi_id', lokasiId);
      }
      if (departmentId) {
        query = query.eq('lokasi.department_id', departmentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch active thresholds and latest readings for these units
      const unitsWithData: UnitPemantauanWithRelations[] = [];
      for (const unit of (data || [])) {
        const { data: thresholds } = await supabase
          .from('ambang_suhu')
          .select('*')
          .eq('unit_id', unit.id)
          .is('effective_until', null)
          .maybeSingle();
          
        const { data: latestReading } = await supabase
          .from('bacaan_suhu')
          .select('*')
          .eq('unit_id', unit.id)
          .order('tarikh_masa', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        let status_pemantauan: 'normal' | 'warning' | 'breach' | 'no_reading' = 'no_reading';
        if (latestReading) {
          const diffHours = (Date.now() - new Date(latestReading.tarikh_masa).getTime()) / (1000 * 60 * 60);
          if (diffHours > 4) {
            status_pemantauan = 'no_reading';
          } else {
            status_pemantauan = latestReading.status_bacaan;
          }
        }

        unitsWithData.push({
          ...unit,
          active_threshold: thresholds,
          latest_reading: latestReading,
          status_pemantauan,
        });
      }
      return { data: unitsWithData, error: null };
    } else {
      const units = getMockData<UnitPemantauan[]>('unit_pemantauan', []);
      const locations = getMockData<Lokasi[]>('lokasi', []);
      const thresholds = getMockData<AmbangSuhu[]>('ambang_suhu', []);
      const readings = getMockData<BacaanSuhu[]>('bacaan_suhu', []);

      const filteredUnits = lokasiId ? units.filter(u => u.lokasi_id === lokasiId) : units;
      
      let res = filteredUnits.map(unit => {
        const lokasi = locations.find(l => l.id === unit.lokasi_id);
        const activeThreshold = thresholds.find(t => t.unit_id === unit.id && t.effective_until === null);
        
        // Find latest reading
        const unitReadings = readings.filter(r => r.unit_id === unit.id);
        unitReadings.sort((a, b) => new Date(b.tarikh_masa).getTime() - new Date(a.tarikh_masa).getTime());
        const latestReading = unitReadings[0] || null;

        let status_pemantauan: 'normal' | 'warning' | 'breach' | 'no_reading' = 'no_reading';
        if (latestReading) {
          const diffHours = (Date.now() - new Date(latestReading.tarikh_masa).getTime()) / (1000 * 60 * 60);
          if (diffHours > 4) {
            status_pemantauan = 'no_reading';
          } else {
            status_pemantauan = latestReading.status_bacaan as 'normal' | 'warning' | 'breach';
          }
        }

        return {
          ...unit,
          lokasi,
          active_threshold: activeThreshold || null,
          latest_reading: latestReading,
          status_pemantauan,
        };
      });

      if (departmentId) {
        res = res.filter(unit => unit.lokasi?.department_id === departmentId);
      }

      return { data: res, error: null };
    }
  } catch (error: any) {
    console.error('Error fetching units:', error);
    return { data: [], error: error.message || 'Failed to fetch monitoring units' };
  }
}

/**
 * Register a new Monitoring Unit
 */
export async function createUnitPemantauan(
  unit: Omit<UnitPemantauan, 'id' | 'created_at' | 'updated_at'>,
  minSuhu: number,
  maxSuhu: number
): Promise<ApiResponse<UnitPemantauanWithRelations>> {
  try {
    if (isSupabaseConfigured()) {
      // 1. Create the unit
      const { data: newUnit, error: unitErr } = await supabase
        .from('unit_pemantauan')
        .insert(unit)
        .select('*')
        .single();
        
      if (unitErr) throw unitErr;
      
      // 2. Set the default threshold config
      const { data: newThreshold, error: thresholdErr } = await supabase
        .from('ambang_suhu')
        .insert({
          unit_id: newUnit.id,
          min_suhu: minSuhu,
          max_suhu: maxSuhu,
          created_by: unit.created_by
        })
        .select('*')
        .single();
        
      if (thresholdErr) throw thresholdErr;
      
      return { 
        data: { ...newUnit, active_threshold: newThreshold, status_pemantauan: 'no_reading' }, 
        error: null 
      };
    } else {
      const units = getMockData<UnitPemantauan[]>('unit_pemantauan', []);
      const thresholds = getMockData<AmbangSuhu[]>('ambang_suhu', []);
      
      const newId = 'unit-' + Math.random().toString(36).substr(2, 9);
      const newUnitObj: UnitPemantauan = {
        ...unit,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const newThresholdObj: AmbangSuhu = {
        id: 'amb-' + Math.random().toString(36).substr(2, 9),
        unit_id: newId,
        min_suhu: minSuhu,
        max_suhu: maxSuhu,
        effective_from: new Date().toISOString(),
        effective_until: null,
        created_by: unit.created_by,
        created_at: new Date().toISOString(),
      };
      
      units.push(newUnitObj);
      thresholds.push(newThresholdObj);
      
      setMockData('unit_pemantauan', units);
      setMockData('ambang_suhu', thresholds);
      
      const locations = getMockData<Lokasi[]>('lokasi', []);
      const lokasi = locations.find(l => l.id === unit.lokasi_id);
      
      return {
        data: {
          ...newUnitObj,
          lokasi,
          active_threshold: newThresholdObj,
          status_pemantauan: 'no_reading'
        },
        error: null
      };
    }
  } catch (error: any) {
    console.error('Error registering monitoring unit:', error);
    return { data: {} as UnitPemantauanWithRelations, error: error.message || 'Failed to register monitoring unit' };
  }
}

/**
 * Update an existing unit and/or its status
 */
export async function updateUnitPemantauan(id: string, updates: Partial<UnitPemantauan>): Promise<ApiResponse<UnitPemantauan>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('unit_pemantauan')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } else {
      const units = getMockData<UnitPemantauan[]>('unit_pemantauan', []);
      const index = units.findIndex(u => u.id === id);
      if (index === -1) throw new Error('Unit not found');
      
      const updated = {
        ...units[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      units[index] = updated;
      setMockData('unit_pemantauan', units);
      return { data: updated, error: null };
    }
  } catch (error: any) {
    console.error('Error updating unit:', error);
    return { data: {} as UnitPemantauan, error: error.message || 'Failed to update unit' };
  }
}

/**
 * Configure temperature threshold values (closes old threshold, inserts new)
 */
export async function updateThresholdConfig(
  unitId: string,
  minSuhu: number,
  maxSuhu: number,
  userId: string
): Promise<ApiResponse<AmbangSuhu>> {
  try {
    if (isSupabaseConfigured()) {
      const now = new Date().toISOString();
      
      // 1. Set effective_until on the previous active threshold
      const { data: previousActive, error: fetchErr } = await supabase
        .from('ambang_suhu')
        .select('*')
        .eq('unit_id', unitId)
        .is('effective_until', null)
        .maybeSingle();
        
      if (fetchErr) throw fetchErr;
      
      if (previousActive) {
        const { error: closeErr } = await supabase
          .from('ambang_suhu')
          .update({ effective_until: now })
          .eq('id', previousActive.id);
          
        if (closeErr) throw closeErr;
      }
      
      // 2. Insert new active threshold
      const { data: newThreshold, error: insertErr } = await supabase
        .from('ambang_suhu')
        .insert({
          unit_id: unitId,
          min_suhu: minSuhu,
          max_suhu: maxSuhu,
          effective_from: now,
          created_by: userId
        })
        .select('*')
        .single();
        
      if (insertErr) throw insertErr;
      return { data: newThreshold, error: null };
    } else {
      const thresholds = getMockData<AmbangSuhu[]>('ambang_suhu', []);
      const now = new Date().toISOString();
      
      // Close previous threshold
      const activeIdx = thresholds.findIndex(t => t.unit_id === unitId && t.effective_until === null);
      if (activeIdx !== -1) {
        thresholds[activeIdx] = {
          ...thresholds[activeIdx],
          effective_until: now
        };
      }
      
      // Create new threshold
      const newThresholdObj: AmbangSuhu = {
        id: 'amb-' + Math.random().toString(36).substr(2, 9),
        unit_id: unitId,
        min_suhu: minSuhu,
        max_suhu: maxSuhu,
        effective_from: now,
        effective_until: null,
        created_by: userId,
        created_at: now
      };
      
      thresholds.push(newThresholdObj);
      setMockData('ambang_suhu', thresholds);
      return { data: newThresholdObj, error: null };
    }
  } catch (error: any) {
    console.error('Error updating threshold config:', error);
    return { data: {} as AmbangSuhu, error: error.message || 'Failed to update threshold config' };
  }
}

/**
 * Log a new temperature reading
 */
export async function logTemperature(
  unitId: string,
  suhu: number,
  tarikhMasa: string,
  dicatatOleh: string,
  nota?: string | null,
  suhuMin?: number,
  suhuMax?: number
): Promise<ApiResponse<BacaanSuhu>> {
  try {
    let activeThreshold: AmbangSuhu | null = null;
    const finalSuhuMin = suhuMin !== undefined ? suhuMin : suhu;
    const finalSuhuMax = suhuMax !== undefined ? suhuMax : suhu;
    
    if (isSupabaseConfigured()) {
      // 1. Fetch active threshold config
      const { data: threshold, error: thresholdErr } = await supabase
        .from('ambang_suhu')
        .select('*')
        .eq('unit_id', unitId)
        .is('effective_until', null)
        .maybeSingle();
        
      if (thresholdErr) throw thresholdErr;
      if (!threshold) throw new Error('No active threshold configured for this unit');
      activeThreshold = threshold;
      
      // Calculate status
      const status_bacaan = calculateReadingStatusWithRange(suhu, finalSuhuMin, finalSuhuMax, threshold.min_suhu, threshold.max_suhu);
      
      // 2. Insert reading
      const { data: reading, error: readErr } = await supabase
        .from('bacaan_suhu')
        .insert({
          unit_id: unitId,
          suhu,
          suhu_min: finalSuhuMin,
          suhu_max: finalSuhuMax,
          status_bacaan,
          ambang_id: threshold.id,
          tarikh_masa: tarikhMasa,
          dicatat_oleh: dicatatOleh,
          nota: nota || null
        })
        .select('*')
        .single();
        
      if (readErr) throw readErr;
      return { data: reading, error: null };
    } else {
      const thresholds = getMockData<AmbangSuhu[]>('ambang_suhu', []);
      const readings = getMockData<BacaanSuhu[]>('bacaan_suhu', []);
      
      const threshold = thresholds.find(t => t.unit_id === unitId && t.effective_until === null);
      if (!threshold) throw new Error('No active threshold configured for this unit');
      activeThreshold = threshold;

      const status_bacaan = calculateReadingStatusWithRange(suhu, finalSuhuMin, finalSuhuMax, threshold.min_suhu, threshold.max_suhu);
      
      const newReading: BacaanSuhu = {
        id: 'read-' + Math.random().toString(36).substr(2, 9),
        unit_id: unitId,
        suhu,
        suhu_min: finalSuhuMin,
        suhu_max: finalSuhuMax,
        status_bacaan,
        ambang_id: threshold.id,
        tarikh_masa: tarikhMasa,
        dicatat_pada: new Date().toISOString(),
        dicatat_oleh: dicatatOleh,
        nota: nota || null,
        is_corrected: false,
        correction_note: null,
        updated_at: new Date().toISOString()
      };
      
      readings.push(newReading);
      setMockData('bacaan_suhu', readings);
      return { data: newReading, error: null };
    }
  } catch (error: any) {
    console.error('Error logging temperature:', error);
    return { data: {} as BacaanSuhu, error: error.message || 'Failed to log temperature' };
  }
}

/**
 * Get readings for a monitoring unit (filter by date range)
 */
export async function getReadings(
  unitId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<BacaanSuhuWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('bacaan_suhu')
        .select(`
          *,
          unit:unit_pemantauan(*),
          ambang:ambang_suhu(*),
          dicatat_oleh_user:users(full_name, jawatan)
        `)
        .eq('unit_id', unitId)
        .order('tarikh_masa', { ascending: true });
        
      if (startDate) {
        query = query.gte('tarikh_masa', startDate);
      }
      if (endDate) {
        query = query.lte('tarikh_masa', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []) as BacaanSuhuWithRelations[], error: null };
    } else {
      const readings = getMockData<BacaanSuhu[]>('bacaan_suhu', []);
      const units = getMockData<UnitPemantauan[]>('unit_pemantauan', []);
      const thresholds = getMockData<AmbangSuhu[]>('ambang_suhu', []);
      
      const unit = units.find(u => u.id === unitId);

      let filteredReadings = readings.filter(r => r.unit_id === unitId);
      if (startDate) {
        filteredReadings = filteredReadings.filter(r => new Date(r.tarikh_masa) >= new Date(startDate));
      }
      if (endDate) {
        filteredReadings = filteredReadings.filter(r => new Date(r.tarikh_masa) <= new Date(endDate));
      }
      
      filteredReadings.sort((a, b) => new Date(a.tarikh_masa).getTime() - new Date(b.tarikh_masa).getTime());
      
      const result: BacaanSuhuWithRelations[] = filteredReadings.map(r => {
        const ambang = thresholds.find(t => t.id === r.ambang_id);
        return {
          ...r,
          unit,
          ambang,
          dicatat_oleh_user: r.dicatat_oleh ? { full_name: 'Staf Bertugas', jawatan: 'Juruteknik Farmasi' } : null
        };
      });

      return { data: result, error: null };
    }
  } catch (error: any) {
    console.error('Error fetching readings:', error);
    return { data: [], error: error.message || 'Failed to fetch temperature readings' };
  }
}

/**
 * Get all breach logs across units for quality audit, optionally filtered by department
 */
export async function getBreachLogs(
  hospitalId: string,
  startDate?: string,
  endDate?: string,
  departmentId?: string
): Promise<ApiResponse<BacaanSuhuWithRelations[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('bacaan_suhu')
        .select(`
          *,
          unit:unit_pemantauan!inner(*, lokasi!inner(*)),
          ambang:ambang_suhu(*),
          dicatat_oleh_user:users(full_name, jawatan)
        `)
        .eq('status_bacaan', 'breach')
        .eq('unit.lokasi.hospital_id', hospitalId)
        .order('tarikh_masa', { ascending: false });
        
      if (startDate) {
        query = query.gte('tarikh_masa', startDate);
      }
      if (endDate) {
        query = query.lte('tarikh_masa', endDate);
      }
      if (departmentId) {
        query = query.eq('unit.lokasi.department_id', departmentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []) as BacaanSuhuWithRelations[], error: null };
    } else {
      const readings = getMockData<BacaanSuhu[]>('bacaan_suhu', []);
      const units = getMockData<UnitPemantauan[]>('unit_pemantauan', []);
      const locations = getMockData<Lokasi[]>('lokasi', []);
      const thresholds = getMockData<AmbangSuhu[]>('ambang_suhu', []);
      
      let breachReadings = readings.filter(r => r.status_bacaan === 'breach');
      if (startDate) {
        breachReadings = breachReadings.filter(r => new Date(r.tarikh_masa) >= new Date(startDate));
      }
      if (endDate) {
        breachReadings = breachReadings.filter(r => new Date(r.tarikh_masa) <= new Date(endDate));
      }
      
      breachReadings.sort((a, b) => new Date(b.tarikh_masa).getTime() - new Date(a.tarikh_masa).getTime());
      
      const result: BacaanSuhuWithRelations[] = [];
      for (const r of breachReadings) {
        const unit = units.find(u => u.id === r.unit_id);
        if (!unit) continue;
        const lokasi = locations.find(l => l.id === unit.lokasi_id);
        if (!lokasi || lokasi.hospital_id !== hospitalId) continue;
        if (departmentId && lokasi.department_id !== departmentId) continue;
        
        const ambang = thresholds.find(t => t.id === r.ambang_id);
        
        result.push({
          ...r,
          unit: { ...unit, lokasi },
          ambang,
          dicatat_oleh_user: r.dicatat_oleh ? { full_name: 'Staf Bertugas', jawatan: 'Juruteknik Farmasi' } : null
        });
      }
      
      return { data: result, error: null };
    }
  } catch (error: any) {
    console.error('Error fetching breach logs:', error);
    return { data: [], error: error.message || 'Failed to fetch breach logs' };
  }
}

/**
 * Annotate a reading in case of errors (correction notes)
 */
export async function annotateReading(
  readingId: string,
  correctionNote: string
): Promise<ApiResponse<BacaanSuhu>> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('bacaan_suhu')
        .update({
          is_corrected: true,
          correction_note: correctionNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', readingId)
        .select('*')
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } else {
      const readings = getMockData<BacaanSuhu[]>('bacaan_suhu', []);
      const index = readings.findIndex(r => r.id === readingId);
      if (index === -1) throw new Error('Reading not found');
      
      const updated = {
        ...readings[index],
        is_corrected: true,
        correction_note: correctionNote,
        updated_at: new Date().toISOString()
      };
      readings[index] = updated;
      setMockData('bacaan_suhu', readings);
      return { data: updated, error: null };
    }
  } catch (error: any) {
    console.error('Error annotating reading:', error);
    return { data: {} as BacaanSuhu, error: error.message || 'Failed to annotate reading' };
  }
}
 
/**
 * Delete auto-plotted compliance readings for a unit in a date range
 */
export async function deleteAutoPlottedReadings(
  unitId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('bacaan_suhu')
        .delete()
        .eq('unit_id', unitId)
        .eq('nota', 'Auto-plotted compliance reading')
        .gte('tarikh_masa', startDate)
        .lte('tarikh_masa', endDate);
        
      if (error) throw error;
      return { data: true, error: null };
    } else {
      const readings = getMockData<BacaanSuhu[]>('bacaan_suhu', []);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const filtered = readings.filter(r => {
        if (r.unit_id !== unitId) return true;
        if (r.nota !== 'Auto-plotted compliance reading') return true;
        const time = new Date(r.tarikh_masa);
        if (time >= start && time <= end) return false;
        return true;
      });
      
      setMockData('bacaan_suhu', filtered);
      return { data: true, error: null };
    }
  } catch (error: any) {
    console.error('Error deleting auto-plotted readings:', error);
    return { data: false, error: error.message || 'Failed to delete auto-plotted readings' };
  }
}

/**
 * Update temperature values of an existing reading
 */
export async function updateReadingValues(
  readingId: string,
  suhu: number,
  suhuMin: number,
  suhuMax: number,
  tarikhMasa?: string
): Promise<ApiResponse<BacaanSuhu>> {
  try {
    if (isSupabaseConfigured()) {
      const updateData: any = {
        suhu,
        suhu_min: suhuMin,
        suhu_max: suhuMax,
        updated_at: new Date().toISOString()
      };
      if (tarikhMasa) {
        updateData.tarikh_masa = tarikhMasa;
      }
      const { data, error } = await supabase
        .from('bacaan_suhu')
        .update(updateData)
        .eq('id', readingId)
        .select('*')
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } else {
      const readings = getMockData<BacaanSuhu[]>('bacaan_suhu', []);
      const index = readings.findIndex(r => r.id === readingId);
      if (index === -1) throw new Error('Reading not found');
      
      const thresholds = getMockData<AmbangSuhu[]>('ambang_suhu', []);
      const threshold = thresholds.find(t => t.id === readings[index].ambang_id) ||
                        thresholds.find(t => t.unit_id === readings[index].unit_id && t.effective_until === null);
      
      const newStatus = threshold
        ? calculateReadingStatusWithRange(suhu, suhuMin, suhuMax, threshold.min_suhu, threshold.max_suhu)
        : 'normal';

      const updated: BacaanSuhu = {
        ...readings[index],
        suhu,
        suhu_min: suhuMin,
        suhu_max: suhuMax,
        status_bacaan: newStatus,
        updated_at: new Date().toISOString()
      };
      if (tarikhMasa) {
        updated.tarikh_masa = tarikhMasa;
      }
      readings[index] = updated;
      setMockData('bacaan_suhu', readings);
      return { data: updated, error: null };
    }
  } catch (error: any) {
    console.error('Error updating reading values:', error);
    return { data: {} as BacaanSuhu, error: error.message || 'Failed to update reading values' };
  }
}
