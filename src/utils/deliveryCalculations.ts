import { addDays, isWeekend, parseISO, isSameDay } from 'date-fns'

// Constants
export const APPL_ITEM_CODE = '990102'
export const CC_ITEM_CODE = '080702'
export const APPL_DELIVERY_DAYS = 10
export const CC_CONTRACT_DELIVERY_DAYS = 30   // CT with contract
export const CC_NO_CONTRACT_WEEKS = 16        // CT without contract

// Malaysian Public Holidays (Fixed dates + Major variable ones for 2025-2026)
// Ideally this should come from a database, but for now we hardcode major ones.
const MALAYSIA_PUBLIC_HOLIDAYS = [
    // 2025
    '2025-01-01', // New Year
    '2025-01-29', // CNY Day 1
    '2025-01-30', // CNY Day 2
    '2025-02-11', // Thaipusam
    '2025-03-17', // Nuzul Al-Quran
    '2025-03-31', // Hari Raya Aidilfitri Day 1
    '2025-04-01', // Hari Raya Aidilfitri Day 2
    '2025-04-18', // Good Friday
    '2025-05-01', // Labour Day
    '2025-05-12', // Wesak Day
    '2025-05-30', // Hari Kaamatan Day 1
    '2025-05-31', // Hari Kaamatan Day 2
    '2025-06-01', // Hari Gawai Day 1
    '2025-06-02', // Agong's Birthday / Hari Gawai Day 2
    '2025-06-06', // Hari Raya Haji
    '2025-07-07', // Awal Muharram
    '2025-08-31', // Merdeka
    '2025-09-05', // Prophet's Birthday
    '2025-09-16', // Malaysia Day
    '2025-10-20', // Deepavali
    '2025-12-25', // Christmas

    // 2026 (Projected/Fixed)
    '2026-01-01', // New Year
    '2026-02-01', // Federal Territory (if applicable, but safe to include)
    '2026-02-17', // CNY Day 1 (Approx)
    '2026-02-18', // CNY Day 2 (Approx)
    '2026-04-03', // Good Friday
    '2026-05-01', // Labour Day
    '2026-05-30', // Hari Kaamatan Day 1
    '2026-05-31', // Wesak Day (Approx) / Hari Kaamatan Day 2
    '2026-06-01', // Agong's Birthday / Hari Gawai Day 1
    '2026-06-02', // Hari Gawai Day 2
    '2026-08-31', // Merdeka
    '2026-09-16', // Malaysia Day
    '2026-12-25', // Christmas
]

/**
 * Checks if a date is a Malaysian Public Holiday
 */
export function isPublicHoliday(date: Date): boolean {
    return MALAYSIA_PUBLIC_HOLIDAYS.some(holiday => isSameDay(date, parseISO(holiday)))
}

/**
 * Checks if an item is an APPL item
 */
export function isAPPLItem(itemCode: string): boolean {
    return itemCode === APPL_ITEM_CODE
}

/**
 * Checks if an item is a Contract (CC) item
 */
export function isCCItem(itemCode: string): boolean {
    return itemCode === CC_ITEM_CODE
}

/**
 * Calculates expected delivery date based on working days (Excludes Weekends & Public Holidays)
 * @param startDate Date order was placed (or LPO date)
 * @param workingDays Number of working days to add
 */
/**
 * Calculates expected delivery date based on working days (Excludes Weekends & Public Holidays)
 * @param startDate Date order was placed (or LPO date)
 * @param workingDays Number of working days to add
 */
export function calculateWorkingDaysDate(startDate: Date | string, workingDays: number): Date {
    let date: Date

    // 1. Parse Input Safely
    if (typeof startDate === 'string') {
        const isoDate = parseISO(startDate)
        if (!isNaN(isoDate.getTime())) {
            date = isoDate
        } else {
            // Try handling DD/MM/YYYY format if ISO failed (common manual entry issue)
            const parts = startDate.split(/[-/]/)
            if (parts.length === 3) {
                // Assume DD/MM/YYYY if year is last
                if (parts[2].length === 4) {
                    date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                } else {
                    // Fallback to standard Date parser
                    date = new Date(startDate)
                }
            } else {
                date = new Date(startDate)
            }
        }
    } else {
        date = startDate
    }

    // 2. Validate
    if (isNaN(date.getTime())) {
        console.warn('Invalid date passed to calculateWorkingDaysDate:', startDate)
        return new Date() // Fallback to today to avoid crashes
    }

    let daysAdded = 0
    let safetyCounter = 0
    const MAX_LOOPS = 365

    while (daysAdded < workingDays && safetyCounter < MAX_LOOPS) {
        date = addDays(date, 1)

        const isWeekendDay = isWeekend(date)
        const isHoliday = isPublicHoliday(date)

        if (!isWeekendDay && !isHoliday) {
            daysAdded++
        }
        safetyCounter++
    }

    return date
}

/**
 * Determines the expected delivery date for an item
 * @param itemCode Vote Code (990102 / 080702) or Item Code (Legacy)
 * @param orderDate Date order was placed
 * @param contractDeliveryDate Optional specific delivery date from contract (for CC items)
 */
export function getExpectedDeliveryDate(
    itemCode: string,
    orderDate: Date | string,
    contractDeliveryDate?: Date | string
): Date {
    // 1. APPL Items: 10 working days
    if (isAPPLItem(itemCode)) {
        return calculateWorkingDaysDate(orderDate, APPL_DELIVERY_DAYS)
    }

    // 2. CC Items: Use contract delivery date if available
    if (isCCItem(itemCode) && contractDeliveryDate) {
        return typeof contractDeliveryDate === 'string'
            ? parseISO(contractDeliveryDate)
            : contractDeliveryDate
    }

    // Default/Fallback: 30 days (per user request) if no other rule matches
    return calculateWorkingDaysDate(orderDate, 30)
}
