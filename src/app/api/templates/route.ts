import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const template = await prisma.messageTemplate.create({
      data: {
        name: body.name,
        category: body.category,
        subject: body.subject || null,
        body: body.body,
        channel: body.channel || 'all',
      },
    })
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const template = await prisma.messageTemplate.update({
      where: { id: body.id },
      data: {
        name: body.name,
        category: body.category,
        subject: body.subject,
        body: body.body,
        channel: body.channel,
        isActive: body.isActive,
      },
    })
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
