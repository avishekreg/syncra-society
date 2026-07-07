import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { NavLink, type NavLinkProps } from 'react-router-dom'

type NavAccordionContextValue = {
  openGroupId: string | null
  toggleGroup: (groupId: string) => void
  openGroup: (groupId: string) => void
  closeAllGroups: () => void
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

  const closeAllGroups = useCallback(() => {
    setOpenGroupId(null)
  }, [])

  const value = useMemo(
    () => ({ openGroupId, toggleGroup, openGroup, closeAllGroups }),
    [openGroupId, toggleGroup, openGroup, closeAllGroups]
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

/** Top-level flat nav links — closes every open dropdown before navigating. */
export function AccordionNavLink({ onClick, ...props }: NavLinkProps) {
  const { closeAllGroups } = useNavAccordion()

  return (
    <NavLink
      preventScrollReset
      {...props}
      onClick={(event) => {
        closeAllGroups()
        onClick?.(event)
      }}
    />
  )
}
