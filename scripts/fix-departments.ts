
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../.env')
console.log('Loading .env from:', envPath)

// Manual .env parser
function loadEnv(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath)
        return
    }
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const lines = content.split('\n')
        let count = 0
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/)
            if (match) {
                const key = match[1].trim()
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1')
                process.env[key] = value
                count++
            }
        }
        console.log(`Loaded ${count} env vars`)
    } catch (e) {
        console.warn('Could not load .env file', e)
    }
}

loadEnv(envPath)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL found:', !!supabaseUrl)
console.log('Service Key found:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env file')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDepartments() {
    console.log('Starting Department Fix...')

    // 1. Get all hospitals
    const { data: hospitals, error: hError } = await supabase.from('hospitals').select('id, hospital_name')

    if (hError) {
        console.error('Error fetching hospitals:', hError)
        return
    }

    console.log(`Found ${hospitals.length} hospitals.`)

    // Official Departments List
    const departments = [
        { code: 'PHARMACY_LOGISTIC', name: 'Pharmacy logistic', desc: 'Pharmacy logistic' },
        { code: 'PHARMACY_SATELLITE', name: 'pharmacy satelite', desc: 'pharmacy satelite' },
        { code: 'PHARMACY_SUBSTORE', name: 'Pharmacy Substore', desc: 'Pharmacy Substore' },
        { code: 'PATHOLOGY', name: 'Pathology', desc: 'Pathology' },
        { code: 'FRONT_DESK', name: 'Front Desk', desc: 'Front Desk' },
        { code: 'HOSPITAL_ADMIN', name: 'Hospital Administration', desc: 'Hospital Administration' },
        { code: 'GENERAL_WARD', name: 'General Ward', desc: 'General Ward' },
        { code: 'NURSING_UNIT', name: 'Nursing Unit', desc: 'Nursing Unit' },
        { code: 'PAEDIATRIC_WARD', name: 'Paediatric ward', desc: 'Paediatric ward' },
        { code: 'MATERNITY_WARD', name: 'Maternity Ward', desc: 'Maternity Ward' },
        { code: 'CSSU_CSSD', name: 'CSSU/CSSD', desc: 'CSSU/CSSD' },
        { code: 'EMERGENCY_TRAUMA', name: 'Emergency & Trauma', desc: 'Emergency & Trauma' },
        { code: 'RADIOLOGY', name: 'Radiologi & Radiography', desc: 'Radiologi & Radiography' },
        { code: 'HAEMODIALYSIS', name: 'Haemodialysis', desc: 'Haemodialysis' },
        { code: 'REHABILITATION', name: 'Rehabilitation', desc: 'Rehabilitation' },
        { code: 'DRIVER_ROOM', name: 'Driver Room', desc: 'Driver Room' },
        { code: 'OPERATION_THEATER', name: 'Operation Theater', desc: 'Operation Theater' },
        { code: 'KLINIK_PAKAR', name: 'Klinik Pakar', desc: 'Klinik Pakar' },
        { code: 'HOSPITAL_DIRECTOR', name: 'Hospital Director', desc: 'Hospital Director' },
        { code: 'AMRO', name: 'AMRO', desc: 'AMRO' }
    ]

    for (const hospital of hospitals) {
        console.log(`Processing hospital: ${hospital.hospital_name} (${hospital.id})`)

        for (const dept of departments) {
            const { error } = await supabase.from('departments').upsert({
                hospital_id: hospital.id,
                department_code: dept.code,
                department_name: dept.name,
                description: dept.desc,
                status: 'active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'hospital_id, department_code' })

            if (error) {
                console.error(`Error syncing department ${dept.code}:`, error)
            }
        }

        // Also Ensure Module Visibility (fix RLS issue via Service Role if possible, but RLS is SQL level)
        // We can't change RLS policies via JS client easily unless we run raw SQL
        // But we can check if it works.
    }

    console.log('Department Seeding Completed.')
}

fixDepartments().catch(console.error)
