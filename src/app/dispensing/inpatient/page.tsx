import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import InpatientTto from '@/features/pharmacy-counter/routes/InpatientTto';

export default function InpatientPage() {
  return (
    <PharmacyProviders>
      <InpatientTto />
    </PharmacyProviders>
  );
}

