// src/types/mysuhu.ts

export type LokasiStatus = 'active' | 'inactive';
export type UnitStatus = 'active' | 'inactive';
export type JenisUnit = 'freezer' | 'refrigerator' | 'ambient' | 'incubator' | 'other';
export type StatusBacaan = 'normal' | 'warning' | 'breach' | 'no_reading';

export interface Lokasi {
  id: string;
  kod_lokasi: string;
  nama_lokasi: string;
  jabatan: string;
  deskripsi: string | null;
  status: LokasiStatus;
  hospital_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitPemantauan {
  id: string;
  lokasi_id: string;
  unit_id: string;
  nama_unit: string;
  jenis_unit: JenisUnit;
  nota: string | null;
  status: UnitStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmbangSuhu {
  id: string;
  unit_id: string;
  min_suhu: number;
  max_suhu: number;
  effective_from: string;
  effective_until: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BacaanSuhu {
  id: string;
  unit_id: string;
  suhu: number;
  status_bacaan: 'normal' | 'warning' | 'breach';
  ambang_id: string;
  tarikh_masa: string;
  dicatat_pada: string;
  dicatat_oleh: string | null;
  nota: string | null;
  is_corrected: boolean;
  correction_note: string | null;
  updated_at: string;
}

// Relations
export interface UnitPemantauanWithRelations extends UnitPemantauan {
  lokasi?: Lokasi;
  active_threshold?: AmbangSuhu | null;
  latest_reading?: BacaanSuhu | null;
  status_pemantauan?: StatusBacaan;
  readings?: BacaanSuhu[];
}

export interface BacaanSuhuWithRelations extends BacaanSuhu {
  unit?: UnitPemantauanWithRelations;
  ambang?: AmbangSuhu;
  dicatat_oleh_user?: {
    full_name: string;
    jawatan: string;
  } | null;
}
