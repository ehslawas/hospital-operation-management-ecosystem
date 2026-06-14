# Purchase Order Print Alignment Plan

## Problem Statement
The current print version of the Purchase Order document does not match the screen display version. Users expect an exact 1:1 match between what they see on screen and what gets printed.

## Current State Analysis

### Screen Version (Non-Print View)
- Located in: `src/pages/pharmacy/procurement/PurchaseOrderDetailPage.tsx` (lines ~730-904)
- Uses Tailwind CSS classes for styling
- Has proper spacing, borders, and layout
- Includes Jata Negara in header
- Clean government document layout
- Proper section separation with borders

### Print Version (Current)
- Located in: `src/pages/pharmacy/procurement/PurchaseOrderDetailPage.tsx` (lines ~1105-1465)
- Uses inline styles with hardcoded values
- Different structure and spacing
- Missing proper alignment with screen version
- May have layout inconsistencies

## Objectives

1. **Exact Visual Match**: Print version must match screen version pixel-perfect
2. **Consistent Structure**: Same component structure and layout
3. **Print Optimization**: Ensure proper page breaks and margins for A4 printing
4. **Code Maintainability**: Use shared components/styling where possible

## Solution Strategy

### Approach 1: Reuse Screen Component (Recommended)
- Extract the screen PO view into a reusable component
- Apply print-specific CSS classes for spacing and margins
- Use CSS `@media print` to adjust only what's necessary for printing
- Maintain single source of truth for the document structure

### Approach 2: Mirror Structure (Fallback)
- Keep separate print view but mirror exact structure
- Copy all styling from screen version
- Convert Tailwind classes to equivalent inline styles if needed
- Ensure pixel-perfect matching

## Implementation Plan

### Phase 1: Analysis & Preparation
1. **Compare Structures**
   - Document all differences between screen and print versions
   - Identify missing elements in print version
   - Note spacing and layout differences

2. **Identify Key Sections**
   - Header with Jata Negara
   - Document Information (PO Number, Vote Code, etc.)
   - Supplier Information
   - Items Table
   - Financial Summary & Signature
   - Footer

### Phase 2: Implementation

#### Step 1: Update Print Styles
- Ensure `@page` margins are standard A4 (20mm)
- Remove all background colors in print
- Ensure proper font sizing matches screen
- Fix table borders and spacing

#### Step 2: Align Header Section
- Match Jata Negara size and position
- Match ministry name and hospital name styling
- Ensure title section matches exactly

#### Step 3: Align Document Information Section
- Match grid layout (2 columns)
- Match label and value styling
- Match border styles and spacing

#### Step 4: Align Supplier Information Section
- Match section header styling
- Match company name and address layout
- Match border and background (white in print)

#### Step 5: Align Items Table
- Match table header styling
- Match column widths and alignment
- Match cell padding and borders
- Match total row styling

#### Step 6: Align Financial Summary Section
- Match signature section on left
- Match financial summary box on right
- Match balance display formatting

#### Step 7: Align Footer Section
- Match footer text and styling
- Match spacing from content above

### Phase 3: Testing & Validation

1. **Visual Comparison**
   - Screenshot screen version
   - Print to PDF and compare
   - Verify all elements align

2. **Print Testing**
   - Test on different browsers (Chrome, Firefox, Edge)
   - Test with different printers
   - Verify A4 page margins
   - Check page breaks

3. **Responsiveness Check**
   - Ensure print version works with different content lengths
   - Test with many items (page breaks)
   - Test with few items

## Technical Considerations

### CSS Print Media Queries
- Use `@media print` for print-specific styles
- Remove backgrounds: `background: white !important`
- Ensure proper margins: `@page { margin: 20mm; }`
- Hide non-printable elements: `.no-print { display: none; }`

### Font Rendering
- Ensure consistent font sizes between screen and print
- Use `Times New Roman` or specified serif font
- Match font weights exactly

### Spacing & Layout
- Convert Tailwind spacing to equivalent pixels/mm in print
- Ensure padding and margins match
- Verify border widths match

### Table Rendering
- Ensure table borders render correctly
- Match cell padding
- Ensure text alignment matches
- Verify column widths

## Success Criteria

1. ✅ Print version visually matches screen version (95%+ similarity)
2. ✅ All sections are present and correctly positioned
3. ✅ Text formatting matches (font, size, weight, alignment)
4. ✅ Spacing and borders match screen version
5. ✅ Proper A4 margins (20mm standard)
6. ✅ No background colors in print (white background only)
7. ✅ Jata Negara displays correctly in print
8. ✅ Page breaks occur appropriately

## Risk Mitigation

- **Risk**: Print CSS may not work consistently across browsers
  - **Mitigation**: Test on multiple browsers, use standard CSS properties

- **Risk**: Inline styles vs classes may cause mismatches
  - **Mitigation**: Use CSS custom properties or ensure exact conversion

- **Risk**: Page breaks may split content incorrectly
  - **Mitigation**: Use `page-break-inside: avoid` on sections, test with various content lengths

## Timeline Estimate

- Phase 1 (Analysis): 15 minutes
- Phase 2 (Implementation): 45-60 minutes
- Phase 3 (Testing): 20-30 minutes
- **Total**: ~1.5-2 hours
