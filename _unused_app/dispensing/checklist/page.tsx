import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import MasterChecklist from '@/features/pharmacy-counter/routes/MasterChecklist';

export default function ChecklistPage() {
  return (
    <PharmacyProviders>
      <MasterChecklist />
    </PharmacyProviders>
  );
}

