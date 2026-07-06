import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type NavAccordionContextValue = {
  openGroupId: string | null
  toggleGroup: (groupId: string) => void
  openGroup: (groupId: string) => void
}

const NavAccordionContext = createContext<NavAccordionContextValue | null>(null)

export function NavAccordionProvider({ children }: { children: React.ReactNode }) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroupId((current) => (current === groupId ? null : groupId))
  }, [])

  const openGroup = useCallback((groupId: string) => {
    setOpenGroupId(groupId)
  }, [])

  const value = useMemo(
    () => ({ openGroupId, toggleGroup, openGroup }),
    [openGroupId, toggleGroup, openGroup]
  )

  return <NavAccordionContext.Provider value={value}>{children}</NavAccordionContext.Provider>
}

export function useNavAccordion() {
  const context = useContext(NavAccordionContext)
  if (!context) {
    throw new Error('useNavAccordion must be used within NavAccordionProvider')
  }
  return context
}
