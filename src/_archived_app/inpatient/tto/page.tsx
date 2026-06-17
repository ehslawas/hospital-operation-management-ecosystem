import { InpatientProviders } from '@/features/inpatient-pharmacy/components/Providers';
import TTODischarge from '@/features/inpatient-pharmacy/routes/TTODischarge';

export default function TTOPage() {
  return (
    <InpatientProviders>
      <TTODischarge />
    </InpatientProviders>
  );
}

