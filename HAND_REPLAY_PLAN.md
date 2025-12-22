# Poker Hand Replay System - Implementation Plan

## Overview
Build a comprehensive poker hand replay mechanism that allows users to input and replay poker hands with full betting action, positions, cards, and dead cards. The system will support saving and loading hands from the database.

## Architecture Overview

### Data Flow
```
User Input → Frontend Store → API Service → Backend Handler → Database
                ↓                                    ↓
         UI Components ← MobX Store ← API Response ← Database Query
```

## 1. Data Models & Interfaces

### 1.1 Common Interfaces (`common/src/interfaces/replayInterfaces.ts`)

```typescript
// Betting Actions
export type BettingActionType = 
    | "fold" 
    | "check" 
    | "call" 
    | "bet" 
    | "raise" 
    | "all-in";

export interface BettingAction {
    playerIndex: number;
    action: BettingActionType;
    amount?: number; // Required for bet/raise/all-in
    timestamp?: number; // Optional: for replay timing
}

// Street (Preflop, Flop, Turn, River)
export type Street = "preflop" | "flop" | "turn" | "river";

export interface StreetAction {
    street: Street;
    actions: BettingAction[];
    potSize: number; // Pot size at end of street
    boardCards?: Card[]; // Cards revealed on this street (for flop/turn/river)
}

// Player Information
export interface ReplayPlayer {
    index: number; // 0-based player index
    name?: string; // Optional player name
    position: number; // Position at table (0 = button, 1 = small blind, etc.)
    holeCards?: [Card, Card]; // Optional: known hole cards
    stack: number; // Starting stack
    isActive: boolean; // Still in hand
}

// Dead Cards
export interface DeadCard {
    card: Card;
    reason?: string; // Optional: why it's dead (e.g., "mucked", "burned")
}

// Complete Hand Replay
export interface HandReplay {
    id?: string; // Database ID (optional for new hands)
    title?: string; // Optional hand title/description
    date?: number; // Timestamp when hand occurred
    createdAt?: number; // When replay was created
    updatedAt?: number; // When replay was last updated
    
    // Table Configuration
    tableSize: number; // Number of seats (2-10)
    buttonPosition: number; // Button position (0-based)
    smallBlind: number;
    bigBlind: number;
    
    // Players
    players: ReplayPlayer[];
    
    // Streets and Actions
    streets: StreetAction[];
    
    // Cards
    board: Card[]; // Final board cards
    deadCards: DeadCard[]; // Known dead cards
    
    // Results (optional - can be filled in later)
    winners?: number[]; // Player indices who won
    potDistribution?: { playerIndex: number; amount: number }[];
    showdown?: boolean; // Whether hand went to showdown
}
```

### 1.2 API Interfaces (`common/src/interfaces/apiInterfaces.ts` - additions)

```typescript
// Save Hand Replay
export interface SaveHandReplayRequest {
    replay: HandReplay;
}

export interface SaveHandReplayResponse {
    id: string;
    replay: HandReplay;
}

// Load Hand Replay
export interface LoadHandReplayRequest {
    id: string;
}

export interface LoadHandReplayResponse {
    replay: HandReplay;
}

// List Hand Replays
export interface ListHandReplaysRequest {
    limit?: number;
    offset?: number;
    search?: string; // Optional search by title
}

export interface ListHandReplaysResponse {
    replays: HandReplay[];
    total: number;
}

// Delete Hand Replay
export interface DeleteHandReplayRequest {
    id: string;
}

export interface DeleteHandReplayResponse {
    success: boolean;
}
```

## 2. Database Schema

### 2.1 Table: `hand_replays`

```sql
CREATE TABLE IF NOT EXISTS hand_replays (
    id TEXT PRIMARY KEY, -- UUID
    title TEXT,
    date INTEGER, -- Timestamp when hand occurred
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- Table Configuration
    table_size INTEGER NOT NULL,
    button_position INTEGER NOT NULL,
    small_blind REAL NOT NULL,
    big_blind REAL NOT NULL,
    
    -- Hand Data (stored as JSON)
    players TEXT NOT NULL, -- JSON array of ReplayPlayer
    streets TEXT NOT NULL, -- JSON array of StreetAction
    board TEXT NOT NULL, -- JSON array of Card
    dead_cards TEXT NOT NULL, -- JSON array of DeadCard
    winners TEXT, -- JSON array of player indices
    pot_distribution TEXT, -- JSON array of {playerIndex, amount}
    showdown INTEGER, -- Boolean (0 or 1)
    
    -- Metadata
    metadata TEXT -- JSON for future extensibility
);

CREATE INDEX IF NOT EXISTS idx_hand_replays_created_at 
    ON hand_replays(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hand_replays_date 
    ON hand_replays(date DESC);

CREATE INDEX IF NOT EXISTS idx_hand_replays_title 
    ON hand_replays(title);
```

