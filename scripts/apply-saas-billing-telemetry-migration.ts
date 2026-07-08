/**
 * Applies supabase/migrations/20260708_saas_billing_telemetry.sql when DATABASE_URL is set.
 * Usage: DATABASE_URL="postgresql://..." npx tsx scripts/apply-saas-billing-telemetry-migration.ts
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260708_saas_billing_telemetry.sql'
)

async function main() {
  const databaseUrl = resolveDatabaseUrl()
  if (!databaseUrl) {
    console.error(
      'Missing database connection.\n' +
        'Add ONE of the following to .env:\n' +
        '  DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres\n' +
        '  SUPABASE_DB_PASSWORD=[database-password]  (uses project ref from SUPABASE_URL)\n'
    )
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

  await client.connect()
  try {
    await client.query('begin')
    await client.query(sql)
    await client.query('commit')
    console.log('Migration applied successfully.')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    await client.end()
  }

  const verify = await verifySchema(
    new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  )
  console.log(verify.summary)
  if (!verify.ok) process.exit(1)
}

async function verifySchema(client: pg.Client) {
  await client.connect()
  try {
    const tables = await client.query<{ tablename: string }>(
      `select tablename
       from pg_tables
       where schemaname = 'public'
         and tablename in ('subscriptions', 'usage_counters')
       order by tablename`
    )
    const subscriptionColumns = await client.query<{ column_name: string }>(
      `select column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'subscriptions'
       order by ordinal_position`
    )
    const usageColumns = await client.query<{ column_name: string }>(
      `select column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'usage_counters'
       order by ordinal_position`
    )
    const rls = await client.query<{ tablename: string; rowsecurity: boolean }>(
      `select c.relname as tablename, c.relrowsecurity as rowsecurity
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relname in ('subscriptions', 'usage_counters')`
    )

    const tableNames = tables.rows.map((r) => r.tablename)
    const ok =
      tableNames.includes('subscriptions') &&
      tableNames.includes('usage_counters') &&
      subscriptionColumns.rows.length >= 9 &&
      usageColumns.rows.length >= 5 &&
      rls.rows.every((r) => r.rowsecurity)

    return {
      ok,
      summary: [
        'Schema verification:',
        `- tables: ${tableNames.join(', ') || '(none)'}`,
        `- subscriptions columns: ${subscriptionColumns.rows.map((r) => r.column_name).join(', ')}`,
        `- usage_counters columns: ${usageColumns.rows.map((r) => r.column_name).join(', ')}`,
        `- RLS enabled: ${rls.rows.map((r) => `${r.tablename}=${r.rowsecurity}`).join(', ') || '(none)'}`
      ].join('\n')
    }
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})

function resolveDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL

  const password = process.env.SUPABASE_DB_PASSWORD
  const ref = extractProjectRef()
  if (password && ref) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`
  }
  return null
}

function extractProjectRef(): string | null {
  const raw =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    ''
  const match = raw.match(/https?:\/\/([^.]+)\.supabase\.co/)
  return match?.[1] ?? null
}
