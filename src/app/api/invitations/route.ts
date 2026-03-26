import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireMandantId } from '@/lib/auth/get-user'
import { hasAccess } from '@/lib/auth/permissions'
import { sendEmail } from '@/lib/aws/ses'
import crypto from 'crypto'

export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = { mandantId }
  if (status) where.status = status

  const invitations = await prisma.invitation.findMany({
    where,
    include: {
      role: { select: { id: true, name: true, color: true } },
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, designation: true } },
      invitedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invitations)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mandantId = requireMandantId(user)
  if (mandantId instanceof NextResponse) return mandantId
  if (!await hasAccess(user.id, 'einstellungen', 'full')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { email, firstName, lastName, roleId, scopeType, propertyId, unitId } = body

  if (!email || !roleId || !scopeType) {
    return NextResponse.json({ error: 'email, roleId, and scopeType are required' }, { status: 400 })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Create placeholder user
  const placeholderUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: '', // will be set on acceptance
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'property_manager', // default, will be determined by role
      mandantId,
      isActive: false,
    },
  })

  // Create role assignment
  await prisma.roleAssignment.create({
    data: {
      userId: placeholderUser.id,
      roleId,
      scope: scopeType,
      mandantId,
      propertyId: propertyId || null,
      unitId: unitId || null,
      assignedByUserId: user.id,
    },
  })

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      mandantId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      roleId,
      scopeType,
      propertyId: propertyId || null,
      unitId: unitId || null,
      token,
      invitedByUserId: user.id,
      expiresAt,
    },
    include: {
      role: { select: { name: true } },
    },
  })

  // Get mandant name for email
  const mandant = await prisma.mandant.findUnique({ where: { id: mandantId }, select: { name: true } })

  // Send invitation email
  try {
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invitations/accept/${token}`
    await sendEmail({
      to: email,
      subject: `Einladung zu ${mandant?.name || 'PropertyFlow'}`,
      html: `
        <h2>Hallo ${firstName || ''},</h2>
        <p>Sie wurden von ${user.firstName} ${user.lastName} eingeladen, ${mandant?.name || 'PropertyFlow'} beizutreten.</p>
        <p><strong>Rolle:</strong> ${invitation.role.name}</p>
        <p><a href="${acceptUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">Konto einrichten</a></p>
        <p style="color:#888;font-size:12px;">Dieser Link ist 7 Tage gültig.</p>
      `,
    })
  } catch (e) {
    console.error('Failed to send invitation email:', e)
  }

  return NextResponse.json(invitation, { status: 201 })
}
