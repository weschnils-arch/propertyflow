export type TrafficLightColor = 'green' | 'yellow' | 'red'

export function getTrafficLight(createdAt: Date, status: string): TrafficLightColor | null {
  if (status === 'closed') return null

  const hoursOpen = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)

  if (hoursOpen <= 24) return 'green'
  if (hoursOpen <= 48) return 'yellow'
  return 'red'
}

export function getTrafficLightLabel(color: TrafficLightColor | null): string {
  switch (color) {
    case 'green': return 'Neu (< 24h)'
    case 'yellow': return 'Offen (> 24h)'
    case 'red': return 'Überfällig (> 48h)'
    case null: return 'Geschlossen'
  }
}
