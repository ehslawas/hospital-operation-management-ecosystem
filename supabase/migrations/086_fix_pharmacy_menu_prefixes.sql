-- Migration: Fix Pharmacy Menu Prefixes
-- Description: Updates menu paths to include the required /pharmacy/ prefix matching routes.tsx
-- Date: 2026-01-15

-- =====================================================
-- 1. FIX PROCUREMENT PATHS
-- =====================================================

-- Parent
UPDATE public.menus 
SET path = '/pharmacy/procurement' 
WHERE path = '/procurement';

-- Submenus
UPDATE public.menus 
SET path = REPLACE(path, '/procurement/', '/pharmacy/procurement/') 
WHERE path LIKE '/procurement/%';

-- =====================================================
-- 2. FIX FINANCIAL PATHS
-- =====================================================

-- Parent
UPDATE public.menus 
SET path = '/pharmacy/financial' 
WHERE path = '/financial';

-- Submenus
UPDATE public.menus 
SET path = REPLACE(path, '/financial/', '/pharmacy/financial/') 
WHERE path LIKE '/financial/%';

-- Fix potential mismatches in specific financial submenus if any
UPDATE public.menus SET path = '/pharmacy/financial/budget' WHERE path = '/pharmacy/financial/budget-overview';

-- =====================================================
-- 3. FIX INVENTORY PATHS
-- =====================================================

-- Parent (if exists at root)
UPDATE public.menus 
SET path = '/pharmacy/inventory' 
WHERE path = '/inventory';

-- Submenus
UPDATE public.menus 
SET path = REPLACE(path, '/inventory/', '/pharmacy/inventory/') 
WHERE path LIKE '/inventory/%';

-- =====================================================
-- 4. FIX DISTRIBUTION PATHS
-- =====================================================

-- Parent
UPDATE public.menus 
SET path = '/pharmacy/distribution' 
WHERE path = '/distribution';

-- Submenus
UPDATE public.menus 
SET path = REPLACE(path, '/distribution/', '/pharmacy/distribution/') 
WHERE path LIKE '/distribution/%';

-- =====================================================
-- 5. FIX MAINTENANCE PATHS
-- =====================================================

-- Parent
UPDATE public.menus 
SET path = '/pharmacy/maintenance' 
WHERE path = '/maintenance';

-- Submenus
UPDATE public.menus 
SET path = REPLACE(path, '/maintenance/', '/pharmacy/maintenance/') 
WHERE path LIKE '/maintenance/%';

-- =====================================================
-- 6. FIX CATALOG PATHS (Plural to Singular 'catalog')
-- =====================================================

-- Parent
UPDATE public.menus 
SET path = '/pharmacy/catalog' 
WHERE path = '/catalogs' OR path = '/catalog';

-- Submenus
UPDATE public.menus 
SET path = REPLACE(path, '/catalogs/', '/pharmacy/catalog/') 
WHERE path LIKE '/catalogs/%';

UPDATE public.menus 
SET path = REPLACE(path, '/catalog/', '/pharmacy/catalog/') 
WHERE path LIKE '/catalog/%' AND path NOT LIKE '/pharmacy/catalog/%';

-- =====================================================
-- 7. ENSURE SPECIFIC MISMATCHES ARE FIXED
-- =====================================================

-- Purchase Orders often uses /procurement/orders in menu but /pharmacy/procurement/orders in routes
UPDATE public.menus SET path = '/pharmacy/procurement/orders' WHERE path = '/pharmacy/procurement/purchase-orders';

-- Order Tracking
UPDATE public.menus SET path = '/pharmacy/procurement/tracking' WHERE path = '/pharmacy/procurement/order-tracking';
