# Finished Tasks

## 2026-11-02 — Build SyllaTest React app from Figma (SyllaTest file)

- Task: Create the project from the Figma frames (20 main screens first, then the remaining
  variant frames), analyse each screen for cross-screen consistency, and correct design
  inconsistencies.
- Figma source: `figma.com/design/uiOhxDjn2Rp9JYFjmH6jyE/SyllaTest` (48 frames on Page 1).

### Files created

- Config: `vite.config.js` (fixed broken `react().tailwindcss()` plugin call), `index.html`,
  `eslint.config.js`, `src/index.css` (design tokens), `src/main.jsx`, `src/App.jsx` (routing).
- Shared: `src/components/AppShell.jsx`, `src/components/ui.jsx`,
  `src/state/AppState.jsx`, `src/state/context.js`,
  `src/data/mock.js`, `src/data/tos.js` (largest-remainder allocation).
- Screens (`src/pages/`): `SignIn`, `Sso`, `Dashboard`, `Upload`, `Verification`, `Consistency`,
  `ExamConfig`, `TosBuilder`, `Generation`, `Review`, `Export`, `Bank`, `ChairDashboard`,
  `Approval`, `Analysis`, `Admin`, `Notifications`, `Help`, `Profile`.

### Files removed

- `src/App.css`, `src/assets/react.svg` (Vite starter leftovers).

### Design inconsistencies found in Figma and corrected in code

1. **TOS item counts did not follow the stated formula.** The grid showed Ch 1 = 4 items for
   11.11% of 50 and Ch 4 = 19 for 23.33%, while naming the largest-remainder method. Counts are
   now computed in `src/data/tos.js`.
2. **Bloom totals contradicted the configured mix.** The grid's 6/7/13/12/6/6 gave 13 lower-order
   and 12 higher-order items against a configured 30% (15) / 20% (10). Both now derive from the
   same mix.
3. **Chair review comment signed by the faculty author.** "Dept. Chair Evelyn" was the same person
   as the item's author; a distinct chair (`Dr. Marco Delfin`) was added so approval has a second
   party. The SSO chooser's duplicate "Evelyn Ramos (Academic Audit)" chair account was replaced.
4. **Course identity conflict.** The same course appeared as "CS 211 Data Structures" (chair
   dashboard) and "IT 213 Data Structures & Algorithms" (faculty dashboard). Standardised on IT 213.
5. **An undefined CO 4.** Item analysis charted "CO 4 - Cloud Pipeline Integrations" and relabelled
   CO 3 as "Latency Security", though the syllabus defines only CO 1–3 (CO 3 *is* cloud deployment).
6. **Hour over-allocation attributed to the wrong outcome.** Reviewer approval placed the +1 hour on
   CO 2, while the consistency screen's fix targeted Chapter 4 (CO 3). Coverage is now computed from
   chapter hours, so both land on CO 3.
7. **Conflicting item-time rules.** Admin set multiple choice at 1.5 min/item; exam config called
   1.2 min/item "optimal" for 50 items in 60 min (1.5 would need 75 min). Admin's estimator is the
   single source at 1.2 and exam config reads from it.
8. **Dates outside the stated term.** Deadlines and the export ledger used October 2024 dates while
   the term is 2nd Sem A.Y. 2023-2024 (Jan–May 2024). Moved to March 2024.
9. **Mixed currency.** Chair dashboard quoted "$2.40", admin "₱ 0.12" for the same system. Pesos
   throughout.
10. **Active nav did not match the screen.** Generation progress highlighted "Question Bank"; the
    review editor highlighted "Verification". Nav state is now driven by the route.
11. **Faculty saw chair/admin navigation.** Several faculty frames listed Chair Dashboard, Reviewer
    Workspace and Admin Center. Navigation is role-scoped, with a "View as" switcher in the header.
12. **Inconsistent active-nav styling.** The consistency frame used a white/bordered 12px-radius
    active item; others used `#eff6ff` at 8px. Unified.
13. **Bloom tag colours varied by screen.** "Analyze" was blue on verification and green in the
    bank. One palette (`bloomTone`) is used everywhere.
14. **Compliance colours had no threshold.** 90% was amber "Good" and 100% green with no stated
    rule. A single `complianceTone` banding is applied to every percentage.
15. **Repeated placeholder statistics.** All three bank cards showed "discrimination score: 0.48
    (Good)"; each item now has its own score with a derived label.
16. **Chapter/CO tags contradicted the syllabus map.** Bank items in Chapter 2 were tagged CO 1 and
    CO 3; the CO now follows the chapter.
