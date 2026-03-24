# Kommunikationsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, secure, DSGVO-compliant email-powered communication system where landlords can message tenants, tenants receive email notifications with quick-reply capability, new tenants get registration invites, all backed by AWS infrastructure with encryption, backups, and audit trails.

**Architecture:** Resend (EU/Frankfurt) handles transactional email delivery. Magic link tokens (SHA-256 hashed, time-limited) enable passwordless tenant access for registration, replies, and portal login. Every outbound message triggers an email notification; inbound replies are captured via token-authenticated public forms. Email delivery status tracked via Resend webhooks. All data encrypted at rest (AES-256) and in transit (TLS 1.3). AWS RDS with automated backups, S3 with versioning, and full audit logging.

**Tech Stack:** Resend (email), React Email (templates), Prisma (ORM), Next.js 16 API routes, JWT + magic links (auth), AWS RDS PostgreSQL (database), AWS S3 (file storage), AWS SES (fallback email), AWS KMS (encryption keys)

---

## File Structure

```
src/
  lib/
    email/
      resend.ts                         — Resend client singleton + send wrapper with retry
      templates/
        base-layout.tsx                 — Shared email layout (header, footer, branding, unsubscribe)
        tenant-invite.tsx               — Registration invitation email
        message-notification.tsx        — New message notification with quick-reply CTA
        ticket-update.tsx               — Ticket status change notification
        payment-reminder.tsx            — Payment reminder / dunning email (4 levels)
        welcome.tsx                     — Welcome after registration complete
        admin-notification.tsx          — Notify admin of tenant reply
    auth/
      magic-link.ts                     — Generate + verify tokens for invite + reply (SHA-256)
      rate-limit.ts                     — Rate limiting for auth endpoints
    security/
      encryption.ts                     — Field-level encryption helpers (AES-256-GCM)
      sanitize.ts                       — Input sanitization (XSS, injection prevention)
      csp.ts                            — Content Security Policy headers
  app/
    (public)/
      register/
        [token]/
          page.tsx                      — Tenant registration form (set password)
      reply/
        [token]/
          page.tsx                      — Quick reply form (no login required)
      unsubscribe/
        [token]/
          page.tsx                      — DSGVO email preference management
    api/
      auth/
        register/
          route.ts                      — Complete tenant registration
        verify/
          route.ts                      — Verify magic link token + create session
      email/
        webhook/
          route.ts                      — Resend webhook (delivery/bounce/open tracking)
        unsubscribe/
          route.ts                      — DSGVO unsubscribe handler
      cron/
        unanswered/
          route.ts                      — 48h unanswered message escalation
        backup-check/
          route.ts                      — Verify AWS backup health
      tenants/
        route.ts                        — MODIFY: send invite email on create
      communications/
        route.ts                        — MODIFY: trigger email on outbound message
        reply/
          route.ts                      — Public quick-reply endpoint
  middleware.ts                         — MODIFY: add security headers, rate limiting
```

---

## Phase 1: Security Foundation & Infrastructure

### Task 1: Security Headers & Input Sanitization

**Files:**
- Create: `src/lib/security/sanitize.ts`
- Create: `src/lib/security/csp.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Create input sanitization module**

Create `src/lib/security/sanitize.ts`:
```typescript
// Sanitize user input to prevent XSS and injection attacks
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

// Sanitize for database queries — strip null bytes and control chars
export function sanitizeForDb(input: string): string {
  return input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim()
}

// Validate email format strictly
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return re.test(email) && email.length <= 254
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 10) return { valid: false, error: 'Mindestens 10 Zeichen erforderlich' }
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Mindestens ein Großbuchstabe erforderlich' }
  if (!/[a-z]/.test(password)) return { valid: false, error: 'Mindestens ein Kleinbuchstabe erforderlich' }
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Mindestens eine Zahl erforderlich' }
  return { valid: true }
}

// Rate limit key generator
export function getRateLimitKey(ip: string, action: string): string {
  return `rate:${action}:${ip}`
}
```

- [ ] **Step 2: Create CSP headers module**

Create `src/lib/security/csp.ts`:
```typescript
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.amazonaws.com",
      "connect-src 'self' https://*.resend.com https://*.amazonaws.com",
      "frame-ancestors 'none'",
    ].join('; '),
  }
}
```

- [ ] **Step 3: Add security headers to middleware**

Update `src/middleware.ts` to apply security headers on all responses:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/security/csp'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const headers = getSecurityHeaders()

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/security/ src/middleware.ts
git commit -m "feat(security): add CSP headers, input sanitization, and security middleware"
```

---

### Task 2: Rate Limiting for Auth Endpoints

> **Production note:** This in-memory rate limiter works for single-instance deployments. On AWS ECS Fargate (multiple containers), replace with Redis (ElastiCache) for shared state.

**Files:**
- Create: `src/lib/auth/rate-limit.ts`

- [ ] **Step 1: Create in-memory rate limiter**

Create `src/lib/auth/rate-limit.ts`:
```typescript
// Simple in-memory rate limiter — replace with Redis in production for multi-instance
const attempts = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of attempts) {
    if (value.resetAt < now) attempts.delete(key)
  }
}, 5 * 60 * 1000)

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // seconds
}

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): RateLimitResult {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetIn: Math.ceil(windowMs / 1000) }
  }

  record.count++

  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((record.resetAt - now) / 1000),
    }
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetIn: Math.ceil((record.resetAt - now) / 1000),
  }
}

// Stricter limit for sensitive operations
export function checkAuthRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`auth:${ip}`, 5, 15 * 60 * 1000) // 5 attempts per 15 min
}

export function checkMagicLinkRateLimit(email: string): RateLimitResult {
  return checkRateLimit(`magic:${email}`, 3, 60 * 60 * 1000) // 3 per hour
}

export function checkReplyRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`reply:${ip}`, 10, 60 * 60 * 1000) // 10 per hour
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/rate-limit.ts
git commit -m "feat(security): add rate limiting for auth and reply endpoints"
```

---

### Task 3: Field-Level Encryption for Sensitive Data

**Files:**
- Create: `src/lib/security/encryption.ts`

- [ ] **Step 1: Create encryption helpers**

Create `src/lib/security/encryption.ts`:
```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Derive encryption key from secret — in production use AWS KMS
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'dev-encryption-key-change-in-production'
  return scryptSync(secret, 'automiq-salt', 32)
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey()
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':')

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// For sensitive fields: IBAN, tax ID, etc.
export function encryptIfPresent(value: string | null | undefined): string | null {
  if (!value) return null
  return encrypt(value)
}

export function decryptIfPresent(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return decrypt(value)
  } catch {
    return value // Return as-is if not encrypted (migration compatibility)
  }
}
```

- [ ] **Step 2: Add ENCRYPTION_SECRET to .env**

```
ENCRYPTION_SECRET=generate-a-64-char-random-hex-string-here
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/security/encryption.ts
git commit -m "feat(security): add AES-256-GCM field-level encryption for sensitive data"
```

---

## Phase 2: Database Schema & Email Infrastructure

> **CRITICAL EXECUTION ORDER:** Execute Task 6 (Prisma schema) and Task 7 (magic link) FIRST, then Task 4 (Resend) and Task 5 (email layout). The email service depends on the EmailLog model from Task 6.

### Task 4: Install Resend & Create Email Service

**Files:**
- Modify: `package.json`
- Modify: `.env`
- Create: `src/lib/email/resend.ts`

- [ ] **Step 1: Install Resend SDK**

```bash
cd /Users/nilswesch/Desktop/claude_projects/automiq/propertyflow-main
npm install resend
```

- [ ] **Step 2: Add environment variables**

Add to `.env`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Automiq PropertyFlow <noreply@automiq.at>
APP_URL=http://localhost:3000
```

- [ ] **Step 3: Create Resend client module**

Create `src/lib/email/resend.ts`:
```typescript
import { Resend } from 'resend'
import { prisma } from '@/lib/db'

if (!process.env.RESEND_API_KEY) {
  console.warn('[Email] RESEND_API_KEY not set — emails will be logged but not sent')
}

export const resend = new Resend(process.env.RESEND_API_KEY || 'test')
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Automiq <onboarding@resend.dev>'
export const APP_URL = process.env.APP_URL || 'http://localhost:3000'

