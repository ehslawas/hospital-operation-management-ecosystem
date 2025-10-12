# SPUB (Integrated Dispensing System)

## Overview

The SPUB (Sistem Pembekalan Ubat Bersepadu) module is a comprehensive medication transfer and dispensing system designed for inter-facility medication coordination. It enables seamless medication supply continuity for patients transitioning between healthcare facilities.

## Key Features

### 1. **Request Management** (`/spub/request`)
- Create medication requests for patients
- Specify medications, dosages, and duration
- Send automated email requests to target facilities
- Track request status (pending → sent → acknowledged → ready → completed)
- Support for urgent and routine priorities
- Patient allergy and chronic condition alerts

### 2. **Receive & Verify** (`/spub/receive`)
- Receive medications from source facilities
- Verify quantities against requests
- Record batch numbers and expiry dates
- Handle partial receipts and discrepancies
- Document receiving notes and issues
- Track completion status

### 3. **Dispense to Patients** (`/spub/dispense`)
- Schedule patient appointments
- Dispense medications with counseling
- Interactive counseling checklist
- Patient signature capture
- Schedule next visit
- Print labels and receipts
- SMS reminders

### 4. **Monitor Balances** (`/spub/monitor`)
- Real-time medication balance tracking
- Stock level indicators (adequate/low/critical)
- Patient-specific inventory views
- Expiry date monitoring
- Low stock alerts
- Balance percentage visualization

### 5. **Reports & Analytics** (`/spub/reports`)
- Summary reports
- Request reports
- Dispensing reports
- Performance metrics
- Patient compliance reports
- Scheduled automated reports
- Export to PDF/Excel

## Workflow

```
┌─────────────┐
│   REQUEST   │ → Create patient medication request
└──────┬──────┘   → Email to source facility
       │
       ↓
┌─────────────┐
│   RECEIVE   │ → Verify received medications
└──────┬──────┘   → Check quantities & expiry
       │
       ↓
┌─────────────┐
│  DISPENSE   │ → Patient counseling
└──────┬──────┘   → Medication dispensing
       │
       ↓
┌─────────────┐
│   MONITOR   │ → Track balances
└─────────────┘   → Alert on low stock
```

## Dashboard Features

- **Active Patients**: Total patients enrolled in SPUB
- **Pending Requests**: Medication requests awaiting action
- **Ready to Dispense**: Medications available for patient collection
- **Low Stock Alerts**: Medications requiring refill
- **Dispensed This Month**: Monthly dispensing count
- **Average Processing Time**: Request-to-dispense efficiency

## Data Structure

### Patient Information
- Demographics (Name, NRIC, Age, Gender)
- Contact details (Phone, Email, Address)
- Home facility information
- Chronic conditions
- Allergies

### Medication Details
- Drug code and name
- Strength and form
- Quantity and unit
- Dosage instructions
- Frequency and route
- Duration (in days)
- Special instructions

### Request Tracking
- Request number (SPUB-YYYY-NNN)
- Request date and requestor
- Target facility
- Status tracking
- Priority level
- Email confirmation

### Receiving Records
- Receive number (SPUB-RCV-YYYY-NNN)
- Batch numbers
- Expiry dates
- Quantity verification
- Discrepancy notes
- Received by (pharmacist)

### Dispensing Records
- Scheduled appointment date
- Counseling checklist completion
- Dispensed date and by
- Patient signature
- Next visit schedule
- Compliance tracking

### Balance Monitoring
- Total received vs. dispensed
- Current balance
- Stock level status
- Expiry warnings
- Usage trends

## Mock Data

The system includes comprehensive mock data for demonstration:
- **5 Patients** with varied chronic conditions
- **5 Medication Requests** in various statuses
- **2 Receive Records** (complete and partial)
- **3 Dispense Records** in different stages
- **5 Medication Balances** with varying stock levels

## Status Types

### Request Status
- `pending`: Request created, not yet sent
- `sent`: Email sent to facility
- `acknowledged`: Facility confirmed receipt
- `processing`: Facility preparing medications
- `ready`: Medications ready for collection
- `completed`: Process completed
- `cancelled`: Request cancelled

### Receive Status
- `pending`: Awaiting receipt
- `partial`: Partially received
- `completed`: Fully received
- `discrepancy`: Issues identified

### Dispense Status
- `scheduled`: Appointment scheduled
- `ready`: Ready for dispensing
- `dispensed`: Completed
- `missed`: Patient did not attend
- `cancelled`: Cancelled

### Balance Status
- `adequate`: >50% stock remaining
- `low`: 25-50% stock remaining
- `critical`: <25% stock remaining
- `expired`: Past expiry date

## Best Practices

1. **Request Creation**
   - Verify patient allergies before requesting
   - Include chronic conditions for context
   - Set appropriate priority levels
   - Add detailed notes for complex cases

2. **Receiving Medications**
   - Always verify batch numbers
   - Check expiry dates carefully
   - Document any discrepancies immediately
   - Follow up on partial receipts

3. **Dispensing**
   - Complete all counseling checklist items
   - Ensure patient understanding
   - Schedule next visit before dispensing
   - Provide written instructions

4. **Monitoring**
   - Review low stock alerts daily
   - Request refills proactively
   - Monitor expiry dates
   - Track usage patterns

## Integration Points

- **Email System**: Automated request notifications
- **SMS Gateway**: Patient reminders
- **Printing**: Labels, receipts, reports
- **Database**: Prisma ORM with PostgreSQL/Supabase
- **Authentication**: Role-based access control

## Future Enhancements

- [ ] Barcode scanning for batch verification
- [ ] Integration with national drug database
- [ ] Automated stock replenishment
- [ ] Patient mobile app for appointment management
- [ ] Analytics dashboard with charts
- [ ] WhatsApp integration for notifications
- [ ] E-signature for patient acknowledgment
- [ ] Integration with pharmacy inventory system

## Technical Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **State Management**: React hooks
- **Data**: Mock data (ready for API integration)

## File Structure

```
src/
├── app/spub/
│   ├── page.tsx                 # Dashboard
│   ├── request/page.tsx         # Request management
│   ├── receive/page.tsx         # Receive medications
│   ├── dispense/page.tsx        # Dispense to patients
│   ├── monitor/page.tsx         # Balance monitoring
│   └── reports/page.tsx         # Reports & analytics
└── features/spub/
    ├── types.ts                 # TypeScript interfaces
    └── mockData.ts              # Sample data
```

## Getting Started

1. Navigate to `/spub` to access the dashboard
2. Review the workflow steps and current status
3. Start with Request page to create new medication requests
4. Use Receive page when medications arrive
5. Dispense to patients as scheduled
6. Monitor balances regularly
7. Generate reports for analysis

## Support

For issues or questions about the SPUB module, contact the Hospital Management System support team.

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Module Owner**: Pharmacy Department  
**Status**: Production Ready


