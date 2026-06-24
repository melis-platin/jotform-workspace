import type { CSSProperties } from 'react'

export type AppRoleTone = 'admin' | 'user' | 'custom'

export interface AppRoleOption {
  id: string
  label: string
  tone: AppRoleTone
  color: string
}

export const ROLE_COLOR_PALETTE = [
  'var(--app-users-role-color-01)',
  'var(--app-users-role-color-02)',
  'var(--app-users-role-color-03)',
  'var(--app-users-role-color-04)',
  'var(--app-users-role-color-05)',
  'var(--app-users-role-color-06)',
  'var(--app-users-role-color-07)',
  'var(--app-users-role-color-08)',
  'var(--app-users-role-color-09)',
  'var(--app-users-role-color-10)',
  'var(--app-users-role-color-11)',
  'var(--app-users-role-color-12)',
  'var(--app-users-role-color-13)',
  'var(--app-users-role-color-14)',
  'var(--app-users-role-color-15)',
  'var(--app-users-role-color-16)',
  'var(--app-users-role-color-17)',
  'var(--app-users-role-color-18)',
  'var(--app-users-role-color-19)',
  'var(--app-users-role-color-20)',
  'var(--app-users-role-color-21)',
  'var(--app-users-role-color-22)',
  'var(--app-users-role-color-23)',
  'var(--app-users-role-color-24)',
  'var(--app-users-role-color-25)',
  'var(--app-users-role-color-26)',
  'var(--app-users-role-color-27)',
  'var(--app-users-role-color-28)',
  'var(--app-users-role-color-29)',
  'var(--app-users-role-color-30)',
]

export const ROLE_COLORS = {
  admin: ROLE_COLOR_PALETTE[0],
  manager: ROLE_COLOR_PALETTE[17],
  teacher: ROLE_COLOR_PALETTE[2],
  parent: ROLE_COLOR_PALETTE[19],
  userBlue: ROLE_COLOR_PALETTE[17],
  userAmber: ROLE_COLOR_PALETTE[3],
  guestGreen: ROLE_COLOR_PALETTE[18],
  userGreen: ROLE_COLOR_PALETTE[19],
  userPurple: ROLE_COLOR_PALETTE[15],
}

export const DEFAULT_ROLE_OPTIONS: AppRoleOption[] = [
  { id: 'admin', label: 'Admin', tone: 'admin', color: ROLE_COLORS.admin },
  { id: 'manager', label: 'Manager', tone: 'custom', color: ROLE_COLORS.manager },
  { id: 'teacher', label: 'Teacher', tone: 'custom', color: ROLE_COLORS.teacher },
  { id: 'parent', label: 'Parent', tone: 'custom', color: ROLE_COLORS.parent },
  { id: 'user', label: 'User', tone: 'user', color: ROLE_COLORS.userBlue },
  { id: 'guest', label: 'Guest', tone: 'custom', color: ROLE_COLORS.guestGreen },
]

export function getRandomRoleColor(excludedColor?: string) {
  const availableColors = ROLE_COLOR_PALETTE.filter((color) => color !== excludedColor)
  const colorOptions = availableColors.length > 0 ? availableColors : ROLE_COLOR_PALETTE

  return colorOptions[Math.floor(Math.random() * colorOptions.length)] ?? ROLE_COLOR_PALETTE[0]
}

export function getRoleColorStyle(color: string) {
  return { '--app-users-role-color': color } as CSSProperties
}
