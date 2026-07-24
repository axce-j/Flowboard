# Migrations

`InitialSchema` was generated from the entities in this scaffold and has
been verified end-to-end against a real local Postgres instance (tables,
FKs, enums, and both partial unique indexes on `topics` all apply cleanly —
see TECH_SPEC §2.1).

Regenerate after further entity changes in Phase 1-3:

    npm run migration:generate -- src/migrations/SomeDescriptiveName

`synchronize` is `false` everywhere (see app.module.ts) — this folder is the
only way schema changes reach any environment. The one-time v1 data backfill
(`src/scripts/migrate-v1-data.ts`) is deliberately NOT a file in this folder
— see TECH_SPEC §9.
