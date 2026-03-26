import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'automiq-dev-secret-change-in-production'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenantProfile: {
          include: {
            contracts: {
              where: { status: 'active' },
              include: { unit: { include: { property: true } } },
              take: 1,
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Konto ist nicht aktiviert' }, { status: 403 })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Create session
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.session.create({
      data: { userId: user.id, token, expiresAt },
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Build response with user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      tenant: user.tenantProfile ? {
        id: user.tenantProfile.id,
        property: user.tenantProfile.contracts[0]?.unit.property.name || null,
        unit: user.tenantProfile.contracts[0]?.unit.designation || null,
      } : null,
    }

    const response = NextResponse.json({ success: true, user: userData })

    // Set httpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
