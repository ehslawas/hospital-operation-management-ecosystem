'use client';

import { useState, useEffect } from 'react';
import ClientOnly from '@/components/ClientOnly';
import { IconBeaker, IconSearch, IconFilter, IconPlus, IconEdit, IconTrash, IconEye, IconSave } from '@/components/ui/Icons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KKMHospital {
  id: string;
  hospitalCode: string;
  hospitalName: string;
  state: string;
  district: string;
  hospitalType: 'General Hospital' | 'District Hospital' | 'Health Clinic' | 'Specialist Hospital';
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  registrationDate: string;
  lastUpdated: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const mockHospitals: KKMHospital[] = [
  // Kuala Lumpur
  {
    id: '1',
    hospitalCode: 'KKM001',
    hospitalName: 'Hospital Kuala Lumpur',
    state: 'Kuala Lumpur',
    district: 'Kuala Lumpur',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1962-01-01',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Ahmad Rahman',
    phone: '+603-26155555',
    email: 'admin@hkl.gov.my',
    address: 'Jalan Pahang, 53000 Kuala Lumpur',
    coordinates: { latitude: 3.1390, longitude: 101.6869 }
  },
  {
    id: '2',
    hospitalCode: 'KKM002',
    hospitalName: 'Hospital Universiti Kebangsaan Malaysia (HUKM)',
    state: 'Kuala Lumpur',
    district: 'Cheras',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1997-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Prof. Dr. Siti Aminah',
    phone: '+603-91455555',
    email: 'admin@hukm.ukm.my',
    address: 'Jalan Yaacob Latif, Bandar Tun Razak, 56000 Cheras, Kuala Lumpur',
    coordinates: { latitude: 3.1167, longitude: 101.7500 }
  },

  // Selangor
  {
    id: '3',
    hospitalCode: 'KKM003',
    hospitalName: 'Hospital Selayang',
    state: 'Selangor',
    district: 'Gombak',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1996-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Siti Aminah',
    phone: '+603-61203200',
    email: 'admin@hselayang.gov.my',
    address: 'Lebuhraya Selayang-Kepong, 68100 Batu Caves, Selangor',
    coordinates: { latitude: 3.2415, longitude: 101.6561 }
  },
  {
    id: '4',
    hospitalCode: 'KKM004',
    hospitalName: 'Hospital Sungai Buloh',
    state: 'Selangor',
    district: 'Gombak',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '2005-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Lim Wei Ming',
    phone: '+603-61561000',
    email: 'admin@hsb.gov.my',
    address: 'Jalan Hospital, 47000 Sungai Buloh, Selangor',
    coordinates: { latitude: 3.2167, longitude: 101.5833 }
  },
  {
    id: '5',
    hospitalCode: 'KKM005',
    hospitalName: 'Hospital Tengku Ampuan Rahimah',
    state: 'Selangor',
    district: 'Klang',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1985-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Norazlina',
    phone: '+603-33757000',
    email: 'admin@htar.gov.my',
    address: 'Jalan Langat, 41200 Klang, Selangor',
    coordinates: { latitude: 3.0333, longitude: 101.4500 }
  },
  {
    id: '6',
    hospitalCode: 'KKM006',
    hospitalName: 'Hospital Serdang',
    state: 'Selangor',
    district: 'Sepang',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '2005-01-01',
    lastUpdated: '2024-01-14',
    contactPerson: 'Dr. Mohd Azlan',
    phone: '+603-89476000',
    email: 'admin@hserdang.gov.my',
    address: 'Jalan Puchong, 43000 Kajang, Selangor',
    coordinates: { latitude: 2.9833, longitude: 101.7833 }
  },

  // Johor
  {
    id: '7',
    hospitalCode: 'KKM007',
    hospitalName: 'Hospital Sultanah Aminah',
    state: 'Johor',
    district: 'Johor Bahru',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1882-01-01',
    lastUpdated: '2024-01-05',
    contactPerson: 'Dr. Lim Wei Ming',
    phone: '+607-2237000',
    email: 'admin@hsajb.gov.my',
    address: 'Jalan Persiaran Sultanah Aminah, 80000 Johor Bahru, Johor',
    coordinates: { latitude: 1.4927, longitude: 103.7414 }
  },
  {
    id: '8',
    hospitalCode: 'KKM008',
    hospitalName: 'Hospital Sultan Ismail',
    state: 'Johor',
    district: 'Johor Bahru',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '2000-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Raj Kumar',
    phone: '+607-3818000',
    email: 'admin@hsi.gov.my',
    address: 'Jalan Persiaran Mutiara Emas, Taman Mount Austin, 81100 Johor Bahru, Johor',
    coordinates: { latitude: 1.5167, longitude: 103.7833 }
  },
  {
    id: '9',
    hospitalCode: 'KKM009',
    hospitalName: 'Hospital Enche Besar Hajjah Kalsom',
    state: 'Johor',
    district: 'Kluang',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1950-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Siti Nurhaliza',
    phone: '+607-7717000',
    email: 'admin@hebhk.gov.my',
    address: 'Jalan Hospital, 86000 Kluang, Johor',
    coordinates: { latitude: 2.0167, longitude: 103.3167 }
  },
  {
    id: '10',
    hospitalCode: 'KKM010',
    hospitalName: 'Hospital Sultanah Nora Ismail',
    state: 'Johor',
    district: 'Batu Pahat',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '2000-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Ahmad Fauzi',
    phone: '+607-4367000',
    email: 'admin@hsni.gov.my',
    address: 'Jalan Korma, Taman Soga, 83000 Batu Pahat, Johor',
    coordinates: { latitude: 1.8500, longitude: 102.9333 }
  },

  // Perak
  {
    id: '11',
    hospitalCode: 'KKM011',
    hospitalName: 'Hospital Raja Permaisuri Bainun',
    state: 'Perak',
    district: 'Ipoh',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1882-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Raj Kumar',
    phone: '+605-2085000',
    email: 'admin@hrpb.gov.my',
    address: 'Jalan Hospital, 30450 Ipoh, Perak',
    coordinates: { latitude: 4.5841, longitude: 101.0829 }
  },
  {
    id: '12',
    hospitalCode: 'KKM012',
    hospitalName: 'Hospital Taiping',
    state: 'Perak',
    district: 'Larut & Matang',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1880-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Lim Siew Choo',
    phone: '+605-8085000',
    email: 'admin@htp.gov.my',
    address: 'Jalan Taming Sari, 34000 Taiping, Perak',
    coordinates: { latitude: 4.8500, longitude: 100.7333 }
  },
  {
    id: '13',
    hospitalCode: 'KKM013',
    hospitalName: 'Hospital Teluk Intan',
    state: 'Perak',
    district: 'Hilir Perak',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1950-01-01',
    lastUpdated: '2024-01-14',
    contactPerson: 'Dr. Norazlina',
    phone: '+605-6221000',
    email: 'admin@hti.gov.my',
    address: 'Jalan Changkat Jong, 36000 Teluk Intan, Perak',
    coordinates: { latitude: 4.0167, longitude: 101.0167 }
  },

  // Pulau Pinang
  {
    id: '14',
    hospitalCode: 'KKM014',
    hospitalName: 'Hospital Seberang Jaya',
    state: 'Pulau Pinang',
    district: 'Seberang Perai Tengah',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1996-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Norazlina',
    phone: '+604-3825333',
    email: 'admin@hsj.gov.my',
    address: 'Jalan Tun Hussein Onn, 13700 Seberang Jaya, Pulau Pinang',
    coordinates: { latitude: 5.3961, longitude: 100.4000 }
  },
  {
    id: '15',
    hospitalCode: 'KKM015',
    hospitalName: 'Hospital Pulau Pinang',
    state: 'Pulau Pinang',
    district: 'Timur Laut',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1882-01-01',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Mohd Azlan',
    phone: '+604-2225333',
    email: 'admin@hpp.gov.my',
    address: 'Jalan Residensi, 10990 Georgetown, Pulau Pinang',
    coordinates: { latitude: 5.4161, longitude: 100.3327 }
  },
  {
    id: '16',
    hospitalCode: 'KKM016',
    hospitalName: 'Hospital Kepala Batas',
    state: 'Pulau Pinang',
    district: 'Seberang Perai Utara',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '2000-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Ahmad Fauzi',
    phone: '+604-5799000',
    email: 'admin@hkb.gov.my',
    address: 'Jalan Bertam Indah, 13200 Kepala Batas, Pulau Pinang',
    coordinates: { latitude: 5.5167, longitude: 100.4333 }
  },

  // Kedah
  {
    id: '17',
    hospitalCode: 'KKM017',
    hospitalName: 'Hospital Sultanah Bahiyah',
    state: 'Kedah',
    district: 'Alor Setar',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '2000-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Siti Aminah',
    phone: '+604-7346000',
    email: 'admin@hsb.gov.my',
    address: 'Jalan Langgar, 05460 Alor Setar, Kedah',
    coordinates: { latitude: 6.1167, longitude: 100.3667 }
  },
  {
    id: '18',
    hospitalCode: 'KKM018',
    hospitalName: 'Hospital Sultan Abdul Halim',
    state: 'Kedah',
    district: 'Sungai Petani',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1980-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Lim Wei Ming',
    phone: '+604-4215000',
    email: 'admin@hsah.gov.my',
    address: 'Jalan Hospital, 08000 Sungai Petani, Kedah',
    coordinates: { latitude: 5.6500, longitude: 100.4833 }
  },

  // Kelantan
  {
    id: '19',
    hospitalCode: 'KKM019',
    hospitalName: 'Hospital Raja Perempuan Zainab II',
    state: 'Kelantan',
    district: 'Kota Bharu',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1970-01-01',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Raj Kumar',
    phone: '+609-7472000',
    email: 'admin@hrpz2.gov.my',
    address: 'Jalan Hospital, 15000 Kota Bharu, Kelantan',
    coordinates: { latitude: 6.1167, longitude: 102.2500 }
  },
  {
    id: '20',
    hospitalCode: 'KKM020',
    hospitalName: 'Hospital Universiti Sains Malaysia',
    state: 'Kelantan',
    district: 'Kota Bharu',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1983-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Prof. Dr. Siti Nurhaliza',
    phone: '+609-7673000',
    email: 'admin@husm.usm.my',
    address: 'Jalan Raja Perempuan Zainab II, 16150 Kubang Kerian, Kelantan',
    coordinates: { latitude: 6.0833, longitude: 102.2833 }
  },

  // Terengganu
  {
    id: '21',
    hospitalCode: 'KKM021',
    hospitalName: 'Hospital Sultanah Nur Zahirah',
    state: 'Terengganu',
    district: 'Kuala Terengganu',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1980-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Ahmad Fauzi',
    phone: '+609-6212000',
    email: 'admin@hsnz.gov.my',
    address: 'Jalan Sultanah Zainab, 20400 Kuala Terengganu, Terengganu',
    coordinates: { latitude: 5.3333, longitude: 103.1333 }
  },
  {
    id: '22',
    hospitalCode: 'KKM022',
    hospitalName: 'Hospital Dungun',
    state: 'Terengganu',
    district: 'Dungun',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1990-01-01',
    lastUpdated: '2024-01-14',
    contactPerson: 'Dr. Norazlina',
    phone: '+609-8481000',
    email: 'admin@hdg.gov.my',
    address: 'Jalan Hospital, 23000 Dungun, Terengganu',
    coordinates: { latitude: 4.7500, longitude: 103.4167 }
  },

  // Pahang
  {
    id: '23',
    hospitalCode: 'KKM023',
    hospitalName: 'Hospital Tengku Ampuan Afzan',
    state: 'Pahang',
    district: 'Kuantan',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1980-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Mohd Azlan',
    phone: '+609-5555000',
    email: 'admin@htaa.gov.my',
    address: 'Jalan Tanah Putih, 25100 Kuantan, Pahang',
    coordinates: { latitude: 3.8167, longitude: 103.3333 }
  },
  {
    id: '24',
    hospitalCode: 'KKM024',
    hospitalName: 'Hospital Bentong',
    state: 'Pahang',
    district: 'Bentong',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1970-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Lim Siew Choo',
    phone: '+609-2221000',
    email: 'admin@hbt.gov.my',
    address: 'Jalan Hospital, 28700 Bentong, Pahang',
    coordinates: { latitude: 3.5167, longitude: 101.9167 }
  },

  // Negeri Sembilan
  {
    id: '25',
    hospitalCode: 'KKM025',
    hospitalName: 'Hospital Tuanku Ja\'afar',
    state: 'Negeri Sembilan',
    district: 'Seremban',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1990-01-01',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Ahmad Rahman',
    phone: '+606-7677000',
    email: 'admin@htj.gov.my',
    address: 'Jalan Rasah, 70300 Seremban, Negeri Sembilan',
    coordinates: { latitude: 2.7167, longitude: 101.9333 }
  },
  {
    id: '26',
    hospitalCode: 'KKM026',
    hospitalName: 'Hospital Port Dickson',
    state: 'Negeri Sembilan',
    district: 'Port Dickson',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1980-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Siti Aminah',
    phone: '+606-6471000',
    email: 'admin@hpd.gov.my',
    address: 'Jalan Pantai, 71000 Port Dickson, Negeri Sembilan',
    coordinates: { latitude: 2.5167, longitude: 101.8000 }
  },

  // Melaka
  {
    id: '27',
    hospitalCode: 'KKM027',
    hospitalName: 'Hospital Melaka',
    state: 'Melaka',
    district: 'Melaka Tengah',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1950-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Lim Wei Ming',
    phone: '+606-2892000',
    email: 'admin@hm.gov.my',
    address: 'Jalan Mufti Haji Khalil, 75400 Melaka',
    coordinates: { latitude: 2.2000, longitude: 102.2500 }
  },
  {
    id: '28',
    hospitalCode: 'KKM028',
    hospitalName: 'Hospital Jasin',
    state: 'Melaka',
    district: 'Jasin',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1980-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Raj Kumar',
    phone: '+606-5291000',
    email: 'admin@hj.gov.my',
    address: 'Jalan Hospital, 77000 Jasin, Melaka',
    coordinates: { latitude: 2.3167, longitude: 102.4333 }
  },

  // Sabah
  {
    id: '29',
    hospitalCode: 'KKM029',
    hospitalName: 'Hospital Queen Elizabeth',
    state: 'Sabah',
    district: 'Kota Kinabalu',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1957-01-01',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Mohd Azlan',
    phone: '+6088-324600',
    email: 'admin@hqe.gov.my',
    address: 'Jalan Penampang, 88300 Kota Kinabalu, Sabah',
    coordinates: { latitude: 5.9804, longitude: 116.0735 }
  },
  {
    id: '30',
    hospitalCode: 'KKM030',
    hospitalName: 'Hospital Duchess of Kent',
    state: 'Sabah',
    district: 'Sandakan',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1950-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Ahmad Fauzi',
    phone: '+6089-212111',
    email: 'admin@hdok.gov.my',
    address: 'Jalan Utara, 90000 Sandakan, Sabah',
    coordinates: { latitude: 5.8333, longitude: 118.1167 }
  },
  {
    id: '31',
    hospitalCode: 'KKM031',
    hospitalName: 'Hospital Tawau',
    state: 'Sabah',
    district: 'Tawau',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1960-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Norazlina',
    phone: '+6089-773333',
    email: 'admin@htw.gov.my',
    address: 'Jalan Utara, 91000 Tawau, Sabah',
    coordinates: { latitude: 4.2500, longitude: 117.9000 }
  },
  {
    id: '32',
    hospitalCode: 'KKM032',
    hospitalName: 'Hospital Keningau',
    state: 'Sabah',
    district: 'Keningau',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1970-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Siti Nurhaliza',
    phone: '+6087-331144',
    email: 'admin@hkg.gov.my',
    address: 'Jalan Hospital, 89000 Keningau, Sabah',
    coordinates: { latitude: 5.3333, longitude: 116.1667 }
  },

  // Sarawak
  {
    id: '33',
    hospitalCode: 'KKM033',
    hospitalName: 'Hospital Umum Sarawak',
    state: 'Sarawak',
    district: 'Kuching',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1950-01-01',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Ahmad Rahman',
    phone: '+6082-276666',
    email: 'admin@hus.gov.my',
    address: 'Jalan Hospital, 93586 Kuching, Sarawak',
    coordinates: { latitude: 1.5500, longitude: 110.3500 }
  },
  {
    id: '34',
    hospitalCode: 'KKM034',
    hospitalName: 'Hospital Sibu',
    state: 'Sarawak',
    district: 'Sibu',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1960-01-01',
    lastUpdated: '2024-01-10',
    contactPerson: 'Dr. Siti Aminah',
    phone: '+6084-343333',
    email: 'admin@hsb.gov.my',
    address: 'Jalan Hospital, 96000 Sibu, Sarawak',
    coordinates: { latitude: 2.3000, longitude: 111.8167 }
  },
  {
    id: '35',
    hospitalCode: 'KKM035',
    hospitalName: 'Hospital Miri',
    state: 'Sarawak',
    district: 'Miri',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1970-01-01',
    lastUpdated: '2024-01-12',
    contactPerson: 'Dr. Lim Wei Ming',
    phone: '+6085-420033',
    email: 'admin@hmr.gov.my',
    address: 'Jalan Hospital, 98000 Miri, Sarawak',
    coordinates: { latitude: 4.3833, longitude: 113.9833 }
  },
  {
    id: '36',
    hospitalCode: 'KKM036',
    hospitalName: 'Hospital Bintulu',
    state: 'Sarawak',
    district: 'Bintulu',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1980-01-01',
    lastUpdated: '2024-01-08',
    contactPerson: 'Dr. Raj Kumar',
    phone: '+6086-331144',
    email: 'admin@hbt.gov.my',
    address: 'Jalan Hospital, 97000 Bintulu, Sarawak',
    coordinates: { latitude: 3.1667, longitude: 113.0333 }
  },

  // Labuan
  {
    id: '37',
    hospitalCode: 'KKM037',
    hospitalName: 'Hospital Labuan',
    state: 'Labuan',
    district: 'Labuan',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '1980-01-01',
    lastUpdated: '2024-01-14',
    contactPerson: 'Dr. Ahmad Fauzi',
    phone: '+6087-414144',
    email: 'admin@hlb.gov.my',
    address: 'Jalan Hospital, 87000 Labuan',
    coordinates: { latitude: 5.2833, longitude: 115.2333 }
  },

  // Putrajaya
  {
    id: '38',
    hospitalCode: 'KKM038',
    hospitalName: 'Hospital Putrajaya',
    state: 'Putrajaya',
    district: 'Putrajaya',
    hospitalType: 'General Hospital',
    status: 'Active',
    registrationDate: '2000-01-01',
    lastUpdated: '2024-01-15',
    contactPerson: 'Dr. Norazlina',
    phone: '+603-83124200',
    email: 'admin@hpj.gov.my',
    address: 'Presint 7, 62250 Putrajaya',
    coordinates: { latitude: 2.9167, longitude: 101.7000 }
  }
];

