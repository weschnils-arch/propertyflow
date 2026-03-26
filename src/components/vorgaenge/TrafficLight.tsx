'use client'

interface TrafficLightProps {
  createdAt: string
  status: string
  size?: 'sm' | 'md'
}

function getColor(createdAt: string, status: string): 'green' | 'yellow' | 'red' | null {
  if (status === 'closed') return null
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  if (hours <= 24) return 'green'
  if (hours <= 48) return 'yellow'
  return 'red'
}

const colorMap = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
}

const labelMap = {
  green: 'Neu (< 24h)',
  yellow: 'Offen (> 24h)',
  red: 'Überfällig (> 48h)',
}

export default function TrafficLight({ createdAt, status, size = 'md' }: TrafficLightProps) {
  const color = getColor(createdAt, status)
  if (!color) return null

  const sizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'

  return (
    <span
      className={`inline-block rounded-full ${colorMap[color]} ${sizeClass} shrink-0`}
      title={labelMap[color]}
    />
  )
}
