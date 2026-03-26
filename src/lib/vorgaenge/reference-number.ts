import { prisma } from '@/lib/db'

export async function generateReferenceNumber(mandantId: string): Promise<string> {
  const year = new Date().getFullYear()

  // Check if yearly reset is needed
  const lastVorgang = await prisma.vorgang.findFirst({
    where: { mandantId },
    orderBy: { createdAt: 'desc' },
    select: { referenceNumber: true },
  })

  if (lastVorgang) {
    const lastYear = parseInt(lastVorgang.referenceNumber.split('-')[1])
    if (lastYear < year) {
      await prisma.mandant.update({
        where: { id: mandantId },
        data: { nextVorgangSequence: 1 },
      })
    }
  }

  // Atomic increment
  const mandant = await prisma.mandant.update({
    where: { id: mandantId },
    data: { nextVorgangSequence: { increment: 1 } },
    select: { nextVorgangSequence: true },
  })

  const sequence = mandant.nextVorgangSequence - 1
  const padded = String(sequence).padStart(4, '0')

  return `V-${year}-${padded}`
}