// Append additional hospitals provided by user to make the list complete
const additionalHospitalNames: string[] = [
  'Hospital Alor Gajah','Hospital Ampang','Hospital Bahagia Ulu Kinta','Hospital Balik Pulau','Hospital Baling','Hospital Banting','Hospital Batu Gajah','Hospital Bau','Hospital Beaufort','Hospital Beluran','Hospital Bentong','Hospital Besut','Hospital Betong','Hospital Bintulu','Hospital Bukit Mertajam','Hospital Changkat Melintang','Hospital Dalat','Hospital Daro','Hospital Duchess Of Kent','Hospital Dungun',"Hospital Enche' Besar Hajjah Kalsom (Kluang)",'Hospital Gerik','Hospital Gua Musang','Hospital Hulu Terengganu','Hospital Jasin','Hospital Jelebu','Hospital Jeli','Hospital Jempol','Hospital Jengka','Hospital Jerantut','Hospital Jitra','Hospital Kajang','Hospital Kampar','Hospital Kanowit','Hospital Kapit','Hospital Kemaman','Hospital Keningau','Hospital Kepala Batas','Hospital Kinabatangan','Hospital Kota Belud','Hospital Kota Marudu','Hospital Kota Tinggi','Hospital Kuala Kangsar','Hospital Kuala Kubu Bharu','Hospital Kuala Lipis','Hospital Kuala Lumpur','Hospital Kuala Nerang','Hospital Kuala Penyu','Hospital Kudat','Hospital Kulim','Hospital Kunak','Hospital Labuan','Hospital Lahad Datu','Hospital Langkawi','Hospital Lawas','Hospital Limbang','Hospital Lundu','Hospital Machang','Hospital Marudi','Hospital Melaka','Hospital Mersing','Hospital Mesra Bukit Padang','Hospital Miri','Hospital Muadzam Shah','Hospital Mukah','Hospital Orang Asli','Hospital Pakar Sultanah Fatimah','Hospital Papar','Hospital Parit Buntar','Hospital Pasir Mas','Hospital Pekan','Hospital Pendang','Hospital Permai','Hospital Pitas','Hospital Pontian','Hospital Port Dickson','Hospital Pulau Pinang','Hospital Putrajaya','Hospital Queen Elizabeth','Hospital Queen Elizabeth II','Hospital Raja Perempuan Zainab II','Hospital Raja Permaisuri Bainun','Hospital Rajah Charles Brooke Memorial','Hospital Ranau','Hospital Raub','Hospital Rehabilitasi Cheras','Hospital Rembau','Hospital Rompin','Hospital Saratok','Hospital Sarikei','Hospital Seberang Jaya','Hospital Segamat','Hospital Selama','Hospital Selayang','Hospital Semporna','Hospital Sentosa','Hospital Serdang','Hospital Seri Manjung','Hospital Serian','Hospital Setiu','Hospital Shah Alam','Hospital Sibu','Hospital Sik','Hospital Simunjan','Hospital Sipitang','Hospital Slim River','Hospital Sri Aman','Hospital Sultan Abdul Halim','Hospital Sultan Hj Ahmad Shah','Hospital Sultan Ismail','Hospital Sultan Ismail Petra','Hospital Sultanah Aminah','Hospital Sultanah Bahiyah','Hospital Sultanah Hajjah Kalsom','Hospital Sultanah Nora Ismail','Hospital Sultanah Nur Zahirah','Hospital Sungai Bakap','Hospital Sungai Buloh','Hospital Sungai Siput','Hospital Taiping','Hospital Tambunan','Hospital Tampin','Hospital Tanah Merah','Hospital Tangkak','Hospital Tanjung Karang','Hospital Tapah','Hospital Tawau','Hospital Teluk Intan','Hospital Temenggong Seri Maharaja Tun Ibrahim','Hospital Tengku Ampuan Afzan','Hospital Tengku Ampuan Jemaah','Hospital Tengku Ampuan Rahimah','Hospital Tengku Anis','Hospital Tenom','Hospital Tuanku Ampuan Najihah','Hospital Tuanku Fauziah',"Hospital Tuanku Ja'afar Seremban",'Hospital Tuaran','Hospital Tumpat','Hospital Tunku Azizah (Wanita dan Kanak-Kanak)','Hospital Umum Sarawak','Hospital Wanita dan Kanak-Kanak Sabah','Hospital Yan','Institut Kanser Negara','Institut Perubatan Respiratori','Pusat Jantung Sarawak','Pusat Kawalan Kusta Negara'
];

