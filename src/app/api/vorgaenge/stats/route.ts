import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireMandantId } from '@/lib/auth/get-user'
import { getUserPropertyScope } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId

  const scope = await getUserPropertyScope(user.id)
  const propertyFilter = scope === 'all' ? {} : { propertyId: { in: scope } }

  const baseWhere = { mandantId, ...propertyFilter }
  const overdueThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [totalOpen, overdue, unassigned, closedToday] = await Promise.all([
    prisma.vorgang.count({ where: { ...baseWhere, status: { not: 'closed' } } }),
    prisma.vorgang.count({ where: { ...baseWhere, status: { not: 'closed' }, createdAt: { lt: overdueThreshold } } }),
    prisma.vorgang.count({ where: { ...baseWhere, status: { not: 'closed' }, assignedToUserId: null } }),
    prisma.vorgang.count({ where: { ...baseWhere, closedAt: { gte: todayStart } } }),
  ])

  return NextResponse.json({ totalOpen, overdue, unassigned, closedToday })
}
