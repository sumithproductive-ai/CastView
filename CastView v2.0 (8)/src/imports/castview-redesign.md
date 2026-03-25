"Redesign the navigation and add new screens to the existing CastView app. Match the existing design system exactly throughout: #080808 background, #111111 surface cards, #1a1a1a elevated surfaces, #f0f0ec ivory text, #a0a09a secondary text, #2a2a2a borders, Cormorant Garamond for display headings, DM Mono for body and UI text, Syne uppercase for labels. Max 4px border radius, no gradients, no drop shadows, 24px spacing unit.
First — update the sidebar navigation on every existing screen.
Remove 'Renders' as a nav item. The sidebar should now read, top to bottom: Dashboard, Prospects, Roster, Shared, Settings. Avatar and agency name at the bottom unchanged.

Screen 1 — Dashboard (update existing)
Unchanged except the stat cards. Replace the four existing stat cards with these five: Total Prospects, Shortlisted, Signed This Month, Roster Size, Shared Packages. Same card style as before — large monospaced number, small Syne uppercase label beneath.

Screen 2 — Prospects Index (replaces old Dashboard prospect list)
Sidebar: Prospects active.
Page title: 'Prospects' in large Cormorant Garamond.
Below title: a filter row. Left side: search input 'Search prospects...' in DM Mono. Right side: filter chips in Syne uppercase — ALL, NEW, IN REVIEW, SHORTLISTED, PASSED. ALL is active/selected by default, shown with filled ivory background. Others are outlined and inactive.
Below filter row: a list of prospect rows, same style as the existing dashboard table. Each row: square photo thumbnail, prospect name in DM Mono, status badge (NEW / IN REVIEW / SHORTLISTED / PASSED — each a different muted tint), a render count indicator ('3 renders' in muted grey), submission date, right arrow chevron. Rows separated by 1px #2a2a2a borders.
Show 6 rows: Sofia Andersen (Shortlisted, 4 renders), Marcus Chen (In Review, 2 renders), Ava Laurent (In Review, 3 renders), Luca Moretti (New, 0 renders), Isabella Novak (Passed, 1 render), Zara Klein (Shortlisted, 5 renders).

Screen 3 — Prospect Profile (update existing profile screen)
Breadcrumb: Prospects > Sofia Andersen. Sidebar: Prospects active.
Layout unchanged from current profile screen — digitals grid left, details and controls right.
One change on the right column: below the Generate Renders button, add a status row showing the current prospect status as a pill — 'SHORTLISTED' in Syne uppercase with a muted amber tint. Next to it, a small 'Change Status' text link in muted grey.

Screen 4 — Prospect Render History (new screen)
Breadcrumb: Prospects > Sofia Andersen > Renders. Sidebar: Prospects active.
Two-column layout. Left column 30% width, right column 70% width.
Left column — persistent prospect panel:
— Name in large Cormorant Garamond
— Current status pill: 'SHORTLISTED'
— Primary render image, full column width, tall portrait ratio
— Measurements in DM Mono key/value: Height 177cm, Bust 82cm, Waist 61cm, Hips 89cm, Hair Brown, Eyes Green. Muted label, ivory value.
— Market tags: NEW YORK, LONDON, PARIS as small outlined pills
— Agent notes text area with placeholder 'Add agent notes...'
— Three full-width buttons stacked:
First: outlined — 'RUN NEW RENDER'
Second: outlined — 'SHARE PACKAGE'
Third: filled ivory background, dark text, slightly more prominent — 'SIGN TO ROSTER'
Right column — render history:
— Section label 'RENDER HISTORY' in Syne uppercase
— Two render session blocks
Session block 1 — most recent, expanded:
— Session header bar: 'March 8, 2026' left, '4 contexts' centre, '96% top score' right. Subtle #1a1a1a background, 1px border.
— 2x2 grid of render cards below: Fragrance 94%, Editorial 96%, Campaign 88%, Beauty 91%. Fragrance card has ivory border as primary/selected. Each card: image placeholder, Syne context label, large Cormorant Garamond score.
— Session notes field below grid: 'Strong fragrance potential — follow up with client brief from Maison Margiela'
Session block 2 — older, collapsed:
— Header only: 'February 14, 2026', '2 contexts', '89% top score', EXPAND label with down chevron on right.

Screen 5 — Sign to Roster Modal (new — shown as overlay on Screen 4)
Show Screen 4 in the background, dimmed with a dark overlay.
Centred modal card: #111111 background, 1px #2a2a2a border, 24px padding, max width 480px.
Modal contents top to bottom:
— Title: 'Sign to Roster' in Cormorant Garamond size 28
— Subtitle in DM Mono muted: 'Sofia Andersen will be moved from Prospects to your Roster. All renders, digitals, and notes will transfer automatically.'
— A small summary block with light #1a1a1a background showing: '4 render sessions · 11 renders total · Signed: today'
— A text input labeled 'DIVISION' in Syne uppercase with a dropdown arrow — placeholder 'Select division...' with options visible: Women, Men, Sports, Couture
— Two buttons side by side at the bottom: left button outlined 'CANCEL', right button filled ivory 'CONFIRM SIGNING'

Screen 6 — Roster Index (new screen)
Sidebar: Roster active.
Page title: 'Roster' in large Cormorant Garamond.
Below title: filter row. Search input left. Right side: 'All Contexts' dropdown, 'All Divisions' dropdown, 'Sort: Last Rendered' dropdown. All minimal outlined style.
Below: 3-column grid of model cards. Each card #111111, 1px #2a2a2a border.
Card contents:
— Large square render thumbnail. Bottom-left corner: small dark pill showing primary context e.g. 'FRAGRANCE'
— Model name in Cormorant Garamond
— Row of 4 small context chips (FR, ED, RW, CA) — filled ivory if rendered, hollow outlined if not
— Top score in DM Mono ivory left, last render date muted grey right
— Bottom: 1px border, then ACTIVE or ON HOLD status in Syne uppercase
Show 6 cards: Sofia Andersen (all 4 chips filled, 96%, 3 days ago, ACTIVE), Marcus Chen (2 chips filled, 91%, 1 week ago, ACTIVE), Ava Laurent (3 chips filled, 89%, 2 weeks ago, ACTIVE), Luca Moretti (1 chip filled, 85%, 1 month ago, ON HOLD), Isabella Novak (4 chips filled, 93%, 5 days ago, ACTIVE), Zara Klein (2 chips filled, 88%, 3 weeks ago, ACTIVE).

Screen 7 — Roster Model Render History (new screen)
Breadcrumb: Roster > Sofia Andersen. Sidebar: Roster active.
Identical layout to Screen 4 (Prospect Render History) with these differences:
— No 'SIGN TO ROSTER' button. Replace it with a button labeled 'VIEW BOOKINGS' outlined.
— Status pill shows 'ACTIVE' in muted green instead of 'SHORTLISTED'
— Add a 'DATE SIGNED' field in the left panel below market tags: 'March 10, 2026' in DM Mono
— Session history shows 3 sessions instead of 2, with the oldest labeled 'PROSPECT ERA' in a muted Syne label above it, and a thin dashed divider separating it from the signed-era sessions above — this makes it visually clear which renders happened before and after signing."*