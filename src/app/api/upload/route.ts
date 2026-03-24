import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuid } from 'uuid'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const ticketId = formData.get('ticketId') as string | null
    const communicationId = formData.get('communicationId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin'
    const fileName = `${uuid()}.${ext}`
    const filePath = `/uploads/${fileName}`
    const fullPath = join(process.cwd(), 'public', 'uploads', fileName)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    await writeFile(fullPath, Buffer.from(bytes))

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        ticketId: ticketId || null,
        communicationId: communicationId || null,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath,
        uploadedBy: 'admin',
      },
    })

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
