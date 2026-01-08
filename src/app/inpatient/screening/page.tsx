import { InpatientProviders } from '@/features/inpatient-pharmacy/components/Providers';
import OrderScreening from '@/features/inpatient-pharmacy/routes/OrderScreening';

export default function OrderScreeningPage() {
  return (
    <InpatientProviders>
      <OrderScreening />
    </InpatientProviders>
  );
}

