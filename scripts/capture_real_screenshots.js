// scripts/capture_real_screenshots.js
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ROOT_DIR = process.cwd()
const OUTPUT_DIR = path.join(ROOT_DIR, 'docs', 'manuals', 'images')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const mockUser = {
  state: {
    user: {
      id: 'user-001-sysadmin',
      email: 'admin@home.gov.my',
      employee_id: 'SYS001',
      full_name: 'Dr. Ahmad Razak bin Abdullah',
      jawatan: 'Pegawai Farmasi Klinikal (UF52)',
      hospital: {
        hospital_code: 'HLWS',
        hospital_name: 'HOSPITAL LAWAS'
      },
      role: {
        role_code: 'system_admin',
        role_name: 'System Administrator'
      }
    },
    isAuthenticated: true,
    isLoading: false,
    sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000
  },
  version: 0
}

async function captureScreenshots() {
  console.log('Launching browser for real application screenshots...')
  const browser = await chromium.launch({
    headless: true
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5
  })

  const page = await context.newPage()

  // Pre-seed authentication in sessionStorage
  await page.addInitScript((storageData) => {
    window.sessionStorage.setItem('home-auth-storage', JSON.stringify(storageData))
    window.localStorage.setItem('home-auth-storage', JSON.stringify(storageData))
  }, mockUser)

  const screenshots = [
    {
      name: '01_hub_formulari_submenu.png',
      url: 'http://localhost:3000/hub/formulari',
      title: 'Module Hub: MyFormulari Submenu',
      waitSelector: 'h1'
    },
    {
      name: '02_formulari_dashboard_search.png',
      url: 'http://localhost:3000/formulari/dashboard',
      title: 'Formulari Dashboard & Search Catalog',
      waitSelector: 'input[placeholder*="Carian"], input[type="text"]'
    },
    {
      name: '03_drug_detail_overview.png',
      url: 'http://localhost:3000/formulari/drug/DRUG-ABX-001',
      title: 'Drug Detail Monograph: Ceftriaxone Overview',
      waitSelector: 'h1'
    },
    {
      name: '04_drug_detail_pregnancy_safety.png',
      url: 'http://localhost:3000/formulari/drug/DRUG-ABX-001',
      title: 'Drug Detail: Pregnancy & Lactation Status',
      action: async (p) => {
        const btn = await p.$('button:has-text("Kehamilan"), button:has-text("Pregnancy")')
        if (btn) await btn.click()
      }
    },
    {
      name: '05_ham_list_page.png',
      url: 'http://localhost:3000/formulari/ham',
      title: 'High Alert Medications (HAM) List Page',
      waitSelector: 'h1'
    },
    {
      name: '06_lasa_list_tallman.png',
      url: 'http://localhost:3000/formulari/lasa',
      title: 'LASA & TALL-Man Lettering Registry',
      waitSelector: 'h1'
    },
    {
      name: '07_iv_dilution_protocols.png',
      url: 'http://localhost:3000/formulari/dilution',
      title: 'IV Dilution & Reconstitution Protocols Page',
      waitSelector: 'h1'
    },
    {
      name: '08_nag_antimicrobial_guidelines.png',
      url: 'http://localhost:3000/formulari/antimicrobial',
      title: 'National Antimicrobial Guidelines (NAG 2024)',
      waitSelector: 'h1'
    },
    {
      name: '09_drug_quota_monitoring.png',
      url: 'http://localhost:3000/formulari/quota',
      title: 'Drug Quota & Low Stock Alerts Page',
      waitSelector: 'h1'
    },
    {
      name: '10_drug_alternatives_matrix.png',
      url: 'http://localhost:3000/formulari/alternatives',
      title: 'Drug Alternatives & Substitution Matrix',
      waitSelector: 'h1'
    },
    {
      name: '11_interaction_checker_modal.png',
      url: 'http://localhost:3000/formulari/dashboard',
      title: 'Drug Interaction Checker Modal',
      action: async (p) => {
        const btn = await p.$('button:has-text("Semak Interaksi Ubat"), button:has-text("Interaksi")')
        if (btn) {
          await btn.click()
          await p.waitForTimeout(600)
        }
      }
    }
  ]

  for (const item of screenshots) {
    console.log(`Navigating to ${item.url} -> ${item.name}...`)
    try {
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(1000)

      if (item.waitSelector) {
        try {
          await page.waitForSelector(item.waitSelector, { timeout: 5000 })
        } catch (_) {}
      }

      if (item.action) {
        try {
          await item.action(page)
          await page.waitForTimeout(600)
        } catch (e) {
          console.warn(`Action failed for ${item.name}:`, e.message)
        }
      }

      const filePath = path.join(OUTPUT_DIR, item.name)
      await page.screenshot({ path: filePath, fullPage: false })
      console.log(`Saved screenshot: ${filePath}`)
    } catch (err) {
      console.error(`Error capturing ${item.name}:`, err.message)
    }
  }

  await browser.close()
  console.log('All real application screenshots successfully captured!')
}

captureScreenshots().catch(err => {
  console.error('Screenshot script error:', err)
  process.exit(1)
})
