'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { deriveKey, loadKey, storeKey, clearKey, decrypt, isEncrypted } from '@/lib/crypto'

interface EncryptionContextType {
  key: CryptoKey | null
  unlock: (password: string, sample?: string) => Promise<'ok' | 'wrong_password' | 'no_sample'>
  lock: () => void
  isUnlocked: boolean
}

const EncryptionContext = createContext<EncryptionContextType>({
  key: null,
  unlock: async () => 'ok',
  lock: () => {},
  isUnlocked: false,
})

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null)

  useEffect(() => {
    loadKey().then(k => { if (k) setKey(k) })
  }, [])

  const unlock = async (password: string, sample?: string) => {
    const k = await deriveKey(password)
    // 既存の暗号化エントリーがあれば復号化して検証
    if (sample && isEncrypted(sample)) {
      try {
        await decrypt(sample, k)
      } catch {
        return 'wrong_password'
      }
    } else if (!sample) {
      // 初回（エントリーなし）は検証なしで受け入れ
    }
    await storeKey(k)
    setKey(k)
    return 'ok'
  }

  const lock = () => {
    clearKey()
    setKey(null)
  }

  return (
    <EncryptionContext.Provider value={{ key, unlock, lock, isUnlocked: key !== null }}>
      {children}
    </EncryptionContext.Provider>
  )
}

export const useEncryption = () => useContext(EncryptionContext)
