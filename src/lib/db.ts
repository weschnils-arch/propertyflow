import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const isVercel = !!process.env.VERCEL
const tmpDbPath = '/tmp/propertyflow.db'

function ensureDatabase() {
  if (!isVercel) return

  if (fs.existsSync(tmpDbPath)) return

  const db = new Database(tmpDbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const schema = `
CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY,"email" TEXT NOT NULL,"password" TEXT NOT NULL,"firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,"role" TEXT NOT NULL DEFAULT 'admin',"avatar" TEXT,"phone" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL);
CREATE TABLE IF NOT EXISTS "Property" ("id" TEXT NOT NULL PRIMARY KEY,"name" TEXT NOT NULL,"street" TEXT NOT NULL,"houseNumber" TEXT NOT NULL,"zipCode" TEXT NOT NULL,"city" TEXT NOT NULL,"country" TEXT NOT NULL DEFAULT 'Deutschland',"buildYear" INTEGER NOT NULL,"totalArea" REAL NOT NULL,"energyEfficiencyClass" TEXT NOT NULL,"insuranceNumber" TEXT,"insuranceExpiry" DATETIME,"contactName" TEXT,"contactEmail" TEXT,"contactPhone" TEXT,"notes" TEXT,"imageUrl" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL);
CREATE TABLE IF NOT EXISTS "Unit" ("id" TEXT NOT NULL PRIMARY KEY,"propertyId" TEXT NOT NULL,"designation" TEXT NOT NULL,"floor" INTEGER NOT NULL,"area" REAL NOT NULL,"rooms" INTEGER NOT NULL,"bathrooms" INTEGER NOT NULL DEFAULT 1,"hasBalcony" BOOLEAN NOT NULL DEFAULT false,"hasTerrace" BOOLEAN NOT NULL DEFAULT false,"rent" REAL NOT NULL,"utilityCost" REAL NOT NULL DEFAULT 0,"status" TEXT NOT NULL DEFAULT 'occupied',"notes" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Tenant" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT,"firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,"email" TEXT NOT NULL,"phone" TEXT,"mobile" TEXT,"dateOfBirth" DATETIME,"occupation" TEXT,"employer" TEXT,"netIncome" REAL,"creditScore" INTEGER,"notes" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Contract" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"unitId" TEXT NOT NULL,"startDate" DATETIME NOT NULL,"endDate" DATETIME,"monthlyRent" REAL NOT NULL,"utilityCost" REAL NOT NULL,"deposit" REAL NOT NULL DEFAULT 0,"specialTerms" TEXT,"status" TEXT NOT NULL DEFAULT 'active',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "Contract_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Payment" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"contractId" TEXT,"amount" REAL NOT NULL,"paymentDate" DATETIME NOT NULL,"dueDate" DATETIME NOT NULL,"type" TEXT NOT NULL DEFAULT 'rent',"method" TEXT,"reference" TEXT,"status" TEXT NOT NULL DEFAULT 'completed',"notes" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Sensor" ("id" TEXT NOT NULL PRIMARY KEY,"unitId" TEXT NOT NULL,"type" TEXT NOT NULL,"designation" TEXT NOT NULL,"serialNumber" TEXT NOT NULL,"installDate" DATETIME NOT NULL,"expiryDate" DATETIME,"status" TEXT NOT NULL DEFAULT 'active',"batteryLevel" INTEGER,"lastReading" REAL,"lastReadingAt" DATETIME,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Sensor_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "SensorData" ("id" TEXT NOT NULL PRIMARY KEY,"sensorId" TEXT NOT NULL,"unitId" TEXT NOT NULL,"value" REAL NOT NULL,"unit" TEXT NOT NULL,"timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "SensorData_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "SensorData_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Ticket" ("id" TEXT NOT NULL PRIMARY KEY,"propertyId" TEXT NOT NULL,"unitId" TEXT,"tenantId" TEXT,"technicianId" TEXT,"title" TEXT NOT NULL,"description" TEXT NOT NULL,"category" TEXT NOT NULL,"priority" TEXT NOT NULL DEFAULT 'medium',"status" TEXT NOT NULL DEFAULT 'open',"dueDate" DATETIME,"completedAt" DATETIME,"cost" REAL,"notes" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Ticket_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT "Ticket_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,CONSTRAINT "Ticket_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Technician" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT,"firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,"email" TEXT NOT NULL,"phone" TEXT,"specialization" TEXT NOT NULL,"availability" TEXT,"rating" REAL NOT NULL DEFAULT 5.0,"notes" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Technician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Alert" ("id" TEXT NOT NULL PRIMARY KEY,"sensorId" TEXT,"type" TEXT NOT NULL,"severity" TEXT NOT NULL,"title" TEXT NOT NULL,"message" TEXT NOT NULL,"isRead" BOOLEAN NOT NULL DEFAULT false,"isResolved" BOOLEAN NOT NULL DEFAULT false,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"resolvedAt" DATETIME,CONSTRAINT "Alert_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Billing" ("id" TEXT NOT NULL PRIMARY KEY,"propertyId" TEXT NOT NULL,"period" TEXT NOT NULL,"startDate" DATETIME NOT NULL,"endDate" DATETIME NOT NULL,"totalAmount" REAL NOT NULL,"status" TEXT NOT NULL DEFAULT 'draft',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL,CONSTRAINT "Billing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "BillingItem" ("id" TEXT NOT NULL PRIMARY KEY,"billingId" TEXT NOT NULL,"unitDesignation" TEXT NOT NULL,"tenantName" TEXT NOT NULL,"costType" TEXT NOT NULL,"quantity" REAL,"unitPrice" REAL,"total" REAL NOT NULL,CONSTRAINT "BillingItem_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Communication" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"type" TEXT NOT NULL,"subject" TEXT,"message" TEXT NOT NULL,"direction" TEXT NOT NULL DEFAULT 'inbound',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Communication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT,"propertyId" TEXT,"entityType" TEXT NOT NULL,"entityId" TEXT NOT NULL,"action" TEXT NOT NULL,"changes" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,CONSTRAINT "AuditLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_userId_key" ON "Tenant"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Sensor_serialNumber_key" ON "Sensor"("serialNumber");
CREATE INDEX IF NOT EXISTS "SensorData_sensorId_timestamp_idx" ON "SensorData"("sensorId","timestamp");
CREATE INDEX IF NOT EXISTS "SensorData_unitId_timestamp_idx" ON "SensorData"("unitId","timestamp");
CREATE UNIQUE INDEX IF NOT EXISTS "Technician_userId_key" ON "Technician"("userId");
`

  for (const stmt of schema.split('\n').filter(s => s.trim())) {
    db.exec(stmt)
  }
  db.close()
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
