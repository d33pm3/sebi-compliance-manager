

# SEBI Compliance Command Centre (SCCC) — Frontend Build Plan

## Overview
Build a comprehensive frontend-only React application for managing SEBI compliance filing requirements, seeded with real compliance data from the uploaded Excel file (~80+ compliance items). No backend — all data managed in-memory via Zustand state management.

## Design System
- **Brand colors**: Navy `#1C5277` (primary), Cyan `#29ABE2` (accent), with success/warning/error colors per spec
- **Font**: Inter (Google Fonts)
- **Layout**: Collapsible left sidebar + top header bar with alerts badge
- **Components**: shadcn/ui + custom StatusBadge, RiskBadge components

## Navigation & Layout
- Collapsible sidebar with module icons (M1–M3 active, M4–M7 grayed as "Coming Soon")
- Top header: Module title, company name, alerts bell, user dropdown
- Responsive — sidebar collapses to icons on mobile

## Module 1 — Register Agent (Simulated)
- **Agent Control Panel**: Run/Stop buttons, scheduler dropdown (30min/2hrs/Daily/Weekly)
- **Agent Status Panel**: Status indicator (Idle/Running), last run time, items extracted count
- **Progress Log**: Terminal-style scrollable log that simulates agent progress when "Run" is clicked
- **PDF Upload Zone**: Drag-and-drop area (UI only — shows upload simulation)
- **Download Outputs**: 5 download buttons (Master Register, Filing Calendar, Event Map, Amendment Tracker, Other Items) — these will trigger CSV/JSON exports of the in-memory data

## Module 2 — Compliance Dashboard & Library
- **Quick Stats Bar**: Total items, Due Soon, Overdue, Completed, Upcoming counts
- **Event Trigger Map Panel**: Critical/High/Medium/Low event-triggered items sorted by severity, with color-coded risk dots
- **Filing Calendar Panel**: Next 15 days of upcoming periodic filings with due date badges
- **Category Grid**: 19 MECE category tiles showing count per category, click to filter
- **Charts** (Recharts):
  - Donut chart: Status breakdown (Completed/Due Soon/Overdue/Not Due)
  - Bar chart: Compliances by month (next 6 months)
  - Bar chart: Category-wise count
- **Master Register Table**: Full searchable, sortable, filterable table (TanStack Table) with all compliance data columns. Row click opens detail drawer.
- **Delegation Modal**: UI for delegating items (email, frequency, escalation settings)

## Module 3 — Risk Assessment
- **Risk Table**: All compliance items with risk flags (auto-calculated using the rules from spec), owner/approver columns
- **Status Bar**: Horizontal summary — Approved, Pending, Doc Missing, Overdue, Not Started
- **Filters**: Category, Status, Risk Level, Search
- **Owner Workflow**: "My Queue" tab, upload evidence button (simulated), status change
- **Approver Workflow**: "Pending Approval" tab, Approve/Reject/Send Back actions
- **Comment Thread**: Per-item comment thread UI
- **Executive Summary**: Bar chart of category-wise Completed vs Non-Compliant

## Data Layer
- Parse and embed all ~80+ rows from `Compliance_Outputs.xlsx` as a TypeScript data file
- Map Excel columns (S.No, Category, Filing Name, Reg Reference, Applicable To, Filing Authority, Frequency, Trigger, Timeline, Format, Penalty, Source URL, Compliance Nature, Obligor Tier) to the app's data model
- Add computed fields: calculated due dates, risk levels, mock statuses, mock owners/approvers
- Zustand store for state management with filters, search, status updates

## Key Interactions
- Click compliance item → Detail drawer slides in from right with full info
- Status changes persist in Zustand (session-only)
- Charts update dynamically when filters change
- Agent "run" simulates progress with timed updates
- All tables: pagination, column sort, search, export to CSV

## Pages/Routes
- `/` → Dashboard (Module 2)
- `/register-agent` → Module 1
- `/risk-assessment` → Module 3
- `/compliance/:id` → Detail view (drawer, not page)

