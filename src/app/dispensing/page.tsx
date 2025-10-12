import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import Dashboard from '@/features/pharmacy-counter/routes/Dashboard';

export default function DispensingPage() {
  return (
    <PharmacyProviders>
      <Dashboard />
    </PharmacyProviders>
  );
}
