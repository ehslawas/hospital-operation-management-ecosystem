import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import OrderScreening from '@/features/inpatient-pharmacy/routes/OrderScreening';

export default function OrderScreeningPage() {
  return (
    <PharmacyProviders>
      <OrderScreening />
    </PharmacyProviders>
  );
}

