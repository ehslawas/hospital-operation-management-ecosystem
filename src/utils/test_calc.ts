
import { calculateWorkingDaysDate } from './deliveryCalculations.ts'
import { parseISO, format } from 'date-fns'

console.log("--- TEST START ---")

const testInputs = [
    { date: "2026-01-22", days: 10, desc: "Standard ISO Date String" },
    { date: "2026-01-22T00:00:00.000Z", days: 10, desc: "Full ISO String" },
    { date: "22/01/2026", days: 10, desc: "DD/MM/YYYY format" },
]

testInputs.forEach(input => {
    try {
        console.log(`Testing: ${input.desc} (${input.date}) + ${input.days} days`)
        const result = calculateWorkingDaysDate(input.date, input.days)
        console.log(`Result: ${format(result, 'yyyy-MM-dd')} (ISO: ${result.toISOString()})`)
    } catch (e: any) {
        console.log(`Error testing ${input.desc}:`, e.message)
    }
})

console.log("--- TEST END ---")
