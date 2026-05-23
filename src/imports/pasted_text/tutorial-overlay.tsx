Create a new TutorialOverlay component. This is an animated 
walkthrough overlay that explains the full new prospect flow 
and the app's main sections. It renders on top of the existing 
app UI — not a separate page.

TRIGGER:
In Settings.tsx, add a new section below the RENDERING block, 
labeled "HELP" in the same section label style (Syne 9px 
#a0a09a uppercase tracking-[0.1em]).

Inside the block: a single row with label "Product Tutorial" 
in DM Mono 13px #a0a09a, and a button on the right:
"LAUNCH TUTORIAL" — ghost style, 1px border #2a2a2a, 
DM Mono 11px #f0f0ec uppercase, px-[16px] py-[10px].

On click, set a global state flag or call a prop that mounts 
the TutorialOverlay component over the current page.

---

OVERLAY STRUCTURE:

The overlay is fixed, full viewport, z-index 100.
Background: rgba(8, 8, 8, 0.92) — not fully opaque so the 
app UI is faintly visible underneath.

The overlay has two zones:
- A spotlight zone: a rounded rectangle cutout that 
  highlights the relevant UI element on screen. Use 
  box-shadow with a large spread to dim everything outside 
  the spotlight area: 
  box-shadow: 0 0 0 9999px rgba(8,8,8,0.85)
  The spotlight itself is transparent so the element beneath 
  is fully visible and readable.

- A tooltip card: positioned near (but not covering) the 
  spotlight. Background #111111, 1px border #2a2a2a, 
  border-radius 4px, padding 24px, max-width 340px.

The tooltip card contains:
- Step counter: Syne 10px #888880 uppercase e.g. "STEP 3 OF 9"
- Headline: Cormorant Garamond 24px #f0f0ec
- Body: DM Mono 12px #c8c8c2 line-height 1.7, max 3 sentences
- Two buttons at the bottom:
  Left: "BACK" ghost, 1px border #2a2a2a, DM Mono 11px #a0a09a
  Right: "NEXT →" filled, bg #f0f0ec, DM Mono 11px #080808
  On the last step, "NEXT →" becomes "FINISH" 
- A row of progress dots below the buttons — one dot per 
  step, active dot is #f0f0ec, inactive dots are #2a2a2a, 
  each 6px diameter, 6px gap

An X button in the top-right corner of the overlay 
(not the tooltip card) — DM Mono 11px #888880 "SKIP TUTORIAL" 
with an X icon. Dismisses the overlay entirely on click.

---

THE 9 STEPS:

Each step defines: which element to spotlight, 
where to position the tooltip, headline, and body copy.

STEP 1 — Sidebar navigation
Spotlight: the entire sidebar (left column)
Tooltip position: right of sidebar, vertically centered
Headline: "Your workspace"
Body: "The sidebar is your main navigation. Prospects 
are unsigned talent you're evaluating. Roster is your 
signed models. Shared tracks client packages you've sent out."

STEP 2 — Dashboard stats row
Spotlight: the 7 stat cards at the top of the dashboard
Tooltip position: below the cards, centered
Headline: "Your pipeline at a glance"
Body: "The briefing shows your live pipeline — total 
prospects, shortlisted, awaiting review, and your 
active roster. The SAVED THIS MONTH card tracks cost 
avoided vs. test shoots."

STEP 3 — ADD PROSPECT button
Spotlight: the ADD PROSPECT button on the Prospects page 
(navigate to /prospects first when this step activates)
Tooltip position: below and left of the button
Headline: "Adding a new prospect"
Body: "Click ADD PROSPECT to start the intake flow. 
You'll enter basic info, confirm consent, then upload 
their digitals. The whole process takes under two minutes."

STEP 4 — Basic Info form
Spotlight: the form card on /prospects/new
Tooltip position: right of the form card
Headline: "Basic information"
Body: "Enter the prospect's name, primary market, and 
source. Measurements and notes are optional but help 
your team build context over time. Source tagging lets 
you filter by how talent came in."

STEP 5 — Consent screen
Spotlight: the checkbox and body copy on the consent screen
Tooltip position: right of the content block
Headline: "Consent confirmation"
Body: "Before uploading digitals, CastView requires you 
to confirm the prospect has been informed their photos 
will be used for AI evaluation. This is stored with 
their profile."

STEP 6 — Digitals upload
Spotlight: the upload area on /prospects/new/digitals
Tooltip position: right of the upload card
Headline: "Uploading digitals"
Body: "Upload front, profile, 3/4, and full body shots. 
Standard agency digitals — nothing special required. 
The AI uses these to generate context-specific 
evaluations adapted to their features."

STEP 7 — Context selector (Profile screen)
Spotlight: the context grid on /profile
Tooltip position: below the context grid
Headline: "Choosing evaluation contexts"
Body: "Select which shoot contexts to evaluate against — 
Fragrance, Editorial, Campaign, Runway, and more. 
Each context has its own scoring model. You can 
run multiple at once."

STEP 8 — Results and WHY THIS SCORE
Spotlight: the WHY THIS SCORE panel on /results
Tooltip position: left of the panel
Headline: "Understanding the score"
Body: "Every evaluation produces a Fit Score with a 
full breakdown — Composition, Style Match, Versatility, 
Market Fit. Use AGREE to log your confirmation or 
OVERRIDE to record your own judgment. Both signals 
improve the model over time."

STEP 9 — Share
Spotlight: the share link panel on /share
Tooltip position: left of the panel
Headline: "Sharing with clients"
Body: "Generate a clean share link for your client. 
They see the evaluation package in a dedicated portal 
— no login required. You'll be notified when they 
view or respond. Track all outstanding packages from 
your Dashboard."

---

ANIMATIONS:

Step transitions: the spotlight rectangle smoothly 
repositions using CSS transition on top/left/width/height 
with duration 400ms ease-in-out.

Tooltip card: fades in with opacity 0 → 1 over 200ms 
after the spotlight finishes moving.

On SKIP or FINISH: the entire overlay fades to opacity 0 
over 300ms then unmounts.

Do not navigate the user between pages automatically — 
instead, on steps that reference a different screen, 
show a note in the tooltip body in DM Mono 11px #888880 
italics: "Navigate to Prospects to follow along."

The spotlight on steps where the user is not on the 
correct page should fall back to a centered 480×320px 
rectangle in the middle of the screen with a gentle 
pulsing border animation (opacity 0.4 → 1 → 0.4 over 
1.5s infinite) to indicate "this is where you'd see it."

---

STATE MANAGEMENT:

Store isTutorialOpen as state in App.tsx or a top-level 
layout component so it persists across navigation.
Pass a closeTutorial callback down to the overlay.
Pass an openTutorial callback down to Settings.tsx.

The overlay mounts inside the Layout wrapper so it sits 
above the sidebar and main content but is controlled 
from Settings.