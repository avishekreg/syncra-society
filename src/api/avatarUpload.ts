import supabase from './supabaseSdk'

const AVATAR_BUCKET = 'avatars'

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? extension : 'jpg'
  const objectPath = `${userId}/${Date.now()}.${safeExt}`

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(objectPath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || `image/${safeExt}`
  })

  if (uploadError) {
    throw new Error(uploadError.message || 'Avatar upload failed.')
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath)
  if (!data.publicUrl) {
    throw new Error('Unable to resolve public avatar URL.')
  }

  return data.publicUrl
}