17. **Similarity warning cited a missing item.** The banner named Q-284, absent from the list; it
    now reads from the flagged item.
18. **Notification copy addressed the recipient as the sender** ("Dr. Evelyn Ramos flagged…" sent to
    Evelyn), cited "12 core outcomes" for a 3-outcome syllabus, and referenced a non-existent
    IT 311. All corrected.
19. **Destructive styling on a constructive action.** "Apply AI Auto-Fixes" was a red button; red is
    now reserved for destructive actions.
20. **Background gradient differed per frame** (`#e2e8f0` vs `#e0f2fe`). Set once on `body`.

### Variant frames

The 28 frames after `syllabus-file-selected` are states of the 20 main screens (file selected,
processing, confirmations, expanded menus, success/failure results, wizards). They are implemented
as state and modals within their parent screen rather than as separate pages, which is what keeps
the flows connected. `item-analysis-detail` opens by clicking a row in the analysis table.

### Notes for review

- Mock data in `src/data/mock.js` stands in for the API; no backend calls are wired yet.
- Sample item text for Q2/Q3 and the bank choices was written to fill out the screens — the Figma
  frames only showed one or two options per item. Replace with real content before any demo.
- Rounded hour figures: the reviewer "required hours" per CO are derived by scaling mapped chapter
  hours to the stated 90. Confirm this matches how the department actually allocates.
- `flutter`-oriented guidance in the root `CLAUDE.md` does not apply to this React/Vite project;
  confirm which CLAUDE.md should govern this directory.
- Verified with `npx eslint src` (clean), `npx vite build` (clean), and `vite preview` returning 200
  on `/`, `/dashboard`, `/tos`, `/chair`, `/admin`.

## 2026-11-02 — Verify the 28 variant frames against Figma (second pass)

- Task: "Can you do the other frames" — go back and check the variant frames I had implemented
  from inference, against their actual Figma designs, and correct the differences.
- Method: read each variant's node tree from the saved metadata to find its overlay node
  (`modal-backdrop`, `picker-modal`, `provider-drawer`, etc.), then fetch only that node instead of
  re-downloading the whole screen shell.

### Variant frames verified against Figma and corrected (13)

| Frame | What was wrong in my inferred version |
| --- | --- |
| `discard-draft-confirmation` | Had 2 actions; the design has 3 (Cancel / **Save Draft** / Discard Draft) with an icon header |
| `consistency-resolution-dialog` | Was a generic confirm; it is a CO-3 coverage workflow — selectable pre-validated items plus a mandatory CHED rationale that gates saving |
| `tos-approval-confirmation` | Was a one-line confirm; it is an audit summary (items, hours, method, Bloom split) and the primary action is "Approve and Generate Items" |
| `submit-review-confirmation` | Missing the readiness checklist, target-reviewer picker, submission note and compliance deadline |
| `bank-filters-expanded` | I built single-select dropdowns; it is a **multi-select chip popover** with a live "Found N matching items" count |
| `bank-action-wizard` | Missing the two tabs, TOS matrix-cell target, and weight / points-per-item fields |
| `grounding-materials-picker` | I had a plain file list; it is an attachment manager with per-file purpose toggles and a total-size meter against a 50 MB limit |
| `request-revisions-dialog` | Missing severity selector, affected-outcome field, due date and notify-faculty toggle |
| `ai-provider-selector` | Missing entirely; now a target-settings drawer with region, latency, cost ratio, fallback order, uptime and Test Connection |
| `user-role-manager` | I modelled one role per user; the design uses independent **authority claims** (granted/revoked) plus a per-user token limit |
| `regenerate-item-options` | Is a **version comparison history** panel (v1.1 vs v1.2) in the editor, not only a mode picker — added to the editor and populated on regenerate |
| `approve-lock-success` | Is a full certification page (identity, immutable version, watermark, next-step cards), not a modal |
| `time-overload-warning` | Revealed the real duration model: items x per-item estimate **plus a 10% review buffer** must fit the window, with "Auto-Optimize Question Count" |

### Further inconsistencies found in this pass

21. **A third name for the chair.** The submit dialog names "Dr. Michael Torres (Dept. Chair /
    Audit Lead)", alongside "Dept. Chair Evelyn" and the SSO chooser's "Evelyn Ramos (Academic
    Audit)". Torres is the only genuinely distinct person, so the invented name from the first pass
    was replaced with his throughout.
