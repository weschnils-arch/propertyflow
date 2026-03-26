import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'automiq-dev-secret-change-in-production'

// GET — validate token and return invitation info
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      role: { select: { name: true, color: true } },
      property: { select: { name: true } },
      unit: { select: { designation: true } },
    },
  })

  if (!invitation) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (invitation.status === 'accepted') return NextResponse.json({ error: 'Already accepted' }, { status: 400 })
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } })
    return NextResponse.json({ error: 'Token expired' }, { status: 400 })
  }

  return NextResponse.json({
    email: invitation.email,
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    role: invitation.role.name,
    scope: invitation.scopeType,
    property: invitation.property?.name,
    unit: invitation.unit?.designation,
  })
}

// POST — accept invitation and set password
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()
  const { password, firstName, lastName } = body

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const invitation = await prisma.invitation.findUnique({ where: { token } })
  if (!invitation) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (invitation.status === 'accepted') return NextResponse.json({ error: 'Already accepted' }, { status: 400 })
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: 'Token expired' }, { status: 400 })

  // Find the placeholder user
  const user = await prisma.user.findFirst({
    where: { email: invitation.email, isActive: false },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Activate user
  const hashedPassword = await bcrypt.hash(password, 10)
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      firstName: firstName || invitation.firstName || user.firstName,
      lastName: lastName || invitation.lastName || user.lastName,
      isActive: true,
    },
  })

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: 'accepted' },
  })

  // Create JWT and session
  const jwtToken = jwt.sign(
    { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role, firstName: updatedUser.firstName, lastName: updatedUser.lastName },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: { userId: updatedUser.id, token: jwtToken, expiresAt },
  })

  const response = NextResponse.json({
    success: true,
    user: { id: updatedUser.id, email: updatedUser.email, firstName: updatedUser.firstName, lastName: updatedUser.lastName, role: updatedUser.role },
    redirect: updatedUser.role === 'tenant' ? '/tenant-portal' : '/dashboard',
  })

  response.cookies.set('auth-token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
