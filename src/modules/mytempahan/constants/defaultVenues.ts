// src/modules/mytempahan/constants/defaultVenues.ts
// Master Venue Catalog & Initial Mock Seed for Hospital Lawas / KKM Facilities

import { Room, Booking } from '@/shared/types/mytempahan'

export const DEFAULT_HOSPITAL_ROOMS: Room[] = [
  {
    id: 'room-lawas-01',
    room_code: 'BM-KNGA-03',
    name: 'Bilik Mesyuarat Utama Kenanga',
    category: 'meeting_room',
    capacity: 45,
    location: 'Aras 3, Blok Pentadbiran Hospital Lawas',
    floor_level: 'Aras 3',
    building_block: 'Blok Pentadbiran',
    status: 'available',
    amenities: [
      'smart_tv',
      'video_conferencing',
      'pa_sound_system',
      'wireless_mic',
      'whiteboard',
      'wifi_kkm',
      'aircond',
      'vip_lounge',
      'podium'
    ],
    layouts: [
      { layout: 'boardroom', capacity: 35 },
      { layout: 'u_shape', capacity: 45 },
      { layout: 'hollow_square', capacity: 30 }
    ],
    operating_hours: {
      start: '07:30',
      end: '22:00',
      is24Hours: false,
      operatingDays: [0, 1, 2, 3, 4, 5, 6]
    },
    min_notice_hours: 2,
    max_advance_days: 180,
    setup_buffer_minutes: 15,
    cleanup_buffer_minutes: 15,
    requires_approval: true,
    pic: {
      name: 'Puan Noor Aishah binti Omar',
      phone: '016-3224178',
      email: 'aishah.omar@moh.gov.my',
      jawatan: 'Penolong Pegawai Tadbir N29',
      department: 'Unit Pentadbiran & Fasiliti'
    },
    pic_user_id: 'user-admin-1',
    color_code: '#0284c7', // Sky Blue
    hospital_id: 'hosp-lawas',
    house_rules: [
      'Terminal Webex / Zoom Rooms hendaklah dimatikan selepas sesi selesai.',
      'Hanya minuman bertutup dibenarkan di atas meja persidangan utama.',
      'Sila serahkan kad kunci ke kaunter pentadbiran selepas selesai.'
    ],
    is_active: true,
    created_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'room-lawas-02',
    room_code: 'DWN-KNYL-01',
    name: 'Dewan Serbaguna Utama (Dewan Kenyalang)',
    category: 'conference_hall',
    capacity: 250,
    location: 'Aras Bawah (Ground), Blok Pentadbiran & Sokongan',
    floor_level: 'Aras G',
    building_block: 'Blok Pentadbiran',
    status: 'available',
    amenities: [
      'projector',
      'pa_sound_system',
      'wireless_mic',
      'video_conferencing',
      'vip_lounge',
      'podium',
      'recording_facility',
      'catering_space',
      'aircond',
      'wifi_kkm'
    ],
    layouts: [
      { layout: 'theatre', capacity: 250 },
      { layout: 'banquet', capacity: 160 },
      { layout: 'classroom', capacity: 120 },
      { layout: 'u_shape', capacity: 60 }
    ],
    operating_hours: {
      start: '07:00',
      end: '23:00',
      is24Hours: false,
      operatingDays: [0, 1, 2, 3, 4, 5, 6]
    },
    min_notice_hours: 4,
    max_advance_days: 180,
    setup_buffer_minutes: 30,
    cleanup_buffer_minutes: 45,
    requires_approval: true,
    pic: {
      name: 'En. Emung Rigi',
      phone: '019-4855640',
      email: 'emung.rigi@moh.gov.my',
      jawatan: 'Pembantu Khidmat Am Operasi',
      department: 'Unit Pentadbiran & Aset'
    },
    pic_user_id: 'user-admin-1',
    color_code: '#c026d3', // Fuchsia
    hospital_id: 'hosp-lawas',
    house_rules: [
      'Larangan membawa makanan berkuah ke pentas utama.',
      'Sistem audio/PA dewan hendaklah dikendalikan bersama juruteknik bertugas.',
      'Pembersihan sisa katering wajib selesai dalam tempoh 45 minit selepas majlis.'
    ],
    is_active: true,
    created_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'room-lawas-03',
    room_code: 'BS-PHARM-01',
    name: 'Bilik Seminar & CPD Farmasi',
    category: 'training_room',
    capacity: 40,
    location: 'Aras 2, Kompleks Farmasi Logistik',
    floor_level: 'Aras 2',
    building_block: 'Blok Farmasi',
    status: 'available',
    amenities: [
      'projector',
      'smart_tv',
      'whiteboard',
      'pa_sound_system',
      'wireless_mic',
      'wifi_kkm',
      'aircond',
      'flipchart',
      'catering_space'
    ],
    layouts: [
      { layout: 'classroom', capacity: 35 },
      { layout: 'theatre', capacity: 45 },
      { layout: 'cluster', capacity: 30 }
    ],
    operating_hours: {
      start: '08:00',
      end: '18:00',
      is24Hours: false,
      operatingDays: [1, 2, 3, 4, 5]
    },
    min_notice_hours: 1,
    max_advance_days: 90,
    setup_buffer_minutes: 15,
    cleanup_buffer_minutes: 20,
    requires_approval: false,
    pic: {
      name: 'En. Tan Yuan Zhang',
      phone: '016-3224178',
      email: 'hosplawas@gmail.com',
      jawatan: 'Ketua Pegawai Farmasi (HOD UF52)',
      department: 'Jabatan Farmasi'
    },
    pic_user_id: 'user-pharm-1',
    color_code: '#059669', // Emerald
    hospital_id: 'hosp-lawas',
    house_rules: [
      'Ruang jamuan disediakan di bahagian luar foyer bilik seminar.',
      'Sila kemaskan susunan meja dan kerusi ke susunan bilik darjah asal.'
    ],
    is_active: true,
    created_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'room-lawas-04',
    room_code: 'BL-ARG-BGB01',
    name: 'Bilik Gerakan Krisis & Bencana (EOC)',
    category: 'command_center',
    capacity: 20,
    location: 'Aras G, Bersebelahan Jabatan Kecemasan & Trauma',
    floor_level: 'Aras G',
    building_block: 'Blok Kecemasan',
    status: 'available',
    amenities: [
      'video_conferencing',
      'smart_tv',
      'pa_sound_system',
      'wifi_kkm',
      'aircond',
      'backup_generator',
      'recording_facility',
      'whiteboard'
    ],
    layouts: [
      { layout: 'boardroom', capacity: 20 }
    ],
    operating_hours: {
      start: '00:00',
      end: '23:59',
      is24Hours: true,
      operatingDays: [0, 1, 2, 3, 4, 5, 6]
    },
    min_notice_hours: 0,
    max_advance_days: 365,
    setup_buffer_minutes: 10,
    cleanup_buffer_minutes: 10,
    requires_approval: true,
    pic: {
      name: 'Dr. Pegawai Perubatan On-Call (EOC)',
      phone: '085-284100',
      email: 'lawas.eoc@moh.gov.my',
      jawatan: 'Penyelaras Bilik Gerakan',
      department: 'Jabatan Kecemasan & Trauma'
    },
    pic_user_id: 'user-admin-1',
    color_code: '#dc2626', // Red
    hospital_id: 'hosp-lawas',
    house_rules: [
      'Keutamaan mutlak untuk panggilan bencana operasi, epidemik dan kecemasan daerah.',
      'Sebarang tempahan bukan kecemasan tertakluk kepada pembatalan serta-merta jika berlaku krisis.'
    ],
    is_active: true,
    created_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'room-lawas-05',
    room_code: 'LAB-IT-01',
    name: 'Makmal Komputer Latihan IT (EMR / HIS)',
    category: 'computer_lab',
    capacity: 28,
    location: 'Aras 2, Blok Pengurusan Maklumat & Rekod',
    floor_level: 'Aras 2',
    building_block: 'Blok Akademik',
    status: 'available',
    amenities: [
      'smart_tv',
      'projector',
      'document_camera',
      'whiteboard',
      'wifi_kkm',
      'aircond',
      'pa_sound_system'
    ],
    layouts: [
      { layout: 'classroom', capacity: 28 }
    ],
    operating_hours: {
      start: '08:00',
      end: '17:30',
      is24Hours: false,
      operatingDays: [1, 2, 3, 4, 5]
    },
    min_notice_hours: 2,
    max_advance_days: 90,
    setup_buffer_minutes: 15,
    cleanup_buffer_minutes: 15,
    requires_approval: true,
    pic: {
      name: 'En. Amri Amit',
      phone: '011-1657713',
      email: 'amri.amit@yahoo.com',
      jawatan: 'Penolong Pegawai Farmasi (Penyelaras IT)',
      department: 'Unit Sistem & Maklumat'
    },
    pic_user_id: 'user-staff-amri',
    color_code: '#0891b2', // Cyan
    hospital_id: 'hosp-lawas',
    house_rules: [
      'Dilarang sama sekali membawa sebarang makanan atau minuman ke meja komputer.',
      'Jangan menanggalkan kabel kuasa atau kabel rangkaian LAN workstation.'
    ],
    is_active: true,
    created_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'room-lawas-06',
    room_code: 'BD-TRTI-01',
    name: 'Bilik Diskusi Klinikal & Kaunseling (Bilik Teratai)',
    category: 'discussion_room',
    capacity: 10,
    location: 'Aras 1, Blok Pesakit Luar (OPD)',
    floor_level: 'Aras 1',
    building_block: 'Blok Klinikal',
    status: 'available',
    amenities: [
      'smart_tv',
      'whiteboard',
      'wifi_kkm',
      'aircond'
    ],
    layouts: [
      { layout: 'round_table', capacity: 10 },
      { layout: 'cluster', capacity: 8 }
    ],
    operating_hours: {
      start: '07:30',
      end: '21:00',
      is24Hours: false,
      operatingDays: [0, 1, 2, 3, 4, 5, 6]
    },
    min_notice_hours: 1,
    max_advance_days: 60,
    setup_buffer_minutes: 10,
    cleanup_buffer_minutes: 10,
    requires_approval: false,
    pic: {
      name: 'En. Mohamad Izwan bin Mat Zaid',
      phone: '017-2274015',
      email: 'aimanmz135@gmail.com',
      jawatan: 'Ketua Unit Farmasi Logistik UF9',
      department: 'Jabatan Farmasi'
    },
    pic_user_id: 'user-lead-logistik',
    color_code: '#f59e0b', // Amber
    hospital_id: 'hosp-lawas',
    house_rules: [
      'Ruang kedap bunyi untuk perbincangan kes klinikal dan kaunseling rawatan pesakit.',
      'Sila pastikan papan putih dipadam bersih selepas perbincangan.'
    ],
    is_active: true,
    created_at: '2026-01-01T08:00:00.000Z'
  }
]

