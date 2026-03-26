import { prisma } from '@/lib/db'

export type PermissionLevel = 'none' | 'read' | 'full'
export type ModuleName = 'vorgaenge' | 'finanzen' | 'immobilien' | 'mieter' | 'eigentuemer' | 'dokumente' | 'techniker' | 'einstellungen' | 'berichte'

interface ModulePermission {
  level: PermissionLevel
  scope?: 'all' | 'assigned'
}

const MODULES: ModuleName[] = ['vorgaenge', 'finanzen', 'immobilien', 'mieter', 'eigentuemer', 'dokumente', 'techniker', 'einstellungen', 'berichte']

function levelRank(level: PermissionLevel): number {
  switch (level) {
    case 'none': return 0
    case 'read': return 1
    case 'full': return 2
  }
}

export async function getUserPermissions(userId: string): Promise<Record<ModuleName, ModulePermission>> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role === 'admin') {
    const full: Record<string, ModulePermission> = {}
    for (const mod of MODULES) full[mod] = { level: 'full', scope: 'all' }
    return full as Record<ModuleName, ModulePermission>
  }

  const assignments = await prisma.roleAssignment.findMany({
    where: { userId, isActive: true },
    include: { role: true },
  })

  const merged: Record<string, ModulePermission> = {}
  for (const mod of MODULES) merged[mod] = { level: 'none' }

  for (const assignment of assignments) {
    const perms = assignment.role.permissions as unknown as Record<string, ModulePermission>
    for (const mod of MODULES) {
      if (perms[mod]) {
        const current = merged[mod]
        const incoming = perms[mod]
        if (levelRank(incoming.level) > levelRank(current.level)) {
          merged[mod] = { ...incoming }
        }
        if (mod === 'vorgaenge' && incoming.scope === 'all') {
          merged[mod].scope = 'all'
        }
      }
    }
  }

  return merged as Record<ModuleName, ModulePermission>
}

export async function hasAccess(userId: string, module: ModuleName, requiredLevel: PermissionLevel): Promise<boolean> {
  const perms = await getUserPermissions(userId)
  return levelRank(perms[module].level) >= levelRank(requiredLevel)
}

export async function getUserPropertyScope(userId: string): Promise<string[] | 'all'> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role === 'admin') return 'all'

  const assignments = await prisma.roleAssignment.findMany({
    where: { userId, isActive: true },
    select: { scope: true, propertyId: true, unitId: true },
  })

  if (assignments.some(a => a.scope === 'mandant')) return 'all'

  const propertyIds = new Set<string>()
  const unitIds: string[] = []

  for (const a of assignments) {
    if (a.propertyId) propertyIds.add(a.propertyId)
    if (a.unitId) unitIds.push(a.unitId)
  }

  if (unitIds.length > 0) {
    const units = await prisma.unit.findMany({
      where: { id: { in: unitIds } },
      select: { propertyId: true },
    })
    for (const u of units) propertyIds.add(u.propertyId)
  }

  return Array.from(propertyIds)
}
