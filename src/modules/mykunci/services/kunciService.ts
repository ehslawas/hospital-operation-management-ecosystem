// src/modules/mykunci/services/kunciService.ts
// MyKunci integrated key management service with Supabase and localStorage fallback

import { supabase, isSupabaseConfigured } from '@/services/supabase';
import type { ApiResponse } from '@/types';
import type {
  KunciDaftar,
  KunciLog,
  KunciAuditBulanan,
  KunciStatus,
  SampulStatus,
  KeadaanKunci,
  KeadaanMangga,
  AuditFizikal
} from '@/shared/types/mykunci';

// ============================================
// LOCAL STORAGE MOCK DATA SYSTEM
// ============================================
const STORAGE_PREFIX = 'mykunci_mock_';

const getMockData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(STORAGE_PREFIX + key);
  return data ? JSON.parse(data) : defaultValue;
};

const setMockData = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
};

// Seed initial mock data if empty
const initMockData = () => {
  if (!localStorage.getItem(STORAGE_PREFIX + 'kunci_daftar')) {
    const initialKunci: KunciDaftar[] = [
      {
        id: 'kunci-1',
        kod_kunci: 'KUNCI-PH-LOG-01',
        nama_kunci: 'Kunci Utama Stor Logistik Farmasi',
        department_id: '7a3bd6c4-c8e6-491b-8441-0ee9bd73f880', // Pharmacy Logistics
        lokasi_fizikal: 'Pintu Masuk Utama Stor Farmasi',
        jenis_kunci: 'room',
        tahap_kawalan: 'normal',
        status: 'available',
        nombor_peti: 'Peti Kunci Utama A-01',
        status_sampul: 'not_applicable',
        penjaga_id: 'user-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'kunci-2',
        kod_kunci: 'KUNCI-PH-DDA-01',
        nama_kunci: 'Kunci Peti Dadah Kawalan / Narcotic DDA Cabinet',
        department_id: '7a3bd6c4-c8e6-491b-8441-0ee9bd73f880', // Pharmacy Logistics
        lokasi_fizikal: 'Peti Besi DDA, Bilik Penyimpanan Khas',
        jenis_kunci: 'cabinet_dda',
        tahap_kawalan: 'high', // High security - double custody DDA
        status: 'borrowed',
        nombor_peti: 'Peti Kunci Utama A-02',
        status_sampul: 'not_applicable',
        penjaga_id: 'user-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'kunci-3',
        kod_kunci: 'KUNCI-PH-CLIN-01',
        nama_kunci: 'Kunci Bilik Satelit Farmasi Klinik Pakar',
        department_id: '0c6c6f1b-d3b6-4779-91c3-536956858fca', // Specialist Clinic Satellite
        lokasi_fizikal: 'Pintu Depan Satelit Farmasi',
        jenis_kunci: 'room',
        tahap_kawalan: 'normal',
        status: 'available',
        nombor_peti: 'Peti Kunci B-05',
        status_sampul: 'not_applicable',
        penjaga_id: 'user-2',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'kunci-4',
        kod_kunci: 'KUNCI-PH-DUP-LOG-01',
        nama_kunci: 'Kunci Pendua Stor Logistik Farmasi (Kecemasan)',
        department_id: '7a3bd6c4-c8e6-491b-8441-0ee9bd73f880',
        lokasi_fizikal: 'Peti Keselamatan Pejabat Pentadbiran',
        jenis_kunci: 'room',
        tahap_kawalan: 'high',
        status: 'available',
        nombor_peti: 'Peti Kunci Kecemasan C-01',
        status_sampul: 'sealed', // Emergency sealed envelope
        penjaga_id: 'user-1',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const initialLogs: KunciLog[] = [
      {
        id: 'log-1',
        kunci_id: 'kunci-1',
        peminjam_id: 'user-1',
        pegawai_penyerah_id: 'user-1',
        tarikh_masa_ambil: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        jangka_masa_pulang: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        tarikh_masa_pulang: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
        pegawai_penerima_id: 'user-1',
        keadaan_kunci: 'good',
        keadaan_mangga: 'good',
        tujuan: 'Pemeriksaan stok barang bulanan.',
        catatan_penggunaan: 'Buka stor logistik untuk penerimaan barang LPO.',
        duration_seconds: 3.5 * 3600,
        is_overdue: false,
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
      },
      {
        id: 'log-2',
        kunci_id: 'kunci-2',
        peminjam_id: 'user-2',
        pegawai_penyerah_id: 'user-1',
        pegawai_saksi_id: 'user-3', // High-security Narcotic co-signing witness
        tarikh_masa_ambil: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago (longer than standard shift)
        jangka_masa_pulang: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // Should be returned 4 hours ago
        is_overdue: true, // Marked as overdue / sangkut!
        tujuan: 'Pemberian ubat DDA untuk pesakit Wad VIP.',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      }
    ];

    const initialAudits: KunciAuditBulanan[] = [
      {
        id: 'audit-1',
        kunci_id: 'kunci-4', // Duplicate key
        tarikh_audit: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        auditor_id: 'user-1',
        status_fizikal: 'present',
        sampul_bermeterai_utuh: true,
        catatan: 'Pemeriksaan fizikal bulanan. Sampul meterai utuh dengan kod siri KKM-4281.',
        hospital_id: 'hosp-1',
        created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      }
    ];

    setMockData('kunci_daftar', initialKunci);
    setMockData('kunci_log', initialLogs);
    setMockData('kunci_audit_bulanan', initialAudits);
  }
};

// Initialize mock data
initMockData();

// ============================================
// API SERVICE LAYER
// ============================================

export const getKunciDaftar = async (departmentId?: string): Promise<ApiResponse<KunciDaftar[]>> => {
  if (!isSupabaseConfigured()) {
    let list = getMockData<KunciDaftar[]>('kunci_daftar', []);
    if (departmentId) {
      list = list.filter((k) => k.department_id === departmentId);
    }
    return { data: list, error: null };
  }

  try {
    let query = supabase.from('kunci_daftar').select(`
      *,
      department:departments(*),
      penjaga:users!penjaga_id(*)
    `);

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query.order('kod_kunci', { ascending: true });
    if (error) throw error;
    return { data: data as KunciDaftar[], error: null };
  } catch (error: any) {
    console.error('getKunciDaftar error:', error);
    return { data: null, error: error?.message || 'Failed to fetch registered keys' };
  }
};

export const getKunciById = async (id: string): Promise<ApiResponse<KunciDaftar>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<KunciDaftar[]>('kunci_daftar', []);
    const key = list.find((k) => k.id === id);
    if (!key) return { data: null, error: 'Key not found' };
    return { data: key, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('kunci_daftar')
      .select(`
        *,
        department:departments(*),
        penjaga:users!penjaga_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: data as KunciDaftar, error: null };
  } catch (error: any) {
    console.error('getKunciById error:', error);
    return { data: null, error: error?.message || 'Failed to fetch key details' };
  }
};

export const addKunci = async (
  kunci: Omit<KunciDaftar, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<KunciDaftar>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<KunciDaftar[]>('kunci_daftar', []);
    const newKunci: KunciDaftar = {
      ...kunci,
      id: `kunci-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newKunci);
    setMockData('kunci_daftar', list);
    return { data: newKunci, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('kunci_daftar')
      .insert([kunci])
      .select()
      .single();

    if (error) throw error;
    return { data: data as KunciDaftar, error: null };
  } catch (error: any) {
    console.error('addKunci error:', error);
    return { data: null, error: error?.message || 'Failed to register key' };
  }
};

export const updateKunci = async (
  id: string,
  kunci: Partial<KunciDaftar>
): Promise<ApiResponse<KunciDaftar>> => {
  const isAvailableOrInactive = kunci.status && ['available', 'damaged', 'lost'].includes(kunci.status);

  if (!isSupabaseConfigured()) {
    const list = getMockData<KunciDaftar[]>('kunci_daftar', []);
    const index = list.findIndex((k) => k.id === id);
    if (index === -1) return { data: null, error: 'Key not found' };

    const updated = {
      ...list[index],
      ...kunci,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    setMockData('kunci_daftar', list);

    // If status changed to available/damaged/lost, close active logs
    if (isAvailableOrInactive) {
      const logs = getMockData<KunciLog[]>('kunci_log', []);
      let logsUpdated = false;
      const updatedLogs = logs.map(l => {
        if (l.kunci_id === id && !l.tarikh_masa_pulang) {
          logsUpdated = true;
          const returnTime = new Date();
          const takeTime = new Date(l.tarikh_masa_ambil).getTime();
          const durationSeconds = Math.max(0, Math.floor((returnTime.getTime() - takeTime) / 1000));
          const etaTime = new Date(l.jangka_masa_pulang).getTime();
          return {
            ...l,
            tarikh_masa_pulang: returnTime.toISOString(),
            duration_seconds: durationSeconds,
            is_overdue: returnTime.getTime() > etaTime,
            updated_at: returnTime.toISOString()
          };
        }
        return l;
      });
      if (logsUpdated) {
        setMockData('kunci_log', updatedLogs);
      }
    }

    return { data: updated, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('kunci_daftar')
      .update(kunci)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If status changed to available/damaged/lost, close active logs in Supabase
    if (isAvailableOrInactive) {
      const nowStr = new Date().toISOString();
      // We don't have a simple way to calculate duration_seconds directly in an update query without fetching,
      // but setting tarikh_masa_pulang is the main trigger for closing the log.
      await supabase
        .from('kunci_log')
        .update({ 
          tarikh_masa_pulang: nowStr,
          updated_at: nowStr
        })
        .eq('kunci_id', id)
        .is('tarikh_masa_pulang', null);
    }

    return { data: data as KunciDaftar, error: null };
  } catch (error: any) {
    console.error('updateKunci error:', error);
    return { data: null, error: error?.message || 'Failed to update key details' };
  }
};

export const deleteKunci = async (id: string): Promise<ApiResponse<boolean>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<KunciDaftar[]>('kunci_daftar', []);
    const filtered = list.filter((k) => k.id !== id);
    setMockData('kunci_daftar', filtered);

    // Clean up logs for deleted key
    const logs = getMockData<KunciLog[]>('kunci_log', []);
    const filteredLogs = logs.filter((l) => l.kunci_id !== id);
    setMockData('kunci_log', filteredLogs);

    return { data: true, error: null };
  }

  try {
    // Delete logs first to avoid foreign key violations, or trust cascade
    await supabase.from('kunci_log').delete().eq('kunci_id', id);
    
    const { error } = await supabase.from('kunci_daftar').delete().eq('id', id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error: any) {
    console.error('deleteKunci error:', error);
    return { data: false, error: error?.message || 'Failed to delete key' };
  }
};

export const getKunciLogs = async (kunciId?: string): Promise<ApiResponse<KunciLog[]>> => {
  if (!isSupabaseConfigured()) {
    let logs = getMockData<KunciLog[]>('kunci_log', []);
    const keys = getMockData<KunciDaftar[]>('kunci_daftar', []);
    
    // Enrich logs with keys mock relationships
    logs = logs.map(log => {
      const keyObj = keys.find(k => k.id === log.kunci_id);
      return {
        ...log,
        kunci: keyObj
      };
    });

    if (kunciId) {
      logs = logs.filter((l) => l.kunci_id === kunciId);
    }
    
    // Sort descending by checkout date
    logs.sort((a, b) => new Date(b.tarikh_masa_ambil).getTime() - new Date(a.tarikh_masa_ambil).getTime());

    return { data: logs, error: null };
  }

  try {
    let query = supabase.from('kunci_log').select(`
      *,
      kunci:kunci_daftar(
        *,
        department:departments(*)
      ),
      peminjam:users!peminjam_id(*),
      pegawai_penyerah:users!pegawai_penyerah_id(*),
      pegawai_saksi:users!pegawai_saksi_id(*),
      pegawai_penerima:users!pegawai_penerima_id(*)
    `);

    if (kunciId) {
      query = query.eq('kunci_id', kunciId);
    }

    const { data, error } = await query.order('tarikh_masa_ambil', { ascending: false });
    if (error) throw error;
    return { data: data as KunciLog[], error: null };
  } catch (error: any) {
    console.error('getKunciLogs error:', error);
    return { data: null, error: error?.message || 'Failed to fetch key logs' };
  }
};

export const checkoutKunci = async (
  log: Omit<KunciLog, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<KunciLog>> => {
  if (!isSupabaseConfigured()) {
    // 1. Save log
    const logs = getMockData<KunciLog[]>('kunci_log', []);
    const newLog: KunciLog = {
      ...log,
      id: `log-${Date.now()}`,
      is_overdue: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    logs.push(newLog);
    setMockData('kunci_log', logs);

    // 2. Update status of key in register to 'borrowed'
    const keys = getMockData<KunciDaftar[]>('kunci_daftar', []);
    const keyIndex = keys.findIndex((k) => k.id === log.kunci_id);
    if (keyIndex !== -1) {
      keys[keyIndex].status = 'borrowed';
      keys[keyIndex].updated_at = new Date().toISOString();
      setMockData('kunci_daftar', keys);
    }

    return { data: newLog, error: null };
  }

  try {
    // We execute checkout inside a transaction if possible, or sequentially
    // Step 1: Insert log
    const { data: insertedLog, error: logError } = await supabase
      .from('kunci_log')
      .insert([log])
      .select()
      .single();

    if (logError) throw logError;

    // Step 2: Update key status to borrowed
    const { error: keyError } = await supabase
      .from('kunci_daftar')
      .update({ status: 'borrowed' })
      .eq('id', log.kunci_id);

    if (keyError) throw keyError;

    return { data: insertedLog as KunciLog, error: null };
  } catch (error: any) {
    console.error('checkoutKunci error:', error);
    return { data: null, error: error?.message || 'Failed to record checkout transaction' };
  }
};

export const returnKunci = async (
  logId: string,
  returnData: {
    tarikh_masa_pulang: string;
    pegawai_penerima_id: string;
    keadaan_kunci: KeadaanKunci;
    keadaan_mangga: KeadaanMangga;
    catatan_penggunaan?: string;
  }
): Promise<ApiResponse<KunciLog>> => {
  if (!isSupabaseConfigured()) {
    // 1. Update log
    const logs = getMockData<KunciLog[]>('kunci_log', []);
    const logIndex = logs.findIndex((l) => l.id === logId);
    if (logIndex === -1) return { data: null, error: 'Checkout record not found' };

    const originalLog = logs[logIndex];
    const takeTime = new Date(originalLog.tarikh_masa_ambil).getTime();
    const returnTime = new Date(returnData.tarikh_masa_pulang).getTime();
    const durationSeconds = Math.max(0, Math.floor((returnTime - takeTime) / 1000));
    
    // Check if overdue
    const etaTime = new Date(originalLog.jangka_masa_pulang).getTime();
    const isOverdue = returnTime > etaTime;

    const updatedLog: KunciLog = {
      ...originalLog,
      ...returnData,
      duration_seconds: durationSeconds,
      is_overdue: isOverdue,
      updated_at: new Date().toISOString(),
    };
    logs[logIndex] = updatedLog;
    setMockData('kunci_log', logs);

    // 2. Set key status back to 'available'
    const keys = getMockData<KunciDaftar[]>('kunci_daftar', []);
    const keyIndex = keys.findIndex((k) => k.id === originalLog.kunci_id);
    if (keyIndex !== -1) {
      keys[keyIndex].status = 'available';
      // If the duplicate key envelope is checked/broken, it gets set
      keys[keyIndex].updated_at = new Date().toISOString();
      setMockData('kunci_daftar', keys);
    }

    return { data: updatedLog, error: null };
  }

  try {
    // Step 1: Get log details to calculate duration and find Kunci ID
    const { data: originalLog, error: fetchError } = await supabase
      .from('kunci_log')
      .select('*')
      .eq('id', logId)
      .single();

    if (fetchError) throw fetchError;

    const takeTime = new Date(originalLog.tarikh_masa_ambil).getTime();
    const returnTime = new Date(returnData.tarikh_masa_pulang).getTime();
    const durationSeconds = Math.max(0, Math.floor((returnTime - takeTime) / 1000));

    const etaTime = new Date(originalLog.jangka_masa_pulang).getTime();
    const isOverdue = returnTime > etaTime;

    // Step 2: Update log
    const { data: updatedLog, error: updateError } = await supabase
      .from('kunci_log')
      .update({
        tarikh_masa_pulang: returnData.tarikh_masa_pulang,
        pegawai_penerima_id: returnData.pegawai_penerima_id,
        keadaan_kunci: returnData.keadaan_kunci,
        keadaan_mangga: returnData.keadaan_mangga,
        catatan_penggunaan: returnData.catatan_penggunaan,
        duration_seconds: durationSeconds,
        is_overdue: isOverdue
      })
      .eq('id', logId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Step 3: Set key status back to 'available'
    const { error: keyError } = await supabase
      .from('kunci_daftar')
      .update({ status: 'available' })
      .eq('id', originalLog.kunci_id);

    if (keyError) throw keyError;

    return { data: updatedLog as KunciLog, error: null };
  } catch (error: any) {
    console.error('returnKunci error:', error);
    return { data: null, error: error?.message || 'Failed to record return transaction' };
  }
};

export const getKunciAudits = async (kunciId?: string): Promise<ApiResponse<KunciAuditBulanan[]>> => {
  if (!isSupabaseConfigured()) {
    let audits = getMockData<KunciAuditBulanan[]>('kunci_audit_bulanan', []);
    const keys = getMockData<KunciDaftar[]>('kunci_daftar', []);
    
    // Enrich with keys relationship
    audits = audits.map(audit => {
      const keyObj = keys.find(k => k.id === audit.kunci_id);
      return {
        ...audit,
        kunci: keyObj
      };
    });

    if (kunciId) {
      audits = audits.filter((a) => a.kunci_id === kunciId);
    }

    audits.sort((a, b) => new Date(b.tarikh_audit).getTime() - new Date(a.tarikh_audit).getTime());
    return { data: audits, error: null };
  }

  try {
    let query = supabase.from('kunci_audit_bulanan').select(`
      *,
      kunci:kunci_daftar(
        *,
        department:departments(*)
      ),
      auditor:users!auditor_id(*)
    `);

    if (kunciId) {
      query = query.eq('kunci_id', kunciId);
    }

    const { data, error } = await query.order('tarikh_audit', { ascending: false });
    if (error) throw error;
    return { data: data as KunciAuditBulanan[], error: null };
  } catch (error: any) {
    console.error('getKunciAudits error:', error);
    return { data: null, error: error?.message || 'Failed to fetch audit records' };
  }
};

export const addKunciAudit = async (
  audit: Omit<KunciAuditBulanan, 'id' | 'created_at'>
): Promise<ApiResponse<KunciAuditBulanan>> => {
  if (!isSupabaseConfigured()) {
    const list = getMockData<KunciAuditBulanan[]>('kunci_audit_bulanan', []);
    const newAudit: KunciAuditBulanan = {
      ...audit,
      id: `audit-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.push(newAudit);
    setMockData('kunci_audit_bulanan', list);

    // If audit checks a duplicate key envelope, update key status_sampul
    const keys = getMockData<KunciDaftar[]>('kunci_daftar', []);
    const keyIndex = keys.findIndex((k) => k.id === audit.kunci_id);
    if (keyIndex !== -1 && keys[keyIndex].jenis_kunci === 'room' && keys[keyIndex].status_sampul !== 'not_applicable') {
      keys[keyIndex].status_sampul = audit.sampul_bermeterai_utuh ? 'sealed' : 'broken';
      keys[keyIndex].updated_at = new Date().toISOString();
      setMockData('kunci_daftar', keys);
    }

    return { data: newAudit, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('kunci_audit_bulanan')
      .insert([audit])
      .select()
      .single();

    if (error) throw error;

    // Update status envelope if needed
    const { data: keyDetails } = await supabase.from('kunci_daftar').select('status_sampul').eq('id', audit.kunci_id).single();
    if (keyDetails && keyDetails.status_sampul !== 'not_applicable') {
      const nextStatus: SampulStatus = audit.sampul_bermeterai_utuh ? 'sealed' : 'broken';
      await supabase.from('kunci_daftar').update({ status_sampul: nextStatus }).eq('id', audit.kunci_id);
    }

    return { data: data as KunciAuditBulanan, error: null };
  } catch (error: any) {
    console.error('addKunciAudit error:', error);
    return { data: null, error: error?.message || 'Failed to record audit entry' };
  }
};
