import { prisma } from '@/lib/db'

interface AssignmentResult {
  userId: string | null
  roleId: string | null
}

export async function autoAssignVorgang(
  categoryId: string,
  propertyId: string,
  unitId: string | null,
  mandantId: string
): Promise<AssignmentResult> {
  const category = await prisma.vorgangCategory.findUnique({
    where: { id: categoryId },
    select: { defaultRoleId: true },
  })

  if (!category?.defaultRoleId) {
    return { userId: null, roleId: null }
  }

  const roleId = category.defaultRoleId
  let assignments: { userId: string }[] = []

  // Unit level
  if (unitId) {
    assignments = await prisma.roleAssignment.findMany({
      where: { roleId, unitId, isActive: true },
      select: { userId: true },
    })
  }

  // Property level
  if (assignments.length === 0) {
    assignments = await prisma.roleAssignment.findMany({
      where: { roleId, propertyId, unitId: null, scope: 'property', isActive: true },
      select: { userId: true },
    })
  }

  // Mandant level
  if (assignments.length === 0) {
    assignments = await prisma.roleAssignment.findMany({
      where: { roleId, mandantId, scope: 'mandant', isActive: true },
      select: { userId: true },
    })
  }

  if (assignments.length === 0) {
    return { userId: null, roleId }
  }

  if (assignments.length === 1) {
    return { userId: assignments[0].userId, roleId }
  }

  // Load balance: pick user with fewest open Vorgänge
  const userIds = assignments.map(a => a.userId)
  const counts = await prisma.vorgang.groupBy({
    by: ['assignedToUserId'],
    where: {
      assignedToUserId: { in: userIds },
      status: { not: 'closed' },
    },
    _count: { id: true },
  })

  const countMap = new Map(counts.map(c => [c.assignedToUserId, c._count.id]))

  let bestUserId = userIds[0]
  let bestCount = countMap.get(userIds[0]) ?? 0

  for (const uid of userIds) {
    const count = countMap.get(uid) ?? 0
    if (count < bestCount) {
      bestCount = count
      bestUserId = uid
    }
  }

  return { userId: bestUserId, roleId }
}
