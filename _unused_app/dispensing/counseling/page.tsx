import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import Counseling from '@/features/pharmacy-counter/routes/Counseling';

export default function CounselingPage() {
  return (
    <PharmacyProviders>
      <Counseling />
    </PharmacyProviders>
  );
}

