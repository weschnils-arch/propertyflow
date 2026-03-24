import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'automiq-dev-secret-change-in-production'

async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch { return null }
}

// GET — fetch current user profile
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
  })
}

// PUT — update profile (email, name, phone)
export async function PUT(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const body = await req.json()

  // Check if email is taken by someone else
  if (body.email && body.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (existing) return NextResponse.json({ error: 'Diese E-Mail wird bereits verwendet' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: body.email?.toLowerCase() || user.email,
      firstName: body.firstName || user.firstName,
      lastName: body.lastName || user.lastName,
      phone: body.phone ?? user.phone,
    },
  })

  // Update tenant profile email too if tenant
  if (user.role === 'tenant') {
    await prisma.tenant.updateMany({
      where: { userId: user.id },
      data: {
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
      },
    })
  }

  // Update localStorage data
  const userData = {
    id: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    role: updated.role,
  }

  return NextResponse.json({ success: true, user: userData })
}

// PATCH — change password
export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Beide Passwörter sind erforderlich' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Neues Passwort muss mindestens 6 Zeichen haben' }, { status: 400 })
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true })
}
