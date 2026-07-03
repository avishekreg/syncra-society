// Placeholder upload util. For Supabase storage use REST or SDK.
export async function uploadDocument(file: File): Promise<string> {
  // Implement real upload to Supabase storage or external CDN
  // Return a public URL
  return Promise.resolve(URL.createObjectURL(file))
}
