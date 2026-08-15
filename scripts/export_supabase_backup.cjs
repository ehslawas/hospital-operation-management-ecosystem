const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(__dirname, `../backups/supabase/backup_${timestamp}`);
const jsonDir = path.join(backupDir, 'json');

fs.mkdirSync(jsonDir, { recursive: true });

// Complete list of tables in public schema
const tables = [
  'hospitals',
  'roles',
  'departments',
  'users',
  'access_requests',
  'hospital_modules',
  'system_health_logs',
  'system_backups',
  'system_alerts',
  'uploaded_files',
  'drug_categories',
  'non_drug_categories',
  'suppliers',
  'drugs',
  'non_drugs',
  'system_settings',
  'hospital_logs',
  'audit_logs',
  'memos',
  'sensitive_data_requests',
  'sensitive_data_access_logs',
  'hospital_health_metrics',
  'permissions',
  'role_permissions',
  'emergency_contacts',
  'pharmacy_stock_locations',
  'pharmacy_stock_batches',
  'pharmacy_stock_transactions',
  'pharmacy_oxygen_cylinder_types',
  'pharmacy_oxygen_cylinders',
  'pharmacy_oxygen_consumption',
  'pharmacy_budgets',
  'pharmacy_budget_transactions',
  'pharmacy_appl',
  'pharmacy_purchase_orders',
  'pharmacy_purchase_order_items',
  'pharmacy_goods_receipts',
  'pharmacy_goods_receipt_items',
  'pharmacy_supplier_penalties',
  'pharmacy_transfer_requests',
  'pharmacy_transfer_request_items',
  'pharmacy_units_of_measure',
  'pharmacy_stock_verifications',
  'pharmacy_stock_verification_items',
  'pharmacy_activity_logs',
  'contracts',
  'google_sheets_sync_config',
  'pharmacy_warrants',
  'pharmacy_appl_expenses',
  'pharmacy_cc_expenses',
  'pharmacy_unit_catalog',
  'pharmacy_unit_catalog_changes',
  'pharmacy_unit_catalog_items',
  'pharmacy_settings',
  'hospital_facilities',
  'clinic_facilities',
  'pharmacy_lpo',
  'pharmacy_order_tracking',
  'pharmacy_receiving',
  'pharmacy_receiving_items',
  'pharmacy_payments',
  'pharmacy_penalties',
  'pharmacy_lou',
  'pharmacy_oxygen_cylinder_sizes',
  'pharmacy_oxygen_reception_records',
  'pharmacy_oxygen_cylinder_inventory',
  'pharmacy_oxygen_cylinder_movements',
  'pharmacy_oxygen_cylinder_requests',
  'pharmacy_oxygen_request_items',
  'pharmacy_oxygen_pricing_config',
  'pharmacy_oxygen_system_settings',
  'pharmacy_oxygen_dept_requests',
  'pharmacy_oxygen_dept_request_items',
  'pharmacy_oxygen_reception_items',
  'menus',
  'role_menu_access',
  'department_running_numbers',
  'appl_drugs',
  'appl_non_drugs',
  'lp_drugs',
  'lp_non_drugs',
  'reagents',
  'contract_non_drugs',
  'old_resource_permissions',
  'old_role_department_permissions',
  'old_approval_routes',
  'old_approval_logs',
  'modules',
  'features',
  'legacy_role_permissions',
  'role_feature_permissions',
  'staff_custom_permissions',
  'action_types',
  'approval_workflows',
  'approval_workflow_steps',
  'approval_conditions',
  'approval_requests',
  'approval_actions',
  'approval_logs',
  'pharmacy_temperature_readings',
  'pharmacy_temperature_locations',
  'pharmacy_receiving_documents',
  'pharmacy_supplier_assessments',
  'penalty_performance_standards',
  'pharmacy_performance_standards',
  'pharmacy_lou_items',
  'pharmacy_lpo_reminders',
  'pharmacy_oxygen_size_type_combos',
  'pharmacy_oxygen_stock_adjustments',
  'system_admin_audit_logs',
  'admin_purchase_orders',
  'admin_purchase_order_items',
  'admin_warrants',
  'admin_warrant_programs',
  'admin_warrant_objeks',
  'admin_warrant_budget_groups',
  'admin_warrant_kategoris',
  'admin_warrant_allocations',
  'admin_pembangunan_programs',
  'admin_pembangunan_objeks',
  'admin_pembangunan_kategoris',
  'admin_pembangunan_allocations',
  'admin_pembangunan',
  'admin_lpos',
  'admin_receiving_records',
  'admin_receiving_items',
  'admin_payments',
  'pharmacy_location_items',
  'pharmacy_loan_records',
  'pharmacy_loan_items',
  'pharmacy_loan_returns',
  'pharmacy_loan_return_items',
  'pharmacy_item_registry',
  'pharmacy_item_movements',
  'resource_permissions',
  'role_department_permissions',
  'approval_routes',
  'admin_suppliers',
  'admin_perihal_catalog',
  'admin_programs',
  'admin_objeks',
  'admin_kategoris',
  'visitor_log',
  'gallery_albums',
  'gallery_photos',
  'pharmacy_credit_notes',
  'pharmacy_credit_note_items',
  'pharmacy_oxygen_return_documents',
  'pharmacy_oxygen_return_document_items',
  'pharmacy_oxygen_request_documents',
  'pharmacy_oxygen_request_document_items',
  'pharmacy_cylinder_dispatch_requests',
  'pharmacy_cylinder_dispatch_request_items',
  'lokasi',
  'unit_pemantauan',
  'ambang_suhu',
  'bacaan_suhu',
  'myphis_disk_changes',
  'myphis_navigation_logs',
  'kunci_daftar',
  'kunci_log',
  'kunci_audit_bulanan',
  'transport_vehicles',
  'transport_requests',
  'vehicle_inspections',
  'vehicle_issue_reports',
  'transport_request_logs',
  'pharmacy_oxygen_cylinder_maintenance',
  'pharmacy_oxygen_cylinder_maintenance_items',
  'crossborder_transfers',
  'crossborder_patients',
  'crossborder_escorts',
  'appl_approved_suppliers',
  'appl_sync_logs',
  'lp_sync_logs',
  'cc_sync_logs',
  'facility_drug_inventory',
  'store_sub_locations',
  'store_locations',
  'facility_nondrug_inventory'
];

