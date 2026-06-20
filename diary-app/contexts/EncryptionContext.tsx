'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { deriveKey, loadKey, storeKey, clearAllKeys, decrypt, isEncrypted } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/client'

interface EncryptionContextType {
  privateKey: CryptoKey | null
  unlockPrivate: (password: string, sample?: string) => Promise<'ok' | 'wrong_password'>
  lockAll: () => void
}

const EncryptionContext = createContext<EncryptionContextType>({
  privateKey: null,
  unlockPrivate: async () => 'ok',
  lockAll: () => {},
})

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadKeysForUser = async (userId: string) => {
      const storedId = sessionStorage.getItem('diary_current_user_id')
      if (storedId && storedId !== userId) {
        clearAllKeys()
        sessionStorage.removeItem('diary_current_user_id')
        return
      }
      sessionStorage.setItem('diary_current_user_id', userId)
      const priv = await loadKey()
      if (priv) setPrivateKey(priv)
    }

    const clearAllState = () => {
      clearAllKeys()
      sessionStorage.removeItem('diary_current_user_id')
      setPrivateKey(null)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadKeysForUser(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAllState()
      } else if (event === 'SIGNED_IN' && session?.user) {
        const storedId = sessionStorage.getItem('diary_current_user_id')
        if (storedId && storedId !== session.user.id) {
          clearAllState()
        }
        sessionStorage.setItem('diary_current_user_id', session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const unlockPrivate = async (password: string, sample?: string) => {
    const k = await deriveKey(password)
    if (sample && isEncrypted(sample)) {
      try {
        await decrypt(sample, k)
      } catch {
        return 'wrong_password'
      }
    }
    await storeKey(k)
    setPrivateKey(k)
    return 'ok'
  }

  const lockAll = () => {
    clearAllKeys()
    sessionStorage.removeItem('diary_current_user_id')
    setPrivateKey(null)
  }

  return (
    <EncryptionContext.Provider value={{ privateKey, unlockPrivate, lockAll }}>
      {children}
    </EncryptionContext.Provider>
  )
}

export const useEncryption = () => useContext(EncryptionContext)
