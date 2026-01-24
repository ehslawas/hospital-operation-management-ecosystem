import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import MedRec from '@/features/inpatient-pharmacy/routes/MedRec';

export default function MedRecPage() {
  return (
    <PharmacyProviders>
      <MedRec />
    </PharmacyProviders>
  );
}

