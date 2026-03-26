import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth/get-user'
import { sendEmail } from '@/lib/aws/ses'
import crypto from 'crypto'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { role: { select: { name: true } } },
  })

  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invitation.remindersSent >= 3) {
    return NextResponse.json({ error: 'Maximum reminders reached' }, { status: 400 })
  }

  const newToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.invitation.update({
    where: { id },
    data: {
      token: newToken,
      expiresAt,
      status: 'pending',
      remindersSent: { increment: 1 },
    },
  })

  const mandant = await prisma.mandant.findUnique({ where: { id: invitation.mandantId }, select: { name: true } })

  try {
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invitations/accept/${newToken}`
    await sendEmail({
      to: invitation.email,
      subject: `Erinnerung: Einladung zu ${mandant?.name || 'PropertyFlow'}`,
      html: `
        <h2>Hallo ${invitation.firstName || ''},</h2>
        <p>Sie haben noch eine offene Einladung zu ${mandant?.name || 'PropertyFlow'}.</p>
        <p><a href="${acceptUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">Konto einrichten</a></p>
        <p style="color:#888;font-size:12px;">Dieser Link ist 7 Tage gültig.</p>
      `,
    })
  } catch (e) {
    console.error('Failed to resend invitation:', e)
  }

  return NextResponse.json({ success: true })
}
