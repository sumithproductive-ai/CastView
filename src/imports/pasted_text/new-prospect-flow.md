"Add a new prospect creation flow to the existing CastView app. This is a 3-step process accessed by a new 'ADD PROSPECT' button on the Prospects Index screen. Match the design system throughout: #080808 background, #111111 surfaces, #1a1a1a elevated, #f0f0ec ivory, #a0a09a muted, #2a2a2a borders, Cormorant Garamond display, DM Mono body, Syne uppercase labels, 24px spacing, 4px max border radius, no gradients, no shadows.
First — on the Prospects Index screen, add an 'ADD PROSPECT' button in the top-right of the page header, aligned to the right of the page title. Style: filled #f0f0ec ivory background, #080808 dark text, DM Mono uppercase, 4px border radius, 12px vertical padding, 20px horizontal padding. A small '+' icon on the left. Clicking navigates to /prospects/new.

New Screen A — Step 1: Basic Info (/prospects/new)
Sidebar: Prospects active. No progress bar at the top of the page — instead show a step indicator directly in the main content area below the page title.
Page title: 'New Prospect' in Cormorant Garamond 48px.
Step indicator: a horizontal row of three steps, left-aligned, below the title with 32px margin. Each step is: a small filled circle with a number (1, 2, 3) and a label to the right in DM Mono 13px. Steps connected by a thin 1px horizontal line. Step 1 'Basic Info' is active — ivory filled circle, ivory text. Steps 2 'Digitals' and 3 'Review' are inactive — #2a2a2a outlined circle, muted text.
Below the step indicator: a single centered form card — #111111 background, 1px #2a2a2a border, 4px radius, 480px max width, 32px padding.
Form fields inside, stacked with 20px gaps:
Field 1 — label 'FULL NAME' in Syne uppercase muted above. Text input below: #1a1a1a background, 1px #2a2a2a border, 4px radius, 12px padding, DM Mono ivory, placeholder 'e.g. Sofia Andersen' in muted grey.
Field 2 — label 'PRIMARY MARKET' in Syne uppercase muted above. Three outlined pill toggles in a row: NEW YORK, LONDON, PARIS. Multiple selectable. Active pill: ivory background, dark text. Inactive: transparent background, #2a2a2a border, muted text. Same style as shoot context chips.
Field 3 — label 'MEASUREMENTS' in Syne uppercase muted above. A 2x3 grid of small paired inputs — each pair has a muted label above and a short input below. Labels and inputs: Height, Bust, Waist, Hips, Shoe, Hair. All same input style as Field 1 but narrower.
Field 4 — label 'AGENT NOTES' in Syne uppercase muted above. Textarea input, 80px height, same style, placeholder 'Initial observations...'
Bottom of card: full-width button 'CONTINUE TO DIGITALS →' — filled ivory background, dark DM Mono text, 4px radius.

New Screen B — Step 2: Upload Digitals (/prospects/new/digitals)
Same page title 'New Prospect'. Step indicator updated: Step 1 shows a checkmark in the circle (completed), Step 2 'Digitals' is now active — ivory circle with '2', ivory text. Step 3 still inactive.
Below step indicator: a section label 'UPLOAD DIGITALS' in Syne uppercase muted, and a line beneath it in DM Mono muted smaller text: 'All four shots are required. Clear, natural light, no filters.'
Below: a 2x2 grid of upload zones, 24px gap. Each zone is a large square — #0d0d0d background, 1px dashed #2a2a2a border, 4px radius. Inside each empty zone: centered vertically and horizontally — an upload icon (simple arrow-up or cloud-upload from lucide), below it the shot label in Syne uppercase ivory (FRONT, PROFILE, 3/4, FULL BODY), below that a smaller line in DM Mono muted '(click or drag to upload)'.
Show two zones as already uploaded (FRONT and PROFILE): replace the empty state with a filled photo — use a fashion model image placeholder filling the entire square. In the top-right corner of uploaded zones: a small dark circular button with an X icon, #1a1a1a background, 1px #2a2a2a border. In the bottom-left corner: a small dark pill badge 'UPLOADED' in Syne uppercase muted green tint.
Show 3/4 and FULL BODY zones as still empty/awaiting upload.
Below the grid: a requirements note in DM Mono muted 12px — 'JPG or PNG · Max 10MB per image · Minimum 800px on shortest side'
Bottom: two buttons side by side. Left: 'BACK' outlined muted. Right: 'CONTINUE TO REVIEW →' filled ivory — but shown in a semi-disabled state (reduced opacity, cursor not-allowed) since not all 4 uploads are complete. Add a small note beneath the button in DM Mono muted 12px: '2 of 4 digitals uploaded'.

New Screen C — Step 3: Review & Save (/prospects/new/review)
Same page title 'New Prospect'. Step indicator: Steps 1 and 2 both show checkmarks (completed). Step 3 'Review' is active.
Below step indicator: section label 'REVIEW PROSPECT' in Syne uppercase muted.
A single centered summary card — #111111 background, 1px #2a2a2a border, 480px max width, 32px padding.
Inside the card — top section: prospect name in Cormorant Garamond 32px ivory. Below name: market tags as small outlined pills — NEW YORK, LONDON.
Below: a 2x2 grid of small uploaded digital thumbnails — 4 square images, 4px radius, labeled below each with Syne uppercase muted: FRONT, PROFILE, 3/4, FULL BODY. Thumbnails are compact — roughly 100px square each.
Below thumbnails: a thin 1px #2a2a2a divider, then measurements displayed in DM Mono key/value pairs in two columns: Height/Bust left, Waist/Hips right. Muted label, ivory value.
Below measurements: agent notes if entered, in DM Mono muted italic.
Bottom of card: two full-width buttons stacked with 12px gap. First button: outlined — 'SAVE AS DRAFT' — saves prospect with New status, navigates to /prospects. Second button: filled ivory — 'SAVE & RUN RENDERS →' — saves prospect and navigates to /profile to begin render context selection. Below the two buttons: a small 'Back to edit' text link in muted DM Mono centered.
Update routes.tsx to register three new routes: /prospects/new, /prospects/new/digitals, /prospects/new/review. Add the ADD PROSPECT button to ProspectsIndex.tsx navigating to /prospects/new."