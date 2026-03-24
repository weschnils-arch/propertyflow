import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// ============================================================================
// GET /api/communications
// ============================================================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const channel = searchParams.get('channel')
    const search = searchParams.get('search')
    const ticketId = searchParams.get('ticketId')
    const tenantId = searchParams.get('tenantId')

    // --- Thread messages for a ticket ---
    if (ticketId) {
      const messages = await prisma.communication.findMany({
        where: { ticketId },
        include: { attachments: true },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json(messages)
    }

    // --- Thread messages for a tenant ---
    if (tenantId) {
      const messages = await prisma.communication.findMany({
        where: { tenantId },
        include: { attachments: true },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json(messages)
    }

    // --- Build conversation list across all channels ---
    const conversations = []

    // TENANT conversations
    if (!channel || channel === 'all' || channel === 'tenant') {
      const tenants = await prisma.tenant.findMany({
        where: search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
          ],
        } : undefined,
        include: {
          communications: { orderBy: { createdAt: 'desc' }, take: 1 },
          contracts: {
            where: { status: 'active' },
            include: { unit: { include: { property: true } } },
            take: 1,
          },
          tickets: {
            where: { status: { in: ['open', 'in_progress', 'assigned', 'scheduled'] } },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })

      for (const t of tenants) {
        if (t.contracts.length === 0) continue
        const contract = t.contracts[0]
        const lastComm = t.communications[0]

        // Count actual unread
        const unreadCount = await prisma.communication.count({
          where: { tenantId: t.id, isRead: false, direction: 'inbound' },
        })

        conversations.push({
          id: `tenant-${t.id}`,
          entityId: t.id,
          entityType: 'tenant',
          name: `${t.firstName} ${t.lastName}`,
          initials: `${t.firstName[0]}${t.lastName[0]}`,
          email: t.email,
          phone: t.phone,
          propertyName: contract.unit.property.name,
          propertyId: contract.unit.property.id,
          unitDesignation: contract.unit.designation,
          unitId: contract.unit.id,
          lastMessage: lastComm?.message?.substring(0, 120) || '',
          lastMessageAt: lastComm?.createdAt || null,
          lastMessageTime: lastComm ? formatTimeAgo(lastComm.createdAt) : '',
          unreadCount,
          channel: 'tenant',
          status: t.tickets.length > 0 ? 'active' : (lastComm ? 'active' : 'idle'),
          priority: t.tickets.some(tk => tk.priority === 'critical' || tk.priority === 'high') ? 'urgent' : 'normal',
          ticketId: t.tickets[0]?.id || null,
          ticketTitle: t.tickets[0]?.title || null,
          ticketStatus: t.tickets[0]?.status || null,
          monthlyRent: contract.monthlyRent,
          contractStart: contract.startDate,
          paymentStatus: 'current', // TODO: calculate from payments
        })
      }
    }

    // OWNER conversations
    if (!channel || channel === 'all' || channel === 'owner') {
      const owners = await prisma.owner.findMany({
        where: search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
          ],
        } : undefined,
        include: {
          properties: {
            include: { property: true },
            where: { isActive: true },
          },
        },
        take: 30,
      })

      for (const o of owners) {
        if (o.properties.length === 0) continue
        const propNames = o.properties.map(p => p.property.name).slice(0, 2).join(', ')

        // Get last communication for this owner
        const lastComm = await prisma.communication.findFirst({
          where: { channel: 'owner', senderName: { contains: o.lastName } },
          orderBy: { createdAt: 'desc' },
        })

        conversations.push({
          id: `owner-${o.id}`,
          entityId: o.id,
          entityType: 'owner',
          name: `${o.firstName} ${o.lastName}`,
          initials: `${o.firstName[0]}${o.lastName[0]}`,
          email: o.email,
          phone: o.phone,
          propertyName: propNames,
          propertyId: o.properties[0]?.property.id || '',
          unitDesignation: '',
          unitId: '',
          lastMessage: lastComm?.message?.substring(0, 120) || '',
          lastMessageAt: lastComm?.createdAt || null,
          lastMessageTime: lastComm ? formatTimeAgo(lastComm.createdAt) : '',
          unreadCount: 0,
          channel: 'owner',
          status: 'idle',
          priority: 'normal',
          ticketId: null,
          ticketTitle: null,
          ticketStatus: null,
          monthlyRent: 0,
          contractStart: null,
          paymentStatus: null,
        })
      }
    }

    // SERVICE PROVIDER conversations
    if (!channel || channel === 'all' || channel === 'service_provider') {
      const technicians = await prisma.technician.findMany({
        where: search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { company: { contains: search } },
          ],
        } : undefined,
        include: {
          tickets: {
            where: { status: { in: ['assigned', 'in_progress', 'scheduled'] } },
            take: 3,
          },
        },
        take: 20,
      })

      for (const tech of technicians) {
        conversations.push({
          id: `tech-${tech.id}`,
          entityId: tech.id,
          entityType: 'technician',
          name: `${tech.firstName} ${tech.lastName}`,
          initials: `${tech.firstName[0]}${tech.lastName[0]}`,
          email: tech.email,
          phone: tech.phone,
          propertyName: tech.company || tech.specialization,
          propertyId: '',
          unitDesignation: '',
          unitId: '',
          lastMessage: tech.tickets.length > 0 ? `${tech.tickets.length} aktive Aufträge` : '',
          lastMessageAt: null,
          lastMessageTime: '',
          unreadCount: 0,
          channel: 'service_provider',
          status: tech.tickets.length > 0 ? 'active' : 'idle',
          priority: 'normal',
          ticketId: tech.tickets[0]?.id || null,
          ticketTitle: tech.tickets[0]?.title || null,
          ticketStatus: tech.tickets[0]?.status || null,
          monthlyRent: 0,
          contractStart: null,
          paymentStatus: null,
        })
      }
    }

    // Sort: unread first, then urgent, then by last message time
    conversations.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1
      if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      if (a.lastMessageAt && !b.lastMessageAt) return -1
      return 0
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Communications GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ============================================================================
// POST /api/communications — send message or mass-send
// ============================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // --- Mass communication ---
    if (body.mass) {
      const { recipientGroup, message, subject, channel = 'tenant' } = body
      let tenantIds: string[] = []

      if (recipientGroup === 'all_tenants') {
        const tenants = await prisma.tenant.findMany({
          where: { contracts: { some: { status: 'active' } } },
          select: { id: true },
        })
        tenantIds = tenants.map(t => t.id)
      } else if (recipientGroup === 'overdue') {
        const payments = await prisma.payment.findMany({
          where: { status: 'overdue' },
          select: { tenantId: true },
          distinct: ['tenantId'],
        })
        tenantIds = payments.map(p => p.tenantId)
      } else if (body.propertyId) {
        const contracts = await prisma.contract.findMany({
          where: { status: 'active', unit: { propertyId: body.propertyId } },
          select: { tenantId: true },
        })
        tenantIds = contracts.map(c => c.tenantId)
      }

      if (tenantIds.length === 0) {
        return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
      }

      // Create one communication per tenant
      const comms = await prisma.communication.createMany({
        data: tenantIds.map(tid => ({
          tenantId: tid,
          channel,
          type: 'email',
          subject: subject || null,
          message,
          direction: 'outbound',
          senderRole: 'admin',
          senderName: 'Hendrik Verwaltung',
          isRead: true,
        })),
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          entityType: 'communication',
          entityId: 'mass',
          action: 'mass_send',
          changes: JSON.stringify({
            recipientCount: tenantIds.length,
            recipientGroup,
            subject,
            messagePreview: message.substring(0, 100),
          }),
        },
      })

      return NextResponse.json({ success: true, sent: comms.count, recipients: tenantIds.length })
    }

    // --- Single message ---
    const {
      tenantId,
      ticketId,
      message,
      subject,
      channel = 'tenant',
      type = 'chat',
      direction = 'outbound',
      senderRole = 'admin',
      senderName = 'Hendrik Verwaltung',
      parentId,
    } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const communication = await prisma.communication.create({
      data: {
        tenantId: tenantId || null,
        ticketId: ticketId || null,
        channel,
        type,
        subject: subject || null,
        message,
        direction,
        senderRole,
        senderName,
        isRead: direction === 'outbound',
        parentId: parentId || null,
      },
      include: { attachments: true },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'communication',
        entityId: communication.id,
        action: 'create',
        changes: JSON.stringify({
          tenantId, ticketId, channel, direction,
          messagePreview: message.substring(0, 100),
        }),
      },
    })

    return NextResponse.json(communication)
  } catch (error) {
    console.error('Communications POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ============================================================================
// PATCH /api/communications — mark as read
// ============================================================================
export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (body.markRead && body.tenantId) {
      await prisma.communication.updateMany({
        where: { tenantId: body.tenantId, isRead: false, direction: 'inbound' },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ============================================================================
function formatTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days}T`
  return `vor ${Math.floor(days / 7)}W`
}
