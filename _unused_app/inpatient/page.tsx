import { InpatientProviders } from '@/features/inpatient-pharmacy/components/Providers';
import Dashboard from '@/features/inpatient-pharmacy/routes/Dashboard';

export default function InpatientPage() {
  return (
    <InpatientProviders>
      <Dashboard />
    </InpatientProviders>
  );
}

