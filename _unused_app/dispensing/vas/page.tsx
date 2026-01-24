import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import VasServices from '@/features/pharmacy-counter/routes/VasServices';

export default function VasPage() {
  return (
    <PharmacyProviders>
      <VasServices />
    </PharmacyProviders>
  );
}