// Sample initial seed bookings
export const DEFAULT_BOOKINGS_SEED: Booking[] = [
  {
    id: 'bk-2026-0001',
    booking_number: 'TMP-2026-00001',
    room_id: 'room-lawas-03',
    user_id: 'user-hod-tyz',
    pemohon_name: 'Tan Yuan Zhang',
    pemohon_jawatan: 'Ketua Pegawai Farmasi (HOD)',
    pemohon_department: 'Jabatan Farmasi',
    pemohon_email: 'hosplawas@gmail.com',
    pemohon_phone: '016-3224178',
    department_id: 'dept-pharmacy',
    purpose: 'Bengkel Pengurusan Ubat High-Alert & Antimicrobial Stewardship 2026',
    event_type: 'Kursus / Latihan',
    date: '2026-09-02',
    start_time: '08:30',
    end_time: '13:00',
    duration_hours: 4.5,
    attendees_count: 30,
    layout_type: 'classroom',
    requested_amenities: ['projector', 'smart_tv', 'pa_sound_system', 'wireless_mic', 'whiteboard', 'wifi_kkm', 'aircond'],
    peralatan_tambahan: [{ equipment_name: 'Presenter Clicker Laser', quantity: 2 }],
    tempahan_makanan: {
      diperlukan: true,
      jenis_hidangan: 'sarapan',
      pembekal_makanan: 'Kantin Hospital Lawas',
      anggaran_pax: 30,
      lokasi_hidang: 'Anjung Foyer Bilik Seminar'
    },
    tetamu_vip: { ada_vip: false },
    status: 'approved',
    priority: 'normal',
    approved_by: 'node-root-pengarah',
    approved_by_name: 'Pengarah Hospital Lawas',
    approved_at: '2026-08-26T02:15:00.000Z',
    catatan_pelulus: 'Permohonan diluluskan. Sila patuhi SOP kebersihan fasiliti.',
    hospital_id: 'hosp-lawas',
    created_at: '2026-08-25T08:00:00.000Z',
    updated_at: '2026-08-26T02:15:00.000Z'
  },
  {
    id: 'bk-2026-0002',
    booking_number: 'TMP-2026-00002',
    room_id: 'room-lawas-02',
    user_id: 'user-lead-logistik',
    pemohon_name: 'Mohamad Izwan bin Mat Zaid',
    pemohon_jawatan: 'Ketua Unit Farmasi Logistik',
    pemohon_department: 'Jabatan Farmasi',
    pemohon_email: 'aimanmz135@gmail.com',
    pemohon_phone: '017-2274015',
    department_id: 'dept-pharmacy',
    purpose: 'Sesi Libat Urus & Lawatan Kerja Pengarah Kesihatan Negeri Sarawak',
    event_type: 'Lawatan VIP',
    date: '2026-09-08',
    start_time: '09:00',
    end_time: '16:00',
    duration_hours: 7.0,
    attendees_count: 140,
    layout_type: 'theatre',
    requested_amenities: [
      'projector',
      'pa_sound_system',
      'wireless_mic',
      'video_conferencing',
      'vip_lounge',
      'podium',
      'recording_facility',
      'catering_space',
      'wifi_kkm',
      'aircond'
    ],
    peralatan_tambahan: [{ equipment_name: 'Bunting Stand & Karpet Merah', quantity: 4 }],
    tempahan_makanan: {
      diperlukan: true,
      jenis_hidangan: 'makan_tengahari',
      pembekal_makanan: 'Katering Rasmi JKN',
      anggaran_pax: 140,
      lokasi_hidang: 'Foyer Dewan Kenyalang'
    },
    tetamu_vip: {
      ada_vip: true,
      senarai_vip: ['YBhg. Pengarah Kesihatan Negeri Sarawak', 'Pegawai Kesihatan Bahagian Limbang'],
      memerlukan_holding_room: true,
      holding_room_id: 'room-lawas-01',
      susunan_protokol_khas: 'Kawalan keselamatan dan holding room VIP disediakan bermula 08:30 pagi.'
    },
    status: 'pending',
    priority: 'vvip_event',
    hospital_id: 'hosp-lawas',
    created_at: '2026-08-29T10:30:00.000Z',
    updated_at: '2026-08-29T10:30:00.000Z'
  },
  {
    id: 'bk-2026-0003',
    booking_number: 'TMP-2026-00003',
    room_id: 'room-lawas-01',
    user_id: 'user-staff-amri',
    pemohon_name: 'Amri Amit',
    pemohon_jawatan: 'Penolong Pegawai Farmasi (Logistik)',
    pemohon_department: 'Jabatan Farmasi',
    pemohon_email: 'amri.amit@yahoo.com',
    pemohon_phone: '011-1657713',
    department_id: 'dept-pharmacy',
    purpose: 'Mesyuarat Semakan Stok & Audit Dadah Berbahaya (DDA) Suku Tahun Ke-3',
    event_type: 'Mesyuarat Rasmi',
    date: '2026-08-28',
    start_time: '14:30',
    end_time: '16:30',
    duration_hours: 2.0,
    attendees_count: 14,
    layout_type: 'boardroom',
    requested_amenities: ['smart_tv', 'whiteboard', 'wifi_kkm', 'aircond'],
    tempahan_makanan: { diperlukan: false },
    tetamu_vip: { ada_vip: false },
    status: 'completed',
    priority: 'normal',
    approved_by: 'user-hod-tyz',
    approved_by_name: 'Tan Yuan Zhang',
    approved_at: '2026-08-21T01:00:00.000Z',
    check_in_at: '2026-08-28T06:25:00.000Z',
    check_out_at: '2026-08-28T08:35:00.000Z',
    hospital_id: 'hosp-lawas',
    created_at: '2026-08-20T03:00:00.000Z',
    updated_at: '2026-08-28T08:35:00.000Z'
  }
]

export const PUBLIC_HOLIDAYS_DATABASE: Record<string, string> = {
  '2026-01-01': 'Tahun Baharu',
  '2026-01-28': 'Tahun Baharu Cina',
  '2026-01-29': 'Tahun Baharu Cina (Hari Ke-2)',
  '2026-03-21': 'Hari Raya Aidilfitri',
  '2026-03-22': 'Hari Raya Aidilfitri (Hari Ke-2)',
  '2026-05-01': 'Hari Pekerja',
  '2026-05-31': 'Hari Wesak',
  '2026-06-01': 'Hari Gawai Dayak (Sarawak)',
  '2026-06-02': 'Hari Gawai Dayak (Hari Ke-2)',
  '2026-06-08': 'Hari Keputeraan YDP Agong',
  '2026-07-22': 'Hari Kemerdekaan Sarawak',
  '2026-08-31': 'Hari Kebangsaan',
  '2026-09-16': 'Hari Malaysia',
  '2026-10-10': 'Hari Jadi TYT Sarawak',
  '2026-12-25': 'Hari Krismas'
}

