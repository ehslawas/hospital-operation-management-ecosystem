import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import InventoryDd from '@/features/pharmacy-counter/routes/InventoryDd';

export default function InventoryPage() {
  return (
    <PharmacyProviders>
      <InventoryDd />
    </PharmacyProviders>
  );
}

