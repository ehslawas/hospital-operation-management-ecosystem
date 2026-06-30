# Plan - Interactive Trend Dashboard Revamp

To address the visual clutter of multiple crisscrossing series and stacked segments, we will replace the trend chart with an **Interactive, Single-Series Focused Composed Dashboard** inspired by Vercel Analytics and Stripe.

Instead of displaying all cylinder sizes simultaneously in a single confusing stacked chart, the dashboard will default to showing **Total Monthly Issues** using a clean, composed line and bar chart. Users can use dynamic toggle chips to filter the chart to any specific cylinder size.

## Redesigned Visual Flow

### ASCII Layout Diagram

```
+-----------------------------------------------------------------------------------+
|  MONTHLY USAGE TREND BY CYLINDER SIZE                                             |
|  Oxygen Consumption                                                               |
|                                                                                   |
|  [ ALL SIZES (Selected) ]  [ 101-N ]  [ P101-F ]  [ 101-F ]  [ P101-HS ]  [ P101-D ] |
|                                                                                   |
|  Tanks                                                                            |
|   160 |                        * (Peak Trend Line)                                |
|       |                       / \                                                 |
|   120 |                      /   \                                                |
|       |      *-------*      /     \       *                                       |
|    80 |     /|       |\    /|      \     /|                                       |
|       |    / |   |   | \  / |   |   \   / |   |                                   |
|    40 |   /  |   |   |  \/  |   |    \ /  |   |                                   |
|       |  *   |   |   |  *   |   |     *   |   |                                   |
|     0 +------+---+---+------+---+-----+---+---+---+                               |
|            Jan 26         Feb 26        Mar 26                                    |
|                                                                                   |
|  * Composed Line: Total monthly volume curve                                      |
|  * Composed Bar: Soft, translucent backing columns representing total values       |
+-----------------------------------------------------------------------------------+
```

## Proposed Changes

### UI Layer

#### [MODIFY] [CylinderReportPage.tsx](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/modules/mycylinder/pages/oxygen/CylinderReportPage.tsx)

1. **State Addition**:
   - Add a `selectedTrendSize` state initialized to `'all'`.

2. **Data Transformation**:
   - Compute `filteredTrendData` in a `useMemo` block.
   - If `selectedTrendSize === 'all'`, sum all cylinder sizes for each month to produce a `total` field.
   - If a specific size is selected (e.g. `101-N`), map the data to display only that size's count.

3. **Interactive Toggle Chips**:
   - Render horizontal filter pills at the top right of the chart card.
   - Add subtle active styles matching the design system (e.g., active teal background, hover transitions).

4. **Composed Chart Setup**:
   - Render a `ComposedChart` with a soft `Bar` (translucent teal `#00a68a` at `0.08` opacity) and a clean `Line` (`strokeWidth={2}`, `#00a68a`) representing the trend.
   - This provides maximum visual clarity, zero overlapping series, and high interactivity.

## Verification Plan

### Manual Verification
- Verify the chart renders a single clean composed chart of total usage.
- Click different cylinder size filter pills and verify the chart switches dynamically to display issues for the selected size only.
