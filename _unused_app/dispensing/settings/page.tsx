import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import Settings from '@/features/pharmacy-counter/routes/Settings';

export default function SettingsPage() {
  return (
    <PharmacyProviders>
      <Settings />
    </PharmacyProviders>
  );
}