const existingNames = new Set(mockHospitals.map(h => h.hospitalName));
additionalHospitalNames.forEach((name, idx) => {
  if (!existingNames.has(name)) {
    mockHospitals.push({
      id: String(mockHospitals.length + 1),
      hospitalCode: `KKM${String(mockHospitals.length + 1).padStart(3, '0')}`,
      hospitalName: name,
      state: 'Unknown',
      district: 'Unknown',
      hospitalType: 'General Hospital',
      status: 'Active',
      registrationDate: '',
      lastUpdated: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: name,
      coordinates: { latitude: 0, longitude: 0 },
    });
  }
});

export default function KKMHospitalCatalogPage() {
  const [hospitals, setHospitals] = useState<KKMHospital[]>(mockHospitals);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<KKMHospital | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<KKMHospital | null>(null);

  // pagination
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.hospitalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !filterState || hospital.state === filterState;
    const matchesType = !filterType || hospital.hospitalType === filterType;
    const matchesStatus = !filterStatus || hospital.status === filterStatus;
    
    return matchesSearch && matchesState && matchesType && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHospitals.length / pageSize));
  const paginatedHospitals = filteredHospitals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // reset page when filters/search change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterState, filterType, filterStatus]);

  const states = [...new Set(hospitals.map(h => h.state))].sort();
  const types = [...new Set(hospitals.map(h => h.hospitalType))].sort();
  const statuses = [...new Set(hospitals.map(h => h.status))].sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconBeaker className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">KKM Hospital Catalog</h1>
              <p className="text-slate-600">All KKM registered hospitals in Malaysia</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total KKM Hospitals</p>
                  <p className="text-2xl font-bold text-slate-900">{hospitals.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconBeaker className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {hospitals.filter(h => h.status === 'Active').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="h-5 w-5 rounded-full bg-green-600"></div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">States & Territories</p>
                  <p className="text-2xl font-bold text-slate-900">{states.length}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="h-5 w-5 rounded bg-purple-600"></div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Under Maintenance</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {hospitals.filter(h => h.status === 'Under Maintenance').length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="h-5 w-5 rounded bg-yellow-600"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search hospitals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <ClientOnly>
          {/* Hospitals Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hospital Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hospital Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedHospitals.map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {hospital.hospitalCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{hospital.hospitalName}</div>
                          <div className="text-sm text-slate-500">{hospital.district}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {hospital.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {hospital.hospitalType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(hospital.status)}>
                          {hospital.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {hospital.contactPerson}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setEditMode(false);
                              setForm(null);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <IconEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setForm({ ...hospital });
                              setEditMode(true);
                              setShowModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900">
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredHospitals.length)} of {filteredHospitals.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1.5 rounded border ${currentPage === 1 ? 'text-slate-400 border-slate-200' : 'text-slate-700 hover:bg-slate-50 border-slate-300'}`}
              >
                Prev
              </button>
              <div className="flex items-center gap-1 text-sm">
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">{currentPage}</span>
                <span className="text-slate-500">/ {totalPages}</span>
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1.5 rounded border ${currentPage === totalPages ? 'text-slate-400 border-slate-200' : 'text-slate-700 hover:bg-slate-50 border-slate-300'}`}
              >
                Next
              </button>
            </div>
          </div>
        </ClientOnly>

        {/* Hospital Details / Edit Modal */}
        {showModal && selectedHospital && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{editMode ? 'Edit Hospital' : 'Hospital Details'}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Hospital Code</label>
                    {editMode ? (
                      <input value={form?.hospitalCode || ''} onChange={(e)=> setForm(f=> f ? { ...f, hospitalCode: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.hospitalCode}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    {editMode ? (
                      <select value={form?.status || 'Active'} onChange={(e)=> setForm(f=> f ? { ...f, status: e.target.value as any } : f)} className="w-full px-3 py-2 border border-slate-300 rounded">
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>Under Maintenance</option>
                      </select>
                    ) : (
                      <Badge className={getStatusColor(selectedHospital.status)}>
                        {selectedHospital.status}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Hospital Name</label>
                  {editMode ? (
                    <input value={form?.hospitalName || ''} onChange={(e)=> setForm(f=> f ? { ...f, hospitalName: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                  ) : (
                    <p className="text-sm text-slate-900">{selectedHospital.hospitalName}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">State</label>
                    {editMode ? (
                      <input value={form?.state || ''} onChange={(e)=> setForm(f=> f ? { ...f, state: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">District</label>
                    {editMode ? (
                      <input value={form?.district || ''} onChange={(e)=> setForm(f=> f ? { ...f, district: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.district}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Hospital Type</label>
                  {editMode ? (
                    <select value={form?.hospitalType || 'General Hospital'} onChange={(e)=> setForm(f=> f ? { ...f, hospitalType: e.target.value as any } : f)} className="w-full px-3 py-2 border border-slate-300 rounded">
                      <option>General Hospital</option>
                      <option>District Hospital</option>
                      <option>Health Clinic</option>
                      <option>Specialist Hospital</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-900">{selectedHospital.hospitalType}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  {editMode ? (
                    <textarea value={form?.address || ''} onChange={(e)=> setForm(f=> f ? { ...f, address: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                  ) : (
                    <p className="text-sm text-slate-900">{selectedHospital.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Contact Person</label>
                    {editMode ? (
                      <input value={form?.contactPerson || ''} onChange={(e)=> setForm(f=> f ? { ...f, contactPerson: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.contactPerson}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Phone</label>
                    {editMode ? (
                      <input value={form?.phone || ''} onChange={(e)=> setForm(f=> f ? { ...f, phone: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  {editMode ? (
                    <input value={form?.email || ''} onChange={(e)=> setForm(f=> f ? { ...f, email: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                  ) : (
                    <p className="text-sm text-slate-900">{selectedHospital.email}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Registration Date</label>
                    {editMode ? (
                      <input type="date" value={form?.registrationDate || ''} onChange={(e)=> setForm(f=> f ? { ...f, registrationDate: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.registrationDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Last Updated</label>
                    {editMode ? (
                      <input type="date" value={form?.lastUpdated || ''} onChange={(e)=> setForm(f=> f ? { ...f, lastUpdated: e.target.value } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.lastUpdated}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Latitude</label>
                    {editMode ? (
                      <input value={String(form?.coordinates.latitude ?? '')} onChange={(e)=> setForm(f=> f ? { ...f, coordinates: { ...(f.coordinates||{latitude:0,longitude:0}), latitude: Number(e.target.value) } } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.coordinates.latitude}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Longitude</label>
                    {editMode ? (
                      <input value={String(form?.coordinates.longitude ?? '')} onChange={(e)=> setForm(f=> f ? { ...f, coordinates: { ...(f.coordinates||{latitude:0,longitude:0}), longitude: Number(e.target.value) } } : f)} className="w-full px-3 py-2 border border-slate-300 rounded" />
                    ) : (
                      <p className="text-sm text-slate-900">{selectedHospital.coordinates.longitude}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Close
                </button>
                {editMode ? (
                  <button
                    onClick={() => {
                      if (!form) return;
                      setHospitals(prev => prev.map(h => h.id === form.id ? form : h));
                      setSelectedHospital(form);
                      setShowModal(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <IconSave className="h-4 w-4" /> Save
                  </button>
                ) : (
                  <button
                    onClick={() => { setEditMode(true); setForm({ ...(selectedHospital as KKMHospital) }); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Edit Hospital
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


