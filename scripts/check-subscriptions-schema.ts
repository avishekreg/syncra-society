import 'dotenv/config'

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const baseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '')

async function checkTable(table: string) {
  const res = await fetch(`${baseUrl}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  })
  const body = await res.text()
  return { table, status: res.status, body: body.slice(0, 300) }
}

async function main() {
  if (!baseUrl || !serviceKey) {
    console.log('Missing SUPABASE_SERVICE_ROLE_KEY or Supabase URL in .env')
    process.exit(1)
  }

  for (const table of ['society_subscriptions', 'payment_webhook_events']) {
    const result = await checkTable(table)
    console.log(`${result.table}: HTTP ${result.status}`)
    if (result.status !== 200) console.log(`  ${result.body}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
