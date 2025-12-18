'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface MobileContextType {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
}

const MobileContext = createContext<MobileContextType | undefined>(undefined)

export function MobileProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <MobileContext.Provider
      value={{
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
      }}
    >
      {children}
    </MobileContext.Provider>
  )
}

export function useMobile() {
  const context = useContext(MobileContext)
  if (!context) {
    throw new Error('useMobile must be used within a MobileProvider')
  }
  return context
}
