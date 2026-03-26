import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth/get-user'

const USER_CREATABLE_TYPES = ['termin', 'gespraechsvermerk', 'angebotsanfrage', 'auftrag']

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (!body.type || !body.title) {
    return NextResponse.json({ error: 'type and title are required' }, { status: 400 })
  }

  if (!USER_CREATABLE_TYPES.includes(body.type)) {
    return NextResponse.json({ error: `Invalid type. Allowed: ${USER_CREATABLE_TYPES.join(', ')}` }, { status: 400 })
  }

  const vorgang = await prisma.vorgang.findUnique({ where: { id } })
  if (!vorgang) return NextResponse.json({ error: 'Vorgang not found' }, { status: 404 })

  const activity = await prisma.vorgangActivity.create({
    data: {
      vorgangId: id,
      type: body.type,
      title: body.title,
      description: body.description || null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      createdByUserId: user.id,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(activity, { status: 201 })
}
