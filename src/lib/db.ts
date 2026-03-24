import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const isVercel = !!process.env.VERCEL
const tmpDbPath = '/tmp/propertyflow.db'

function ensureDatabase() {
  if (!isVercel) return
  if (fs.existsSync(tmpDbPath)) return

  // Copy the bundled seeded DB to /tmp (writable on Vercel)
  const bundledDb = path.join(process.cwd(), 'prisma', 'dev.db')
  if (fs.existsSync(bundledDb)) {
    fs.copyFileSync(bundledDb, tmpDbPath)
  }
}

function getDbUrl() {
  if (isVercel) return `file:${tmpDbPath}`
  return process.env.DATABASE_URL || 'file:./dev.db'
}

ensureDatabase()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: getDbUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