## 3. Backend Implementation

### 3.1 Handler (`server/src/handlers/replayHandler.ts`)

**Responsibilities:**
- Validate hand replay data
- Save/load/delete/list hand replays
- Handle database operations

**Methods:**
- `saveHandReplay(req, res)` - POST /poker/replay/save
- `loadHandReplay(req, res)` - GET /poker/replay/:id
- `listHandReplays(req, res)` - GET /poker/replay/list
- `deleteHandReplay(req, res)` - DELETE /poker/replay/:id
- `updateHandReplay(req, res)` - PUT /poker/replay/:id

### 3.2 Router (`server/src/routes/replayRouter.ts`)

- Define all replay endpoints
- Add Swagger documentation
- Wire up handlers

### 3.3 Database Operations (`server/src/integrations/replay/`)

- `replayRepository.ts` - Database access layer
  - `saveReplay(replay: HandReplay): Promise<string>`
  - `loadReplay(id: string): Promise<HandReplay | null>`
  - `listReplays(options): Promise<{replays: HandReplay[], total: number}>`
  - `deleteReplay(id: string): Promise<boolean>`
  - `updateReplay(id: string, replay: HandReplay): Promise<boolean>`

## 4. Frontend Implementation

### 4.1 Store (`web/src/stores/ReplayStore/replayStore.ts`)

**State:**
- `currentReplay: HandReplay | null` - Currently editing/playing replay
- `savedReplays: HandReplay[]` - List of saved replays
- `isLoading: boolean` - Loading state
- `error: string | null` - Error state
- `activeStreet: Street` - Current street being edited
- `selectedPlayerIndex: number | null` - Currently selected player

**Actions:**
- `createNewReplay(tableSize, smallBlind, bigBlind)` - Initialize new replay
- `setButtonPosition(position)` - Set button position
- `addPlayer(player)` - Add player to replay
- `updatePlayer(playerIndex, updates)` - Update player info
- `setPlayerHoleCards(playerIndex, cards)` - Set known hole cards
- `addStreetAction(street, action)` - Add betting action
- `setBoardCards(cards)` - Set board cards
- `addDeadCard(card, reason?)` - Add dead card
- `saveReplay()` - Save to database
- `loadReplay(id)` - Load from database
- `deleteReplay(id)` - Delete from database
- `listReplays()` - Load list of saved replays
- `resetReplay()` - Clear current replay

### 4.2 Service (`web/src/services/replayService.ts`)

**Methods:**
- `saveReplay(replay: HandReplay): Promise<SaveHandReplayResponse>`
- `loadReplay(id: string): Promise<LoadHandReplayResponse>`
- `listReplays(options?): Promise<ListHandReplaysResponse>`
- `deleteReplay(id: string): Promise<DeleteHandReplayResponse>`
- `updateReplay(id: string, replay: HandReplay): Promise<SaveHandReplayResponse>`

### 4.3 Components

#### 4.3.1 Main Page Component (`web/src/pages/PokerHands/PokerHands.ts`)
- Main container for replay interface
- Orchestrates all sub-components
- Handles save/load operations

#### 4.3.2 ReplayConfiguration (`web/src/components/ReplayConfiguration/`)
- Table setup (table size, blinds, button position)
- Player management (add/remove players, set positions)
- Initial stack sizes

#### 4.3.3 StreetViewer (`web/src/components/StreetViewer/`)
- Display current street (preflop/flop/turn/river)
- Show board cards for current street
- Visual representation of betting action
- Pot size display

#### 4.3.4 BettingActionInput (`web/src/components/BettingActionInput/`)
- Input betting actions for current street
- Select player, action type, amount
- Validate actions (e.g., can't check if there's a bet)

#### 4.3.5 PlayerCardsInput (`web/src/components/PlayerCardsInput/`)
- Input known hole cards for players
- Mark cards as unknown
- Visual card display

