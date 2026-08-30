// src/modules/mypriviledging/data/credentialingCriteriaData.ts
// Official KKM & AHP Logbook Credentialing Criteria for Nurses & Assistant Medical Officers

export interface CredentialingCriterion {
  id: string;
  roleKey: 'nurses' | 'amos';
  roleChip: string;
  title: string;
  subtitle: string;
  minimumRequirements: string[];
  supportingEvidence: string[];
  submissionChecklist: string[];
  kkmGovernanceNotes: string[];
  validityPeriod: string;
}

export const CREDENTIALING_CRITERIA: Record<'nurses' | 'amos', CredentialingCriterion> = {
  nurses: {
    id: 'nurses-criteria',
    roleKey: 'nurses',
    roleChip: 'Jururawat / Nurses',
    title: 'Kriteria Credentialing Jururawat Berdaftar',
    subtitle: 'Mengekalkan standard kejururawatan berkualiti tinggi dengan kompetensi klinikal disahkan dan bukti amalan semasa KKM.',
    minimumRequirements: [
      'Peri-Operative / Intensive Care: 2 - 5 tahun pengalaman berterusan dalam perkhidmatan dengan buku log lengkap disahkan.',
      'Emergency Medicine & Trauma: 3 - 5 tahun bertugas barisan hadapan, lulus viva & stesen kemahiran praktikal, serta memiliki sijil life support semasa yang berkaitan.',
      'General Paediatric / Neonatal: 2 - 5 tahun pengalaman di wad paediatrik/NICU berserta rekod buku log dan kemahiran bantuan hayat didokumenkan.'
    ],
    supportingEvidence: [
      'Buku Log Klinikal (AHP Logbook) yang telah disemak dan ditandatangani oleh Pakar Perunding / Penyelia Klinikal.',
      'Laporan Penilaian Prestasi Tahunan (LNPT / SKT) bagi 3 tahun terkini dengan markah kompetensi cemerlang.',
      'Rekod Pembangunan Profesional Berterusan (CPD) & Sijil Bantuan Hayat (BLS / ACLS / PALS / NRP / ATLS mengikut kepakaran).',
      'Ringkasan laporan insiden klinikal / adverse events berserta langkah mitigasi penambahbaikan (jika berkenaan).'
    ],
    submissionChecklist: [
      'Muat naik semua bukti dokumen sokongan dan sijil ke portal sebelum tarikh tamat sahlaku tempoh kelayakan.',
      'Pastikan borang dan buku log telah disahkan serta ditandatangani oleh Ketua Jabatan / Matron Penyelia.',
      'Jadualkan sesi temuduga dan penilaian kompetensi bersama Panel Jawatankuasa Credentialing & Privileging (JKCP).',
      'Sertakan sijil kelayakan bantuan hayat (Life Support Certificates) terkini mengikut sub-bidang kepakaran masing-masing.'
    ],
    kkmGovernanceNotes: [
      'Pematuhan ketat kepada Garis Panduan Credentialing & Privileging Jururawat KKM Edisi Terkini.',
      'Keperluan APC (Annual Practicing Certificate) Lembaga Jururawat Malaysia (LJM) yang aktif dan sah.',
      'Pengiktirafan sijil Pos Basik / Diploma Lanjutan yang diiktiraf oleh Bahagian Kejururawatan KKM.'
    ],
    validityPeriod: '3 Tahun (Diperbaharui melalui Penilaian Semula JKCP)'
  },
  amos: {
    id: 'amos-criteria',
    roleKey: 'amos',
    roleChip: 'Penolong Pegawai Perubatan (PPP / AMO)',
    title: 'Kriteria Credentialing Penolong Pegawai Perubatan',
    subtitle: 'Membuktikan kompetensi prosedur klinikal, kemahiran resusitasi, dan pematuhan peraturan Lembaga Pembantu Perubatan Malaysia (LPPPM).',
    minimumRequirements: [
      'Anaesthesia & Peri-Anaesthesia: ≥3 tahun bertugas di Dewan Bedah (OT) / ICU dengan persijilan kompetensi pengurusan salur pernafasan (Airway) & resusitasi.',
      'Emergency Medicine & Trauma: ≥4 tahun bertugas di Jabatan Kecemasan & Trauma dengan giliran salur pernafasan, trauma & penjagaan kritikal.',
      'Renal Services / Dialysis: ≥2 tahun portfolio hemodialisis berserta rekod rawatan air (water treatment) & log pengendalian kecemasan dialisis.'
    ],
    supportingEvidence: [
      'Buku Log Prosedur Klinikal yang telah disahkan dan ditandatangani oleh Pakar Perunding / Ketua Penolong Pegawai Perubatan (KPPP).',
      'Laporan Penilaian Prestasi Tahunan (LNPT / SKT) bagi 3 tahun perkhidmatan terkini.',
      'Rekod Pembangunan Profesionalisme Berterusan (CPD) & Sijil Kompetensi (BLS / ACLS / PALS / ATLS / MTLS yang sah).',
      'Ringkasan portfolio prosedur invasif berserta rekod kes dan tindakan pembetulan sekiranya berlaku komplikasi.'
    ],
    submissionChecklist: [
      'Muat naik semua bukti dokumen dan salinan buku log ke portal sebelum tarikh akhir pemfailan kelayakan.',
      'Pastikan dokumen diperakukan dan disokong oleh Ketua Jabatan / Ketua Penolong Pegawai Perubatan Hospital.',
      'Tetapkan tarikh semakan dan sesi penilaian amali bersama Panel Penilai Khas JKCP.',
      'Bagi Perkhidmatan Dialisis: Lampirkan Sijil Pos Basik / Diploma Lanjutan Hemodialisis yang diiktiraf LPPPM.'
    ],
    kkmGovernanceNotes: [
      'Pematuhan Akta Pembantu Perubatan (Pendaftaran) 1977 dan Kod Etika Amalan Lembaga Pembantu Perubatan Malaysia.',
      'Memegang Perakuan Amalan Tahunan (APC) LPPPM yang sah bagi tahun semasa.',
      'Prosedur khusus tertakluk kepada Surat Penurunan Kuasa Klinikal yang ditandatangani oleh Pengarah Hospital.'
    ],
    validityPeriod: '3 Tahun (Tertakluk kepada audit berkala oleh JKCP)'
  }
};
