import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (token) {
      await prisma.session.deleteMany({ where: { token } })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
    return response
  } catch {
    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
    return response
  }
}
