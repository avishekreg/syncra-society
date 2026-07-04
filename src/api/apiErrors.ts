/** True when Supabase/network errors should fall back to local demo data. */
export function shouldUseLocalFallback(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return /fetch failed|failed to fetch|network|401|403|404|invalid api key|jwt|pgrst|relation|does not exist|not found|timeout|aborted|supabase|unexpected non-json|invalid json|resource not found/i.test(
    message
  )
}
