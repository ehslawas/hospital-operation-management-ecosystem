// src/modules/mycrossborder/services/crossborderService.ts
// MyCrossBorder Malaysia-Brunei cross border patient transfer service with Supabase and localStorage fallback

import { supabase, isSupabaseConfigured } from '@/services/supabase';
import type { ApiResponse } from '@/types';
import type {
  CrossborderTransfer,
  CrossborderPatient,
  CrossborderEscort,
  CrossborderStatus,
  CrossborderJenisKenderaan,
  JenisDokumen,

  JenisPengiring,
  Jantina,
  CreateCrossborderPayload
} from '@/shared/types/mycrossborder';

const STORAGE_PREFIX = 'mycrossborder_mock_';

const getMockData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(STORAGE_PREFIX + key);
  return data ? JSON.parse(data) : defaultValue;
};

const setMockData = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
};

// Seed initial mock data if empty
export const initMockData = () => {
  if (!localStorage.getItem(STORAGE_PREFIX + 'transfers')) {
    const defaultTransfers: CrossborderTransfer[] = [
      {
        id: 'cb-transfer-1',
        no_rujukan: 'CB-HLW-2026-0001',
        hospital_id: 'hosp-1',
        referring_hospital: 'Hospital Lawas',
        destination_hospital: 'Hospital Limbang',
        tarikh_perjalanan: '2026-07-20',
        masa_berlepas: '09:00',
        tempat_berlepas: 'Hospital Lawas',
        status: 'approved',
        jenis_kenderaan: 'ambulance',
        no_pendaftaran: 'BNN7608',
        peralatan_lain: 'Oxygen concentrator, AED, standard trauma kit',
        pemandu_nama: 'AHMAD BIN ALI',
        pemandu_passport: 'K12345678',
        doktor_perujuk_nama: 'Dr. Jason Ling',
        doktor_perujuk_id: 'user-4',
        approved_by: 'user-5',
        approved_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        pengarah_nama: 'DR DOUGLAS CHU KIN SOON (Pengarah Hospital Lawas)',
        border_control_post: 'MALAYSIA/BRUNEI',
        surat_kebenaran_ref: 'TF/HL/MW ( 12 ) 2026',
        catatan: 'Pesakit dirujuk ke Hospital Limbang untuk rawatan pakar kecemasan.',
        created_by: 'user-4',
        created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'cb-transfer-2',
        no_rujukan: 'CB-HLW-2026-0002',
        hospital_id: 'hosp-1',
        referring_hospital: 'Hospital Lawas',
        destination_hospital: 'Hospital Limbang',
        tarikh_perjalanan: '2026-07-22',
        masa_berlepas: '14:30',
        tempat_berlepas: 'Hospital Lawas',
        status: 'submitted',
        jenis_kenderaan: 'ambulance',
        no_pendaftaran: 'BNN7608',
        peralatan_lain: 'Patient monitor, portable ventilator',
        pemandu_nama: 'MOHD SHAH BIN ABDULLAH',
        pemandu_passport: 'K87654321',
        doktor_perujuk_nama: 'Dr. Sarah binti Ahmad',
        doktor_perujuk_id: 'user-3',
        border_control_post: 'MALAYSIA/BRUNEI',
        catatan: 'Kes Obstetriks & Ginekologi berisiko tinggi.',
        created_by: 'user-3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const defaultPatients: CrossborderPatient[] = [
      {
        id: 'patient-1-1',
        transfer_id: 'cb-transfer-1',
        urutan: 1,
        nama: 'DAIMON BIN MOHD TAHIR',
        jantina: 'Lelaki',
        tarikh_lahir: '1978-05-15',
        warganegara: 'Malaysia',
        jenis_dokumen: 'PASSPORT',
        no_dokumen: 'K2348911A',
        no_pengenalan: '780515-13-5591',
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'patient-2-1',
        transfer_id: 'cb-transfer-2',
        urutan: 1,
        nama: 'FATIMAH BINTI OTHMAN',
        jantina: 'Perempuan',
        tarikh_lahir: '1990-11-20',
        warganegara: 'Malaysia',
        jenis_dokumen: 'IC',
        no_dokumen: '901120-13-5242',
        no_pengenalan: '901120-13-5242',
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const defaultEscorts: CrossborderEscort[] = [
      {
        id: 'escort-1-1',
        transfer_id: 'cb-transfer-1',
        jenis_pengiring: 'medical_escort',
        nama: 'ADI SURIA (Pegawai Perubatan)',
        jenis_dokumen: 'PASSPORT',
        no_dokumen: 'K4489113B',
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'escort-1-2',
        transfer_id: 'cb-transfer-1',
        jenis_pengiring: 'patient_escort',
        nama: 'AMINAH BINTI TAHIR (Adik)',
        jenis_dokumen: 'IC',
        no_dokumen: '820412-13-6622',
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'escort-2-1',
        transfer_id: 'cb-transfer-2',
        jenis_pengiring: 'medical_escort',
        nama: 'SN NURUL FARHANA',
        jenis_dokumen: 'IC',
        no_dokumen: '930804-13-5182',
        hospital_id: 'hosp-1',
        created_at: new Date().toISOString()
      }
    ];

    setMockData('transfers', defaultTransfers);
    setMockData('patients', defaultPatients);
    setMockData('escorts', defaultEscorts);
  }
};

// Auto-initialize mock data
initMockData();

// Helper to generate reference numbers
export const generateReferenceNumber = (): string => {
  const year = new Date().getFullYear();
  const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
  const count = transfers.length + 1;
  const seq = String(count).padStart(4, '0');
  return `CB-HLW-${year}-${seq}`;
};

// Helper to get relations for a transfer in mock data
const getTransferRelations = (transfer: CrossborderTransfer): CrossborderTransfer => {
  const patients = getMockData<CrossborderPatient[]>('patients', []);
  const escorts = getMockData<CrossborderEscort[]>('escorts', []);
  
  return {
    ...transfer,
    patients: patients.filter(p => p.transfer_id === transfer.id).sort((a, b) => a.urutan - b.urutan),
    escorts: escorts.filter(e => e.transfer_id === transfer.id)
  };
};

export async function getCrossborderTransfers(): Promise<ApiResponse<CrossborderTransfer[]>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const fullTransfers = transfers.map(t => getTransferRelations(t));
    return { data: fullTransfers, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('crossborder_transfers')
      .select('*, patients(*), escorts(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as CrossborderTransfer[], error: null };
  } catch (error: any) {
    console.error('Error fetching crossborder transfers:', error);
    return { data: null, error: error?.message || 'Gagal memuatkan rekod rentasi sempadan' };
  }
}

export async function getCrossborderTransferById(id: string): Promise<ApiResponse<CrossborderTransfer>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) return { data: null, error: 'Rekod tidak ditemui' };
    return { data: getTransferRelations(transfer), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('crossborder_transfers')
      .select('*, patients(*), escorts(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: data as CrossborderTransfer, error: null };
  } catch (error: any) {
    console.error('Error fetching crossborder transfer details:', error);
    return { data: null, error: error?.message || 'Gagal memuatkan butiran permohonan' };
  }
}

export async function createCrossborderTransfer(payload: CreateCrossborderPayload, hospitalId: string, userId: string): Promise<ApiResponse<CrossborderTransfer>> {
  const newTransferId = crypto.randomUUID();
  const noRujukan = generateReferenceNumber();
  
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const patients = getMockData<CrossborderPatient[]>('patients', []);
    const escorts = getMockData<CrossborderEscort[]>('escorts', []);

    const newTransfer: CrossborderTransfer = {
      ...payload.transfer,
      id: newTransferId,
      no_rujukan: noRujukan,
      hospital_id: hospitalId,
      status: 'draft',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newPatients: CrossborderPatient[] = payload.patients.map((p, idx) => ({
      ...p,
      id: crypto.randomUUID(),
      transfer_id: newTransferId,
      urutan: idx + 1,
      hospital_id: hospitalId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const newEscorts: CrossborderEscort[] = payload.escorts.map(e => ({
      ...e,
      id: crypto.randomUUID(),
      transfer_id: newTransferId,
      hospital_id: hospitalId,
      created_at: new Date().toISOString()
    }));

    setMockData('transfers', [newTransfer, ...transfers]);
    setMockData('patients', [...patients, ...newPatients]);
    setMockData('escorts', [...escorts, ...newEscorts]);

    return { data: getTransferRelations(newTransfer), error: null };
  }

  try {
    // 1. Insert master record
    const { data: transferData, error: transferError } = await supabase
      .from('crossborder_transfers')
      .insert({
        ...payload.transfer,
        id: newTransferId,
        no_rujukan: noRujukan,
        hospital_id: hospitalId,
        status: 'draft',
        created_by: userId
      })
      .select()
      .single();

    if (transferError) throw transferError;

    // 2. Insert patients
    const patientsPayload = payload.patients.map((p, idx) => ({
      ...p,
      transfer_id: newTransferId,
      urutan: idx + 1,
      hospital_id: hospitalId
    }));

    const { error: patientsError } = await supabase
      .from('crossborder_patients')
      .insert(patientsPayload);

    if (patientsError) throw patientsError;

    // 3. Insert escorts if any
    if (payload.escorts.length > 0) {
      const escortsPayload = payload.escorts.map(e => ({
        ...e,
        transfer_id: newTransferId,
        hospital_id: hospitalId
      }));

      const { error: escortsError } = await supabase
        .from('crossborder_escorts')
        .insert(escortsPayload);

      if (escortsError) throw escortsError;
    }

    return await getCrossborderTransferById(newTransferId);
  } catch (error: any) {
    console.error('Error creating crossborder transfer:', error);
    return { data: null, error: error?.message || 'Gagal menyimpan rekod rentasi sempadan' };
  }
}

export async function updateCrossborderTransfer(id: string, payload: Partial<CreateCrossborderPayload>): Promise<ApiResponse<CrossborderTransfer>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const patients = getMockData<CrossborderPatient[]>('patients', []);
    const escorts = getMockData<CrossborderEscort[]>('escorts', []);

    const transferIdx = transfers.findIndex(t => t.id === id);
    if (transferIdx === -1) return { data: null, error: 'Rekod tidak ditemui' };

    const original = transfers[transferIdx];
    
    // Update master
    if (payload.transfer) {
      transfers[transferIdx] = {
        ...original,
        ...payload.transfer,
        updated_at: new Date().toISOString()
      };
    }

    // Replace patients if provided
    if (payload.patients) {
      const filteredPatients = patients.filter(p => p.transfer_id !== id);
      const newPatients = payload.patients.map((p, idx) => ({
        ...p,
        id: crypto.randomUUID(),
        transfer_id: id,
        urutan: idx + 1,
        hospital_id: original.hospital_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setMockData('patients', [...filteredPatients, ...newPatients]);
    }

    // Replace escorts if provided
    if (payload.escorts) {
      const filteredEscorts = escorts.filter(e => e.transfer_id !== id);
      const newEscorts = payload.escorts.map(e => ({
        ...e,
        id: crypto.randomUUID(),
        transfer_id: id,
        hospital_id: original.hospital_id,
        created_at: new Date().toISOString()
      }));
      setMockData('escorts', [...filteredEscorts, ...newEscorts]);
    }

    setMockData('transfers', transfers);
    return { data: getTransferRelations(transfers[transferIdx]), error: null };
  }

  try {
    if (payload.transfer) {
      const { error: transferError } = await supabase
        .from('crossborder_transfers')
        .update(payload.transfer)
        .eq('id', id);
      if (transferError) throw transferError;
    }

    if (payload.patients) {
      // Delete old patients
      const { error: delError } = await supabase
        .from('crossborder_patients')
        .delete()
        .eq('transfer_id', id);
      if (delError) throw delError;

      // Insert new patients
      const original = (await getCrossborderTransferById(id)).data;
      if (!original) throw new Error('Original transfer record not found');
      
      const patientsPayload = payload.patients.map((p, idx) => ({
        ...p,
        transfer_id: id,
        urutan: idx + 1,
        hospital_id: original.hospital_id
      }));

      const { error: insError } = await supabase
        .from('crossborder_patients')
        .insert(patientsPayload);
      if (insError) throw insError;
    }

    if (payload.escorts) {
      // Delete old escorts
      const { error: delError } = await supabase
        .from('crossborder_escorts')
        .delete()
        .eq('transfer_id', id);
      if (delError) throw delError;

      // Insert new escorts
      if (payload.escorts.length > 0) {
        const original = (await getCrossborderTransferById(id)).data;
        if (!original) throw new Error('Original transfer record not found');

        const escortsPayload = payload.escorts.map(e => ({
          ...e,
          transfer_id: id,
          hospital_id: original.hospital_id
        }));

        const { error: insError } = await supabase
          .from('crossborder_escorts')
          .insert(escortsPayload);
        if (insError) throw insError;
      }
    }

    return await getCrossborderTransferById(id);
  } catch (error: any) {
    console.error('Error updating crossborder transfer:', error);
    return { data: null, error: error?.message || 'Gagal mengemaskini rekod rentasi sempadan' };
  }
}

export async function submitCrossborderTransfer(id: string): Promise<ApiResponse<CrossborderTransfer>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const transferIdx = transfers.findIndex(t => t.id === id);
    if (transferIdx === -1) return { data: null, error: 'Rekod tidak ditemui' };
    transfers[transferIdx].status = 'submitted';
    transfers[transferIdx].updated_at = new Date().toISOString();
    setMockData('transfers', transfers);
    return { data: getTransferRelations(transfers[transferIdx]), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('crossborder_transfers')
      .update({ status: 'submitted' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as CrossborderTransfer, error: null };
  } catch (error: any) {
    console.error('Error submitting crossborder transfer:', error);
    return { data: null, error: error?.message || 'Gagal menghantar permohonan' };
  }
}

export async function approveCrossborderTransfer(id: string, pengarahNama: string, approvalRef: string, approvedByUserId: string): Promise<ApiResponse<CrossborderTransfer>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const transferIdx = transfers.findIndex(t => t.id === id);
    if (transferIdx === -1) return { data: null, error: 'Rekod tidak ditemui' };
    
    transfers[transferIdx].status = 'approved';
    transfers[transferIdx].pengarah_nama = pengarahNama;
    transfers[transferIdx].surat_kebenaran_ref = approvalRef || `TF/HL/MW ( ${Math.floor(Math.random() * 50) + 1} ) ${new Date().getFullYear()}`;
    transfers[transferIdx].approved_by = approvedByUserId;
    transfers[transferIdx].approved_at = new Date().toISOString();
    transfers[transferIdx].updated_at = new Date().toISOString();
    
    setMockData('transfers', transfers);
    return { data: getTransferRelations(transfers[transferIdx]), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('crossborder_transfers')
      .update({
        status: 'approved',
        pengarah_nama: pengarahNama,
        surat_kebenaran_ref: approvalRef || `TF/HL/MW ( ${Math.floor(Math.random() * 50) + 1} ) ${new Date().getFullYear()}`,
        approved_by: approvedByUserId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as CrossborderTransfer, error: null };
  } catch (error: any) {
    console.error('Error approving crossborder transfer:', error);
    return { data: null, error: error?.message || 'Gagal meluluskan permohonan' };
  }
}

export async function completeCrossborderTransfer(id: string): Promise<ApiResponse<CrossborderTransfer>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const transferIdx = transfers.findIndex(t => t.id === id);
    if (transferIdx === -1) return { data: null, error: 'Rekod tidak ditemui' };
    transfers[transferIdx].status = 'completed';
    transfers[transferIdx].updated_at = new Date().toISOString();
    setMockData('transfers', transfers);
    return { data: getTransferRelations(transfers[transferIdx]), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('crossborder_transfers')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as CrossborderTransfer, error: null };
  } catch (error: any) {
    console.error('Error completing crossborder transfer:', error);
    return { data: null, error: error?.message || 'Gagal menukar status pemindahan' };
  }
}

export async function cancelCrossborderTransfer(id: string, reason: string): Promise<ApiResponse<CrossborderTransfer>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const transferIdx = transfers.findIndex(t => t.id === id);
    if (transferIdx === -1) return { data: null, error: 'Rekod tidak ditemui' };
    
    transfers[transferIdx].status = 'cancelled';
    transfers[transferIdx].catatan = `Dibatalkan. Sebab: ${reason}`;
    transfers[transferIdx].updated_at = new Date().toISOString();
    
    setMockData('transfers', transfers);
    return { data: getTransferRelations(transfers[transferIdx]), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('crossborder_transfers')
      .update({
        status: 'cancelled',
        catatan: `Dibatalkan. Sebab: ${reason}`
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as CrossborderTransfer, error: null };
  } catch (error: any) {
    console.error('Error cancelling crossborder transfer:', error);
    return { data: null, error: error?.message || 'Gagal membatalkan permohonan' };
  }
}

export async function deleteCrossborderTransfer(id: string): Promise<ApiResponse<boolean>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const patients = getMockData<CrossborderPatient[]>('patients', []);
    const escorts = getMockData<CrossborderEscort[]>('escorts', []);

    setMockData('transfers', transfers.filter(t => t.id !== id));
    setMockData('patients', patients.filter(p => p.transfer_id !== id));
    setMockData('escorts', escorts.filter(e => e.transfer_id !== id));

    return { data: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('crossborder_transfers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error deleting crossborder transfer:', error);
    return { data: false, error: error?.message || 'Gagal memadam permohonan' };
  }
}

export async function getUnlinkedCrossborderTransfers(): Promise<ApiResponse<CrossborderTransfer[]>> {
  if (!isSupabaseConfigured()) {
    const transfers = getMockData<CrossborderTransfer[]>('transfers', []);
    const unlinked = transfers.filter(t => !t.linked_transport_request_id && (t.status === 'draft' || t.status === 'submitted'));
    const fullTransfers = unlinked.map(t => getTransferRelations(t));
    return { data: fullTransfers, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('crossborder_transfers')
      .select('*, patients(*), escorts(*)')
      .or('linked_transport_request_id.is.null,linked_transport_request_id.eq.""')
      .in('status', ['draft', 'submitted'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as CrossborderTransfer[], error: null };
  } catch (error: any) {
    console.error('Error fetching unlinked crossborder transfers:', error);
    return { data: null, error: error?.message || 'Gagal memuatkan rekod rentasi sempadan' };
  }
}

