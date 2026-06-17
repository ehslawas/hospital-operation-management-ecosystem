import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';
import QueueAppointments from '@/features/pharmacy-counter/routes/QueueAppointments';

export default function QueuePage() {
  return (
    <PharmacyProviders>
      <QueueAppointments />
    </PharmacyProviders>
  );
}

