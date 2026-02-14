# ShipInspector UX Redesign Proposal

**Document Version**: 1.0
**Date**: 2026-02-08
**Status**: Draft for Team Review
**Epic**: SI-UX (proposed)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Principles](#2-design-principles)
3. [User Personas](#3-user-personas)
4. [Feature Areas](#4-feature-areas)
   - A. Collapsible Sidebar
   - B. Equity Calculator Improvements
   - C. Hand Recorder Reimagining
   - D. Hand Library Redesign
   - E. New Poker Utilities
5. [Visual Design System](#5-visual-design-system)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Jira Epic Structure](#7-jira-epic-structure)
8. [Risk Register](#8-risk-register)
9. [Success Metrics](#9-success-metrics)
10. [Appendix: Competitive Landscape](#10-appendix-competitive-landscape)

---

## 1. Executive Summary

ShipInspector is a poker hand tracking and analysis application consisting of an Equity Calculator and a Hand Replayer, deployed on Vercel with a React 19 SPA frontend. After completing the migration from Lit.js to React 19 (Epic SI-35) and the server consolidation effort (Epic SI-81), the product is architecturally stable and ready for a user experience overhaul. This proposal synthesizes findings from six independent analyst reviews covering poker UX research, React component architecture, poker game design, UX patterns, visual design, and feature prioritization.

The current application works but suffers from several UX gaps: a fixed-width sidebar that wastes screen real estate on smaller viewports, an equity calculator table constrained to `max-w-4xl` (896px) that underutilizes wide monitors, a hand recorder that presents all form fields simultaneously without guided workflow, and a hand library with no filtering or sorting capabilities. Card sizes are below industry minimums, suit color contrast fails WCAG AA standards, and the action recorder uses generic form dropdowns instead of poker-native interaction patterns.

The redesign is organized into four implementation phases spanning approximately 12 weeks. Phase 1 (Quick Wins, weeks 1-2) delivers the collapsible sidebar and equity calculator visual improvements for immediate user impact. Phase 2 (Strategic Investment, weeks 3-8) tackles the hand library redesign and begins the hand recorder reimagining. Phase 3 (New Utilities, weeks 9-12) introduces two validated poker utilities. Phase 4 (Ongoing Polish) covers animations, accessibility refinements, and performance tuning.

Each recommendation is grounded in competitive analysis (PokerTracker 4, Hold'em Manager 3, Equilab, GTO Wizard, PioSolver), validated against four user personas, and scoped with specific Tailwind CSS classes, file paths, and shadcn/ui component references to enable direct story creation in Jira.

---

## 2. Design Principles

These principles govern all design and implementation decisions throughout the redesign.

### 2.1 Mobile-First, Desktop-Enhanced

Build every layout for narrow viewports first, then progressively enhance for tablets and desktops. The current sidebar already has `md:w-64` breakpoint behavior in `web/src/app/AppLayout.tsx`; all new work should follow this pattern using Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).

### 2.2 Visual First, Numbers Second

Poker players think in patterns, colors, and spatial relationships. Prefer visual indicators (equity bars, colored suit icons, position badges) over raw numeric tables. When numbers are needed, use `tabular-nums` font-variant for alignment and `font-black` for card rank legibility.

### 2.3 Three-Second Rule

Every core interaction (deal a card, record an action, filter hands) should complete in under three seconds. If an operation cannot meet this threshold, show a loading state within 100ms and provide progress feedback.

### 2.4 Zero-to-Value in 60 Seconds

A new user should be able to complete a meaningful action (run an equity calculation, begin recording a hand) within 60 seconds of first entering the application. Progressive disclosure and smart defaults support this goal.

### 2.5 Poker-Native Terminology

Use standard poker vocabulary throughout: "Raise to $50" (not "Raise $25"), positions as UTG/MP/CO/BTN/SB/BB, streets as Preflop/Flop/Turn/River. Avoid programmer slang or ambiguous labels in UI elements. The current `ACTION_TYPE_OPTIONS` array in `web/src/components/hand-recorder/ActionRecorder.tsx` already follows this pattern and should remain the reference standard.

### 2.6 Collaboration-Ready

Design data structures and UI patterns that support future multi-user features (study groups, shared hand reviews). This does not require implementation now, but interfaces and stores should avoid assumptions of single-user-only usage.

### 2.7 Accessibility as a Baseline

All interactive elements must meet WCAG 2.1 AA. Minimum 44px touch targets on mobile, visible focus indicators, proper ARIA labels, and `prefers-reduced-motion` support for all animations.

---

## 3. User Personas

Four personas represent the core user segments. Feature prioritization and design decisions should reference these personas to ensure broad coverage.

### 3.1 Casual Cal (Weekend Warrior)

- **Profile**: Plays 1-2 sessions per week, primarily live home games or low-stakes online
- **Goals**: Quick equity checks during study sessions, record memorable hands to discuss with friends
- **Pain Points**: Overwhelmed by complex interfaces, wants fast answers without configuration
- **Key Needs**: Simple defaults, mobile-friendly layout, minimal required fields in hand recorder

### 3.2 Grinder Grace (Volume Player)

- **Profile**: Plays 4-6 sessions per week, multi-tables online, tracks results seriously
- **Goals**: Efficient hand entry workflow, session tracking, quick filtering of hand library
- **Pain Points**: Slow data entry, no keyboard shortcuts, inability to filter/sort large hand libraries
- **Key Needs**: Keyboard navigation, batch operations, fast page loads, collapsible sidebar for screen space

### 3.3 Tournament Tom (MTT Specialist)

- **Profile**: Primarily plays multi-table tournaments, cares about ICM and final table dynamics
- **Goals**: Understand push/fold ranges, calculate ICM equity, review tournament hands with position context
- **Pain Points**: No ICM calculator, no tournament-specific metadata in hand records
- **Key Needs**: Position-aware displays, stack-to-pot ratio tools, tournament-specific utilities

### 3.4 Study Group Sam (Collaborative Learner)

- **Profile**: Active in poker study groups, reviews hands with peers, shares analysis
- **Goals**: Export and share hands, annotate key decisions, compare ranges with study partners
- **Pain Points**: No sharing workflow, no annotation support, no collaborative features
- **Key Needs**: Export functionality, hand notes, future collaboration hooks

---

## 4. Feature Areas

### 4.A Collapsible Sidebar

**Rationale**: The current sidebar in `web/src/app/AppLayout.tsx` (line 29) is fixed at `w-16` on mobile and `md:w-64` on desktop. Users cannot collapse it to reclaim horizontal space for the poker table or hand library. Competitive tools like PokerTracker 4 and Hold'em Manager 3 both provide collapsible navigation. Grinder Grace and Tournament Tom, who often work on constrained screen widths, will benefit most.

**Current State**: The sidebar renders nav items with icons and labels. On mobile (`<md`), only icons show. There is no mechanism to toggle between expanded and collapsed states on desktop.

**Scope**:

1. Add a `sidebarCollapsed` boolean to `useSettingsStore` (`web/src/stores/useSettingsStore.ts`), persisted to localStorage alongside `cardSelectionMode`
2. Add a hamburger toggle button in the sidebar header area
3. When collapsed: sidebar shrinks to `w-16`, nav labels hide, app title shows "SI" abbreviation
4. When expanded: sidebar returns to `w-64`, full labels visible
5. Add `Sheet` component from shadcn/ui for mobile overlay mode (breakpoints below `md`)
6. Keyboard shortcut: `Ctrl+B` (or `Cmd+B` on macOS) toggles sidebar

**Files to Modify**:
- `web/src/stores/useSettingsStore.ts` (add `sidebarCollapsed`, `toggleSidebar`, persist state)
- `web/src/app/AppLayout.tsx` (conditional width classes, toggle button, Sheet on mobile)

**New shadcn/ui Components**: `Sheet` (for mobile overlay sidebar)

**Acceptance Criteria Sketch**:
- [ ] Sidebar toggle button visible in sidebar header
- [ ] Clicking toggle collapses sidebar to icon-only mode (`w-16`)
- [ ] Clicking toggle again expands sidebar to full mode (`w-64`)
- [ ] Collapsed/expanded state persists across page reloads via localStorage
- [ ] `Ctrl+B` / `Cmd+B` keyboard shortcut toggles sidebar
- [ ] On mobile (`<md`), sidebar opens as a Sheet overlay
- [ ] Navigation remains fully functional in both states
- [ ] Transition animates smoothly (`transition-all duration-200`)

---

### 4.B Equity Calculator Improvements

**Rationale**: The equity calculator is ShipInspector's flagship feature. The poker table in `web/src/components/poker/PokerTable.tsx` is currently constrained to `max-w-4xl` (896px), wasting significant space on wide monitors. Card sizes (player cards at `min-w-[2rem] min-h-[2.5rem]`, board cards at `min-w-[2.5rem] min-h-[3rem]`) are below the industry minimum of 48x64px for player cards and 60x80px for board cards. Suit colors for clubs (`#4b5563`) and spades (`#4b5563`) in `web/src/lib/poker/constants.ts` fail WCAG AA contrast against the dark card background.

**Current State**: The `PokerTable` component uses percentage-based absolute positioning for 8 player slots around an elliptical table. The `EquityCalculatorPage` has a simple vertical layout (header, table, outs section) with no side panel for supplementary information.

**Scope**:

1. **Widen the table**: Replace `max-w-4xl` with responsive constraints: `max-w-[90vw] xl:max-w-[1200px] 2xl:max-w-[1400px]`
2. **Increase card sizes**: Player cards to `min-w-[3rem] min-h-[4rem]` (48x64px) scaling up to `min-w-[4.5rem] min-h-[5.5rem]` (72x88px) at `xl:`. Board cards to `min-w-[3.75rem] min-h-[5rem]` (60x80px) scaling up to `min-w-[5.5rem] min-h-[7rem]` (88x112px) at `xl:`
3. **Fix suit colors**: Update `SUIT_MAP` in `web/src/lib/poker/constants.ts`:
   - Hearts: `#fb7185` (rose-400)
   - Diamonds: `#f87171` (red-400)
   - Clubs: `#64748b` (slate-500)
   - Spades: `#334155` (slate-700) with `drop-shadow` for dark-on-dark visibility
4. **Card rank typography**: Apply `font-black` (`font-weight: 900`) to all card rank text, add `tabular-nums` to all numeric displays
5. **Poker table theming**: Add subtle green felt background to the inner table ellipse (`bg-emerald-950/20`), warm brown rail border (`border-amber-900/30`), and a pot-gold accent for active/winner states
6. **Two-column layout on XL+**: On `xl:` breakpoints and above, add a side panel (`w-80` to `w-96`) alongside the table showing equity breakdown details, outs analysis, and recent calculation history. Move the `OutsDisplay` component from below the table into this side panel
7. **4-color deck option**: Add a `fourColorDeck` boolean to `useSettingsStore`, exposed in `PokerOptions`. When enabled, override suit colors: hearts (rose-400), diamonds (blue-400), clubs (green-500), spades (slate-700)

**Files to Modify**:
- `web/src/components/poker/PokerTable.tsx` (width constraints, table theming)
- `web/src/components/poker/Player.tsx` (card size classes)
- `web/src/components/poker/BoardCards.tsx` (card size classes)
- `web/src/lib/poker/constants.ts` (suit colors)
- `web/src/pages/EquityCalculatorPage.tsx` (two-column layout, side panel)
- `web/src/components/poker/EquityDisplay.tsx` (tabular-nums)
- `web/src/stores/useSettingsStore.ts` (fourColorDeck setting)
- `web/src/components/settings/PokerOptions.tsx` (4-color deck toggle)

**Acceptance Criteria Sketch**:
- [ ] Poker table uses full available width up to responsive maximums
- [ ] Player card slots are at least 48x64px; board card slots are at least 60x80px
- [ ] All suit colors pass WCAG AA contrast ratio (4.5:1 for normal text)
- [ ] Card ranks use `font-black` weight
- [ ] All numeric values (equity percentages, sample counts) use `tabular-nums`
- [ ] On `xl:` screens, equity breakdown appears in a side panel
- [ ] 4-color deck option available in settings and persisted
- [ ] Table has subtle felt/rail visual treatment

---

### 4.C Hand Recorder Reimagining

**Rationale**: The hand recorder is the highest-value, highest-risk redesign target. Currently, `HandRecorderPage` (`web/src/pages/HandRecorderPage.tsx`) displays all four sections simultaneously: `GameSettingsForm`, `PlayerSetupSection`, `BoardCardsSection`, and `ActionRecorder`. This overwhelming layout causes new users to abandon hand entry (Casual Cal persona) and frustrates experienced users who want streamlined data entry (Grinder Grace persona). The action recorder in `web/src/components/hand-recorder/ActionRecorder.tsx` uses generic form dropdowns for street, action type, and actor seat, rather than poker-native context-aware buttons.

**Current State**: The `ActionRecorder` component exposes 16 action types in a flat dropdown, requires manual street selection, and makes no attempt to infer which actions are valid given the current game state. There is no position-awareness (UTG, MP, CO, BTN, SB, BB), no automatic blind posting, and no pot-relative bet sizing presets.

**Scope**:

This feature area is split into two sub-phases: the Wizard Navigation (lower risk) and the Commentator Narration Flow (higher risk, requires UX spike first).

#### 4.C.1 Wizard Navigation

Convert the current single-page form into a tabbed wizard using shadcn/ui `Tabs` component:

**Step 1: Game Context** (maps to current `GameSettingsForm`)
- Stakes (SB/BB/Ante), table size, button position
- Smart defaults: auto-populate common stakes, remember last-used settings

**Step 2: Players** (maps to current `PlayerSetupSection`)
- Active player configuration with names, starting stacks, seat positions
- Position labels auto-calculated from button seat (UTG, MP, CO, BTN, SB, BB)

**Step 3: Action Recording** (maps to current `ActionRecorder`)
- Context-aware action buttons replace generic dropdowns (Phase 2 enhancement)
- Auto-post blinds from correct positions when entering preflop
- Street progression handled automatically

**Step 4: Board and Review** (maps to current `BoardCardsSection` + review)
- Board card entry
- Summary view of all entered data
- "Hand ended here" shortcut to skip remaining streets
- Save button with validation feedback

**Alternative Mode**: A toggle for "All-in-One" mode that shows all sections simultaneously (current behavior), persisted in `useSettingsStore` for power users (Grinder Grace).

#### 4.C.2 Commentator Narration Flow (Requires UX Spike)

Replace form-based action entry with a contextual action panel:

- **Context-aware buttons**: Instead of a generic dropdown, show only valid actions. If facing a bet, show "Fold", "Call $X", "Raise to $Y". If first to act, show "Check", "Bet $X"
- **Pot-relative presets**: Bet sizing buttons for 1/3 pot, 1/2 pot, 3/4 pot, pot, all-in
- **Position indicators**: Display position labels (UTG, MP, CO, BTN, SB, BB) next to player names
- **Auto blind posting**: When starting preflop, automatically generate POST_SB and POST_BB actions from the correct seats
- **Street auto-progression**: When all players have acted and action is closed, prompt for next street
- **Validation rules**: Prevent impossible actions (CHECK facing a bet, CALL with no outstanding bet), enforce action order by position, track stack consistency

**Files to Modify**:
- `web/src/pages/HandRecorderPage.tsx` (wizard shell, tab navigation)
- `web/src/components/hand-recorder/ActionRecorder.tsx` (context-aware buttons, smart defaults)
- `web/src/components/hand-recorder/GameSettingsForm.tsx` (smart defaults, position calculation)
- `web/src/components/hand-recorder/PlayerSetupSection.tsx` (position labels)
- `web/src/stores/useHandRecorderStore.ts` (wizard step state, validation rules, position logic)
- `web/src/stores/useSettingsStore.ts` (wizard vs. all-in-one mode preference)

**New shadcn/ui Components**: `Tabs`, `Separator`

**Acceptance Criteria Sketch (Wizard Navigation)**:
- [ ] Hand recorder presents as a 4-step tabbed wizard
- [ ] Users can navigate between steps freely (not locked to linear progression)
- [ ] Each step validates its own inputs and shows inline errors
- [ ] "All-in-One" toggle switches to the current simultaneous layout
- [ ] Mode preference persists in localStorage
- [ ] Draft auto-save works identically in both modes
- [ ] Position labels (UTG, MP, CO, BTN, SB, BB) display next to player names
- [ ] Tab state does not reset when switching between steps

**Acceptance Criteria Sketch (Commentator Narration Flow)**:
- [ ] Action panel shows only contextually valid actions
- [ ] Blinds auto-post when entering preflop for the first time
- [ ] Pot-relative bet sizing presets available (1/3, 1/2, 3/4, pot, all-in)
- [ ] Invalid actions are prevented with clear feedback messages
- [ ] Street progresses automatically when action closes
- [ ] Stack tracking updates in real-time as actions are recorded

---

### 4.D Hand Library Redesign

**Rationale**: The hand library (`web/src/components/hand-library/HandLibraryList.tsx`) currently displays a flat table with Date, Stakes, Table Size, Board, and Actions columns. There is no filtering, sorting, or alternative view. As users accumulate hands, finding specific hands becomes increasingly difficult. Grinder Grace and Study Group Sam need robust search and filtering to make the library useful for study.

**Current State**: The `HandLibraryList` component renders an HTML table with cursor-based pagination ("Load more" button). Hands are displayed in reverse chronological order with no ability to filter or sort. The `useHandLibraryStore` handles fetching and pagination but has no filter state.

**Scope**:

1. **Filter Bar Component**: Add a `FilterBar` component above the hand list with the following filters:
   - Date range picker (start date, end date)
   - Stakes selector (dropdown of unique SB/BB combinations from user's hands)
   - Result filter (won/lost/all, requires adding result metadata to hand records)
   - Table size filter (2-9 players)
   - Hero cards filter (text input matching card notation, e.g., "AKs")
   - Clear all filters button

2. **Sort Options**: Add sortable column headers for Date, Stakes, and Table Size (ascending/descending toggle)

3. **View Modes**: Add a toggle between:
   - **List View** (default): Current table layout, enhanced with sortable headers
   - **Grid View**: Card-based layout showing hand previews in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), each card displaying board preview, stakes, date, and a quick-replay button

4. **Filter Store**: Create `useHandLibraryFiltersStore` as a separate Zustand store for filter state, decoupled from the data-fetching store. Filtering should happen client-side for the currently loaded hands, with server-side filtering as a future enhancement.

5. **Empty and Filtered-Empty States**: Distinct messaging for "no hands at all" vs. "no hands match your filters"

**Files to Modify**:
- `web/src/pages/HandLibraryPage.tsx` (FilterBar integration, view mode toggle)
- `web/src/components/hand-library/HandLibraryList.tsx` (sortable headers, grid view, filtered-empty state)
- New file: `web/src/stores/useHandLibraryFiltersStore.ts`
- New file: `web/src/components/hand-library/FilterBar.tsx`
- New file: `web/src/components/hand-library/HandLibraryGrid.tsx`

**New shadcn/ui Components**: `Popover` (for date picker), `Combobox` (for stakes selector)

**Acceptance Criteria Sketch**:
- [ ] Filter bar renders above the hand list with date, stakes, table size, and hero cards filters
- [ ] Filters apply client-side to currently loaded hands
- [ ] Clearing all filters restores the full list
- [ ] Column headers for Date, Stakes, and Table Size are sortable (click to toggle asc/desc)
- [ ] Grid view toggle switches to a card-based responsive layout
- [ ] View preference persists in localStorage
- [ ] "No hands match your filters" message when filters exclude all results
- [ ] Filter state resets when navigating away and returning
- [ ] Performance remains acceptable with 100+ hands loaded client-side

---

### 4.E New Poker Utilities

**Rationale**: Competitive analysis reveals that modern poker tools bundle multiple utility calculators alongside core features. Users (especially Tournament Tom and Study Group Sam) expect analysis tools beyond basic equity calculation. The proposals from multiple analysts overlap significantly; this section consolidates them into a single prioritized list of five utilities.

**Navigation**: Add a "Utilities" section to the sidebar in `AppLayout.tsx` with an expandable sub-navigation. Each utility gets its own route under `/utilities/<name>`.

**Consolidated Utility List** (prioritized by user impact and implementation feasibility):

#### Utility 1: Pot Odds and Equity Required Calculator (Priority: P2)

*Merges: "Pot Odds & Equity Required Calculator" (David Park) + "Interactive Outs Calculator with Board Runout Simulation" (Sarah Chen)*

- Input: pot size, bet to call, number of outs
- Output: pot odds as ratio and percentage, required equity to call profitably, implied odds breakeven
- Enhancement: board runout simulation showing how equity changes on different turn/river cards
- Leverages existing WASM equity engine in `lib/wasm-equity/`

#### Utility 2: Effective Stack and SPR Calculator (Priority: P2)

*Merges: "Effective Stack & SPR Calculator" (David Park) + portion of "Smart Session Tracker" (Sarah Chen)*

- Input: stack sizes for two players, pot size
- Output: effective stack, stack-to-pot ratio (SPR), strategic guidance based on SPR thresholds
- SPR thresholds: <3 (commit or fold), 3-6 (one street of value), 7-13 (two streets), 13+ (deep stacked play)
- Could integrate as a side panel in the equity calculator two-column layout

#### Utility 3: Range Builder with Presets (Priority: P3)

*Merges: "Range Builder with Strategy Preset Library" (Sarah Chen) + "Range vs Range Equity Calculator" (David Park)*

- Visual 13x13 range grid (rows = first card rank, columns = second card rank)
- Click/drag to select range combinations
- Built-in presets: UTG open, CO open, BTN open, BB defend, 3-bet ranges by position
- Range vs. range equity calculation using existing WASM engine
- Color-coded heatmap display (green = high equity, red = low equity)

#### Utility 4: Session Tracker with Variance Visualization (Priority: P3)

*Merges: "Smart Session Tracker with Variance Visualization" (Sarah Chen) + "Session Tracker with Variance Analysis" (David Park)*

- Log sessions with date, duration, buy-in, cash-out, game type, stakes
- Running bankroll chart with expected-value line and confidence intervals
- Variance visualization showing standard-deviation bands
- Session tagging (live, online, tournament, cash)
- Import/export session data as CSV

#### Utility 5: Combos and Blockers Analyzer (Priority: P4)

*From: "Combos & Blockers Analyzer" (David Park)*

- Input: a hand range and known cards (board + hole cards)
- Output: remaining combos count, blocked combos visualization
- Shows how known cards reduce opponent's possible holdings
- Useful for advanced hand reading and bluff frequency calculations

**Deferred Utilities** (not included in initial roadmap, to be reconsidered after Phase 3 metrics):
- ICM Calculator with Final Table Deal Analyzer (Tournament Tom persona, but narrow audience)
- Hand Review Notes with AI-Powered Tagging (high complexity, requires backend AI integration)

**Implementation Note**: Ship Utility 1 and Utility 2 first (simpler, higher confidence in user demand), measure engagement, then decide on Utilities 3-5 based on data.

---

## 5. Visual Design System

### 5.1 Color Palette

#### Suit Colors (Standard 2-Color)

| Suit     | Current Color | Proposed Color | Tailwind Token | Contrast (on dark bg) |
|----------|---------------|----------------|----------------|-----------------------|
| Hearts   | `#ef4444`     | `#fb7185`      | rose-400       | 5.2:1 (AA pass)       |
| Diamonds | `#ef4444`     | `#f87171`      | red-400        | 4.8:1 (AA pass)       |
| Clubs    | `#4b5563`     | `#64748b`      | slate-500      | 4.6:1 (AA pass)       |
| Spades   | `#4b5563`     | `#334155`      | slate-700      | Needs drop-shadow     |

**Note**: Spades at slate-700 on dark backgrounds require a `drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]` to meet contrast requirements.

#### Suit Colors (4-Color Deck Option)

| Suit     | Color      | Tailwind Token |
|----------|------------|----------------|
| Hearts   | `#fb7185`  | rose-400       |
| Diamonds | `#60a5fa`  | blue-400       |
| Clubs    | `#22c55e`  | green-500      |
| Spades   | `#334155`  | slate-700      |

#### Poker Theme Accents

| Element          | Color/Class                               |
|------------------|-------------------------------------------|
| Table felt       | `bg-emerald-950/20`                       |
| Table rail       | `border-amber-900/30`                     |
| Pot/winner gold  | `text-amber-400`, `bg-amber-400/10`       |
| Active selection | `ring-primary/50` (existing)              |
| Winner glow      | `shadow-[0_0_8px_rgba(34,197,94,0.3)]` (existing, keep) |

### 5.2 Card Sizing

All sizes use responsive scaling. The "min" values ensure touch-target accessibility (44px minimum dimension).

#### Player Hole Cards

| Breakpoint | Width         | Height         | Tailwind Classes                |
|------------|---------------|----------------|---------------------------------|
| Base       | 48px (3rem)   | 64px (4rem)    | `min-w-[3rem] min-h-[4rem]`    |
| md         | 56px (3.5rem) | 72px (4.5rem)  | `md:min-w-[3.5rem] md:min-h-[4.5rem]` |
| xl         | 72px (4.5rem) | 88px (5.5rem)  | `xl:min-w-[4.5rem] xl:min-h-[5.5rem]` |

#### Board Cards

| Breakpoint | Width         | Height         | Tailwind Classes                 |
|------------|---------------|----------------|----------------------------------|
| Base       | 60px (3.75rem)| 80px (5rem)    | `min-w-[3.75rem] min-h-[5rem]`   |
| md         | 68px (4.25rem)| 88px (5.5rem)  | `md:min-w-[4.25rem] md:min-h-[5.5rem]` |
| xl         | 88px (5.5rem) | 112px (7rem)   | `xl:min-w-[5.5rem] xl:min-h-[7rem]` |

### 5.3 Typography

| Element           | Classes                                        | Notes                          |
|-------------------|------------------------------------------------|--------------------------------|
| Card ranks        | `font-black leading-none`                      | 900 weight for maximum legibility |
| Numeric displays  | `tabular-nums`                                 | Uniform digit width for alignment |
| Position labels   | `text-xs font-bold uppercase tracking-wide`    | UTG, MP, CO, BTN, SB, BB      |
| Street headers    | `text-sm font-semibold uppercase tracking-wider` | PREFLOP, FLOP, TURN, RIVER  |
| Page titles       | `text-xl font-bold` (existing)                 | Keep current pattern           |

### 5.4 Animations

All animations must respect `prefers-reduced-motion`. Wrap in the Tailwind `motion-safe:` modifier or use a CSS media query.

| Animation        | CSS / Tailwind                                         | Duration | Use Case                  |
|------------------|--------------------------------------------------------|----------|---------------------------|
| Card deal        | `motion-safe:animate-[deal_300ms_ease-out]`            | 300ms    | New card placed on board   |
| Card flip        | `motion-safe:animate-[flip_400ms_ease-in-out]`         | 400ms    | Hole card reveal           |
| Winner glow      | `motion-safe:animate-pulse`                            | 2000ms   | Winning player highlight   |
| Card hover lift  | `motion-safe:hover:-translate-y-1 transition-transform` | 150ms   | Interactive card hover     |
| Sidebar toggle   | `transition-all duration-200`                          | 200ms    | Collapse/expand sidebar    |
| Sheet overlay    | Built into shadcn/ui Sheet                             | 200ms    | Mobile sidebar             |

**Keyframe Definitions** (to add in `web/src/index.css` or Tailwind config):

```css
@keyframes deal {
  from {
    opacity: 0;
    transform: translateY(-20px) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
}

@keyframes flip {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(90deg); }
  100% { transform: rotateY(0deg); }
}
```

### 5.5 Responsive Table Width

Replace the current `max-w-4xl` constraint on the poker table:

```
Current:  max-w-4xl                    (896px fixed max)
Proposed: max-w-[90vw] xl:max-w-[1200px] 2xl:max-w-[1400px]
```

This allows the table to use 90% of viewport width on smaller screens, capping at 1200px on XL and 1400px on 2XL monitors.

---

## 6. Implementation Roadmap

### Phase 1: Quick Wins (Weeks 1-2, ~5 dev days)

| Story                                  | Effort | Personas Served          |
|----------------------------------------|--------|--------------------------|
| Collapsible sidebar                    | S (2-3d)| Grinder Grace, all users |
| Equity calculator width + card sizing  | S (2-3d)| All users                |
| Suit color WCAG fix + 4-color option   | XS (1d) | All users                |

**Phase 1 Exit Criteria**: Sidebar toggles correctly, table fills available width, all suit colors pass WCAG AA, 4-color deck option works.

### Phase 2: Strategic Investment (Weeks 3-8, ~20-25 dev days)

| Story                                  | Effort  | Personas Served             |
|----------------------------------------|---------|-----------------------------|
| Hand Library filter bar                | M (5d)  | Grinder Grace, Study Group Sam |
| Hand Library sort + grid view          | S (3d)  | Grinder Grace, Study Group Sam |
| Hand Recorder wizard navigation        | M (5d)  | Casual Cal, Grinder Grace    |
| Position labels + auto blind posting   | S (3d)  | All users                    |
| UX Spike: Commentator narration flow   | S (3d)  | (research only)              |
| Commentator narration flow impl.       | L (8d)  | Grinder Grace, Casual Cal   |

**Phase 2 Exit Criteria**: Hand library has working filters, sorts, and grid view. Hand recorder has wizard mode with position labels. Commentator narration flow is validated and at least partially implemented.

**Gate**: The Commentator Narration Flow implementation (L effort) should not begin until the UX Spike is complete with validated wireframes. If the spike reveals significant complexity, defer implementation to Phase 3.

### Phase 3: New Utilities (Weeks 9-12, ~10-15 dev days)

| Story                                  | Effort | Personas Served               |
|----------------------------------------|--------|-------------------------------|
| Pot Odds & Equity Required Calculator  | M (5d) | Casual Cal, Tournament Tom     |
| Effective Stack & SPR Calculator       | S (3d) | Tournament Tom, Grinder Grace  |
| Utilities sidebar section + routing    | S (2d) | All users                      |
| Range Builder (if metrics support)     | L (8d) | Study Group Sam, Grinder Grace |

**Phase 3 Exit Criteria**: Two utilities shipped, usage metrics instrumented, sidebar navigation updated with Utilities section.

### Phase 4: Ongoing Polish (Week 12+)

| Story                                  | Effort | Notes                      |
|----------------------------------------|--------|----------------------------|
| Card animations (deal, flip, glow)     | S (3d) | prefers-reduced-motion      |
| Poker table theming (felt, rail)       | XS (1d)| Visual polish               |
| Typography pass (font-black, tabular)  | XS (1d)| Across all components       |
| Keyboard shortcuts                     | S (2d) | Cmd+1-4 for nav, etc.      |
| ARIA audit + focus management          | S (3d) | Accessibility compliance    |
| Performance profiling (filter perf)    | S (2d) | Client-side filter scaling  |

---

## 7. Jira Epic Structure

**Epic**: SI-UX: UX Redesign
**Description**: Comprehensive UX overhaul of ShipInspector covering navigation, equity calculator, hand recorder, hand library, new utilities, and visual design system improvements.

---

### Phase 1 Stories

---

### SI-XX: Implement collapsible sidebar with persistent state
**Type**: Story
**Priority**: P1 (Critical)
**Effort**: S (2-3d)
**Dependencies**: None
**Summary**: Add toggle functionality to the sidebar in `AppLayout.tsx`, persist collapsed/expanded state in `useSettingsStore`, and implement Sheet overlay for mobile viewports.
**Acceptance Criteria**:
- [ ] Toggle button in sidebar header collapses sidebar to `w-16` icon-only mode
- [ ] Expanded state shows sidebar at `w-64` with full labels
- [ ] State persisted to localStorage via `useSettingsStore`
- [ ] `Ctrl+B` / `Cmd+B` keyboard shortcut toggles sidebar
- [ ] Mobile (`<md`) sidebar opens as a shadcn/ui Sheet overlay
- [ ] Smooth `transition-all duration-200` animation
- [ ] All existing navigation links remain functional in both modes

---

### SI-XX: Widen equity calculator table and increase card sizes
**Type**: Story
**Priority**: P1 (Critical)
**Effort**: S (2-3d)
**Dependencies**: None
**Summary**: Replace `max-w-4xl` on the poker table with responsive width constraints and increase card slot minimum sizes to meet industry standards (48x64px for player cards, 60x80px for board cards).
**Acceptance Criteria**:
- [ ] `PokerTable` uses `max-w-[90vw] xl:max-w-[1200px] 2xl:max-w-[1400px]`
- [ ] Player `CardSlot` in `Player.tsx` uses `min-w-[3rem] min-h-[4rem]` (base), scaling at `md:` and `xl:`
- [ ] Board `BoardCardSlot` in `BoardCards.tsx` uses `min-w-[3.75rem] min-h-[5rem]` (base), scaling at `md:` and `xl:`
- [ ] Card ranks use `font-black` weight
- [ ] All numeric displays (equity %, sample counts) use `tabular-nums`
- [ ] Table remains properly centered and responsive across breakpoints
- [ ] Player position layout (`PLAYER_POSITIONS` percentage coords) still works at larger sizes

---

### SI-XX: Fix suit color contrast and add 4-color deck option
**Type**: Story
**Priority**: P2 (High)
**Effort**: XS (1d)
**Dependencies**: None
**Summary**: Update suit colors in `web/src/lib/poker/constants.ts` to pass WCAG AA contrast. Add a `fourColorDeck` boolean to `useSettingsStore` with a toggle in `PokerOptions`.
**Acceptance Criteria**:
- [ ] Hearts color updated to `#fb7185` (rose-400)
- [ ] Diamonds color updated to `#f87171` (red-400)
- [ ] Clubs color updated to `#64748b` (slate-500)
- [ ] Spades color updated to `#334155` (slate-700) with drop-shadow for visibility
- [ ] All four suit colors pass WCAG AA contrast ratio (4.5:1) against card background
- [ ] 4-color deck toggle in Settings; when enabled, diamonds become blue-400 and clubs become green-500
- [ ] Setting persisted to localStorage

---

### Phase 2 Stories

---

### SI-XX: Add filter bar to hand library
**Type**: Story
**Priority**: P2 (High)
**Effort**: M (5d)
**Dependencies**: None
**Summary**: Create a `FilterBar` component and `useHandLibraryFiltersStore` for client-side filtering of the hand library by date range, stakes, table size, and hero cards.
**Acceptance Criteria**:
- [ ] `FilterBar` component renders above the hand list in `HandLibraryPage`
- [ ] Date range filter with start/end date inputs
- [ ] Stakes dropdown populated from unique SB/BB values in loaded hands
- [ ] Table size filter (2-9 dropdown)
- [ ] Hero cards text input accepting card notation (e.g., "AK", "QJs")
- [ ] "Clear all filters" button resets all filters
- [ ] Filtering happens client-side on currently loaded hands
- [ ] Distinct empty state: "No hands match your filters" vs. "No hands saved yet"
- [ ] Filter store created as `useHandLibraryFiltersStore` (separate from data store)

---

### SI-XX: Add sorting and grid view to hand library
**Type**: Story
**Priority**: P3 (Medium)
**Effort**: S (2-3d)
**Dependencies**: SI-XX (filter bar)
**Summary**: Add sortable column headers to the list view and an alternative grid view with a toggle button. Persist view preference in localStorage.
**Acceptance Criteria**:
- [ ] Date, Stakes, and Table Size column headers are clickable for sort toggle (asc/desc)
- [ ] Sort indicator arrow shows current sort direction
- [ ] Grid view toggle button switches to a card-based layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- [ ] Each grid card shows board preview, stakes, date, and a quick-replay button
- [ ] View mode (list/grid) persisted in localStorage
- [ ] Sorting works in both list and grid views

---

### SI-XX: Convert hand recorder to wizard navigation
**Type**: Story
**Priority**: P2 (High)
**Effort**: M (5d)
**Dependencies**: None
**Summary**: Refactor `HandRecorderPage` to use a shadcn/ui `Tabs` component presenting four steps: Game Context, Players, Actions, Board and Review. Add an "All-in-One" toggle for power users that shows the current simultaneous layout.
**Acceptance Criteria**:
- [ ] Hand recorder renders as a 4-tab wizard (Game Context, Players, Actions, Board & Review)
- [ ] Users can navigate between tabs freely (non-linear)
- [ ] Each tab validates its own section and shows inline errors
- [ ] "All-in-One" toggle in header switches to the current simultaneous layout
- [ ] Mode preference persisted in `useSettingsStore`
- [ ] Draft auto-save (idb-keyval with 7-day TTL) works in both modes
- [ ] Tab state preserved when switching between tabs
- [ ] Save button accessible from the final tab with full validation summary

---

### SI-XX: Add position labels and auto blind posting to hand recorder
**Type**: Story
**Priority**: P2 (High)
**Effort**: S (2-3d)
**Dependencies**: SI-XX (wizard navigation, for integration context)
**Summary**: Calculate and display poker position labels (UTG, MP, CO, BTN, SB, BB) based on button seat and table size. Auto-generate POST_SB and POST_BB actions when entering preflop.
**Acceptance Criteria**:
- [ ] Position labels (UTG, MP, CO, BTN, SB, BB) display next to each player name in the player setup section
- [ ] Labels recalculate when button seat or table size changes
- [ ] Correct position assignment for all table sizes (2-9 players)
- [ ] When entering the Actions tab/section for the first time on a new hand, POST_SB and POST_BB actions auto-populate from the correct seats with the correct amounts
- [ ] Auto-posted blinds can be manually edited or removed
- [ ] Action recorder dropdown shows player name + position label (e.g., "Alice (BTN)")

---

### SI-XX: UX spike for commentator narration flow
**Type**: Spike
**Priority**: P2 (High)
**Effort**: S (2-3d)
**Dependencies**: SI-XX (wizard navigation, to understand wizard context)
**Summary**: Research and prototype the "commentator narration flow" for action recording. Produce wireframes for context-aware action buttons, pot-relative bet sizing presets, and automatic street progression. Validate with 2-3 target users from the Grinder Grace and Casual Cal personas.
**Acceptance Criteria**:
- [ ] Wireframes for context-aware action panel (buttons replace dropdowns)
- [ ] Wireframes for pot-relative sizing presets (1/3, 1/2, 3/4, pot, all-in)
- [ ] Wireframes for automatic street progression prompts
- [ ] Document validation rules: which actions are valid in which game states
- [ ] User validation with at least 2 target users
- [ ] Go/no-go recommendation with effort estimate for implementation
- [ ] Deliverable: Figma/wireframe file attached to Jira

---

### SI-XX: Implement commentator narration flow for action recording
**Type**: Story
**Priority**: P2 (High)
**Effort**: L (8d)
**Dependencies**: SI-XX (UX spike, must complete with "go" recommendation)
**Summary**: Replace the form-based action entry in `ActionRecorder.tsx` with context-aware action buttons, pot-relative bet sizing presets, and automatic street progression based on the validated UX spike wireframes.
**Acceptance Criteria**:
- [ ] Action panel shows only valid actions given current game state
- [ ] Buttons show absolute amounts: "Call $10", "Raise to $30"
- [ ] Pot-relative presets: 1/3 pot, 1/2 pot, 3/4 pot, pot, all-in
- [ ] Custom amount input for non-preset bet sizes
- [ ] Invalid actions prevented (cannot CHECK facing a bet, cannot CALL with no outstanding bet)
- [ ] Street auto-progresses when action closes (with user confirmation prompt)
- [ ] Stack tracking updates in real-time
- [ ] All-in auto-detected when bet/raise equals remaining stack
- [ ] Existing action editing (ActionRow) still works for corrections

---

### Phase 3 Stories

---

### SI-XX: Add utilities section to sidebar navigation
**Type**: Story
**Priority**: P3 (Medium)
**Effort**: XS (1d)
**Dependencies**: SI-XX (collapsible sidebar, for consistent navigation pattern)
**Summary**: Add an expandable "Utilities" section to the sidebar in `AppLayout.tsx` with sub-navigation items. Set up routing in `App.tsx` for `/utilities/*` paths under the protected route group.
**Acceptance Criteria**:
- [ ] "Utilities" header appears in sidebar below main nav items
- [ ] Utilities section is expandable/collapsible (accordion or disclosure)
- [ ] Routes registered in `App.tsx` under `/utilities/pot-odds`, `/utilities/spr`, etc.
- [ ] Active utility route highlights in sidebar
- [ ] Works correctly in both collapsed and expanded sidebar states

---

### SI-XX: Build Pot Odds and Equity Required Calculator
**Type**: Story
**Priority**: P3 (Medium)
**Effort**: M (5d)
**Dependencies**: SI-XX (utilities sidebar)
**Summary**: Create a new utility page at `/utilities/pot-odds` that calculates pot odds, required equity to call, and implied odds breakeven. Include board runout simulation leveraging the existing WASM equity engine.
**Acceptance Criteria**:
- [ ] Input fields: pot size, bet to call, number of outs (optional)
- [ ] Output: pot odds as ratio (e.g., 3:1) and percentage (25%)
- [ ] Output: required equity to call profitably
- [ ] Output: implied odds breakeven amount
- [ ] If outs provided, show equity on current street and by the river
- [ ] Board runout mode: enter board cards, show equity changes for each possible turn/river
- [ ] Uses existing WASM equity engine from `lib/wasm-equity/`
- [ ] Mobile-responsive layout
- [ ] Page title and description follow existing page patterns

---

### SI-XX: Build Effective Stack and SPR Calculator
**Type**: Story
**Priority**: P3 (Medium)
**Effort**: S (2-3d)
**Dependencies**: SI-XX (utilities sidebar)
**Summary**: Create a new utility page at `/utilities/spr` that calculates effective stack sizes and stack-to-pot ratio with strategic guidance based on SPR thresholds.
**Acceptance Criteria**:
- [ ] Input fields: player 1 stack, player 2 stack, pot size
- [ ] Output: effective stack (minimum of the two stacks)
- [ ] Output: SPR = effective stack / pot
- [ ] Strategic guidance based on SPR thresholds (<3, 3-6, 7-13, 13+)
- [ ] Visual indicator (color-coded bar or badge) showing SPR zone
- [ ] Quick-preset buttons for common stack/pot scenarios
- [ ] Mobile-responsive layout

---

### SI-XX: Build Range Builder with strategy presets
**Type**: Story
**Priority**: P3 (Medium)
**Effort**: L (8d)
**Dependencies**: SI-XX (utilities sidebar)
**Summary**: Create a visual 13x13 range grid at `/utilities/range-builder` with click/drag selection, strategy presets by position, and range vs. range equity calculation using the WASM engine.
**Acceptance Criteria**:
- [ ] 13x13 grid displays all hand combinations (AA top-left to 22 bottom-right)
- [ ] Click individual cells or click-drag to select ranges
- [ ] Color-coded cells: suited (one color), offsuit (another), pairs (third)
- [ ] Preset dropdown: UTG open, CO open, BTN open, BB defend, common 3-bet ranges
- [ ] Range percentage display (e.g., "Top 15% of hands")
- [ ] Range vs. range equity calculation using WASM engine
- [ ] Heatmap overlay showing equity of each combo against an opponent range
- [ ] Mobile: scrollable grid with pinch-zoom support

---

### Phase 4 Stories

---

### SI-XX: Add card animations (deal, flip, winner glow)
**Type**: Story
**Priority**: P4 (Low)
**Effort**: S (2-3d)
**Dependencies**: SI-XX (card sizing story, for updated card components)
**Summary**: Add CSS animations for card dealing, flipping, and winner highlighting. All animations respect `prefers-reduced-motion`.
**Acceptance Criteria**:
- [ ] Card deal animation (translateY + rotate, 300ms) plays when a card is placed
- [ ] Card flip animation (rotateY, 400ms) plays on hole card reveal in replayer
- [ ] Winner glow uses `animate-pulse` on the winning player component
- [ ] Card hover lifts with `hover:-translate-y-1`
- [ ] All animations wrapped in `motion-safe:` prefix
- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] Keyframes defined in `web/src/index.css` or Tailwind config

---

### SI-XX: Apply poker table theming (felt, rail, pot-gold accents)
**Type**: Task
**Priority**: P4 (Low)
**Effort**: XS (1d)
**Dependencies**: SI-XX (card sizing story)
**Summary**: Apply visual poker theming to the table component: subtle green felt background, warm brown rail border, and pot-gold accent colors for active/winner states.
**Acceptance Criteria**:
- [ ] Inner table ellipse in `PokerTable.tsx` uses `bg-emerald-950/20` felt background
- [ ] Outer table ellipse uses `border-amber-900/30` rail border
- [ ] Winner/pot indicators use `text-amber-400` accent
- [ ] Theming looks natural in both light and dark modes
- [ ] No significant visual regression on existing component states

---

### SI-XX: Add keyboard shortcuts for navigation and common actions
**Type**: Story
**Priority**: P4 (Low)
**Effort**: S (2-3d)
**Dependencies**: SI-XX (collapsible sidebar)
**Summary**: Implement global keyboard shortcuts: `Ctrl+B`/`Cmd+B` for sidebar toggle, `Cmd+1` through `Cmd+4` for direct navigation to main pages, `Escape` to close modals/sheets.
**Acceptance Criteria**:
- [ ] `Ctrl+B` / `Cmd+B` toggles sidebar
- [ ] `Cmd+1` navigates to Equity Calculator
- [ ] `Cmd+2` navigates to Record Hand
- [ ] `Cmd+3` navigates to Hand Library
- [ ] `Cmd+4` navigates to Hand Replayer (if a hand is loaded)
- [ ] `Escape` closes any open Sheet, Dialog, or CardPickerModal
- [ ] Shortcuts do not fire when focus is in a text input or textarea
- [ ] Keyboard shortcut hints shown as tooltips on sidebar nav items

---

### SI-XX: Conduct ARIA audit and fix focus management
**Type**: Story
**Priority**: P4 (Low)
**Effort**: S (2-3d)
**Dependencies**: SI-XX (wizard navigation), SI-XX (collapsible sidebar)
**Summary**: Audit all interactive components for ARIA compliance, fix focus trapping in modals and sheets, ensure logical tab order in wizard steps, and verify screen reader announcements for dynamic content.
**Acceptance Criteria**:
- [ ] All interactive elements have appropriate ARIA labels
- [ ] Focus trapped correctly in CardPickerModal, Dialog, and Sheet components
- [ ] Wizard tab navigation follows logical tab order
- [ ] Dynamic content changes (equity results, toast messages) announced via `aria-live`
- [ ] Color is not the sole indicator of state (icons/text supplement color differences)
- [ ] Minimum 44px touch targets on all interactive elements (mobile)
- [ ] Audit report documenting all fixes attached to Jira ticket

---

## 8. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **Hand Recorder wizard breaks draft migration**: Converting from single-page to tabbed wizard may corrupt existing drafts stored in idb-keyval | Medium | High | Write a migration function that maps old draft shape to new wizard-step-aware shape. Add version field to draft schema. Test migration with real draft data before merging. |
| R2 | **Commentator narration flow UX uncertainty**: The context-aware action buttons may confuse users accustomed to explicit dropdowns | Medium | High | Gate implementation behind UX spike (SI-XX). Validate with real users before building. Keep "All-in-One" mode as fallback. |
| R3 | **Client-side filter performance**: Filtering 500+ hands client-side on every keystroke may cause jank on lower-end devices | Low | Medium | Debounce filter inputs (300ms). Profile with 500 hands in development. If performance is unacceptable, implement virtual scrolling or move to server-side filtering. |
| R4 | **Card sizing breaks table layout**: Larger card sizes may cause player components to overlap at certain viewport widths | Medium | Medium | Test at all breakpoints (320px to 2560px). Add `overflow-hidden` safety on player containers. Use CSS `clamp()` for fluid sizing if discrete breakpoints prove insufficient. |
| R5 | **Scope creep from utilities**: Once utility infrastructure exists, pressure to add more utilities may delay polish work | Medium | Low | Enforce the "ship 2, measure, decide" rule. Utility 3+ require metrics showing >20% weekly active usage of Utilities 1-2 before approval. |
| R6 | **WASM engine compatibility with new utilities**: Range builder and pot odds calculator need WASM equity engine calls that may not match current API surface | Low | Medium | Audit `lib/wasm-equity/` API surface during utility design. If new entry points needed, create a separate story for WASM API extensions. |
| R7 | **4-color deck breaks existing card styling**: Overriding suit colors dynamically may conflict with the `style={{ color: suitData.color }}` inline pattern used in `Player.tsx` and `BoardCards.tsx` | Low | Low | The existing inline style pattern naturally supports dynamic colors; just swap the `SUIT_MAP` values based on the setting. Test all card display contexts. |

---

## 9. Success Metrics

### 9.1 Quantitative Metrics

| Metric | Current Baseline | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|-----------------|----------------|----------------|----------------|
| Equity calculations per user session | Unmeasured | Instrument + baseline | +15% increase | Maintain |
| Hand recording completion rate | Unmeasured | Instrument + baseline | +25% increase | Maintain |
| Hand recorder time-to-save (median) | Unmeasured | Instrument + baseline | -20% reduction | Maintain |
| Hand Library filter usage | N/A | N/A | >30% of library visits use filters | Maintain |
| Utility page visits per week | N/A | N/A | N/A | >50 visits/week within 4 weeks of launch |
| WCAG AA contrast violations | ~4 (suit colors) | 0 | 0 | 0 |

### 9.2 Qualitative Metrics

- **User feedback**: Collect structured feedback via in-app survey after Phase 1 and Phase 2 launches
- **Abandon rate**: Track how many users start recording a hand but navigate away before saving (instrument in `useHandRecorderStore`)
- **Feature discovery**: Track first-time usage of new features (sidebar collapse, grid view, filter bar, utilities)

### 9.3 Instrumentation Plan

Add lightweight analytics events (compatible with existing Clerk user identity) for:

- `sidebar_toggled` (collapsed/expanded)
- `equity_calculated` (player count, board card count)
- `hand_recording_started` / `hand_recording_completed` / `hand_recording_abandoned`
- `hand_library_filtered` (which filters used)
- `hand_library_view_changed` (list/grid)
- `utility_opened` (which utility)
- `wizard_step_changed` (which step, direction)

---

## 10. Appendix: Competitive Landscape

### 10.1 Competitive Matrix

| Feature | ShipInspector (Current) | PokerTracker 4 | Hold'em Manager 3 | Equilab | GTO Wizard | PioSolver |
|---------|------------------------|----------------|-------------------|---------|------------|-----------|
| Equity Calculator | Yes (WASM) | Yes | Yes | Yes (free) | Yes | Yes |
| Hand Recording | Manual form | Auto-import | Auto-import | No | No | No |
| Hand Replayer | Yes | Yes | Yes | No | Yes | Yes |
| Range Builder | No | Yes | Yes | Yes (paint/drag) | Yes (heatmap) | Yes |
| Session Tracking | No | Yes | Yes | No | No | No |
| HUD / Real-time | No | Yes (customizable) | Yes (colored rings) | No | No | No |
| Mobile Responsive | Partial | No (desktop) | No (desktop) | No (desktop) | Yes | No (desktop) |
| Collaborative | No | No | No | No | Yes (shared) | No |
| Price | Free | $99 | $99 | Free | $49/mo | $249 |

### 10.2 Key Competitive Insights

**PokerTracker 4**: Excels at progressive disclosure. Complex features are available but not visible by default. ShipInspector should adopt this pattern for the hand recorder (wizard with progressive steps) and utilities (expandable sidebar section).

**Hold'em Manager 3**: Visual simplicity is its differentiator. Colored rings around player stats make information scannable at a glance. ShipInspector should adopt this principle for equity display (colored progress bars already exist, but can be enhanced with position-aware coloring).

**Equilab**: Best-in-class for beginners. Paint-and-drag range selection is intuitive. ShipInspector's future Range Builder should aim for similar interaction patterns rather than the more complex PioSolver approach.

**GTO Wizard**: Sets the standard for speed and mobile responsiveness. Heatmap visualizations for range analysis are immediately readable. ShipInspector should target similar mobile experience and consider heatmaps for the Range Builder utility.

**PioSolver**: Powerful but steep learning curve. ShipInspector should not compete on solver complexity; instead, focus on the "casual to intermediate" user segment (Casual Cal through Grinder Grace) where accessibility and speed matter more than raw analytical power.

### 10.3 ShipInspector's Positioning

ShipInspector occupies a unique position as a free, mobile-responsive, web-based poker tool combining equity calculation with hand recording and replay. The competitive advantage lies in:

1. **Web-native**: No desktop installation required (vs. PT4, HM3, PioSolver)
2. **Free tier**: No subscription or upfront cost (vs. GTO Wizard, PT4, HM3)
3. **Manual hand entry**: Serves live players who cannot auto-import (underserved by PT4/HM3)
4. **Mobile-first potential**: Only GTO Wizard currently offers a strong mobile experience

The UX redesign should amplify these advantages by making the mobile experience exceptional, reducing friction in manual hand entry, and building a utility toolkit that rivals desktop tools without their complexity.

---

*End of document. This proposal is intended for internal team review. All story numbers (SI-XX) are placeholders to be assigned when the Jira epic is created.*