#### 4.3.6 DeadCardsInput (`web/src/components/DeadCardsInput/`)
- Input dead cards
- Optional reason for dead card
- Visual display of dead cards

#### 4.3.7 ReplayTimeline (`web/src/components/ReplayTimeline/`)
- Timeline view of all streets
- Navigate between streets
- Visual flow of hand

#### 4.3.8 ReplayList (`web/src/components/ReplayList/`)
- List of saved replays
- Search/filter functionality
- Load/delete actions
- Preview hand details

#### 4.3.9 ReplaySummary (`web/src/components/ReplaySummary/`)
- Summary of hand (final pot, winners, etc.)
- Showdown information
- Pot distribution

## 5. Implementation Phases

### Phase 1: Foundation (Core Data Structures)
1. ✅ Create `replayInterfaces.ts` in common
2. ✅ Add API interfaces to `apiInterfaces.ts`
3. ✅ Create database schema
4. ✅ Create database repository

### Phase 2: Backend API
1. ✅ Create `replayHandler.ts`
2. ✅ Create `replayRouter.ts`
3. ✅ Wire up routes in main router
4. ✅ Test API endpoints

### Phase 3: Frontend Store & Service
1. ✅ Create `replayService.ts`
2. ✅ Create `ReplayStore`
3. ✅ Wire up MobX observables and actions

### Phase 4: Basic UI Components
1. ✅ Create `ReplayConfiguration` component
2. ✅ Create `StreetViewer` component
3. ✅ Create `BettingActionInput` component
4. ✅ Update `PokerHands` page to use new components

### Phase 5: Advanced Features
1. ✅ Create `PlayerCardsInput` component
2. ✅ Create `DeadCardsInput` component
3. ✅ Create `ReplayTimeline` component
4. ✅ Create `ReplayList` component

### Phase 6: Polish & Integration
1. ✅ Create `ReplaySummary` component
2. ✅ Add validation and error handling
3. ✅ Add loading states
4. ✅ Test full workflow
5. ✅ Add keyboard shortcuts
6. ✅ Improve UX/UI

## 6. Design Principles

### Modularity
- Each component handles a single responsibility
- Clear separation between data (stores), logic (services), and presentation (components)
- Reusable components where possible

### Type Safety
- All interfaces defined in `common` package
- Shared between frontend and backend
- Strict TypeScript typing throughout

### State Management
- MobX for reactive state management
- Store contains all business logic
- Components are mostly presentational

### Validation
- Backend validates all inputs
- Frontend provides immediate feedback
- Clear error messages

### User Experience
- Progressive disclosure (show only what's needed)
- Clear visual feedback
- Intuitive workflow
- Save frequently, auto-save drafts

## 7. File Structure

```
common/src/interfaces/
  ├── replayInterfaces.ts (NEW)
  └── apiInterfaces.ts (UPDATE)

server/src/
  ├── handlers/
  │   └── replayHandler.ts (NEW)
  ├── routes/
  │   └── replayRouter.ts (NEW)
  └── integrations/
      └── replay/
          └── replayRepository.ts (NEW)

web/src/
  ├── stores/
  │   └── ReplayStore/
  │       ├── replayStore.ts (NEW)
  │       └── index.ts (NEW)
  ├── services/
  │   └── replayService.ts (NEW)
  ├── components/
  │   ├── ReplayConfiguration/ (NEW)
  │   ├── StreetViewer/ (NEW)
  │   ├── BettingActionInput/ (NEW)
  │   ├── PlayerCardsInput/ (NEW)
  │   ├── DeadCardsInput/ (NEW)
  │   ├── ReplayTimeline/ (NEW)
  │   ├── ReplayList/ (NEW)
  │   └── ReplaySummary/ (NEW)
  └── pages/
      └── PokerHands/
          └── PokerHands.ts (UPDATE)
```

## 8. Testing Considerations

### Backend
- Unit tests for handlers
- Integration tests for database operations
- API endpoint tests

### Frontend
- Component unit tests
- Store action tests
- Integration tests for full workflow

## 9. Future Enhancements

- Hand history import (from poker sites)
- Hand analysis and statistics
- Export to various formats (JSON, text, etc.)
- Hand sharing/export
- Advanced filtering and search
- Tags and categories for hands
- Hand replay visualization/animation
- Equity calculations integrated with replay
- Hand range analysis based on actions

