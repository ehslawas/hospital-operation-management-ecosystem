import { InpatientProviders } from '@/features/inpatient-pharmacy/components/Providers';
import MedRec from '@/features/inpatient-pharmacy/routes/MedRec';

export default function MedRecPage() {
  return (
    <InpatientProviders>
      <MedRec />
    </InpatientProviders>
  );
}

