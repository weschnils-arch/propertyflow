import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/aws/ses'
import { messageNotificationEmail } from '@/lib/email/templates'
import { buildMagicLinkUrl, buildQuickReplyUrl } from '@/lib/auth/magic-link'

const THROTTLE_HOURS = 2

async function shouldThrottle(tenantId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - THROTTLE_HOURS * 60 * 60 * 1000)
  const recentSent = await prisma.notificationQueue.findFirst({
    where: {
      tenantId,
      status: 'sent',
      sentAt: { gte: cutoff },
    },
  })
  return !!recentSent
}

export async function queueMessageNotification(communicationId: string, tenantId: string) {
  await prisma.notificationQueue.create({
    data: {
      tenantId,
      communicationId,
      type: 'message_notification',
      status: 'pending',
      scheduledAt: new Date(),
    },
  })
}

export async function queueVorgangNotification(vorgangId: string, userId: string, type: string) {
  await prisma.notificationQueue.create({
    data: {
      userId,
      vorgangId,
      type,
      status: 'pending',
      scheduledAt: new Date(),
    },
  })
}

export async function processNotificationQueue(): Promise<{ sent: number; throttled: number; failed: number }> {
  const pending = await prisma.notificationQueue.findMany({
    where: { status: 'pending', scheduledAt: { lte: new Date() } },
    include: {
      tenant: true,
      communication: true,
      user: true,
      vorgang: true,
    },
    orderBy: { scheduledAt: 'asc' },
    take: 50,
  })

  let sent = 0, throttled = 0, failed = 0

  for (const notification of pending) {
    // Tenant notifications: apply throttling
    if (notification.tenantId && notification.tenant) {
      if (await shouldThrottle(notification.tenantId)) {
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: { status: 'throttled' },
        })
        throttled++
        continue
      }

      try {
        const tenant = notification.tenant

        const user = tenant.userId
          ? await prisma.user.findUnique({ where: { id: tenant.userId } })
          : await prisma.user.findFirst({ where: { email: tenant.email } })

        const magicLinkUrl = user ? buildMagicLinkUrl(tenant.id, user.id) : null
        const quickReplyUrl = user ? buildQuickReplyUrl(tenant.id, user.id, tenant.id) : null

        const emailContent = messageNotificationEmail({
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          senderName: notification.communication?.senderName || 'Ihre Hausverwaltung',
          messagePreview: notification.communication?.message.substring(0, 300) || '',
          magicLinkUrl,
          quickReplyUrl,
        })

        await sendEmail({
          to: tenant.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })

        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: { status: 'sent', sentAt: new Date() },
        })
        sent++
      } catch (error) {
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            failReason: error instanceof Error ? error.message : 'Unknown error',
            retryCount: { increment: 1 },
          },
        })
        failed++
      }
    }

    // Staff/Vorgang notifications: no throttling
    if (notification.userId && notification.user) {
      try {
        const staffUser = notification.user
        const vorgang = notification.vorgang
        const subject = vorgang
          ? `[${vorgang.referenceNumber}] ${notification.type === 'vorgang_assigned' ? 'Neue Zuweisung' : 'Statusänderung'}`
          : 'PropertyFlow Benachrichtigung'

        await sendEmail({
          to: staffUser.email,
          subject,
          html: `<p>Hallo ${staffUser.firstName},</p><p>${vorgang ? `Vorgang "${vorgang.title}" (${vorgang.referenceNumber}) wurde Ihnen zugewiesen.` : 'Sie haben eine neue Benachrichtigung.'}</p>`,
        })

        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: { status: 'sent', sentAt: new Date() },
        })
        sent++
      } catch (error) {
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            failReason: error instanceof Error ? error.message : 'Unknown error',
            retryCount: { increment: 1 },
          },
        })
        failed++
      }
    }
  }

  return { sent, throttled, failed }
}
