import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { NavLink, type NavLinkProps, useLocation } from 'react-router-dom'
import { resolveActiveNavGroup } from '../../lib/navGroups'

type NavAccordionContextValue = {
  openGroupId: string | null
  toggleGroup: (groupId: string) => void
  openGroup: (groupId: string) => void
  closeAllGroups: () => void
  /** Blocks path-based auto-expand for one navigation after a flat nav link is used. */
  suppressAutoOpenRef: React.MutableRefObject<boolean>
}

const NavAccordionContext = createContext<NavAccordionContextValue | null>(null)

export function NavAccordionProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [openGroupId, setOpenGroupId] = useState<string | null>(() =>
    resolveActiveNavGroup(location.pathname)
  )
  const suppressAutoOpenRef = useRef(false)
  const lastSyncedPathRef = useRef(location.pathname)

  React.useEffect(() => {
    if (lastSyncedPathRef.current === location.pathname) return
    lastSyncedPathRef.current = location.pathname

    if (suppressAutoOpenRef.current) {
      suppressAutoOpenRef.current = false
      return
    }

    const activeGroup = resolveActiveNavGroup(location.pathname)
    if (activeGroup) {
      setOpenGroupId(activeGroup)
    }
  }, [location.pathname])

  const toggleGroup = useCallback((groupId: string) => {
    suppressAutoOpenRef.current = false
    setOpenGroupId((current) => (current === groupId ? null : groupId))
  }, [])

  const openGroup = useCallback((groupId: string) => {
    suppressAutoOpenRef.current = false
    setOpenGroupId(groupId)
  }, [])

  const closeAllGroups = useCallback(() => {
    suppressAutoOpenRef.current = true
    setOpenGroupId(null)
  }, [])

  const value = useMemo(
    () => ({ openGroupId, toggleGroup, openGroup, closeAllGroups, suppressAutoOpenRef }),
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

/** Top-level flat nav links — preserve accordion state to avoid sidebar scroll jumps. */
export function AccordionNavLink({ onClick, ...props }: NavLinkProps) {
  const { suppressAutoOpenRef } = useNavAccordion()

  return (
    <NavLink
      preventScrollReset
      {...props}
      onClick={(event) => {
        suppressAutoOpenRef.current = true
        onClick?.(event)
      }}
    />
  )
}
