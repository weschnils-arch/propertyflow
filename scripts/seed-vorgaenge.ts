/**
 * Seed script for Vorgänge system
 * Run: npx tsx scripts/seed-vorgaenge.ts
 *
 * Seeds system roles (Admin, Mieter) and system categories for all mandants.
 * Also creates RoleAssignments for existing admin users.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SYSTEM_CATEGORIES = [
  { name: 'Reparatur', slug: 'reparatur', icon: 'Wrench', color: '#ef4444', sortOrder: 0 },
  { name: 'Angebotseinholung', slug: 'angebotseinholung', icon: 'FileSearch', color: '#f59e0b', sortOrder: 1 },
  { name: 'Meldung', slug: 'meldung', icon: 'AlertCircle', color: '#3b82f6', sortOrder: 2 },
  { name: 'Rundschreiben', slug: 'rundschreiben', icon: 'Send', color: '#8b5cf6', sortOrder: 3 },
  { name: 'Abrechnung', slug: 'abrechnung', icon: 'Calculator', color: '#10b981', sortOrder: 4 },
  { name: 'Kündigung', slug: 'kuendigung', icon: 'FileX', color: '#dc2626', sortOrder: 5 },
  { name: 'Mietbescheinigung', slug: 'mietbescheinigung', icon: 'FileCheck', color: '#06b6d4', sortOrder: 6 },
  { name: 'Versicherung', slug: 'versicherung', icon: 'Shield', color: '#6366f1', sortOrder: 7 },
  { name: 'Eigentümerversammlung', slug: 'eigentuemerversammlung', icon: 'Users', color: '#d946ef', sortOrder: 8 },
  { name: 'Allgemein', slug: 'allgemein', icon: 'MessageSquare', color: '#64748b', sortOrder: 9 },
]

const ADMIN_PERMISSIONS = {
  vorgaenge: { level: 'full', scope: 'all' },
  finanzen: { level: 'full' },
  immobilien: { level: 'full' },
  mieter: { level: 'full' },
  eigentuemer: { level: 'full' },
  dokumente: { level: 'full' },
  techniker: { level: 'full' },
  einstellungen: { level: 'full' },
  berichte: { level: 'full' },
}

const MIETER_PERMISSIONS = {
  vorgaenge: { level: 'none' },
  finanzen: { level: 'none' },
  immobilien: { level: 'none' },
  mieter: { level: 'none' },
  eigentuemer: { level: 'none' },
  dokumente: { level: 'none' },
  techniker: { level: 'none' },
  einstellungen: { level: 'none' },
  berichte: { level: 'none' },
}

async function main() {
  const mandants = await prisma.mandant.findMany()
  console.log(`Found ${mandants.length} mandant(s)`)

  for (const mandant of mandants) {
    console.log(`\nSeeding mandant: ${mandant.name} (${mandant.id})`)

    // Seed system roles
    const adminRole = await prisma.role.upsert({
      where: { id: `system-admin-${mandant.id}` },
      create: { id: `system-admin-${mandant.id}`, mandantId: mandant.id, name: 'Admin', isSystem: true, permissions: ADMIN_PERMISSIONS, color: '#ef4444' },
      update: { permissions: ADMIN_PERMISSIONS },
    })
    console.log(`  Admin role: ${adminRole.id}`)

    const mieterRole = await prisma.role.upsert({
      where: { id: `system-mieter-${mandant.id}` },
      create: { id: `system-mieter-${mandant.id}`, mandantId: mandant.id, name: 'Mieter', isSystem: true, permissions: MIETER_PERMISSIONS, color: '#3b82f6' },
      update: { permissions: MIETER_PERMISSIONS },
    })
    console.log(`  Mieter role: ${mieterRole.id}`)

    // Seed categories
    for (const cat of SYSTEM_CATEGORIES) {
      await prisma.vorgangCategory.upsert({
        where: { mandantId_slug: { mandantId: mandant.id, slug: cat.slug } },
        create: { mandantId: mandant.id, ...cat, isSystem: true, isActive: true },
        update: {},
      })
    }
    console.log(`  ${SYSTEM_CATEGORIES.length} categories seeded`)

    // Create RoleAssignments for existing admin users
    const adminUsers = await prisma.user.findMany({
      where: { mandantId: mandant.id, role: 'admin', isActive: true },
    })

    for (const adminUser of adminUsers) {
      const existing = await prisma.roleAssignment.findFirst({
        where: { userId: adminUser.id, roleId: adminRole.id, mandantId: mandant.id },
      })
      if (!existing) {
        await prisma.roleAssignment.create({
          data: {
            userId: adminUser.id,
            roleId: adminRole.id,
            scope: 'mandant',
            mandantId: mandant.id,
            assignedByUserId: adminUser.id,
          },
        })
        console.log(`  Assigned admin role to ${adminUser.email}`)
      }
    }
  }

  console.log('\nSeeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
