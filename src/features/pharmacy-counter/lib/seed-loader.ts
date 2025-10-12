import type {
  Patient,
  Medication,
  Prescription,
  Appointment,
  Facility,
  DrugInteraction,
  AdrIncident,
  DdRegister,
} from '../types/entities';

// Import seed data
import facilitiesData from '../seed/facilities.json';
import patientsData from '../seed/patients.json';
import medicationsData from '../seed/medications.json';
import prescriptionsData from '../seed/prescriptions.json';
import appointmentsData from '../seed/appointments.json';
import interactionsData from '../seed/interactions.json';
import adrIncidentsData from '../seed/adr-incidents.json';
import ddRegistersData from '../seed/dd-registers.json';

// In-memory storage (simulating a database)
class DataStore {
  private facilities: Facility[] = [];
  private patients: Patient[] = [];
  private medications: Medication[] = [];
  private prescriptions: Prescription[] = [];
  private appointments: Appointment[] = [];
  private interactions: DrugInteraction[] = [];
  private adrIncidents: AdrIncident[] = [];
  private ddRegisters: DdRegister[] = [];

  constructor() {
    this.loadSeedData();
  }

  private loadSeedData() {
    this.facilities = facilitiesData as Facility[];
    this.patients = patientsData as Patient[];
    this.medications = medicationsData as Medication[];
    this.prescriptions = prescriptionsData as Prescription[];
    this.appointments = appointmentsData as Appointment[];
    this.interactions = interactionsData as DrugInteraction[];
    this.adrIncidents = adrIncidentsData as AdrIncident[];
    this.ddRegisters = ddRegistersData as DdRegister[];
  }

  // Facilities
  getFacilities() {
    return this.facilities;
  }

  getFacility(id: string) {
    return this.facilities.find((f) => f.id === id);
  }

  // Patients
  getPatients() {
    return this.patients;
  }

  getPatient(id: string) {
    return this.patients.find((p) => p.id === id);
  }

  searchPatients(query: string) {
    const q = query.toLowerCase();
    return this.patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.nric.toLowerCase().includes(q)
    );
  }

  // Medications
  getMedications() {
    return this.medications;
  }

  getMedication(code: string) {
    return this.medications.find((m) => m.code === code);
  }

  searchMedications(query: string) {
    const q = query.toLowerCase();
    return this.medications.filter(
      (m) =>
        m.nameFull.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q)
    );
  }

  // Prescriptions
  getPrescriptions() {
    return this.prescriptions;
  }

  getPrescription(id: string) {
    return this.prescriptions.find((p) => p.id === id);
  }

  getPrescriptionsByPatient(patientId: string) {
    return this.prescriptions.filter((p) => p.patientId === patientId);
  }

  getPrescriptionsByStatus(status: Prescription['status']) {
    return this.prescriptions.filter((p) => p.status === status);
  }

  updatePrescription(id: string, updates: Partial<Prescription>) {
    const index = this.prescriptions.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.prescriptions[index] = { ...this.prescriptions[index], ...updates };
      return this.prescriptions[index];
    }
    return null;
  }

  createPrescription(prescription: Prescription) {
    this.prescriptions.push(prescription);
    return prescription;
  }

  // Appointments
  getAppointments() {
    return this.appointments;
  }

  getAppointment(id: string) {
    return this.appointments.find((a) => a.id === id);
  }

  getAppointmentsByPatient(patientId: string) {
    return this.appointments.filter((a) => a.patientId === patientId);
  }

  getAppointmentsByDate(date: string) {
    return this.appointments.filter((a) => a.dateTime.startsWith(date));
  }

  createAppointment(appointment: Appointment) {
    this.appointments.push(appointment);
    return appointment;
  }

  updateAppointment(id: string, updates: Partial<Appointment>) {
    const index = this.appointments.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.appointments[index] = { ...this.appointments[index], ...updates };
      return this.appointments[index];
    }
    return null;
  }

  // Interactions
  getInteractions() {
    return this.interactions;
  }

  checkInteractions(drugCodes: string[]): DrugInteraction[] {
    const interactions: DrugInteraction[] = [];
    
    for (let i = 0; i < drugCodes.length; i++) {
      for (let j = i + 1; j < drugCodes.length; j++) {
        const interaction = this.interactions.find(
          (int) =>
            (int.drug1Code === drugCodes[i] && int.drug2Code === drugCodes[j]) ||
            (int.drug1Code === drugCodes[j] && int.drug2Code === drugCodes[i])
        );
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }
    
    return interactions;
  }

  // ADR Incidents
  getAdrIncidents() {
    return this.adrIncidents;
  }

  getAdrIncident(id: string) {
    return this.adrIncidents.find((a) => a.id === id);
  }

  createAdrIncident(incident: AdrIncident) {
    this.adrIncidents.push(incident);
    return incident;
  }

  updateAdrIncident(id: string, updates: Partial<AdrIncident>) {
    const index = this.adrIncidents.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.adrIncidents[index] = { ...this.adrIncidents[index], ...updates };
      return this.adrIncidents[index];
    }
    return null;
  }

  // DD Registers
  getDdRegisters() {
    return this.ddRegisters;
  }

  getDdRegister(id: string) {
    return this.ddRegisters.find((d) => d.id === id);
  }

  getDdRegistersByMedication(medicationCode: string) {
    return this.ddRegisters.filter((d) => d.medicationCode === medicationCode);
  }

  createDdRegister(register: DdRegister) {
    this.ddRegisters.push(register);
    return register;
  }

  // Helper: Get prescription with patient and medication details
  getPrescriptionWithDetails(id: string) {
    const prescription = this.getPrescription(id);
    if (!prescription) return null;

    const patient = this.getPatient(prescription.patientId);
    const medications = prescription.items.map((item) => 
      this.getMedication(item.drugCode)
    ).filter((m): m is Medication => m !== undefined);

    return {
      ...prescription,
      patient,
      medications,
    };
  }
}

// Singleton instance
let dataStore: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!dataStore) {
    dataStore = new DataStore();
  }
  return dataStore;
}

