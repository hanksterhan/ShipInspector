# Hand Replayer Database Layer

This module provides the database layer for storing and retrieving poker hands for replay functionality.

## Setup

1. **Run migrations**: Execute the SQL migrations in `server/migrations/`:
   ```bash
   # Option 1: Using the script
   ./migrations/run-migrations.sh
   
   # Option 2: Using psql directly
   psql $DATABASE_URL -f migrations/001_create_hand_replayer_schema.sql
   psql $DATABASE_URL -f migrations/002_seed_action_tags.sql
   ```

2. **Environment**: Ensure `DATABASE_URL` is set in your environment.

## API

### `createHand(params)`
Creates a new hand record.

```typescript
const handId = await createHand({
    userId: "user-uuid",
    tableSize: 6,
    maxPlayers: 6,
    smallBlind: 25,
    bigBlind: 50,
    ante: 0,
    currency: "chips",
    buttonSeat: 1,
    boardCards: [],
    meta: {}
});
```

### `addHandPlayer(params)`
Adds a player to a hand.

```typescript
const playerId = await addHandPlayer({
    handId: "hand-uuid",
    seat: 1,
    playerLabel: "Hero",
    startingStack: 10000,
    holeCards: ["As", "Kh"],
    isHero: true
});
```

### `appendAction(params)`
Appends an action to the hand's timeline. Automatically assigns the next `action_index`.

```typescript
const actionId = await appendAction({
    handId: "hand-uuid",
    street: "PREFLOP",
    type: "RAISE",
    actorPlayerId: "player-uuid",
    amount: 150,
    raiseTo: 200,
    decisionMs: 2500
});
```

### `setActionTags(actionId, tagKeys)`
Sets tags on an action (replaces existing tags).

```typescript
await setActionTags(actionId, ["tanked", "all_in"]);
```

### `getHandForPlayback(handId)`
Fetches a complete hand with all players and actions ordered for playback.

```typescript
const playback = await getHandForPlayback("hand-uuid");
// Returns: { hand: {...}, players: [...], actions: [...] }
```

### `getActionTags()`
Returns all available action tags.

```typescript
const tags = await getActionTags();
```

## Schema

- **hands**: Main hand metadata
- **hand_players**: Players in each hand (unique per seat)
- **hand_actions**: Ordered timeline of actions (monotonic action_index)
- **action_tags**: Available tags
- **hand_action_tag_map**: Many-to-many action-to-tag mapping

## Constraints

- Unique `(hand_id, seat)` per hand
- Unique `(hand_id, action_index)` per hand
- Action indexes are assigned automatically and monotonically
- Tags must exist in `action_tags` before use

## Example

See `example.ts` for a complete usage example.

## Testing

Tests are in `handReplayDb.spec.ts`. They require `DATABASE_URL` to be set and migrations to be run.

```bash
npm test -- handReplayDb.spec.ts
```

