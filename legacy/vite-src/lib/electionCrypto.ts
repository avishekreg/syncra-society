/** Web Crypto helpers for anonymous, irreversible society elections. */

export type ElectionKeyPair = {
  publicKey: JsonWebKey
  privateKey: JsonWebKey
}

function toBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function generateElectionKeyPair(): Promise<ElectionKeyPair> {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  )
  const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey)
  const privateKey = await crypto.subtle.exportKey('jwk', pair.privateKey)
  return { publicKey, privateKey }
}

export async function encryptVote(publicKeyJwk: JsonWebKey, candidateId: string) {
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
  const encoded = new TextEncoder().encode(candidateId)
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encoded)
  return toBase64(encrypted)
}

export async function decryptVote(privateKeyJwk: JsonWebKey, encryptedBallot: string) {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, fromBase64(encryptedBallot))
  return new TextDecoder().decode(decrypted)
}

/** One-way voter seal — prevents double voting without storing identity on ballot. */
export async function createVoterSeal(electionId: string, societyId: string, flatNumber: string, pepper: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const payload = `${electionId}|${societyId}|${flatNumber.trim().toUpperCase()}`
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return toBase64(signature)
}

export function generateElectionPepper() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return toBase64(bytes.buffer)
}

export function lockPrivateKey(privateKeyJwk: JsonWebKey) {
  return btoa(JSON.stringify(privateKeyJwk))
}

export function unlockPrivateKey(locked: string): JsonWebKey {
  return JSON.parse(atob(locked)) as JsonWebKey
}