interface SendEmailParams {
  to: string
  subject: string
  react: React.ReactElement
  replyTo?: string
  tags?: { name: string; value: string }[]
  tenantId?: string
  communicationId?: string
  templateName?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  tags,
  tenantId,
  communicationId,
  templateName = 'unknown',
}: SendEmailParams) {
  // Log every email attempt
  const emailLog = await prisma.emailLog.create({
    data: {
      to,
      subject,
      templateName,
      tenantId: tenantId || null,
      communicationId: communicationId || null,
      status: 'queued',
    },
  })

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      react,
      replyTo,
      tags,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'failed', error: error.message },
      })
      return { success: false, error: error.message, emailLogId: emailLog.id }
    }

    console.log(`[Email] Sent to ${to}: ${subject} (${data?.id})`)
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        resendId: data?.id || null,
        status: 'sent',
        sentAt: new Date(),
      },
    })
    return { success: true, resendId: data?.id, emailLogId: emailLog.id }
  } catch (err) {
    console.error('[Email] Exception:', err)
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: 'failed', error: String(err) },
    })
    return { success: false, error: String(err), emailLogId: emailLog.id }
  }
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/resend.ts .env package.json package-lock.json
git commit -m "feat(email): add Resend client with automatic EmailLog tracking"
```

---

### Task 5: Base Email Layout Template

**Files:**
- Create: `src/lib/email/templates/base-layout.tsx`

- [ ] **Step 1: Create base email layout**

Create `src/lib/email/templates/base-layout.tsx`:
```tsx
import * as React from 'react'

interface BaseLayoutProps {
  children: React.ReactNode
  previewText?: string
  unsubscribeUrl?: string
}

