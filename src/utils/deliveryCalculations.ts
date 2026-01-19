import { addDays, isWeekend, parseISO } from 'date-fns'

// Constants
export const APPL_ITEM_CODE = '990102'
export const CC_ITEM_CODE = '080702'
export const APPL_DELIVERY_DAYS = 10

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
 * Calculates expected delivery date based on working days
 * @param startDate Date order was placed (or LPO date)
 * @param workingDays Number of working days to add
 */
export function calculateWorkingDaysDate(startDate: Date | string, workingDays: number): Date {
    let date = typeof startDate === 'string' ? parseISO(startDate) : startDate
    let daysAdded = 0

    while (daysAdded < workingDays) {
        date = addDays(date, 1)
        if (!isWeekend(date)) {
            daysAdded++
        }
    }

    return date
}

/**
 * Determines the expected delivery date for an item
 * @param itemCode Item code to check type
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

    // Default/Fallback: 14 days standard if no other rule matches
    return addDays(typeof orderDate === 'string' ? parseISO(orderDate) : orderDate, 14)
}
