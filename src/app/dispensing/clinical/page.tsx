import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import ClinicalTouchpoints from '@/features/pharmacy-counter/routes/ClinicalTouchpoints';

export default function ClinicalPage() {
  return (
    <PharmacyProviders>
      <ClinicalTouchpoints />
    </PharmacyProviders>
  );
}

