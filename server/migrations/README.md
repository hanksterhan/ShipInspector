# Hand Replayer Database Migrations

This directory contains SQL migrations for the hand replayer feature.

## Running Migrations

### Using Neon Console
1. Connect to your Neon database via the Neon Console
2. Open the SQL Editor
3. Run each migration file in order (001, then 002)

### Using psql
```bash
psql $DATABASE_URL -f migrations/001_create_hand_replayer_schema.sql
psql $DATABASE_URL -f migrations/002_seed_action_tags.sql
```

### Using a Migration Tool
If you prefer using a migration tool like `node-pg-migrate` or `db-migrate`, you can adapt these SQL files to work with your preferred tool.

## Migration Files

- `001_create_hand_replayer_schema.sql` - Creates enums, tables, indexes, and constraints
- `002_seed_action_tags.sql` - Seeds baseline action tags

## Schema Overview

The schema includes:
- **hands**: Main hand metadata
- **hand_players**: Players in each hand
- **hand_actions**: Ordered timeline of actions
- **action_tags**: Available tags for actions
- **hand_action_tag_map**: Many-to-many mapping of actions to tags

See the TypeScript module `src/integrations/handReplay/handReplayDb.ts` for the API.

