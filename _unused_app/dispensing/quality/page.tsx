import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import QualitySafety from '@/features/pharmacy-counter/routes/QualitySafety';

export default function QualityPage() {
  return (
    <PharmacyProviders>
      <QualitySafety />
    </PharmacyProviders>
  );
}

