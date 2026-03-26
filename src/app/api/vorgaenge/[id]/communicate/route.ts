import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth/get-user'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (!body.message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const vorgang = await prisma.vorgang.findUnique({
    where: { id },
    select: { tenantId: true, ownerId: true },
  })
  if (!vorgang) return NextResponse.json({ error: 'Vorgang not found' }, { status: 404 })

  const communication = await prisma.communication.create({
    data: {
      vorgangId: id,
      tenantId: vorgang.tenantId,
      ownerId: vorgang.ownerId,
      channel: 'general',
      type: body.isInternal ? 'note' : 'chat',
      message: body.message,
      direction: user.role === 'tenant' ? 'inbound' : 'outbound',
      senderRole: user.role,
      senderName: `${user.firstName} ${user.lastName}`,
      isRead: false,
    },
    include: { attachments: true },
  })

  return NextResponse.json(communication, { status: 201 })
}
