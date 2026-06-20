const PBKDF2_ITERATIONS = 200_000
const PRIVATE_SALT = 'diary-na-dvoyikh-v1'
const PRIVATE_KEY_STORAGE = 'diary_private_key'

export async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(PRIVATE_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const ivB64 = btoa(String.fromCharCode(...iv))
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  return `enc:${ivB64}:${ctB64}`
}

export async function decrypt(text: string, key: CryptoKey): Promise<string> {
  if (!isEncrypted(text)) return text
  const parts = text.split(':')
  const iv = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0))
  const ct = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0))
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(plain)
}

export function isEncrypted(text: string | null | undefined): boolean {
  return typeof text === 'string' && text.startsWith('enc:')
}

export async function storeKey(key: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey('raw', key)
  sessionStorage.setItem(PRIVATE_KEY_STORAGE, btoa(String.fromCharCode(...new Uint8Array(raw))))
}

export async function loadKey(): Promise<CryptoKey | null> {
  try {
    const b64 = sessionStorage.getItem(PRIVATE_KEY_STORAGE)
    if (!b64) return null
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  } catch {
    return null
  }
}

export function clearAllKeys(): void {
  // Clear current and any legacy storage keys
  sessionStorage.removeItem(PRIVATE_KEY_STORAGE)
  sessionStorage.removeItem('diary_my_public_key')
  sessionStorage.removeItem('diary_partner_key')
  sessionStorage.removeItem('diary_enc_key')
  sessionStorage.removeItem('diary_partner_user_id')
}