22. **A lock dialog that contradicts itself.** `tos-approval-confirmation` shows "91 computed hours"
    while asserting "University compliance checks passed" — 91 vs 90 stated *is* the open critical
    finding. The banner is now driven by whether the hours actually reconcile.
23. **Two different AI vendors.** The provider drawer makes "Vertex Gemini 1.5 Pro" the active
    engine, while the admin card and the sign-in footer both credit "Contra Core Cognitive LLM".
    Contra Core is kept active and Vertex is listed as the fallback provider it is.
24. **Admin rights granted to the faculty author.** The user drawer shows Dr. Evelyn Ramos with
    "System Administrator — GRANTED", contradicting her faculty role everywhere else. Claims now
    follow each account's actual role.
25. **The approval certificate credited the author.** `approve-lock-success` lists Dr. Evelyn Ramos
    as the certifying "Peer Reviewer" for the set she wrote; it now credits the approving chair.
26. **The hour overage mis-attributed again.** The revisions dialog calls it a "1 Hour Deficit" on
    CO 2 and describes 54 as the "lecture constraint", though it is an over-allocation on Chapter 4
    (CO 3) and the cover page lists 54 as *laboratory* hours.
27. **Bloom levels swapped between screens.** The wizard lists Q-312 as Analyze and Q-313 as
    Create; the bank list on the same items has them the other way round. The bank record is now
    the single source.