export function BaseLayout({ children, previewText, unsubscribeUrl }: BaseLayoutProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 20px; font-weight: 700; color: #0066FF; letter-spacing: -0.02em; }
          .footer { text-align: center; padding: 24px 0; color: #71717a; font-size: 12px; line-height: 1.6; }
          .footer a { color: #71717a; text-decoration: underline; }
          .btn { display: inline-block; padding: 12px 32px; background: #0066FF; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
          .text-muted { color: #71717a; font-size: 14px; }
          .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
          h1 { font-size: 22px; font-weight: 700; color: #18181b; margin: 0 0 16px; }
          p { font-size: 15px; line-height: 1.6; color: #3f3f46; margin: 0 0 16px; }
        `}</style>
      </head>
      <body>
        {previewText && (
          <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
            {previewText}
          </div>
        )}
        <div className="container">
          <div className="header">
            <div className="logo">Automiq PropertyFlow</div>
          </div>
          <div className="card">
            {children}
          </div>
          <div className="footer">
            <p>
              Automiq PropertyFlow — Immobilienverwaltung
            </p>
            {unsubscribeUrl && (
              <p>
                <a href={unsubscribeUrl}>E-Mail-Einstellungen verwalten</a>
              </p>
            )}
            <p>
              Sie erhalten diese E-Mail, weil Sie als Mieter/Eigentümer registriert sind.<br />
              Automiq GmbH · Datenschutz gemäß DSGVO
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/base-layout.tsx
git commit -m "feat(email): add base email layout template with DSGVO footer"
```

---

### Task 6: Prisma Schema — MagicToken & EmailLog Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add MagicToken model**

Add after the Session model:
```prisma
model MagicToken {
  id              String    @id @default(uuid())
  email           String
  token           String    @unique
  type            String    // invite, login, reply
  tenantId        String?
  communicationId String?
  metadata        String?   // JSON
  expiresAt       DateTime
  usedAt          DateTime?
  createdAt       DateTime  @default(now())

  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([email, type])
}
```

- [ ] **Step 2: Add EmailLog model**

```prisma
model EmailLog {
  id              String    @id @default(uuid())
  to              String
  fromAddress     String    @default("noreply@automiq.at")
  subject         String
  templateName    String
  resendId        String?
  status          String    @default("queued") // queued, sent, delivered, opened, bounced, failed
  communicationId String?
  tenantId        String?
  error           String?
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  createdAt       DateTime  @default(now())

  tenant          Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([status])
  @@index([resendId])
}
```

- [ ] **Step 3: Update Tenant model — add invite tracking fields**

Add to the Tenant model:
```prisma
  invitedAt        DateTime?
  inviteAcceptedAt DateTime?
  emailVerified    Boolean   @default(false)
  magicTokens      MagicToken[]
  emailLogs        EmailLog[]
```

- [ ] **Step 4: Run Prisma migration**

```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add MagicToken and EmailLog models, extend Tenant with invite tracking"
```

---

### Task 7: Magic Link Token System

**Files:**
- Create: `src/lib/auth/magic-link.ts`

- [ ] **Step 1: Create magic link utility**

Create `src/lib/auth/magic-link.ts`:
```typescript
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

interface GenerateTokenParams {
  email: string
  type: 'invite' | 'login' | 'reply'
  tenantId?: string
  communicationId?: string
  metadata?: Record<string, unknown>
  expiresInMinutes?: number
}

export async function generateMagicToken({
  email,
  type,
  tenantId,
  communicationId,
  metadata,
  expiresInMinutes = 15,
}: GenerateTokenParams) {
  // Invalidate existing unused tokens of same type for this email
  await prisma.magicToken.updateMany({
    where: { email: email.toLowerCase(), type, usedAt: null },
    data: { usedAt: new Date() },
  })

  const rawToken = randomBytes(32).toString('hex')
  const hashedToken = createHash('sha256').update(rawToken).digest('hex')

  const record = await prisma.magicToken.create({
    data: {
      email: email.toLowerCase(),
      token: hashedToken,
      type,
      tenantId,
      communicationId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    },
  })

  // URLs use the raw token; DB stores the SHA-256 hash
  const urls: Record<string, string> = {
    invite: `${APP_URL}/register/${rawToken}`,
    login: `${APP_URL}/auth/verify?token=${rawToken}`,
    reply: `${APP_URL}/reply/${rawToken}`,
  }

  return {
    id: record.id,
    rawToken,
    url: urls[type],
    expiresAt: record.expiresAt,
  }
}

export async function verifyMagicToken(rawToken: string, expectedType?: string) {
  const hashedToken = createHash('sha256').update(rawToken).digest('hex')

  const token = await prisma.magicToken.findUnique({
    where: { token: hashedToken },
    include: { tenant: true },
  })

  if (!token) return { valid: false as const, error: 'Token nicht gefunden' }
  if (token.usedAt) return { valid: false as const, error: 'Token bereits verwendet' }
  if (token.expiresAt < new Date()) return { valid: false as const, error: 'Token abgelaufen' }
  if (expectedType && token.type !== expectedType) return { valid: false as const, error: 'Ungültiger Token-Typ' }

  return { valid: true as const, token }
}

export async function consumeMagicToken(rawToken: string) {
  const hashedToken = createHash('sha256').update(rawToken).digest('hex')

  return prisma.magicToken.update({
    where: { token: hashedToken },
    data: { usedAt: new Date() },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/magic-link.ts
git commit -m "feat(auth): add secure magic link token system (SHA-256 hashed)"
```

---

## Phase 3: Tenant Registration Flow

### Task 8: Tenant Invite Email Template

**Files:**
- Create: `src/lib/email/templates/tenant-invite.tsx`

- [ ] **Step 1: Create invite email template**

Create `src/lib/email/templates/tenant-invite.tsx`:
```tsx
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface TenantInviteProps {
  tenantName: string
  propertyAddress: string
  unitNumber: string
  landlordName: string
  registerUrl: string
}

export function TenantInviteEmail({
  tenantName,
  propertyAddress,
  unitNumber,
  landlordName,
  registerUrl,
}: TenantInviteProps) {
  return (
    <BaseLayout previewText={`${landlordName} hat Sie als Mieter registriert`}>
      <h1>Willkommen bei PropertyFlow</h1>
      <p>Hallo {tenantName},</p>
      <p>
        <strong>{landlordName}</strong> hat Sie als Mieter für folgende Wohnung registriert:
      </p>
      <div style={{ background: '#f4f4f5', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{propertyAddress}</p>
        <p style={{ margin: '4px 0 0', color: '#71717a' }}>Wohnung {unitNumber}</p>
      </div>
      <p>
        Über PropertyFlow können Sie direkt mit Ihrer Hausverwaltung kommunizieren,
        Reparaturen melden und Ihre Dokumente einsehen.
      </p>
      <p>Bitte klicken Sie auf den Button, um Ihr Konto zu aktivieren:</p>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={registerUrl} style={{ display: 'inline-block', padding: '12px 32px', background: '#0066FF', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>Konto aktivieren</a>
      </div>
      <p style={{ color: '#71717a', fontSize: '14px' }}>
        Dieser Link ist 7 Tage gültig. Falls Sie diese E-Mail nicht erwartet haben,
        können Sie sie ignorieren.
      </p>
    </BaseLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/tenant-invite.tsx
git commit -m "feat(email): add tenant invite email template"
```

---

### Task 9: Send Invite on Tenant Creation

**Files:**
- Create: `src/lib/email/send-invite.ts`
- Modify: `src/app/api/tenants/route.ts`

- [ ] **Step 1: Create invite sender function**

Create `src/lib/email/send-invite.ts`:
```typescript
import { prisma } from '@/lib/db'
import { sendEmail } from './resend'
import { generateMagicToken } from '@/lib/auth/magic-link'
import { TenantInviteEmail } from './templates/tenant-invite'

interface SendInviteParams {
  tenantId: string
  email: string
  tenantName: string
  propertyAddress: string
  unitNumber: string
  landlordName: string
}

export async function sendTenantInvite({
  tenantId,
  email,
  tenantName,
  propertyAddress,
  unitNumber,
  landlordName,
}: SendInviteParams) {
  // Generate 7-day invite token
  const { url } = await generateMagicToken({
    email,
    type: 'invite',
    tenantId,
    expiresInMinutes: 7 * 24 * 60, // 7 days
  })

  const result = await sendEmail({
    to: email,
    subject: `Willkommen – Ihr Mieterportal für ${propertyAddress}`,
    react: TenantInviteEmail({
      tenantName,
      propertyAddress,
      unitNumber,
      landlordName,
      registerUrl: url,
    }),
    tenantId,
    templateName: 'tenant-invite',
    tags: [
      { name: 'type', value: 'invite' },
      { name: 'tenantId', value: tenantId },
    ],
  })

  // Mark tenant as invited
  if (result.success) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { invitedAt: new Date() },
    })
  }

  return result
}
```

- [ ] **Step 2: Hook into tenants POST route**

**Note:** The existing `src/app/api/tenants/route.ts` may only have a GET handler. If no POST handler exists, create one first (create tenant + contract), then add the invite hook below. After tenant creation:
```typescript
import { sendTenantInvite } from '@/lib/email/send-invite'

// After tenant + contract creation:
if (tenant.email) {
  sendTenantInvite({
    tenantId: tenant.id,
    email: tenant.email,
    tenantName: `${tenant.firstName} ${tenant.lastName}`,
    propertyAddress: property?.street || 'Ihre Wohnung',
    unitNumber: unit?.designation || '',
    landlordName: 'Ihre Hausverwaltung',
  }).catch(err => console.error('[Invite] Failed:', err))
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/send-invite.ts src/app/api/tenants/route.ts
git commit -m "feat(email): auto-send registration invite when landlord adds tenant with email"
```

---

### Task 10: Registration API & Page

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/verify/route.ts`
- Create: `src/app/(public)/register/[token]/page.tsx`

- [ ] **Step 1: Create token verification API**

Create `src/app/api/auth/verify/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMagicToken, consumeMagicToken } from '@/lib/auth/magic-link'
import jwt from 'jsonwebtoken'

// GET: Verify token validity (used by registration + reply pages)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const type = req.nextUrl.searchParams.get('type')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token fehlt' }, { status: 400 })
  }

  const result = await verifyMagicToken(token, type || undefined)

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error })
  }

  return NextResponse.json({
    valid: true,
    type: result.token!.type,
    tenantName: result.token!.tenant
      ? `${result.token!.tenant.firstName} ${result.token!.tenant.lastName}`
      : null,
  })
}

// POST: Consume magic link login token and create session
export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  }

  const result = await verifyMagicToken(token, 'login')
  if (!result.valid || !result.token) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const magicToken = result.token
  await consumeMagicToken(token)

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email: magicToken.email },
  })

  if (!user && magicToken.tenant) {
    // Create user, then link tenant to user (Tenant has userId, not User has tenantId)
    user = await prisma.user.create({
      data: {
        email: magicToken.email,
        password: '',
        role: 'tenant',
        firstName: magicToken.tenant.firstName,
        lastName: magicToken.tenant.lastName,
      },
    })
    await prisma.tenant.update({
      where: { id: magicToken.tenantId! },
      data: { userId: user.id },
    })
  }

  if (!user) {
    return NextResponse.json({ error: 'Konto nicht gefunden' }, { status: 404 })
  }

  const jwtToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    process.env.JWT_SECRET || 'automiq-dev-secret-change-in-production',
    { expiresIn: '7d' }
  )

  await prisma.session.create({
    data: {
      userId: user.id,
      token: jwtToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const response = NextResponse.json({ success: true, role: user.role })
  response.cookies.set('auth-token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
```

- [ ] **Step 2: Create registration API endpoint**

Create `src/app/api/auth/register/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMagicToken, consumeMagicToken } from '@/lib/auth/magic-link'
import { validatePassword } from '@/lib/security/sanitize'
import { checkAuthRateLimit } from '@/lib/auth/rate-limit'
import bcrypt from 'bcryptjs'
import { sendEmail, APP_URL } from '@/lib/email/resend'
import { WelcomeEmail } from '@/lib/email/templates/welcome'

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const rateLimit = checkAuthRateLimit(ip)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Zu viele Versuche. Bitte warten Sie ${Math.ceil(rateLimit.resetIn / 60)} Minuten.` },
      { status: 429 }
    )
  }

  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token und Passwort erforderlich' }, { status: 400 })
  }

  const passwordCheck = validatePassword(password)
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 })
  }

  const result = await verifyMagicToken(token, 'invite')
  if (!result.valid || !result.token) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const { token: magicToken } = result

  if (!magicToken.tenantId) {
    return NextResponse.json({ error: 'Kein Mieter zugeordnet' }, { status: 400 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: magicToken.tenantId },
    include: {
      contracts: {
        where: { status: 'active' },
        include: { unit: { include: { property: true } } },
        take: 1,
      },
    },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: magicToken.email },
  })

  if (existingUser) {
    return NextResponse.json({ error: 'Konto existiert bereits. Bitte melden Sie sich an.' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user, then link tenant to user (Tenant has userId, not User has tenantId)
  const user = await prisma.user.create({
    data: {
      email: magicToken.email,
      password: hashedPassword,
      role: 'tenant',
      firstName: tenant.firstName,
      lastName: tenant.lastName,
    },
  })

  await consumeMagicToken(token)

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      userId: user.id,
      inviteAcceptedAt: new Date(),
      emailVerified: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'register',
      entityType: 'User',
      entityId: user.id,
      changes: JSON.stringify({ method: 'invite', tenantId: tenant.id }),
    },
  })

  // Send welcome email
  const contract = tenant.contracts[0]
  sendEmail({
    to: magicToken.email,
    subject: 'Willkommen bei PropertyFlow',
    react: WelcomeEmail({
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      propertyAddress: contract?.unit?.property?.street || '',
      portalUrl: `${APP_URL}/tenant-portal`,
    }),
    tenantId: tenant.id,
    templateName: 'welcome',
  }).catch(err => console.error('[Welcome] Failed:', err))

  return NextResponse.json({
    success: true,
    message: 'Konto erfolgreich erstellt.',
  })
}
```

- [ ] **Step 3: Create registration page UI**

Create `src/app/(public)/register/[token]/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function RegisterPage() {
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/auth/verify?token=${token}&type=invite`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setStatus('valid')
          setTenantName(data.tenantName || '')
        } else {
          setStatus('invalid')
          setError(data.error || 'Ungültiger Link')
        }
      })
      .catch(() => {
        setStatus('invalid')
        setError('Verbindungsfehler')
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    setSubmitting(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()
    if (data.success) {
      setStatus('success')
    } else {
      setError(data.error || 'Registrierung fehlgeschlagen')
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-zinc-500">Link wird überprüft...</p>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Link ungültig</h1>
          <p className="text-zinc-500 mb-6">{error}</p>
          <a href="/login" className="text-blue-600 hover:underline">Zur Anmeldung</a>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Konto erstellt!</h1>
          <p className="text-zinc-500 mb-6">Sie können sich jetzt in Ihrem Mieterportal anmelden.</p>
          <a href="/login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Jetzt anmelden
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="text-xl font-bold text-blue-600 mb-2">Automiq PropertyFlow</div>
          <h1 className="text-2xl font-bold">Konto aktivieren</h1>
          {tenantName && <p className="text-zinc-500 mt-2">Hallo {tenantName}</p>}
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Min. 10 Zeichen, Groß/Klein + Zahl"
              required
              minLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Passwort wiederholen"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Wird erstellt...' : 'Konto aktivieren'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/register/ src/app/api/auth/verify/ src/app/(public)/register/
git commit -m "feat(auth): tenant registration page with secure invite token flow"
```

---

## Phase 4: Message Email Notifications

### Task 11: Message Notification Email Template

**Files:**
- Create: `src/lib/email/templates/message-notification.tsx`

- [ ] **Step 1: Create notification template with quick-reply CTA**

Create `src/lib/email/templates/message-notification.tsx`:
```tsx
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface MessageNotificationProps {
  tenantName: string
  senderName: string
  subject?: string
  messagePreview: string
  propertyAddress: string
  replyUrl: string
  portalUrl: string
  unsubscribeUrl?: string
}

export function MessageNotificationEmail({
  tenantName,
  senderName,
  subject,
  messagePreview,
  propertyAddress,
  replyUrl,
  portalUrl,
  unsubscribeUrl,
}: MessageNotificationProps) {
  return (
    <BaseLayout
      previewText={`Neue Nachricht von ${senderName}: ${messagePreview.slice(0, 60)}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <h1>{subject || 'Neue Nachricht'}</h1>
      <p>Hallo {tenantName},</p>
      <p>
        Sie haben eine neue Nachricht von <strong>{senderName}</strong> bezüglich{' '}
        <strong>{propertyAddress}</strong> erhalten:
      </p>
      <div style={{
        background: '#f4f4f5',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        borderLeft: '4px solid #0066FF',
      }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{messagePreview}</p>
      </div>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={replyUrl} style={{ display: 'inline-block', padding: '12px 32px', background: '#0066FF', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>Direkt antworten</a>
      </div>
      <p style={{ color: '#71717a', fontSize: '14px' }} style={{ textAlign: 'center' }}>
        oder <a href={portalUrl} style={{ color: '#0066FF' }}>im Mieterportal anmelden</a>
      </p>
    </BaseLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/message-notification.tsx
git commit -m "feat(email): add message notification template with quick-reply button"
```

---

### Task 12: Trigger Email on Outbound Message

**Files:**
- Create: `src/lib/email/send-notification.ts`
- Modify: `src/app/api/communications/route.ts`

- [ ] **Step 1: Create notification sender with smart throttling**

Create `src/lib/email/send-notification.ts`:
```typescript
import { prisma } from '@/lib/db'
import { sendEmail, APP_URL } from './resend'
import { generateMagicToken } from '@/lib/auth/magic-link'
import { MessageNotificationEmail } from './templates/message-notification'

interface NotifyTenantParams {
  communicationId: string
  tenantId: string
  senderName: string
  subject?: string
  message: string
}

export async function notifyTenantByEmail({
  communicationId,
  tenantId,
  senderName,
  subject,
  message,
}: NotifyTenantParams) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: {
        where: { status: 'active' },
        include: { unit: { include: { property: true } } },
        take: 1,
      },
    },
  })

  if (!tenant?.email) return { success: false, error: 'Keine E-Mail-Adresse' }

  // Check DSGVO consent — default allow unless explicitly revoked
  const consent = await prisma.consent.findUnique({
    where: { tenantId_type: { tenantId, type: 'communication_email' } },
  })
  if (consent && !consent.granted) {
    return { success: false, error: 'E-Mail-Kommunikation vom Mieter deaktiviert' }
  }

  // Smart throttling: don't send if email was sent < 5 min ago
  const recentEmail = await prisma.emailLog.findFirst({
    where: {
      tenantId,
      templateName: 'message-notification',
      createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
    },
  })
  if (recentEmail) {
    console.log(`[Email] Throttled for tenant ${tenantId} — recent notification exists`)
    return { success: false, error: 'Throttled' }
  }

  const contract = tenant.contracts[0]
  const propertyAddress = contract?.unit?.property?.street || 'Ihre Wohnung'

  // Generate quick-reply token (24h validity)
  const { url: replyUrl } = await generateMagicToken({
    email: tenant.email,
    type: 'reply',
    tenantId,
    communicationId,
    expiresInMinutes: 24 * 60,
  })

  const tenantName = `${tenant.firstName} ${tenant.lastName}`

  return sendEmail({
    to: tenant.email,
    subject: subject || `Neue Nachricht von ${senderName}`,
    react: MessageNotificationEmail({
      tenantName,
      senderName,
      subject,
      messagePreview: message.slice(0, 500),
      propertyAddress,
      replyUrl,
      portalUrl: `${APP_URL}/tenant-portal`,
    }),
    tenantId,
    communicationId,
    templateName: 'message-notification',
    tags: [
      { name: 'type', value: 'notification' },
      { name: 'tenantId', value: tenantId },
    ],
  })
}
```

- [ ] **Step 2: Hook into communications POST route**

In `src/app/api/communications/route.ts`, after creating an outbound communication to a tenant:
```typescript
import { notifyTenantByEmail } from '@/lib/email/send-notification'

// After creating single outbound communication:
if (direction === 'outbound' && tenantId) {
  notifyTenantByEmail({
    communicationId: communication.id,
    tenantId,
    senderName: senderName || 'Ihre Hausverwaltung',
    subject,
    message,
  }).catch(err => console.error('[Notification] Failed:', err))
}

// For mass send — same per tenant in the batch loop
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/send-notification.ts src/app/api/communications/route.ts
git commit -m "feat(email): send notification email on outbound message with smart throttling"
```

---

## Phase 5: Quick-Reply from Email

### Task 13: Quick-Reply API & Page

**Files:**
- Create: `src/app/api/communications/reply/route.ts`
- Create: `src/app/(public)/reply/[token]/page.tsx`

- [ ] **Step 1: Create reply API endpoint**

Create `src/app/api/communications/reply/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMagicToken, consumeMagicToken } from '@/lib/auth/magic-link'
import { checkReplyRateLimit } from '@/lib/auth/rate-limit'
import { sanitizeForDb } from '@/lib/security/sanitize'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkReplyRateLimit(ip)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warten.' }, { status: 429 })
  }

  const { token, message } = await req.json()

  if (!token || !message?.trim()) {
    return NextResponse.json({ error: 'Token und Nachricht erforderlich' }, { status: 400 })
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: 'Nachricht zu lang (max. 5000 Zeichen)' }, { status: 400 })
  }

  const result = await verifyMagicToken(token, 'reply')
  if (!result.valid || !result.token) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const { token: magicToken } = result

  const tenant = await prisma.tenant.findUnique({
    where: { id: magicToken.tenantId! },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
  }

  const sanitizedMessage = sanitizeForDb(message.trim())

  const communication = await prisma.communication.create({
    data: {
      tenantId: tenant.id,
      channel: 'tenant',
      type: 'chat',
      message: sanitizedMessage,
      direction: 'inbound',
      senderRole: 'tenant',
      senderName: `${tenant.firstName} ${tenant.lastName}`,
      isRead: false,
      parentId: magicToken.communicationId || null,
    },
  })

  await consumeMagicToken(token)

  await prisma.auditLog.create({
    data: {
      action: 'create',
      entityType: 'Communication',
      entityId: communication.id,
      changes: JSON.stringify({ method: 'quick-reply', tenantId: tenant.id }),
    },
  })

  // Notify admin of new inbound message
  // (Uses admin notification from Phase 7)

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create quick-reply page UI**

Create `src/app/(public)/reply/[token]/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function QuickReplyPage() {
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/auth/verify?token=${token}&type=reply`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setStatus('valid')
          setTenantName(data.tenantName || '')
        } else {
          setStatus('invalid')
          setError(data.error || 'Link ungültig oder abgelaufen')
        }
      })
      .catch(() => {
        setStatus('invalid')
        setError('Verbindungsfehler')
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setSubmitting(true)
    setError('')

    const res = await fetch('/api/communications/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, message }),
    })

    const data = await res.json()
    if (data.success) {
      setStatus('success')
    } else {
      setError(data.error || 'Senden fehlgeschlagen')
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold mb-2">Link ungültig</h1>
          <p className="text-zinc-500 mb-4">{error}</p>
          <p className="text-sm text-zinc-400">
            Bitte melden Sie sich im{' '}
            <a href="/login" className="text-blue-600 hover:underline">Mieterportal</a> an.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Antwort gesendet</h1>
          <p className="text-zinc-500">Ihre Nachricht wurde erfolgreich übermittelt.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-xl font-bold text-blue-600 mb-2">Automiq PropertyFlow</div>
          <h1 className="text-lg font-semibold">Schnellantwort</h1>
          {tenantName && <p className="text-zinc-500 text-sm mt-1">{tenantName}</p>}
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ihre Nachricht</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="Schreiben Sie hier Ihre Antwort..."
              maxLength={5000}
              required
            />
            <p className="text-xs text-zinc-400 mt-1">{message.length}/5000 Zeichen</p>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Wird gesendet...' : 'Antwort senden'}
          </button>
          <p className="text-xs text-zinc-400 text-center">
            Dieser Link kann nur einmal verwendet werden.
          </p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/communications/reply/ src/app/(public)/reply/
git commit -m "feat(comms): quick-reply from email without login (rate-limited, sanitized)"
```

---

## Phase 6: Admin Notifications (Inbound Messages)

> **Note:** Magic link login was removed from scope. Tenant login already exists. Tokens are still used for invite links and quick-reply only.

### Task 15: Notify Admin on Tenant Reply

**Files:**
- Create: `src/lib/email/templates/admin-notification.tsx`
- Create: `src/lib/email/send-admin-notification.ts`
- Modify: `src/app/api/communications/reply/route.ts`

- [ ] **Step 1: Create admin notification template**

Create `src/lib/email/templates/admin-notification.tsx`:
```tsx
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface AdminNotificationProps {
  tenantName: string
  propertyAddress: string
  messagePreview: string
  dashboardUrl: string
}

export function AdminNotificationEmail({
  tenantName,
  propertyAddress,
  messagePreview,
  dashboardUrl,
}: AdminNotificationProps) {
  return (
    <BaseLayout previewText={`Neue Nachricht von ${tenantName}`}>
      <h1>Neue Mieter-Nachricht</h1>
      <p>
        <strong>{tenantName}</strong> ({propertyAddress}) hat eine Nachricht gesendet:
      </p>
      <div style={{
        background: '#f4f4f5',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        borderLeft: '4px solid #10b981',
      }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{messagePreview}</p>
      </div>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <a href={dashboardUrl} style={{ display: 'inline-block', padding: '12px 32px', background: '#0066FF', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>Im Dashboard öffnen</a>
      </div>
    </BaseLayout>
  )
}
```

- [ ] **Step 2: Create admin notification sender**

Create `src/lib/email/send-admin-notification.ts`:
```typescript
import { prisma } from '@/lib/db'
import { sendEmail, APP_URL } from './resend'
import { AdminNotificationEmail } from './templates/admin-notification'

export async function notifyAdminOfReply(tenantId: string, message: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: {
        where: { status: 'active' },
        include: { unit: { include: { property: true } } },
        take: 1,
      },
    },
  })

  if (!tenant) return

  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'property_manager'] } },
  })

  const tenantName = `${tenant.firstName} ${tenant.lastName}`
  const property = tenant.contracts[0]?.unit?.property

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `Neue Nachricht von ${tenantName}`,
      react: AdminNotificationEmail({
        tenantName,
        propertyAddress: property?.street || 'Unbekanntes Objekt',
        messagePreview: message.slice(0, 500),
        dashboardUrl: `${APP_URL}/communications`,
      }),
      templateName: 'admin-notification',
    }).catch(err => console.error(`[AdminNotify] Failed for ${admin.email}:`, err))
  }
}
```

- [ ] **Step 3: Hook into reply endpoint**

In `src/app/api/communications/reply/route.ts`, after creating the reply communication:
```typescript
import { notifyAdminOfReply } from '@/lib/email/send-admin-notification'

// After creating communication:
notifyAdminOfReply(tenant.id, sanitizedMessage).catch(err => console.error('[AdminNotify]', err))
```

Also hook into the main communications POST route for inbound messages from tenant portal.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/templates/admin-notification.tsx src/lib/email/send-admin-notification.ts src/app/api/communications/
git commit -m "feat(email): notify admins when tenant sends message or replies"
```

---

## Phase 7: Automated Email Notifications

### Task 16: Ticket Status Change Notifications

**Files:**
- Create: `src/lib/email/templates/ticket-update.tsx`
- Create: `src/lib/email/send-ticket-notification.ts`
- Modify: ticket update API route

- [ ] **Step 1: Create ticket update template**

Create `src/lib/email/templates/ticket-update.tsx`:
```tsx
import * as React from 'react'
import { BaseLayout } from './base-layout'

const STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  assigned: 'Zugewiesen',
  in_progress: 'In Bearbeitung',
  scheduled: 'Terminiert',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
}

interface TicketUpdateProps {
  tenantName: string
  ticketTitle: string
  oldStatus: string
  newStatus: string
  note?: string
  portalUrl: string
}

export function TicketUpdateEmail({
  tenantName,
  ticketTitle,
  oldStatus,
  newStatus,
  note,
  portalUrl,
}: TicketUpdateProps) {
  return (
    <BaseLayout previewText={`Reparatur "${ticketTitle}" — ${STATUS_LABELS[newStatus] || newStatus}`}>
      <h1>Reparatur-Update</h1>
      <p>Hallo {tenantName},</p>
      <p>Der Status Ihrer Reparaturmeldung wurde aktualisiert:</p>
      <div style={{ background: '#f4f4f5', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{ticketTitle}</p>
        <p style={{ margin: '8px 0 0', fontSize: '14px' }}>
          <span style={{ color: '#71717a' }}>{STATUS_LABELS[oldStatus] || oldStatus}</span>
          {' → '}
          <span style={{ color: '#0066FF', fontWeight: 600 }}>{STATUS_LABELS[newStatus] || newStatus}</span>
        </p>
        {note && <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#3f3f46' }}>{note}</p>}
      </div>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <a href={portalUrl} style={{ display: 'inline-block', padding: '12px 32px', background: '#0066FF', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>Im Portal ansehen</a>
      </div>
    </BaseLayout>
  )
}
```

- [ ] **Step 2: Create ticket notification sender**

Create `src/lib/email/send-ticket-notification.ts`:
```typescript
import { prisma } from '@/lib/db'
import { sendEmail, APP_URL } from './resend'
import { TicketUpdateEmail } from './templates/ticket-update'

export async function notifyTicketStatusChange(ticketId: string, oldStatus: string, newStatus: string, note?: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { tenant: true },
  })

  if (!ticket?.tenant?.email) return

  await sendEmail({
    to: ticket.tenant.email,
    subject: `Reparatur-Update: ${ticket.title}`,
    react: TicketUpdateEmail({
      tenantName: `${ticket.tenant.firstName} ${ticket.tenant.lastName}`,
      ticketTitle: ticket.title,
      oldStatus,
      newStatus,
      note,
      portalUrl: `${APP_URL}/tenant-portal/maintenance`,
    }),
    tenantId: ticket.tenantId,
    templateName: 'ticket-update',
    tags: [{ name: 'type', value: 'ticket-update' }],
  })
}
```

- [ ] **Step 3: Hook into ticket status update route**

```typescript
import { notifyTicketStatusChange } from '@/lib/email/send-ticket-notification'

// After status change:
if (oldStatus !== newStatus) {
  notifyTicketStatusChange(ticket.id, oldStatus, newStatus, body.note)
    .catch(err => console.error('[TicketNotify]', err))
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/templates/ticket-update.tsx src/lib/email/send-ticket-notification.ts
git commit -m "feat(email): notify tenant on ticket status changes"
```

---

### Task 17: Payment Reminder / Dunning Emails

**Files:**
- Create: `src/lib/email/templates/payment-reminder.tsx`
- Create: `src/lib/email/send-payment-reminder.ts`

- [ ] **Step 1: Create payment reminder template (4 dunning levels)**

Create `src/lib/email/templates/payment-reminder.tsx`:
```tsx
import * as React from 'react'
import { BaseLayout } from './base-layout'

const LEVEL_CONFIG: Record<number, { title: string; tone: string }> = {
  1: {
    title: 'Freundliche Zahlungserinnerung',
    tone: 'Wir möchten Sie freundlich daran erinnern, dass folgende Zahlung noch aussteht:',
  },
  2: {
    title: '1. Mahnung',
    tone: 'Leider konnten wir bisher keinen Zahlungseingang feststellen. Bitte begleichen Sie den offenen Betrag umgehend:',
  },
  3: {
    title: '2. Mahnung',
    tone: 'Trotz unserer bisherigen Erinnerungen steht die Zahlung weiterhin aus. Wir bitten Sie dringend, den Betrag innerhalb von 7 Tagen zu überweisen:',
  },
  4: {
    title: 'Letzte Mahnung vor Inkasso',
    tone: 'Dies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 5 Werktagen eingehen, sehen wir uns gezwungen, ein Inkassounternehmen zu beauftragen:',
  },
}

interface PaymentReminderProps {
  tenantName: string
  amount: string
  dueDate: string
  propertyAddress: string
  unitNumber: string
  dunningLevel: number
  portalUrl: string
}

export function PaymentReminderEmail({
  tenantName,
  amount,
  dueDate,
  propertyAddress,
  unitNumber,
  dunningLevel,
  portalUrl,
}: PaymentReminderProps) {
  const config = LEVEL_CONFIG[dunningLevel] || LEVEL_CONFIG[1]

  return (
    <BaseLayout previewText={`${config.title} — ${amount}`}>
      <h1>{config.title}</h1>
      <p>Hallo {tenantName},</p>
      <p>{config.tone}</p>
      <div style={{ background: '#f4f4f5', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
        <table style={{ width: '100%', fontSize: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0', color: '#71717a' }}>Objekt:</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{propertyAddress}, Whg. {unitNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#71717a' }}>Betrag:</td>
              <td style={{ padding: '4px 0', fontWeight: 700, color: '#DC2626', fontSize: '16px' }}>{amount}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#71717a' }}>Fällig seit:</td>
              <td style={{ padding: '4px 0' }}>{dueDate}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <a href={portalUrl} style={{ display: 'inline-block', padding: '12px 32px', background: '#0066FF', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>Im Portal ansehen</a>
      </div>
      {dunningLevel >= 3 && (
        <p style={{ fontSize: '13px', color: '#71717a', borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
          Bei Zahlungsschwierigkeiten kontaktieren Sie uns bitte umgehend. Wir finden gemeinsam eine Lösung.
        </p>
      )}
    </BaseLayout>
  )
}
```

- [ ] **Step 2: Create payment reminder sender**

Create `src/lib/email/send-payment-reminder.ts`:
```typescript
import { prisma } from '@/lib/db'
import { sendEmail, APP_URL } from './resend'
import { PaymentReminderEmail } from './templates/payment-reminder'

interface SendReminderParams {
  tenantId: string
  amount: number
  dueDate: string
  dunningLevel: number
}

export async function sendPaymentReminder({ tenantId, amount, dueDate, dunningLevel }: SendReminderParams) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: {
        where: { status: 'active' },
        include: { unit: { include: { property: true } } },
        take: 1,
      },
    },
  })

  if (!tenant?.email) return { success: false, error: 'Keine E-Mail' }

  const contract = tenant.contracts[0]

  const result = await sendEmail({
    to: tenant.email,
    subject: dunningLevel === 1 ? 'Zahlungserinnerung' : `${dunningLevel - 1}. Mahnung — Offener Betrag`,
    react: PaymentReminderEmail({
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      amount: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount),
      dueDate,
      propertyAddress: contract?.unit?.property?.street || '',
      unitNumber: contract?.unit?.designation || '',
      dunningLevel,
      portalUrl: `${APP_URL}/tenant-portal/payments`,
    }),
    tenantId,
    templateName: 'payment-reminder',
    tags: [
      { name: 'type', value: 'dunning' },
      { name: 'level', value: String(dunningLevel) },
    ],
  })

  // Create dunning step record
  await prisma.dunningStep.create({
    data: {
      tenantId,
      level: dunningLevel,
      amount,
      method: 'email',
      status: result.success ? 'sent' : 'failed',
    },
  })

  // Create communication record for audit trail
  await prisma.communication.create({
    data: {
      tenantId,
      channel: 'tenant',
      type: 'email',
      subject: dunningLevel === 1 ? 'Zahlungserinnerung' : `${dunningLevel - 1}. Mahnung`,
      message: `Offener Betrag: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)} (fällig seit ${dueDate})`,
      direction: 'outbound',
      senderRole: 'system',
      senderName: 'Automiq System',
      isRead: true,
    },
  })

  return result
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/templates/payment-reminder.tsx src/lib/email/send-payment-reminder.ts
git commit -m "feat(email): 4-level dunning / payment reminder email automation"
```

---

### Task 18: Welcome Email Template

**Files:**
- Create: `src/lib/email/templates/welcome.tsx`

- [ ] **Step 1: Create welcome template**

Create `src/lib/email/templates/welcome.tsx`:
```tsx
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface WelcomeProps {
  tenantName: string
  propertyAddress: string
  portalUrl: string
}

export function WelcomeEmail({ tenantName, propertyAddress, portalUrl }: WelcomeProps) {
  return (
    <BaseLayout previewText="Ihr Mieterportal ist bereit">
      <h1>Willkommen bei PropertyFlow!</h1>
      <p>Hallo {tenantName},</p>
      <p>Ihr Konto wurde erfolgreich aktiviert. Über Ihr Mieterportal können Sie ab sofort:</p>
      <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
        <li>Direkt mit Ihrer Hausverwaltung kommunizieren</li>
        <li>Reparaturen und Mängel melden</li>
        <li>Ihre Dokumente und Abrechnungen einsehen</li>
        <li>Zahlungsübersichten prüfen</li>
      </ul>
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={portalUrl} style={{ display: 'inline-block', padding: '12px 32px', background: '#0066FF', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}>Zum Mieterportal</a>
      </div>
    </BaseLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/welcome.tsx
git commit -m "feat(email): add welcome email template"
```

---

## Phase 8: Email Delivery Tracking (Resend Webhook)

### Task 19: Webhook Endpoint for Delivery Status

**Files:**
- Create: `src/app/api/email/webhook/route.ts`

- [ ] **Step 1: Create webhook handler**

Create `src/app/api/email/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHmac } from 'crypto'

// Verify Resend webhook signature
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.RESEND_WEBHOOK_SECRET) return false
  const expected = createHmac('sha256', process.env.RESEND_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')
  return signature === expected
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('resend-signature')

  // Verify signature in production
  if (process.env.NODE_ENV === 'production') {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const { type, data } = JSON.parse(rawBody)

  if (!data?.email_id) {
    return NextResponse.json({ received: true })
  }

  const updateData: Record<string, unknown> = {}

  switch (type) {
    case 'email.delivered':
      updateData.status = 'delivered'
      updateData.deliveredAt = new Date()
      break
    case 'email.opened':
      updateData.status = 'opened'
      updateData.openedAt = new Date()
      break
    case 'email.bounced':
      updateData.status = 'bounced'
      updateData.error = data.bounce?.message || 'Bounced'
      break
    case 'email.complained':
      updateData.status = 'complained'
      break
    default:
      return NextResponse.json({ received: true })
  }

  await prisma.emailLog.updateMany({
    where: { resendId: data.email_id },
    data: updateData,
  })

  // On bounce: log for admin visibility
  if (type === 'email.bounced' && data.to?.[0]) {
    const tenant = await prisma.tenant.findFirst({
      where: { email: data.to[0] },
    })
    if (tenant) {
      await prisma.auditLog.create({
        data: {
          action: 'email_bounced',
          entityType: 'Tenant',
          entityId: tenant.id,
          changes: JSON.stringify({ email: data.to[0], reason: data.bounce?.message }),
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Add RESEND_WEBHOOK_SECRET to .env**

```
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/email/webhook/ .env
git commit -m "feat(email): Resend webhook with signature verification for delivery tracking"
```

---

## Phase 9: DSGVO Compliance — Unsubscribe & Consent

### Task 20: Unsubscribe Flow

**Files:**
- Create: `src/app/api/email/unsubscribe/route.ts`
- Create: `src/app/(public)/unsubscribe/[token]/page.tsx`

- [ ] **Step 1: Create unsubscribe API**

Create `src/app/api/email/unsubscribe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMagicToken, consumeMagicToken } from '@/lib/auth/magic-link'

export async function POST(req: NextRequest) {
  const { token, type } = await req.json()
  // type: "all" | "notifications" | "reminders"

  const result = await verifyMagicToken(token)
  if (!result.valid || !result.token?.tenantId) {
    return NextResponse.json({ error: 'Ungültiger Link' }, { status: 400 })
  }

  const tenantId = result.token.tenantId
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (type === 'all') {
    await prisma.consent.upsert({
      where: { tenantId_type: { tenantId, type: 'communication_email' } },
      update: { granted: false, revokedAt: new Date(), ipAddress: ip },
      create: { tenantId, type: 'communication_email', granted: false, revokedAt: new Date(), ipAddress: ip },
    })
  }

  await consumeMagicToken(token)

  await prisma.auditLog.create({
    data: {
      action: 'unsubscribe',
      entityType: 'Consent',
      entityId: tenantId,
      changes: JSON.stringify({ unsubscribeType: type, tenantId }),
    },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create unsubscribe page**

Create `src/app/(public)/unsubscribe/[token]/page.tsx` — simple confirmation page with "E-Mails abbestellen" button and success state.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/email/unsubscribe/ src/app/(public)/unsubscribe/
git commit -m "feat(dsgvo): unsubscribe flow with consent tracking and audit log"
```

---

## Phase 10: Unanswered Message Escalation

### Task 21: Cron Job for Unanswered Messages

**Files:**
- Create: `src/app/api/cron/unanswered/route.ts`
- [ ] **Step 1: Create cron endpoint**

Create `src/app/api/cron/unanswered/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, APP_URL } from '@/lib/email/resend'
import { AdminNotificationEmail } from '@/lib/email/templates/admin-notification'

// AWS EventBridge cron: runs every 6 hours
export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const threshold48h = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const unanswered = await prisma.communication.findMany({
    where: {
      direction: 'inbound',
      isRead: false,
      createdAt: { lt: threshold48h },
    },
    include: {
      tenant: {
        include: {
          contracts: {
            where: { status: 'active' },
            include: { unit: { include: { property: true } } },
            take: 1,
          },
        },
      },
    },
    take: 50,
  })

  if (unanswered.length === 0) {
    return NextResponse.json({ checked: true, unanswered: 0 })
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'property_manager'] } },
  })

  const summary = unanswered.map(m => {
    const name = m.tenant ? `${m.tenant.firstName} ${m.tenant.lastName}` : 'Unbekannt'
    return `${name}: "${m.message.slice(0, 80)}..."`
  }).join('\n\n')

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `⚠ ${unanswered.length} unbeantwortete Nachricht(en) seit 48h`,
      react: AdminNotificationEmail({
        tenantName: `${unanswered.length} Mieter`,
        propertyAddress: 'Verschiedene Objekte',
        messagePreview: summary,
        dashboardUrl: `${APP_URL}/communications`,
      }),
      templateName: 'escalation-unanswered',
    }).catch(err => console.error(`[Escalation] Failed for ${admin.email}:`, err))
  }

  return NextResponse.json({ checked: true, unanswered: unanswered.length })
}
```

- [ ] **Step 2: Configure AWS EventBridge cron**

Set up an EventBridge rule to hit the endpoint every 6 hours:
```
Rule: automiq-unanswered-check
Schedule: rate(6 hours)
Target: HTTPS → https://app.automiq.at/api/cron/unanswered
Auth header: Bearer ${CRON_SECRET}
```

- [ ] **Step 3: Add CRON_SECRET to .env**

```
CRON_SECRET=generate-a-random-secret-here
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/
git commit -m "feat(comms): 48h unanswered message escalation cron with admin alerts"
```

---

## Phase 11: Sidebar Additions — Feature Request & Support

### Task 22: Add Feature Request & Support Tabs to Admin Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Create: `src/app/feature-request/page.tsx`
- Create: `src/app/support/page.tsx`
- Create: `src/app/api/feature-requests/route.ts`
- Create: `src/app/api/support-tickets/route.ts`

- [ ] **Step 1: Add sidebar items at bottom**

In `src/components/layout/Sidebar.tsx`, add a new section at the bottom of the sidebar (before or after PORTALE):
```tsx
// SUPPORT section — pinned to bottom
<div className="mt-auto border-t border-zinc-200 dark:border-zinc-700 pt-4">
  <SidebarLink href="/feature-request" icon={Lightbulb} label="Feature anfragen" />
  <SidebarLink href="/support" icon={LifeBuoy} label="Support-Ticket" />
</div>
```

Import the icons:
```typescript
import { Lightbulb, LifeBuoy } from 'lucide-react'
```

- [ ] **Step 2: Create Feature Request page**

Create `src/app/feature-request/page.tsx`:
A simple form with:
- Title field
- Category dropdown (UI, Kommunikation, Finanzen, Wartung, Automatisierung, Sonstiges)
- Description textarea
- Priority (nice-to-have, should-have, must-have)
- Submit button
- List of previously submitted feature requests with status badges (neu, in Prüfung, geplant, umgesetzt, abgelehnt)

- [ ] **Step 3: Create Support Ticket page**

Create `src/app/support/page.tsx`:
A form with:
- Subject field
- Category (Bug, Frage, Zugang, Abrechnung, Sonstiges)
- Description textarea with Markdown support
- File attachment (screenshot)
- Urgency (niedrig, mittel, hoch, kritisch)
- List of open support tickets with status

- [ ] **Step 4: Create API routes**

Create `src/app/api/feature-requests/route.ts` and `src/app/api/support-tickets/route.ts` with GET/POST handlers. These store requests in the database for internal tracking.

**Note:** Consider adding Prisma models for these if persistent tracking is needed:
```prisma
model FeatureRequest {
  id          String   @id @default(uuid())
  userId      String
  title       String
  category    String
  description String
  priority    String   @default("nice-to-have")
  status      String   @default("neu")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
}

model SupportTicket {
  id          String   @id @default(uuid())
  userId      String
  subject     String
  category    String
  description String
  urgency     String   @default("mittel")
  status      String   @default("offen")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/app/(admin)/feature-request/ src/app/(admin)/support/ src/app/api/feature-requests/ src/app/api/support-tickets/ prisma/schema.prisma
git commit -m "feat(admin): add Feature Request and Support Ticket tabs to sidebar"
```

---

## Phase 12: Security Hardening & AWS Backup Strategy

### Task 23: Resend Invite Button (Re-invite Tenant)

**Files:**
- Modify: tenant detail page or tenant list
- Create: `src/app/api/tenants/[id]/reinvite/route.ts`

- [ ] **Step 1: Create re-invite endpoint**

Create `src/app/api/tenants/[id]/reinvite/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendTenantInvite } from '@/lib/email/send-invite'
import { checkRateLimit } from '@/lib/auth/rate-limit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = params.id

  // Rate limit: max 3 re-invites per tenant per day
  const rateLimit = checkRateLimit(`reinvite:${tenantId}`, 3, 24 * 60 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Maximale Einladungen pro Tag erreicht' }, { status: 429 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      contracts: {
        where: { status: 'active' },
        include: { unit: { include: { property: true } } },
        take: 1,
      },
    },
  })

  if (!tenant) return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
  if (!tenant.email) return NextResponse.json({ error: 'Keine E-Mail-Adresse hinterlegt' }, { status: 400 })
  if (tenant.inviteAcceptedAt) return NextResponse.json({ error: 'Mieter hat bereits registriert' }, { status: 400 })

  const contract = tenant.contracts[0]

  const result = await sendTenantInvite({
    tenantId: tenant.id,
    email: tenant.email,
    tenantName: `${tenant.firstName} ${tenant.lastName}`,
    propertyAddress: contract?.unit?.property?.street || 'Ihre Wohnung',
    unitNumber: contract?.unit?.designation || '',
    landlordName: 'Ihre Hausverwaltung',
  })

  if (result.success) {
    return NextResponse.json({ success: true, message: 'Einladung erneut gesendet' })
  }

  return NextResponse.json({ error: 'Senden fehlgeschlagen' }, { status: 500 })
}
```

- [ ] **Step 2: Add "Erneut einladen" button to tenant UI**

In the tenant list or detail page, show a button for tenants where `invitedAt` exists but `inviteAcceptedAt` is null.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tenants/
git commit -m "feat(tenants): re-invite button for tenants who haven't registered"
```

---

### Task 24: AWS Infrastructure Security Checklist

This task is a configuration guide — no code changes, but critical for production security.

- [ ] **Step 1: AWS RDS PostgreSQL Setup**

```
Region: eu-central-1 (Frankfurt) — DSGVO compliant
Instance: db.t3.micro (free tier) → db.t3.medium (production)
Engine: PostgreSQL 16
Storage: 20GB gp3, encryption enabled (AES-256 via AWS KMS)
Multi-AZ: YES for production (automatic failover)
Backup:
  - Automated daily snapshots (35-day retention)
  - Point-in-time recovery enabled
  - Cross-region backup to eu-west-1 (Ireland) for disaster recovery
Network:
  - Private subnet only (no public access)
  - Security group: allow port 5432 only from app servers
  - SSL/TLS enforced (rds.force_ssl = 1)
```

- [ ] **Step 2: AWS S3 Configuration**

```
Bucket: automiq-propertyflow-documents
Region: eu-central-1
Encryption: SSE-S3 (AES-256) at rest, enforced via bucket policy
Versioning: ENABLED (document revision history + accidental deletion recovery)
Lifecycle rules:
  - Move to S3-IA after 90 days
  - Move to Glacier after 365 days
  - Never delete (legal retention for Mietrecht)
Block public access: ALL enabled
CORS: restrict to app domain only
Bucket policy: deny unencrypted uploads
Access: IAM role for app, no access keys in code
```

- [ ] **Step 3: AWS KMS (Key Management)**

```
Key: automiq-encryption-key
Region: eu-central-1
Key rotation: ENABLED (annual automatic rotation)
Usage:
  - RDS storage encryption
  - S3 server-side encryption
  - Application-level field encryption (IBAN, tax ID, etc.)
Access: only app IAM role + admin users
```

- [ ] **Step 4: AWS SES (Fallback Email)**

```
Region: eu-central-1 (Frankfurt)
Domain: automiq.at (DKIM + SPF + DMARC configured)
Purpose: Fallback if Resend is down
Configuration set: tracking enabled (delivery, bounce, complaint)
Suppression list: enabled (auto-suppress bounced emails)
```

- [ ] **Step 5: Network Security**

```
VPC: dedicated VPC for PropertyFlow
Subnets: public (ALB) + private (app + DB)
NAT Gateway: for outbound from private subnets
WAF: AWS WAF on ALB
  - Rate limiting: 2000 req/5min per IP
  - SQL injection rule set
  - XSS rule set
  - Bot control
Security Groups:
  - ALB: 443 inbound from anywhere
  - App (ECS): 3000 from ALB only
  - DB: 5432 from App SG only
```

- [ ] **Step 6: Backup & Disaster Recovery Plan**

```
Database:
  - RDS automated snapshots: daily, 35-day retention
  - Point-in-time recovery: 5-minute granularity
  - Cross-region replica in eu-west-1
  - Monthly manual snapshot export to S3 (long-term archive)
  - RPO: 5 minutes, RTO: 30 minutes

Files (S3):
  - Versioning enabled (recover any version)
  - Cross-region replication to eu-west-1
  - S3 Object Lock for legal hold documents

Application:
  - Git repository = source of truth
  - ECS Fargate deployment = rolling update with rollback
  - Infrastructure as Code (future: Terraform/CDK)

Monitoring:
  - CloudWatch alarms: CPU, memory, disk, connection count
  - RDS event notifications: failover, backup failure
  - Resend dashboard: delivery rate, bounce rate
  - CloudWatch Logs: application logs + error tracking
```

- [ ] **Step 7: Environment Variables (Production)**

```bash
# Database
DATABASE_URL=postgresql://user:pass@automiq-rds.xxxxx.eu-central-1.rds.amazonaws.com:5432/propertyflow?sslmode=require

# Auth
JWT_SECRET=<64-char-random-hex>
ENCRYPTION_SECRET=<64-char-random-hex>

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
EMAIL_FROM=Automiq PropertyFlow <noreply@automiq.at>

# AWS
AWS_REGION=eu-central-1
AWS_S3_BUCKET=automiq-propertyflow-documents
AWS_ACCESS_KEY_ID=<IAM-role-preferred>
AWS_SECRET_ACCESS_KEY=<IAM-role-preferred>

# App
APP_URL=https://app.automiq.at
CRON_SECRET=<random-secret>
NODE_ENV=production
```

- [ ] **Step 8: Document the setup**

Save AWS configuration decisions to a `docs/infrastructure.md` file for team reference.

- [ ] **Step 9: Commit**

```bash
git add docs/infrastructure.md
git commit -m "docs: AWS infrastructure security plan and backup strategy"
```

---

### Task 25: Email Log Viewer for Admin

**Files:**
- Create: `src/app/api/email-logs/route.ts`
- Modify: tenant detail page to show email history

- [ ] **Step 1: Create email logs API**

Create `src/app/api/email-logs/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId')
  const status = req.nextUrl.searchParams.get('status')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (tenantId) where.tenantId = tenantId
  if (status) where.status = status

  const logs = await prisma.emailLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
    include: {
      tenant: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  return NextResponse.json(logs)
}
```

- [ ] **Step 2: Add email history tab to tenant detail view**

Show a table with: date, subject, template, status (with color badges: sent=blue, delivered=green, opened=teal, bounced=red, failed=red).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/email-logs/
git commit -m "feat(admin): email log viewer with delivery status tracking"
```

---

## Summary

| Phase | Feature | Tasks |
|---|---|---|
| 1 | Security foundation (CSP, sanitization, rate limiting, encryption) | 1-3 |
| 2 | Database schema + email infrastructure (Resend) | 4-7 (execute 6-7 first!) |
| 3 | Tenant registration flow (invite on creation + registration page) | 8-10 |
| 4 | Message email notifications (with smart throttling) | 11-12 |
| 5 | Quick-reply from email (no login needed) | 13 |
| 6 | Admin notifications (when tenant replies) | 14-15 |
| 7 | Automated notifications (ticket updates, dunning, welcome) | 16-18 |
| 8 | Email delivery tracking (Resend webhook) | 19 |
| 9 | DSGVO compliance (unsubscribe + consent) | 20 |
| 10 | Unanswered message escalation (AWS EventBridge cron) | 21 |
| 11 | Feature Request + Support tabs (admin sidebar) | 22 |
| 12 | Re-invite tenant + AWS infra + email log viewer | 23-25 |

### Security Measures Included

| Layer | Protection |
|---|---|
| **Transport** | TLS 1.3 enforced, HSTS preload |
| **Headers** | CSP, X-Frame-Options DENY, nosniff, XSS protection |
| **Auth** | SHA-256 hashed tokens, bcrypt(12) passwords, JWT httpOnly cookies |
| **Rate Limiting** | Auth: 5/15min, Magic links: 3/hour, Replies: 10/hour, Re-invite: 3/day |
| **Input** | XSS sanitization, null byte stripping, email validation, message length limits |
| **Encryption** | AES-256-GCM field-level (IBAN, tax ID), KMS for key management |
| **Database** | RDS encryption at rest, SSL enforced, private subnet, automated backups |
| **Files** | S3 SSE, versioning, no public access, encrypted uploads only |
| **Email** | Resend webhook signature verification, no email enumeration, DSGVO unsubscribe |
| **Audit** | Full audit log on every action with IP address tracking |
| **Backup** | Daily RDS snapshots (35 days), cross-region S3 replication, point-in-time recovery |
| **Network** | VPC isolation, WAF, security groups, no public DB access |
