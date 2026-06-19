'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { deriveKey, loadKey, storeKey, clearAllKeys, decrypt, isEncrypted } from '@/lib/crypto'

interface EncryptionContextType {
  privateKey: CryptoKey | null
  myPublicKey: CryptoKey | null
  partnerPublicKey: CryptoKey | null
  partnerUserId: string | null
  unlockPrivate: (password: string, sample?: string) => Promise<'ok' | 'wrong_password'>
  applyPublicKeys: (myPub: CryptoKey | null, partnerPub: CryptoKey | null, pid: string | null) => void
  lockAll: () => void
}

const EncryptionContext = createContext<EncryptionContextType>({
  privateKey: null,
  myPublicKey: null,
  partnerPublicKey: null,
  partnerUserId: null,
  unlockPrivate: async () => 'ok',
  applyPublicKeys: () => {},
  lockAll: () => {},
})

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null)
  const [myPublicKey, setMyPublicKey] = useState<CryptoKey | null>(null)
  const [partnerPublicKey, setPartnerPublicKey] = useState<CryptoKey | null>(null)
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      loadKey('private'),
      loadKey('public'),
      loadKey('partner'),
    ]).then(([priv, pub, partner]) => {
      if (priv) setPrivateKey(priv)
      if (pub) setMyPublicKey(pub)
      if (partner) setPartnerPublicKey(partner)
    })
    const pid = sessionStorage.getItem('diary_partner_user_id')
    if (pid) setPartnerUserId(pid)
  }, [])

  const loadSlotsWithKey = async (privKey: CryptoKey) => {
    try {
      const res = await fetch('/api/account/slots')
      if (!res.ok) return
      const { myPublicSlot, partnerSlot, partnerUserId: pid } = await res.json()

      if (myPublicSlot && isEncrypted(myPublicSlot)) {
        const pubPassword = await decrypt(myPublicSlot, privKey)
        const pubKey = await deriveKey(pubPassword, 'public')
        await storeKey('public', pubKey)
        setMyPublicKey(pubKey)
      }

      if (partnerSlot && isEncrypted(partnerSlot) && pid) {
        const partnerPassword = await decrypt(partnerSlot, privKey)
        const partnerKey = await deriveKey(partnerPassword, 'public')
        await storeKey('partner', partnerKey)
        setPartnerPublicKey(partnerKey)
        setPartnerUserId(pid)
        sessionStorage.setItem('diary_partner_user_id', pid)
      }
    } catch {
      // slots not yet configured
    }
  }

  const unlockPrivate = async (password: string, sample?: string) => {
    const k = await deriveKey(password, 'private')
    if (sample && isEncrypted(sample)) {
      try {
        await decrypt(sample, k)
      } catch {
        return 'wrong_password'
      }
    }
    await storeKey('private', k)
    setPrivateKey(k)
    await loadSlotsWithKey(k)
    return 'ok'
  }

  const applyPublicKeys = (myPub: CryptoKey | null, partnerPub: CryptoKey | null, pid: string | null) => {
    if (myPub) { setMyPublicKey(myPub) }
    if (partnerPub) { setPartnerPublicKey(partnerPub) }
    if (pid) {
      setPartnerUserId(pid)
      sessionStorage.setItem('diary_partner_user_id', pid)
    }
  }

  const lockAll = () => {
    clearAllKeys()
    sessionStorage.removeItem('diary_partner_user_id')
    setPrivateKey(null)
    setMyPublicKey(null)
    setPartnerPublicKey(null)
    setPartnerUserId(null)
  }

  return (
    <EncryptionContext.Provider value={{
      privateKey, myPublicKey, partnerPublicKey, partnerUserId,
      unlockPrivate, applyPublicKeys, lockAll,
    }}>
      {children}
    </EncryptionContext.Provider>
  )
}

export const useEncryption = () => useContext(EncryptionContext)
