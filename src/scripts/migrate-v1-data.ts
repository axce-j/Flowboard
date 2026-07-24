/**
 * One-time v1 -> v2 data backfill.
 *
 * NOT part of the migrations/ chain — never runs on deploy. Run manually,
 * once, against a fresh backup, in a maintenance window. See TECH_SPEC §9
 * for the full approach and the judgment calls this script has to make
 * (name -> User mapping, createdBy = handledBy assumption, synthetic
 * ContentStatusHistory seed rows, etc).
 *
 * STATUS: not implemented. Before writing this, confirm with the project
 * owner whether v1 holds any real data worth preserving at all — if it was
 * disposable demo/test data, skip this file entirely and delete it
 * (PRD §10 open item).
 *
 * Expected shape once implemented:
 *   npx ts-node src/scripts/migrate-v1-data.ts --dry-run
 *   npx ts-node src/scripts/migrate-v1-data.ts --commit
 *
 * Must be idempotent (safe to re-run) and dry-runnable (reports what it
 * *would* do before writing anything).
 */

async function main() {
  throw new Error(
    'migrate-v1-data.ts is a scaffold stub — see TECH_SPEC §9 before implementing.',
  );
}

main();