28. **Three difficulty vocabularies.** The filter offers Easy/Medium/Hard/**Advanced**, bank cards
    use Medium/Hard, and item analysis uses Easy/Moderate/Hard. Authored difficulty now uses the
    four-level scale; the computed difficulty *index* keeps its own banding, since it is a
    different measure (a p-value, not an author's label).
29. **A missing count in a button label.** "Attach Selected Materials ( Files)" shipped with the
    number absent.
30. **More October dates** in the submit dialog (Oct 20), revisions due date (Oct 25) and lock
    timestamp (Oct 14), all outside the stated Jan–May term.

### Still inferred, not yet verified against Figma (18 of 48 frames)

Corrected count: an earlier version of this entry said 15, listed 16, and wrongly omitted
`help-support-center` and `profile-account-menu` — those two were also built without fetching
their frames, despite being among the first 20 screens.

From the first 20: `help-support-center`, `profile-account-menu`, `syllabus-file-selected`.

Variants: `syllabus-processing`, `audit-processing`, `ai-auto-fix-review`,
`exam-selectors-expanded`, `generation-completed`, `generation-failed-retry`, `export-format-menu`,
`randomization-preview`, `export-success`, `results-import-mapping`, `item-analysis-detail`,
`registrar-sync-result`, `accreditation-export-result`, `timing-template-editor`,
`configuration-save-success`.

All are implemented and reachable, but built from convention rather than from their frames — treat
their copy and field lists as unverified. Of the 13 variants that were checked, every one differed
from what had been inferred, so several of these are likely wrong too.

### Coverage tally

- 48 frames in the file.
- 30 built from their actual Figma design (17 of the first 20, plus 13 variants).
- 18 implemented from inference, listed above.

### Incident

An earlier `python open(path, 'w')` call in this pass wrote several source files in the Windows
ANSI codepage, corrupting em dashes and peso signs; a cp1252 round-trip then turned the corruption
into literal mojibake. All files were repaired back to UTF-8 and verified clean. Later edits use the
editor tools or an explicit `encoding='utf-8'`.

### Verification

`npx eslint src` clean, `npx vite build` clean, and `vite preview` returns 200 on all 20 routes.

## 2026-11-02 — Third pass: finish the remaining frames

- Task: "Finish all the frames, analyze each screen, make sure each screen is related to others and
  modify the inconsistencies in the design."

### Verified against Figma and rebuilt in this pass (13 new, plus time-overload-warning re-derived)

| Frame | What differed |
| --- | --- |
| help-support-center | Mine was an FAQ accordion. The design is a search banner, a 2x2 "Getting Started Categories" grid, Recent Articles, a help-desk card and a system-status card |
| profile-account-menu | Is a **popover** on the sidebar account button, not a page: identity, role/department, Account Settings, AI Token Usage, Audit Trail, Switch Role, Sign Out |
| syllabus-processing | Is a full processing card with a five-step pipeline (integrity lock, malware scan, OCR, CO mapping, schema compliance), not a progress modal |
| audit-processing | Is a panel with audit-depth progress, a four-item checklist and a console diagnostic log |
| ai-auto-fix-review | Is a **full page** (the title changes) of before/after diff cards with per-fix checkboxes, not a modal list |
| exam-selectors-expanded | Adds a syllabus **coverage multi-select**, duration presets (45/60/90/120) and weighting-basis cards |
| time-overload-warning | Gave the real duration model: items x per-item estimate **plus a 10% review buffer** must fit the window |
| generation-completed | Is a full page with a compilation summary, duplicate scan, quality score and pipeline metrics |
| generation-failed-retry | Is a full page with per-chapter PRESERVED/FAILED rows and a Fault Resolution Panel (provider switch, error log, retry) |
| export-success | Is a full "Export Status & Archives" page with a checksum card, three bundle cards and a share row |
| registrar-sync-result | Is a receipt dialog: course/section, sync reference ID, outcomes uploaded, privacy safeguards, sync history |
| results-import-mapping | Is a **full page** column-mapping grid (data field / file column / validation preview) with an anonymize toggle |
| accreditation-export-result | Is a full "CHED Quality Reports Center" page with a Part A/B/C manifest and checksum |
| configuration-save-success | Is a centred success page with an integrity log, validator checks and a rollback point |

### Further inconsistencies found and corrected

31. **A fourth AI vendor.** The generation failure panel names Claude-3-Opus / Claude-3-Sonnet as
    the compiler, after Contra Core (admin card, sign-in footer) and Vertex Gemini (provider
    drawer). The configured provider list is now used everywhere.
32. **The phantom CO 4 again**, in two more places: the registrar receipt reports "4 of 4 COs
    Uploaded" and the accreditation manifest "4 outcome metrics", against three real outcomes.
33. **Chapter coverage was decorative.** The expanded selectors show a chapter multi-select that
    nothing consumed. Selected chapters now drive the TOS allocation and the generation jobs, so
    deselecting a chapter actually changes the grid.
34. **A zero-error badge styled as an error.** The mapping screen renders "0 mapping errors" in red.
35. **A one-off teal palette** on the help-desk card, used on no other screen.
36. **Latency quoted two ways.** Help says "Core Cognitive LLM latency: 12s average"; the provider
    drawer says "240 ms average". These measure different things, so the status card now labels
    request latency and parse duration separately.
37. **A file over its own limit.** The processing card reports a verified 25.4 MB upload while the
    dropzone states a 25 MB cap.
38. **PST on a Philippine export.** The export timestamp is stamped PST; a Lingayen campus export
    is PHT.
39. **Still more October dates** (export Oct 15, config save Oct 12, revision due Oct 25, lock
    Oct 14), all outside the stated Jan-May term.
40. **A hard-coded greeting.** The help banner greets "Dr. Evelyn" regardless of who is signed in.

### Coverage

- 43 of 48 frames built from their actual Figma design.
- 5 remain inferred: syllabus-file-selected, export-format-menu, randomization-preview,
  item-analysis-detail, timing-template-editor. These are implemented and working as states
  (file-selected card, format selects, randomization table, analysis detail dialog, template
  editor dialog) but their frames were not opened.

### Verification

eslint clean, vite build clean, vite preview returns 200 on all 20 routes.

## 2026-11-02 — Build the final 5 Figma frames and reconcile them

- Task: Finish all the frames, analyse each screen, keep the screens related to one another, and
  correct the design inconsistencies.
- Files: src/data/mock.js (modified), src/pages/Upload.jsx (modified), src/pages/Export.jsx
  (modified), src/pages/Analysis.jsx (modified), src/pages/Admin.jsx (modified),
  src/pages/ExamConfig.jsx (modified).

### Frames closed this pass

The last 5 inferred frames were opened and rebuilt from their actual design. Every one differed
from what had been inferred, as the earlier passes suggested they would:

- **syllabus-file-selected** (2:2788) — the staged state keeps the dropzone's brand border and
  holds a file detail card with a "Ready to Process" pill, a completed transfer bar, and a centred
  "Choose different file" button. The metadata card is retitled "Extracted Context Metadata" with
  "DETECTED" labels once a document is staged. Had been a plain card with a text link.
- **export-format-menu** (2:4558) — eight target formats, each with its own note, not four bare
  names. Added the "System Note" panel about Moodle XML and QTI carrying banks and images.
- **randomization-preview** (2:4662) — a full page, "Set Randomization & Shuffling Matrix", with an
  equivalence header, three set columns showing items and choices with "(Was Qn)" annotations, and
  Regenerate / Accept & Finalize actions. Had been a dialog with a position table.
- **item-analysis-detail** (2:5637) — a 480px right drawer over the dimmed table carrying the two
  index blocks, the response distribution chart, a misconception flag, a Retain/Revise/Reject
  decision and a revision note. Had been a centred dialog with no distribution.
- **timing-template-editor** (2:6090) — a six-row matrix with base duration, difficulty scale,
  year-level preset and review buffer per question type, plus New Question Type / Reset Defaults /
  Save Timing Template. Had been three summary cards.

### Inconsistencies found and corrected (41-50)

41. **The timing template and the exam duration check disagreed.** The editor sets multiple choice
    at 1.5 min/item; the overload panel called 1.2 min "optimal" for 50 items in 60 minutes, which
    leaves zero review time and does not fit either. The editor is now the single authority, and
    the exam screen derives how many items genuinely fit (36) instead of repeating the 1.2 claim.
    This reverses the earlier reconciliation, which had taken 1.2 as the shared figure.
42. **Two different review-buffer models.** The editor states a buffer in seconds per question
    type; the overload panel stated a flat 10% of total duration. The per-type figure is the
    specific one, so the buffer is now items x bufferSecs on both screens.
43. **"Create/Synthesis" in the estimator.** Synthesis is the 1956 taxonomy's name for Create. The
    product uses the revised taxonomy everywhere else, so the duplicate was dropped.
44. **Set C was not a shuffle.** "Set C (Deep Shuffled)" contained an item appearing in neither
    Set A nor Set B, and gave another item different choices altogether, while the header claimed
    99.4% equivalence. All sets now draw from one item pool by rotation, so equivalence holds by
    construction and is stated as 100% identical TOS coverage rather than an unexplained 99.4%.
45. **A Bloom mapping belonging to no screen.** The randomization header read "Analyze (40%),
    Evaluate (30%), Create (30%)", which is neither the configured 30/50/20 mix nor any
    distribution shown elsewhere. It now renders the configured mix.
46. **Key IDs stamped A-2024** against a 2nd Sem A.Y. 2023-2024 term; now derived from the term.
47. **Two class sizes in one panel.** The item audit read 21% = 11 students and 64% = 32 students,
    implying cohorts of 52 and 50. All counts now derive from one `cohortSize`, which reproduces
    both of Figma's numbers exactly at 50.
48. **The misconception flag misattributed its own figure.** It read "64% of high-performing
    students selected Option B"; 64% is the share of the whole cohort, and the upper group is a
    subset of it. Restated against the cohort.
49. **The same document listed twice, under two names.** The upload queue showed
    "ELEC4_WebMobile2_Syllabus.pdf — 85% complete" beside the ELEC 4 file being staged on that very
    screen, so one document was both pending and in flight. Only the earlier upload is listed.
50. **OCR enabled for a document that does not need it.** The staged notice read "Regional GPU-OCR
    Enabled" and, in the same sentence, that the file was "verified as vector-text native". The
    notice now reports whichever path actually applies.

Two further cross-screen gaps were closed: the recommended export format (Moodle XML) is now the
one the screen opens on rather than a green label beside an unselected option, and the produced
download bundle follows the chosen format instead of always emitting PDF + XML + XLSX.

### Defects fixed in my own earlier code

- **Export.jsx crashed on render.** `bundles` referenced `setCount` seven lines before its `const`
  declaration — a temporal dead zone `ReferenceError`. The export route had been reported as
  passing because a preview server returns 200 for an SPA route whatever the page does afterwards.
  Caught by rendering every page to a string; the check is now part of verification below.
- **Regenerating the shuffle could collapse two sets.** My first rotation used `si * (seed + 1)`,
  which yields offset 0 for Set B at seed 2, making it identical to Set A. Replaced with an offset
  that is non-zero and distinct per set at every seed; verified across seeds.

### Verification

- `npx eslint src` clean.
- `npx vite build` clean (478.66 kB JS / 138.26 kB gzip).
- All 19 page components rendered to string through an SSR harness, which catches render-time
  crashes a bundle cannot. Harness built and removed; not committed.
- Note on scope: the harness renders each page's default state. The branch states added this pass
  (randomization page, staged upload, audit drawer, export archive) are covered by lint, build and
  review, not by an interaction test — the project has no DOM test harness installed.

### Coverage

- 48 of 48 frames built from their actual Figma design. None remain inferred.

### Still for the developer

- Sample item text for Q2/Q3 and the bank choices is invented filler.
- Reviewer "required hours" per CO are derived by scaling mapped chapter hours to 90; confirm
  against real department practice.
- The root CLAUDE.md describes a Flutter/Laravel app and does not match this React/Vite project.
