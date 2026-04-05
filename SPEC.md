# Rental Property Tax Prep MVP - Specification

## Project Overview

- **Project Name**: Rental Tax Prep
- **Type**: Single-page React webapp (Vite + React)
- **Core Functionality**: Receipt scanning, expense categorization to IRS Schedule E categories, dashboard visualization, PDF export for tax filing
- **Target Users**: DIY landlords with 1-10 rental properties

---

## UI/UX Specification

### Layout Structure

- **Header**: Fixed top bar with app branding + year selector + export button
- **Main Content**: 
  - Left panel (60%): Receipt upload + expense list
  - Right panel (40%): Dashboard summary
- **Responsive**: Stack panels vertically on mobile (<768px)

### Visual Design

**Color Palette**
- Background: `#0F1419` (rich black)
- Card/Surface: `#1A2332` (dark navy)
- Card Hover: `#243447`
- Primary Accent: `#10B981` (emerald green - money/finance theme)
- Secondary Accent: `#F59E0B` (amber for warnings/highlights)
- Text Primary: `#F8FAFC`
- Text Secondary: `#94A3B8`
- Borders: `#2D3F52`
- Error: `#EF4444`
- Schedule E Category Colors:
  - Advertising: `#8B5CF6`
  - Auto/Mileage: `#EC4899`
  - Insurance: `#F97316`
  - Legal/Professional: `#06B6D4`
  - Management Fees: `#10B981`
  - Repairs/Maintenance: `#EAB308`
  - Taxes/Interest: `#3B82F6`
  - Utilities: `#14B8A6`
  - Depreciation: `#6B7280`
  - Other: `#78716C`

**Typography**
- Font Family: `"DM Sans"` (headings), `"JetBrains Mono"` (numbers/currency)
- Headings: 24px (h1), 18px (h2), 14px (h3)
- Body: 14px
- Small: 12px

**Spacing**
- Base unit: 4px
- Card padding: 20px
- Gap between cards: 16px
- Section margin: 32px

**Visual Effects**
- Card shadows: `0 4px 20px rgba(0,0,0,0.3)`
- Border radius: 12px (cards), 8px (buttons), 6px (inputs)
- Transitions: 200ms ease-out
- Subtle glow on primary actions: `0 0 20px rgba(16,185,129,0.2)`

### Components

**Header**
- App title: "Rental Tax Prep" with house icon
- Year dropdown selector (current year ± 2)
- "Export PDF" button (primary action)

**Receipt Upload Zone**
- Drag-and-drop area with dashed border
- Camera/file input button
- Uploaded image preview thumbnail
- Fields: Date picker, amount input, category dropdown, description input

**Expense List**
- Scrollable list of expense items
- Each item: date, description, category pill, amount
- Delete button on hover

**Dashboard**
- Total expenses card (large number)
- Donut chart showing breakdown by category
- Category legend with amounts

**PDF Export**
- Generated using jsPDF + jspdf-autotable
- IRS Schedule E format reference
- Property summary, expense details table

---

## Acceptance Criteria

1. User can upload an image (drag-drop or click)
2. User can add expense with date, amount, category, description
3. Expenses persist after page refresh (localStorage)
4. Dashboard shows accurate totals by category
5. Dashboard shows donut chart breakdown
6. PDF export downloads a properly formatted report
7. UI is clean and professional
8. Responsive: works on mobile and desktop
9. No console errors in normal operation
10. Fast load (< 2s initial render)