async function fetchTableData(tableName) {
  let allRows = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      return { error: error.message, rows: [] };
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);

    if (data.length < pageSize) break;
    page++;
  }

  return { error: null, rows: allRows };
}

async function runBackup() {
  console.log(`Starting Supabase Backup at ${new Date().toISOString()}...`);
  console.log(`Output directory: ${backupDir}`);

  const report = [];
  let totalRecords = 0;
  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    process.stdout.write(`Backing up ${table}... `);
    const result = await fetchTableData(table);

    if (result.error) {
      console.log(`FAILED: ${result.error}`);
      report.push({ table, count: 0, status: 'ERROR', error: result.error });
      failCount++;
    } else {
      console.log(`SUCCESS (${result.rows.length} rows)`);
      const filePath = path.join(jsonDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2), 'utf-8');
      report.push({ table, count: result.rows.length, status: 'OK' });
      totalRecords += result.rows.length;
      successCount++;
    }
  }

  // Write Manifest & Summary
  const manifest = {
    timestamp: new Date().toISOString(),
    supabaseUrl,
    totalTables: tables.length,
    successfulTables: successCount,
    failedTables: failCount,
    totalRecords,
    tables: report
  };

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // Write Markdown Report
  let md = `# Supabase Database Backup Summary\n\n`;
  md += `- **Date/Time**: ${manifest.timestamp}\n`;
  md += `- **Project URL**: ${supabaseUrl}\n`;
  md += `- **Total Tables Processed**: ${tables.length}\n`;
  md += `- **Successful Tables**: ${successCount}\n`;
  md += `- **Failed Tables**: ${failCount}\n`;
  md += `- **Total Records Exported**: ${totalRecords.toLocaleString()}\n\n`;
  md += `## Table Summary\n\n`;
  md += `| Table Name | Row Count | Status |\n`;
  md += `| :--- | :--- | :--- |\n`;

  report.forEach(r => {
    md += `| \`${r.table}\` | ${r.count.toLocaleString()} | ${r.status === 'OK' ? '✅ OK' : '❌ ' + r.error} |\n`;
  });

  fs.writeFileSync(path.join(backupDir, 'BACKUP_SUMMARY.md'), md, 'utf-8');

  console.log(`\n========================================`);
  console.log(`BACKUP COMPLETE!`);
  console.log(`Total Tables: ${tables.length} | Success: ${successCount} | Failed: ${failCount}`);
  console.log(`Total Records Exported: ${totalRecords.toLocaleString()}`);
  console.log(`Manifest & Data saved to: ${backupDir}`);
  console.log(`========================================\n`);
}

runBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
