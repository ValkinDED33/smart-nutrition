# PostgreSQL Production Discipline

Smart Nutrition applies PostgreSQL schema migrations automatically when the backend starts with
`SMART_NUTRITION_DATABASE_PROVIDER=postgres`.

## Runtime Migrations

- Migrations live in `server/storage/postgres.mjs` as `POSTGRES_SCHEMA_MIGRATIONS`.
- Applied migrations are stored in `schema_migrations` with `id`, `name`, `checksum`, and `applied_at`.
- The current schema version is stored in `smart_nutrition_meta` as `schema_version`.
- Startup migrations run under a PostgreSQL advisory lock, so concurrent deploy instances do not apply DDL at the same time.
- Existing migration SQL must not be edited after deployment. Add a new migration instead.

## Adding A Migration

1. Append a new item to `POSTGRES_SCHEMA_MIGRATIONS` with a monotonic timestamp id.
2. Keep migrations additive whenever possible: add columns, add indexes, backfill, then remove old fields in a later release.
3. Use `CREATE ... IF NOT EXISTS` for idempotent DDL where PostgreSQL supports it.
4. Add or update tests in `server/storage/postgres.test.mjs`.
5. Run `npm test`, `npm run lint`, `npm run build`, and `npm audit --audit-level=moderate`.

## Rollback Strategy

- If a deploy fails before a migration is recorded, the migration transaction rolls back and a fixed release can be redeployed.
- If a deploy succeeds with an additive migration, roll back the application code first. The old code should continue to tolerate extra columns and indexes.
- If a destructive migration ever ships, restore the database from the provider snapshot or backup that was taken before the deploy. Do not manually delete rows from `schema_migrations` unless the database itself was restored to the matching schema state.
- Prefer forward fixes for data corrections: add a new migration or repair script with an audit trail.

## Production Seed

Set `SMART_NUTRITION_SUPER_ADMIN_EMAIL` before launch. The first registered account with that email is promoted to `SUPER_ADMIN`, and existing matching accounts are promoted again on service bootstrap.

## Predeploy Check

Run:

```bash
npm run server:check
```

The check expects PostgreSQL in production and reports the schema version compiled into the backend.
