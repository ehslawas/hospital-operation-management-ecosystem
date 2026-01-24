import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import OutpatientCounter from '@/features/pharmacy-counter/routes/OutpatientCounter';

export default function OutpatientPage() {
  return (
    <PharmacyProviders>
      <OutpatientCounter />
    </PharmacyProviders>
  );
}

