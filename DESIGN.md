---
name: AssistDesk
description: A campus helpdesk identity with a clear, readable wayfinding route into support.
colors:
  navy: "#0f2d52"
  navy-deep: "#082038"
  teal: "#1f6f78"
  gold: "#d4a017"
  signal-gold: "#ffd35a"
  white: "#ffffff"
  soft-surface: "#f3f7fb"
  page-text: "#163548"
  muted-text: "#5f7482"
  hairline: "#dce6ee"
  route-line: "rgba(132, 190, 195, 0.8)"
  route-marker: "#79aeb4"
  route-marker-fill: "#bfe4e2"
  closing-surface: "#eaf2f5"
  dialog-surface: "#f1f8fb"
typography:
  display:
    fontFamily: "Poppins, Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "clamp(3.1rem, 7.4vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.99
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Poppins, Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "clamp(2.05rem, 4vw, 3.45rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Poppins, Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "clamp(1rem, 1.5vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Poppins, Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 650
rounded:
  button: "7px"
  brand-mark: "12px"
  marker: "50%"
  dialog: "24px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "24px"
  xl: "42px"
components:
  button-primary:
    backgroundColor: "{colors.signal-gold}"
    textColor: "{colors.navy-deep}"
    rounded: "{rounded.button}"
    padding: "0 18px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "#ffe28c"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "0 18px"
    height: "46px"
  route-marker:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.route-marker-fill}"
    rounded: "{rounded.marker}"
    size: "46px"
  navigation-header:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    height: "82px"
    padding: "14px clamp(20px, 5vw, 72px)"
  directory-row:
    backgroundColor: "{colors.white}"
    textColor: "{colors.page-text}"
    padding: "11px 0"
---

# Design System: AssistDesk

## Overview

**Creative North Star: "The Campus Wayfinding Board"**

AssistDesk keeps its established campus-helpdesk identity—navy, teal, white, and gold—while giving the support journey a distinct, reusable wayfinding language. A fine map grid, connected numbered stops, and restrained destination markers make the route legible; clear type and direct labels remain the primary information layer.

The Campus Wayfinding Board direction was inferred as the assigned lead after the decision page closed without a stored answer and confirmation returned no selection; it was not a recorded user selection. The implemented surface pairs a dark route field with a quiet directory and a pale closing panel, keeping the existing AssistDesk identity recognizable while making the request-to-department-to-status sequence easy to scan.

**Key Characteristics:**
- Campus support expressed as a clear, connected route.
- Navy-led contrast with teal route details and signal-gold actions.
- Information stays readable and explicit; map graphics support rather than replace it.

## Colors

The palette uses deep institutional navy for focus, teal for wayfinding cues, white and cool pale surfaces for reading, and a brighter gold signal for the primary action and route origin.

### Primary
- **Campus Navy** (#0f2d52): Brand and section-heading color on light surfaces.
- **Deep Route Navy** (#082038): Hero field, footer, and route marker ground.
- **Signal Gold** (#ffd35a): Primary action, sign-in control, and first route marker; brighter than the inherited gold token to preserve contrast and prominence.

### Secondary
- **Campus Teal** (#1f6f78): Links and wayfinding accent on light surfaces.
- **Route Mist Teal** (#bfe4e2): Numbered route marker text against the dark field.

### Neutral
- **Paper White** (#ffffff): Navigation and directory surfaces; keeps long department lists calm.
- **Cool Map Paper** (#f3f7fb): Soft brand-mark tile and the shared light page ground.
- **Campus Ink** (#163548): Body and directory text.
- **Muted Slate** (#5f7482): Supporting navigation and explanatory copy.
- **Fine Divider** (#dce6ee): Quiet boundaries between navigation, sections, and directory entries.
- **Wayfinding Pale** (#eaf2f5): Closing action panel.
- **Route Line** (rgba(132, 190, 195, 0.8)): Dashed path joining route markers.
- **Route Marker Teal** (#79aeb4): Outlined route-stop boundary.
- **Legacy Campus Gold** (#d4a017): Inherited brand token; the landing-page action uses Signal Gold instead.

### Named Rules
**The Gold Signal Rule.** Reserve the brighter signal gold for the primary action and the route origin; do not treat it as a broad decorative fill.

## Typography

**Display Font:** Poppins (with Segoe UI, Tahoma, Geneva, Verdana, sans-serif fallbacks; Poppins weights 400, 500, 600, and 700 are locally imported)
**Body Font:** Poppins (with Segoe UI, Tahoma, Geneva, Verdana, sans-serif fallbacks)
**Label/Mono Font:** No separate family; compact wayfinding numbers use tabular Poppins numerals.

**Character:** Geometric, confident headings contrast with open, readable supporting copy. Tight tracking belongs to large headlines; small navigation and directory text stays compact without becoming ornamental.

### Hierarchy
- **Display** (700, clamp(3.1rem, 7.4vw, 6rem), 0.99): The direct hero headline; smaller mobile clamps replace it at narrow widths.
- **Headline** (700, clamp(2.05rem, 4vw, 3.45rem), 1.04): Department section heading; closing headings use a separate 1.8–3rem clamp.
- **Title** (700, clamp(1.12rem, 1.8vw, 1.42rem), default line-height): Route-board heading.
- **Body** (400, clamp(1rem, 1.5vw, 1.2rem), 1.65): Hero explanation; directory copy is deliberately denser at 0.82rem with 1.4 line-height.
- **Label** (650, 0.88rem, normal tracking): Navigation links; route and directory indices use smaller tabular numerals.

### Named Rules
**The Clear-Label Rule.** Keep meaningful route steps and actions in text; condensed numbering and graphic marks are supporting wayfinding, not substitutes for labels.

## Layout

The header spans the viewport while its navigation is capped at 1360px; the hero content, route board, section heading, and directory share a 1216px maximum width. Wide layouts show the three route stops in a horizontal sequence and the department directory in two columns. At 700px and below, the route becomes vertical, the directory groups stack, and the footer changes to a vertical reading order. At 420px, the navigation may wrap and directory entries become one column; at 360px, the navigation itself stacks. Gutters use responsive clamps on wide layouts, then settle to 20px at mobile and 12px at the narrowest breakpoint. The rhythm uses compact 8–12px control gaps, 20–24px content spacing, and larger 42–104px section breathing room.

### Named Rules
**The Route-Orientation Rule.** Preserve the same ordered three-stop path across breakpoints: horizontal on wide screens and vertical on narrow screens.

## Elevation & Depth

The landing surface is flat by default. Depth comes from the contrast between the deep route field and light directory, the fine grid and dashed route lines, and thin dividers rather than card shadows. The existing authentication modal is the intentional exception: a translucent blurred backdrop and a substantial dialog shadow separate that focused overlay from the page.

### Shadow Vocabulary
- **Authentication dialog** (`0 24px 80px rgba(0,0,0,0.35)`): Lift the sign-in or registration modal above the dimmed page; do not apply this treatment to route stops or directory entries.

## Shapes

Buttons use gently rounded corners (7px); the brand mark sits in a softly rounded tile (12px), while route stops and endpoint markers are circular. Directory entries remain unboxed rows, separated by hairline top rules. The map grid is square and regular; route lines are thin, dashed connectors, not enclosing card outlines.

## Components

### Buttons
- **Character:** Compact, confident actions with a shared rounded shape and crisp icon strokes.
- **Shape:** Gently rounded (7px), 46px minimum height; the route-start variant is 40px on wide screens and 42px on mobile.
- **Primary:** Signal-gold fill (#ffd35a), deep-navy text, 0 18px horizontal padding; the route-start version tightens to 14px and adds a small diagonal arrow.
- **Hover / Focus:** Hover shifts to pale gold (#ffe28c) and lifts 1px. Landing links and buttons receive a visible 3px focus outline with 4px offset; focused actions stay distinct from color-only hover.
- **Secondary:** Transparent white-tinted fill and border over the dark hero, with white text; hover increases the tint and brightens the border.

### Navigation
- **Style:** White, 82px-high desktop header with the AssistDesk mark, compact text links, and a gold Sign in action. The nav content is capped at 1360px.
- **States:** Links shift from muted slate to teal on hover; the sign-in action follows the primary gold state. Mobile navigation wraps at 420px and stacks at 360px.

### Route Stops
- **Character:** A connected, numbered three-step path makes the service sequence scannable without turning it into cards.
- **Shape and color:** 46px circular markers with a teal outline and pale-teal numerals on deep navy; the first marker is signal gold with deep-navy numerals.
- **Connector:** A one-pixel repeating dashed teal line runs through the marker centers; it reorients from horizontal to vertical on mobile.
- **Content:** Each stop keeps a concise title and explanatory sentence; the first stop owns the Start a request action.

### Directory Rows
- **Style:** Department names sit in open, unboxed rows on white, with a fine top divider and 11px vertical padding.
- **Grouping:** Academic departments and campus services have numbered teal group labels; the grid changes from paired columns to one column at narrow widths.

### Authentication Dialog
- **Style:** Existing sign-in and registration flow in a centered, scrollable dialog (up to 980px wide) over a darkened, 5px-blurred backdrop.
- **Shape and depth:** 24px corners on desktop, 18px on mobile; a white-to-cool-white surface and the focused dialog shadow described above.

## Do's and Don'ts

### Do:
- **Do** keep the inherited navy/teal/gold identity and use the brighter signal gold for the principal action and route origin.
- **Do** use connected route lines and numbered destination markers to clarify an explicitly labeled support sequence.
- **Do** preserve the 1216px content measure and the horizontal-to-vertical route transformation.
- **Do** keep keyboard focus visible and honor reduced-motion preferences for interactive transitions.

### Don't:
- **Don't** let map graphics replace labels, controls, or readable explanations.
- **Don't** add unsupported response-time promises, service counts, guarantees, or customer claims.
- **Don't** turn the flat route and directory into a stack of shadowed cards.
