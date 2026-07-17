import React from 'react'
import { Pill, type PillVariant } from './Pill'

export type StatusKind = 'live' | 'break' | 'waiting' | 'done' | 'draft' | 'ready' | 'active' | 'completed'

const map: Record<StatusKind, { variant: PillVariant; label: string }> = {
  live: { variant: 'green', label: 'в эфире' },
  break: { variant: 'cyan', label: 'кофе-брейк' },
  waiting: { variant: 'cyan', label: 'ожидает' },
  done: { variant: 'outline', label: 'выступил' },
  draft: { variant: 'outline', label: 'Черновик' },
  ready: { variant: 'cyan', label: 'Готово' },
  active: { variant: 'green', label: 'Активно' },
  completed: { variant: 'outline', label: 'Завершено' },
}

export interface StatusBadgeProps {
  status: StatusKind
  label?: string
}

export const StatusBadge = ({ status, label }: StatusBadgeProps): React.ReactElement => {
  const cfg = map[status] || map.draft
  return (
    <Pill variant={cfg.variant} dot={status === 'live' || status === 'active'}>
      {label ?? cfg.label}
    </Pill>
  )
}
