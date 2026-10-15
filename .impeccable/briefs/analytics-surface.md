# Data Analytics surface

## Scope and mode
Redesign the existing administrator Data Analytics screen in `client/src/AdminReportsPage.js`; Operate mode. Keep the existing application shell, role protections, AssistDesk identity, report filters, CSV export, section navigation, charts, performance tables, ticket records, audit history, and user directory.

## Audience, job, action, evidence, constraints
Audience: administrators reviewing campus support operations. Primary job: scan ticket health quickly, then move into department, performance, ticket, or audit details. Evidence: live report API values and existing report filters; do not invent metrics, dates, department counts, or claims. Open decisions were unanswered; the user directed autonomous progress, so this direction is inferred from the shipped feature set.

## Direction contract
THESIS: An analytics index sheet makes ticket health scannable first and places each deeper report in a clearly registered panel; it refuses the current all-sections-at-once density.

OWN-WORLD: Preserve the existing AssistDesk navy, teal, white, neutral surfaces, typography, navigation, and native web controls. Borrow only the assigned design-annual grammar: one-pixel rules, small section captions, careful panel alignment, subtle registration marks, and restrained printed-sheet density. No new brand palette or navigation metaphor.

STORY: Admin sees a current-scope ticket summary and the highest-signal priority distribution, then chooses Overview, Performance, Ticket records, or Audit & activity. Filters and CSV export remain globally available.

FIRST VIEWPORT: Keep the existing top navigation and page title. Place a slim scope/filter/export row beneath it, followed by four live summary figures. Below, show an Overview plate grid led by ticket priorities and department volume, with remaining overview charts aligned as secondary plates; use existing real API values and explicit empty states.

FORM: Assigned grounded candidate #5 from concept seed c5b000b1, Report Plate Index / design annual plate section. Its index/plate composition becomes panel alignment and subtle registration marks, not editorial navigation. Signature move: a restrained registration crosshair at report-plate corners, used consistently and never obscuring content or controls.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
