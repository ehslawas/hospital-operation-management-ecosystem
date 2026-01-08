import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.adrIncident.deleteMany();
  await prisma.ddRegister.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.drugInteraction.deleteMany();
  await prisma.user.deleteMany();

  // Seed Facilities
  console.log('🏥 Seeding facilities...');
  const facilities = await prisma.facility.createMany({
    data: [
      {
        code: 'HKL',
        name: 'Hospital Kuala Lumpur',
        type: 'Hospital',
        state: 'Wilayah Persekutuan',
        district: 'Kuala Lumpur',
        address: 'Jalan Pahang, 50586 Kuala Lumpur',
        phone: '03-26155555',
      },
      {
        code: 'HSB',
        name: 'Hospital Sungai Buloh',
        type: 'Hospital',
        state: 'Selangor',
        district: 'Petaling',
        address: 'Jalan Hospital, 47000 Sungai Buloh, Selangor',
        phone: '03-61454333',
      },
      {
        code: 'KKB1',
        name: 'Klinik Kesihatan Bandar',
        type: 'Clinic',
        state: 'Selangor',
        district: 'Petaling',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${facilities.count} facilities`);

  // Seed Medications
  console.log('💊 Seeding medications...');
  const medications = await prisma.medication.createMany({
    data: [
      {
        code: 'PARA500',
        nameFull: 'Paracetamol 500mg Tablet',
        genericName: 'Paracetamol',
        strength: '500mg',
        form: 'Tablet',
        route: 'Oral',
        unitPrice: 0.50,
        stockLevel: 5000,
        reorderLevel: 1000,
      },
      {
        code: 'AMOX250',
        nameFull: 'Amoxicillin 250mg Capsule',
        genericName: 'Amoxicillin',
        strength: '250mg',
        form: 'Capsule',
        route: 'Oral',
        unitPrice: 1.20,
        stockLevel: 2000,
        reorderLevel: 500,
      },
      {
        code: 'METF500',
        nameFull: 'Metformin 500mg Tablet',
        genericName: 'Metformin',
        strength: '500mg',
        form: 'Tablet',
        route: 'Oral',
        unitPrice: 0.80,
        stockLevel: 3000,
        reorderLevel: 800,
      },
      {
        code: 'AMLO5',
        nameFull: 'Amlodipine 5mg Tablet',
        genericName: 'Amlodipine',
        strength: '5mg',
        form: 'Tablet',
        route: 'Oral',
        unitPrice: 0.60,
        stockLevel: 2500,
        reorderLevel: 600,
      },
      {
        code: 'MORPH10',
        nameFull: 'Morphine 10mg/ml Injection',
        genericName: 'Morphine',
        strength: '10mg/ml',
        form: 'Injection',
        route: 'IV/IM',
        isControlled: true,
        unitPrice: 5.00,
        stockLevel: 100,
        reorderLevel: 20,
      },
      {
        code: 'INSUL100',
        nameFull: 'Insulin Aspart 100 units/ml',
        genericName: 'Insulin Aspart',
        strength: '100 units/ml',
        form: 'Injection',
        route: 'SC',
        requiresColdChain: true,
        unitPrice: 25.00,
        stockLevel: 300,
        reorderLevel: 50,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${medications.count} medications`);

  // Seed Patients
  console.log('👤 Seeding patients...');
  
  // Hash PIN for patient portal test account
  const testPinHash = await bcrypt.hash('123456', 10);
  
  const patientData = [
    {
      mrn: 'MRN2024001',
      nric: '900101-01-1234',
      name: 'Ahmad bin Abdullah',
      dob: new Date('1990-01-01'),
      gender: 'Male',
      phone: '0123456789',
      email: 'ahmad@example.com',
      allergies: ['Penicillin'],
    },
    {
      mrn: 'MRN2024002',
      nric: '850505-02-5678',
      name: 'Siti binti Hassan',
      dob: new Date('1985-05-05'),
      gender: 'Female',
      phone: '0129876543',
      allergies: [],
    },
    {
      mrn: 'MRN2024003',
      nric: '750315-10-2468',
      name: 'Tan Ah Kow',
      dob: new Date('1975-03-15'),
      gender: 'Male',
      phone: '0167654321',
      allergies: ['Aspirin', 'NSAIDs'],
    },
    {
      mrn: 'MRN2024004',
      nric: '920820-14-8642',
      name: 'Muthu Kumar',
      dob: new Date('1992-08-20'),
      gender: 'Male',
      phone: '0134567890',
      allergies: [],
    },
    {
      mrn: 'MRN2024005',
      nric: '880212-06-1357',
      name: 'Lee Mei Ling',
      dob: new Date('1988-02-12'),
      gender: 'Female',
      phone: '0198765432',
      email: 'meiling@example.com',
      allergies: ['Sulfa drugs'],
    },
    {
      mrn: 'MRN2024006',
      nric: '940120126733',
      name: 'Muhammad Hafiz bin Ahmad',
      dob: new Date('1994-01-20'),
      gender: 'Male',
      phone: '0123334455',
      email: 'hafiz@example.com',
      allergies: [],
      // Patient Portal Access
      pinHash: testPinHash,
      isPortalActive: true,
      portalActivatedAt: new Date(),
      portalLanguage: 'en',
    },
  ];

  for (const data of patientData) {
    await prisma.patient.create({ data });
  }
  console.log(`✅ Created ${patientData.length} patients (including 1 patient portal test account)`);

  // Seed Drug Interactions
  console.log('⚠️ Seeding drug interactions...');
  const interactions = await prisma.drugInteraction.createMany({
    data: [
      {
        drug1Code: 'AMOX250',
        drug2Code: 'METF500',
        severity: 'moderate',
        description: 'Amoxicillin may reduce the effectiveness of oral antidiabetic medications',
        management: 'Monitor blood glucose levels closely',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${interactions.count} drug interactions`);

  // Seed Users
  console.log('👨‍⚕️ Seeding users...');
  // Note: In production, use proper password hashing (bcrypt)
  const users = await prisma.user.createMany({
    data: [
      {
        username: 'admin',
        password: '$2a$10$rqD9KjZ8x5kkLxGxJ7YHzOx3bQqFd0LNq9Y4tZ5/JK3hI0P0P0P0P', // 'admin123' hashed
        name: 'System Administrator',
        email: 'admin@hospital.local',
        department: 'IT',
        role: 'admin',
      },
      {
        username: 'pharmacist1',
        password: '$2a$10$rqD9KjZ8x5kkLxGxJ7YHzOx3bQqFd0LNq9Y4tZ5/JK3hI0P0P0P0P',
        name: 'Nur Aina binti Ahmad',
        email: 'pharmacist1@hospital.local',
        department: 'Pharmacy',
        role: 'pharmacist',
      },
      {
        username: 'tech1',
        password: '$2a$10$rqD9KjZ8x5kkLxGxJ7YHzOx3bQqFd0LNq9Y4tZ5/JK3hI0P0P0P0P',
        name: 'Raj Kumar',
        email: 'tech1@hospital.local',
        department: 'Pharmacy',
        role: 'technician',
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${users.count} users`);

  // Seed Sample Prescriptions
  console.log('📋 Seeding prescriptions...');
  
  const patients = await prisma.patient.findMany({ take: 4 });
  
  if (patients.length > 0) {
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      
      const prescription = await prisma.prescription.create({
        data: {
          patientId: patient.id,
          source: i === 0 ? 'Outpatient' : i === 1 ? 'Ward' : 'Emergency',
          status: i === 0 ? 'new' : i === 1 ? 'verified' : 'ready',
          prescribedBy: 'Dr. Ahmad Zaki',
          prescribedAt: new Date(),
          priority: i === 2 ? 'urgent' : 'normal',
          notes: 'Sample prescription',
          items: {
            create: [
              {
                drugCode: 'PARA500',
                quantity: 30,
                dosage: '500mg',
                frequency: 'TDS',
                duration: '10 days',
                instructions: 'Take after meals',
              },
              {
                drugCode: 'AMOX250',
                quantity: 21,
                dosage: '250mg',
                frequency: 'TDS',
                duration: '7 days',
                instructions: 'Complete the full course',
              },
            ],
          },
        },
      });
    }
    console.log(`✅ Created ${patients.length} prescriptions`);
  }
  
  // Add specific prescriptions for patient portal test account
  const portalTestPatient = await prisma.patient.findUnique({
    where: { nric: '940120126733' }
  });
  
  if (portalTestPatient) {
    // Current ongoing medications
    await prisma.prescription.create({
      data: {
        patientId: portalTestPatient.id,
        source: 'Outpatient',
        status: 'dispensed',
        prescribedBy: 'Dr. Fatimah Zahra',
        prescribedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        priority: 'normal',
        notes: 'Chronic disease management',
        items: {
          create: [
            {
              drugCode: 'METF500',
              quantity: 60,
              dosage: '500mg',
              frequency: 'BD',
              duration: '30 days',
              instructions: 'Take with meals',
            },
            {
              drugCode: 'AMLO5',
              quantity: 30,
              dosage: '5mg',
              frequency: 'OD',
              duration: '30 days',
              instructions: 'Take in the morning',
            },
          ],
        },
      },
    });
    console.log('✅ Created patient portal test prescriptions');
  }

  // Seed Sample Appointments
  console.log('📅 Seeding appointments...');
  
  if (patients.length > 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    for (let i = 0; i < Math.min(2, patients.length); i++) {
      const patient = patients[i];
      const appointmentTime = new Date(tomorrow);
      appointmentTime.setHours(appointmentTime.getHours() + i);

      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          dateTime: appointmentTime,
          type: i === 0 ? 'Counseling' : 'MTAC',
          status: 'scheduled',
          pharmacist: 'Nur Aina binti Ahmad',
          notes: 'Routine check',
        },
      });
    }
    console.log(`✅ Created ${Math.min(2, patients.length)} appointments`);
  }

  console.log('✨ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

