import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'automiq-dev-secret-change-in-production'

export async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch {
    return null
  }
}

export function requireMandantId(user: { mandantId: string | null }): string | NextResponse {
  if (!user.mandantId) {
    return NextResponse.json({ error: 'User has no mandant assigned' }, { status: 403 })
  }
  return user.mandantId
}
