---
version: 1
slug: "client-src-landingpage-js"
primary_target: "client/src/LandingPage.js"
related_targets: ["client/src/index.css"]
---

# AssistDesk Landing Page

## Scope and mode
Redesign the existing public landing page in `client/src/LandingPage.js`; Persuade mode. Preserve the AssistDesk identity, accurate product capabilities, and working sign-in/registration modal flow.

## Audience, job, action, proof, constraints
First-time campus visitors need to understand where to begin with a support request and what happens afterward. The main action opens the existing sign-in flow; registration remains available there. Prove the service path with only supported steps: describe the concern, route the request to a department, and follow status updates. Do not invent response times, service counts, guarantees, or customer claims. The direction was inferred as the rolled lead after the decision page closed without a stored answer and the confirmation returned no selection; it is not a recorded user selection.

## Direction contract
THESIS: A campus wayfinding board makes AssistDesk's support route easy to understand before a visitor signs in; refuse the generic hero-over-feature-cards arrangement.

OWN-WORLD: Keep the existing AssistDesk navy, teal, white, and gold identity. Let fine campus-route lines, destination markers, and measured map-grid spacing carry the visual language. Keep actual UI copy, controls, and navigation crisp and readable; route graphics clarify the service, never replace it.

STORY: A visitor recognizes AssistDesk as the campus support entry point, sees the path from request to department to status updates, then opens sign-in to continue. Existing registration remains reachable in that modal.

FIRST VIEWPORT: Retain the brand and a compact top navigation. Lead with a large, direct headline and short explanation, followed immediately by a connected three-step route. Put a clearly clickable “Start a request” action at the route's origin and “Sign in” in the navigation. Begin a real department directory below the route, using existing campus department names only.

FORM: Assigned grounded structure 4, Campus Wayfinding Board, from surface roll 96dd3388. Build code-led because image generation is unavailable. Use `.impeccable/mocks/decision/landing-wayfinding.html` as the composition reference, not as shipped markup.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions
None blocking the inferred direction. Keep existing application routes and authentication behavior unchanged.
