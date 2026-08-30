// src/modules/mypriviledging/index.ts
export * from './types/priviledgingTypes';
export * from './data/procedureCatalogData';
export * from './data/credentialingCriteriaData';
export * from './services/priviledgingService';
export * from './components';

export { default as PriviledgingDashboardPage } from './pages/PriviledgingDashboardPage';
export { default as CredentialingCriteriaPage } from './pages/CredentialingCriteriaPage';
export { default as ProcedureCatalogPage } from './pages/ProcedureCatalogPage';
export { default as MySubmissionsPage } from './pages/MySubmissionsPage';
export { default as AdminReviewQueuePage } from './pages/AdminReviewQueuePage';
export { default as StaffProgressPage } from './pages/StaffProgressPage';
export { default as PrintPriviledgingPage } from './pages/PrintPriviledgingPage';
