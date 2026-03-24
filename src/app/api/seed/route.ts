import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// ============================================================================
// REALISTIC GERMAN DATA POOLS
// ============================================================================

const STREETS = [
  'Hauptstraße', 'Berliner Straße', 'Gartenstraße', 'Bahnhofstraße', 'Schillerstraße',
  'Goethestraße', 'Mozartstraße', 'Friedrichstraße', 'Lindenstraße', 'Parkstraße',
  'Rosenweg', 'Am Markt', 'Kirchstraße', 'Schulstraße', 'Waldstraße',
  'Bergstraße', 'Industriestraße', 'Ringstraße', 'Sonnenweg', 'Eichenallee',
  'Bismarckstraße', 'Lessingstraße', 'Kantstraße', 'Herderstraße', 'Uhlandstraße',
  'Dorfstraße', 'Mühlenweg', 'Am Stadtpark', 'Neue Straße', 'Alte Landstraße',
  'Tulpenweg', 'Ahornstraße', 'Buchenweg', 'Kastanienallee', 'Birkenstraße',
  'Feldweg', 'Wiesenstraße', 'Am Hang', 'Seestraße', 'Uferweg',
]

const CITIES = [
  { city: 'Berlin', zip: '10' }, { city: 'Hamburg', zip: '20' }, { city: 'München', zip: '80' },
  { city: 'Köln', zip: '50' }, { city: 'Frankfurt', zip: '60' }, { city: 'Stuttgart', zip: '70' },
  { city: 'Düsseldorf', zip: '40' }, { city: 'Leipzig', zip: '04' }, { city: 'Dresden', zip: '01' },
  { city: 'Hannover', zip: '30' }, { city: 'Nürnberg', zip: '90' }, { city: 'Essen', zip: '45' },
  { city: 'Bremen', zip: '28' }, { city: 'Dortmund', zip: '44' }, { city: 'Bonn', zip: '53' },
  { city: 'Mannheim', zip: '68' }, { city: 'Augsburg', zip: '86' }, { city: 'Wiesbaden', zip: '65' },
  { city: 'Potsdam', zip: '14' }, { city: 'Rostock', zip: '18' },
]

const FIRST_NAMES = [
  'Anna', 'Maria', 'Sophie', 'Laura', 'Lena', 'Julia', 'Sarah', 'Lisa', 'Katharina', 'Emma',
  'Thomas', 'Michael', 'Stefan', 'Andreas', 'Christian', 'Markus', 'Daniel', 'Martin', 'Tobias', 'Jan',
  'Petra', 'Claudia', 'Sabine', 'Monika', 'Susanne', 'Nicole', 'Andrea', 'Birgit', 'Kerstin', 'Heike',
  'Peter', 'Wolfgang', 'Jürgen', 'Klaus', 'Frank', 'Uwe', 'Bernd', 'Ralf', 'Dirk', 'Matthias',
  'Elif', 'Fatima', 'Ayse', 'Ali', 'Mehmet', 'Hasan', 'Olga', 'Irina', 'Pavel', 'Dimitri',
]

const LAST_NAMES = [
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
  'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger',
  'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Lehmann', 'Schmid',
  'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter', 'Mayer', 'Huber', 'Kaiser', 'Fuchs',
  'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert', 'Vogel', 'Friedrich',
]

const OCCUPATIONS = [
  'Softwareentwickler/in', 'Lehrer/in', 'Kaufmann/-frau', 'Ingenieur/in', 'Krankenpfleger/in',
  'Bürokaufmann/-frau', 'Handwerker/in', 'Arzt/Ärztin', 'Verkäufer/in', 'Student/in',
  'Rentner/in', 'Selbstständig', 'Beamter/in', 'Erzieher/in', 'Architekt/in',
]

const PROPERTY_PREFIXES = [
  'Residenz', 'Haus', 'Wohnanlage', 'Stadthaus', 'Parkhaus', 'Hofgut', 'Villa',
  'Wohnpark', 'Domizil', 'Quartier', 'Lofts', 'Altbau', 'Neubau',
]

const PROPERTY_SUFFIXES = [
  'am Park', 'am See', 'im Grünen', 'an der Alster', 'am Marktplatz', 'am Stadtwald',
  'Mitte', 'Süd', 'Nord', 'West', 'Ost', 'Zentrum', 'am Ring',
]

const TICKET_TEMPLATES = [
  { title: 'Heizung defekt', desc: 'Heizung funktioniert nicht mehr, Wohnung wird nicht warm', cat: 'heating', pri: 'high' },
  { title: 'Wasserhahn tropft', desc: 'Wasserhahn in der Küche tropft durchgehend', cat: 'water', pri: 'medium' },
  { title: 'Steckdose defekt', desc: 'Steckdose im Wohnzimmer hat keinen Strom', cat: 'electrical', pri: 'medium' },
  { title: 'Fenster undicht', desc: 'Fenster im Schlafzimmer schließt nicht richtig, es zieht', cat: 'general', pri: 'low' },
  { title: 'Toilettenspülung läuft', desc: 'Spülkasten läuft ständig nach', cat: 'water', pri: 'high' },
  { title: 'Rauchmelder piept', desc: 'Rauchmelder in Flur piept alle 30 Sekunden', cat: 'smoke_detector', pri: 'medium' },
  { title: 'Heizkörper entlüften', desc: 'Heizkörper gluckert und wird nicht richtig warm', cat: 'heating', pri: 'low' },
  { title: 'Schimmel im Bad', desc: 'Schwarzer Schimmel an der Decke im Badezimmer', cat: 'general', pri: 'high' },
  { title: 'Türschloss klemmt', desc: 'Wohnungstür lässt sich nur schwer öffnen', cat: 'door_lock', pri: 'medium' },
  { title: 'Rolladen defekt', desc: 'Rolladen im Wohnzimmer lässt sich nicht mehr hochziehen', cat: 'general', pri: 'low' },
  { title: 'Warmwasser ausgefallen', desc: 'Kein Warmwasser seit heute Morgen', cat: 'water', pri: 'critical' },
  { title: 'Lichtschalter kaputt', desc: 'Lichtschalter im Flur reagiert nicht mehr', cat: 'electrical', pri: 'low' },
  { title: 'Rohr verstopft', desc: 'Abfluss in der Küche ist komplett verstopft', cat: 'water', pri: 'high' },
  { title: 'Balkon Geländer locker', desc: 'Balkongeländer wackelt bedenklich', cat: 'structural', pri: 'critical' },
  { title: 'Klingel defekt', desc: 'Türklingel funktioniert nicht mehr', cat: 'electrical', pri: 'low' },
]

const TECH_DATA = [
  { first: 'Marco', last: 'Rossi', spec: 'heating', company: 'Rossi Heiztechnik GmbH', rate: 65 },
  { first: 'Klaus', last: 'Bergmann', spec: 'plumbing', company: 'Bergmann Sanitär', rate: 60 },
  { first: 'Eva', last: 'Thiel', spec: 'electrical', company: 'Thiel Elektrotechnik', rate: 70 },
  { first: 'Hans', last: 'Weber', spec: 'general', company: 'Weber Hausmeisterservice', rate: 45 },
  { first: 'Lukas', last: 'Mayer', spec: 'structural', company: 'Mayer Bau GmbH', rate: 75 },
  { first: 'Ahmed', last: 'Yilmaz', spec: 'plumbing', company: 'Yilmaz Installationen', rate: 55 },
  { first: 'Petra', last: 'Richter', spec: 'smoke_detector', company: 'Richter Brandschutz', rate: 50 },
  { first: 'Stefan', last: 'Kraft', spec: 'heating', company: 'Kraft Wärmetechnik', rate: 68 },
  { first: 'Dirk', last: 'Schulze', spec: 'electrical', company: 'Schulze & Söhne Elektrik', rate: 72 },
  { first: 'Oliver', last: 'Brandt', spec: 'general', company: 'Brandt Facility Services', rate: 48 },
]

// ============================================================================
// HELPERS
// ============================================================================

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randFloat(min: number, max: number) { return Math.round((Math.random() * (max - min) + min) * 100) / 100 }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)] }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d }
function monthsAgo(n: number) { const d = new Date(); d.setMonth(d.getMonth() - n); return d }

let meterCounter = 0
let usedNames = new Set<string>()
function uniqueName(): { first: string; last: string } {
  let attempts = 0
  while (attempts < 100) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const key = `${first}_${last}`
    if (!usedNames.has(key)) {
      usedNames.add(key)
      return { first, last }
    }
    attempts++
  }
  // fallback with number suffix
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  usedNames.add(`${first}_${last}_${usedNames.size}`)
  return { first, last }
}

function generatePropertyName(i: number): string {
  if (i < PROPERTY_PREFIXES.length * PROPERTY_SUFFIXES.length) {
    const prefix = PROPERTY_PREFIXES[i % PROPERTY_PREFIXES.length]
    const suffix = PROPERTY_SUFFIXES[Math.floor(i / PROPERTY_PREFIXES.length) % PROPERTY_SUFFIXES.length]
    return `${prefix} ${suffix}`
  }
  return `${pick(PROPERTY_PREFIXES)} ${pick(STREETS).split('straße')[0] || pick(PROPERTY_SUFFIXES)}`
}

// ============================================================================
// MAIN SEED
// ============================================================================

export async function POST() {
  try {
    // Reset counters
    meterCounter = 0
    usedNames = new Set<string>()

    // Clear all tables
    await prisma.$transaction([
      prisma.meterReading.deleteMany(),
      prisma.meter.deleteMany(),
      prisma.attachment.deleteMany(),
      prisma.document.deleteMany(),
      prisma.agendaItem.deleteMany(),
      prisma.meetingAttendee.deleteMany(),
      prisma.meeting.deleteMany(),
      prisma.ticketStatusHistory.deleteMany(),
      prisma.communication.deleteMany(),
      prisma.billingItem.deleteMany(),
      prisma.billing.deleteMany(),
      prisma.dunningStep.deleteMany(),
      prisma.consent.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.expense.deleteMany(),
      prisma.bankTransaction.deleteMany(),
      prisma.scheduledReminder.deleteMany(),
      prisma.automationRule.deleteMany(),
      prisma.messageTemplate.deleteMany(),
      prisma.sensorData.deleteMany(),
      prisma.alert.deleteMany(),
      prisma.sensor.deleteMany(),
      prisma.ticket.deleteMany(),
      prisma.contract.deleteMany(),
      prisma.propertyOwner.deleteMany(),
      prisma.owner.deleteMany(),
      prisma.tenant.deleteMany(),
      prisma.technician.deleteMany(),
      prisma.unit.deleteMany(),
      prisma.property.deleteMany(),
      prisma.session.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.user.deleteMany(),
      prisma.mandant.deleteMany(),
    ])

    // --- MANDANT ---
    const mandant = await prisma.mandant.create({
      data: {
        name: 'Hendrik Immobilien',
        legalName: 'Hendrik Immobilienverwaltung GmbH',
        taxId: 'DE123456789',
        street: 'Kurfürstendamm 100',
        zipCode: '10711',
        city: 'Berlin',
        email: 'info@hendrik-immo.de',
        phone: '+49 30 12345678',
        bankName: 'Deutsche Bank',
        iban: 'DE89370400440532013000',
        bic: 'DEUTDEDB',
      },
    })

    // --- TEST USERS (password: "test123" for all) ---
    const hashedPassword = await import('bcryptjs').then(b => b.hashSync('test123', 10))

    await prisma.user.create({
      data: {
        email: 'admin@automiq.de',
        password: hashedPassword,
        firstName: 'Hendrik',
        lastName: 'Verwaltung',
        role: 'admin',
        mandantId: mandant.id,
      },
    })

    // Tenant test user — will be linked to first tenant created later
    const tenantUser = await prisma.user.create({
      data: {
        email: 'mieter@automiq.de',
        password: hashedPassword,
        firstName: 'Anna',
        lastName: 'Müller',
        role: 'tenant',
        mandantId: mandant.id,
      },
    })

    // --- TECHNICIANS ---
    const technicians = await Promise.all(
      TECH_DATA.map(t =>
        prisma.technician.create({
          data: {
            firstName: t.first,
            lastName: t.last,
            email: `${t.first.toLowerCase()}.${t.last.toLowerCase()}@technik.de`,
            phone: `+49 ${rand(151, 179)} ${rand(1000000, 9999999)}`,
            company: t.company,
            specialization: t.spec,
            hourlyRate: t.rate,
            rating: randFloat(3.5, 5.0),
            mandantId: mandant.id,
          },
        })
      )
    )

    // --- OWNERS ---
    const owners = await Promise.all(
      Array.from({ length: 30 }, () => {
        const { first, last } = uniqueName()
        return prisma.owner.create({
          data: {
            firstName: first,
            lastName: last,
            email: `${first.toLowerCase()}.${last.toLowerCase()}@eigentümer.de`,
            phone: `+49 ${rand(151, 179)} ${rand(1000000, 9999999)}`,
            mandantId: mandant.id,
          },
        })
      })
    )

    // --- 200 PROPERTIES ---
    const propertyIds: string[] = []
    const unitIds: string[] = []
    const tenantIds: string[] = []
    const contractIds: string[] = []

    for (let i = 0; i < 200; i++) {
      const cityData = CITIES[i % CITIES.length]
      const unitsCount = rand(2, 12)
      const isWEG = i % 5 === 0 // every 5th property is WEG
      const buildYear = rand(1955, 2023)

      const property = await prisma.property.create({
        data: {
          mandantId: mandant.id,
          name: generatePropertyName(i),
          street: STREETS[i % STREETS.length],
          houseNumber: `${rand(1, 150)}${rand(0, 3) === 0 ? pick(['a', 'b', 'c']) : ''}`,
          zipCode: `${cityData.zip}${rand(100, 999)}`,
          city: cityData.city,
          buildYear,
          totalArea: unitsCount * randFloat(45, 95),
          energyEfficiencyClass: pick(['A+', 'A', 'B', 'B', 'C', 'C', 'D', 'E']),
          propertyType: isWEG ? 'weg' : 'rental',
          insuranceNumber: `VN-${rand(100000, 999999)}`,
          insuranceExpiry: new Date(`${2026 + rand(0, 3)}-${String(rand(1, 12)).padStart(2, '0')}-01`),
          reserveBalance: isWEG ? randFloat(5000, 80000) : 0,
          reserveTarget: isWEG ? randFloat(50000, 150000) : 0,
        },
      })
      propertyIds.push(property.id)

      // Assign owner
      await prisma.propertyOwner.create({
        data: {
          propertyId: property.id,
          ownerId: owners[i % owners.length].id,
          share: 100,
          since: new Date(`${buildYear}-01-01`),
        },
      })

      // --- UNITS for this property ---
      for (let u = 0; u < unitsCount; u++) {
        const area = randFloat(35, 120)
        const rooms = area < 50 ? rand(1, 2) : area < 75 ? rand(2, 3) : rand(3, 5)
        const rent = Math.round(area * randFloat(8, 18)) // €/m² range
        const isVacant = Math.random() < 0.06 // ~6% vacancy
        const isRenovation = !isVacant && Math.random() < 0.02

        const unit = await prisma.unit.create({
          data: {
            propertyId: property.id,
            designation: unitsCount <= 4 ? `${pick(['EG', '1.OG', '2.OG', 'DG'])} ${pick(['Links', 'Rechts', 'Mitte'])}` : `Wohnung ${u + 1}`,
            floor: Math.min(u, 5),
            area,
            rooms,
            bathrooms: rooms >= 4 ? 2 : 1,
            hasBalcony: Math.random() > 0.4,
            hasTerrace: u === 0 && Math.random() > 0.7,
            rent,
            utilityCost: Math.round(area * randFloat(2.5, 4.5)),
            status: isVacant ? 'vacant' : isRenovation ? 'renovation' : 'occupied',
          },
        })
        unitIds.push(unit.id)

        // --- TENANT + CONTRACT for occupied units ---
        if (!isVacant && !isRenovation) {
          const { first, last } = uniqueName()
          const tenant = await prisma.tenant.create({
            data: {
              firstName: first,
              lastName: last,
              email: `${first.toLowerCase()}.${last.toLowerCase().replace('ü', 'ue').replace('ö', 'oe').replace('ä', 'ae')}@email.de`,
              phone: `+49 ${rand(151, 179)} ${rand(1000000, 9999999)}`,
              occupation: pick(OCCUPATIONS),
              netIncome: randFloat(1800, 6500),
              creditScore: rand(550, 850),
            },
          })
          tenantIds.push(tenant.id)

          // Link first tenant to test user
          if (tenantIds.length === 1) {
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { userId: tenantUser.id, firstName: 'Anna', lastName: 'Müller', email: 'mieter@automiq.de' },
            })
          }

          const startDate = monthsAgo(rand(3, 72))
          const contract = await prisma.contract.create({
            data: {
              tenantId: tenant.id,
              unitId: unit.id,
              startDate,
              monthlyRent: rent,
              utilityCost: Math.round(area * randFloat(2.5, 4.5)),
              deposit: rent * 3,
              depositPaid: rent * 3,
              status: 'active',
            },
          })
          contractIds.push(contract.id)

          // --- PAYMENTS (last 12 months) ---
          const paymentData = []
          for (let m = 0; m < 12; m++) {
            const due = new Date()
            due.setMonth(due.getMonth() - m)
            due.setDate(1)
            const isOverdue = m === 0 && Math.random() < 0.08 // ~8% current month overdue
            const isPending = m === 0 && !isOverdue && Math.random() < 0.05
            paymentData.push({
              tenantId: tenant.id,
              contractId: contract.id,
              amount: rent + Math.round(area * randFloat(2.5, 4.5)),
              dueDate: due,
              paymentDate: isOverdue || isPending ? due : new Date(due.getTime() + rand(0, 5) * 86400000),
              type: 'rent' as const,
              method: pick(['bank_transfer', 'direct_debit', 'bank_transfer']),
              reference: `MIETE-${first[0]}${last[0]}-${String(due.getMonth() + 1).padStart(2, '0')}/${due.getFullYear()}`,
              status: isOverdue ? 'overdue' : isPending ? 'pending' : 'completed',
            })
          }
          await prisma.payment.createMany({ data: paymentData })

          // --- METERS (2-3 per unit) ---
          const meterTypes = pickN(['water_cold', 'water_warm', 'electricity', 'heating', 'gas'], rand(2, 4))
          for (const mType of meterTypes) {
            const meter = await prisma.meter.create({
              data: {
                unitId: unit.id,
                meterNumber: `${mType.substring(0, 3).toUpperCase()}-${String(++meterCounter).padStart(6, '0')}`,
                type: mType,
                location: pick(['Küche', 'Bad', 'Keller', 'Flur', 'Hauswirtschaftsraum']),
                installDate: monthsAgo(rand(12, 120)),
                calibrationDue: new Date(`${2026 + rand(0, 5)}-${String(rand(1, 12)).padStart(2, '0')}-01`),
              },
            })

            // --- METER READINGS (last 12 months) ---
            let lastVal = mType === 'electricity' ? rand(1000, 5000) : mType.includes('water') ? rand(10, 100) : rand(500, 3000)
            const readings = []
            for (let m = 11; m >= 0; m--) {
              const increment = mType === 'electricity' ? rand(150, 400) : mType.includes('water') ? rand(2, 8) : rand(50, 200)
              lastVal += increment
              readings.push({
                meterId: meter.id,
                unitId: unit.id,
                value: lastVal,
                readingDate: monthsAgo(m),
                readBy: 'system',
                reason: 'regular' as const,
              })
            }
            await prisma.meterReading.createMany({ data: readings })
          }
        }
      }

      // --- EXPENSES for this property (last 12 months) ---
      const expenseData = []
      for (let m = 0; m < 12; m++) {
        // Monthly management fee
        expenseData.push({
          propertyId: property.id,
          category: 'management',
          description: `Verwaltungsgebühr ${new Date(monthsAgo(m)).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
          amount: unitsCount * rand(20, 35),
          date: monthsAgo(m),
          isDeductible: true,
        })
        // Random maintenance expense ~30% of months
        if (Math.random() < 0.3) {
          expenseData.push({
            propertyId: property.id,
            category: 'maintenance',
            description: pick(['Treppenhausreinigung', 'Gartenpflege', 'Winterdienst', 'Schornsteinfeger', 'Aufzugwartung', 'Heizungswartung']),
            amount: randFloat(80, 1200),
            date: monthsAgo(m),
            vendor: pick(TECH_DATA).company,
            isDeductible: true,
          })
        }
      }
      // Annual insurance
      expenseData.push({
        propertyId: property.id,
        category: 'insurance',
        description: 'Gebäudeversicherung Jahresbeitrag',
        amount: unitsCount * rand(150, 350),
        date: monthsAgo(rand(0, 11)),
        isDeductible: true,
      })
      await prisma.expense.createMany({ data: expenseData })
    }

    // --- TICKETS (spread across properties) ---
    const ticketData = []
    for (let t = 0; t < 150; t++) {
      const template = pick(TICKET_TEMPLATES)
      const propIdx = rand(0, propertyIds.length - 1)
      const isCompleted = Math.random() < 0.5
      const isInProgress = !isCompleted && Math.random() < 0.4
      const status = isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'open'
      ticketData.push({
        propertyId: propertyIds[propIdx],
        unitId: unitIds[rand(0, unitIds.length - 1)],
        tenantId: tenantIds.length > 0 ? tenantIds[rand(0, tenantIds.length - 1)] : undefined,
        technicianId: status !== 'open' ? technicians[rand(0, technicians.length - 1)].id : undefined,
        title: template.title,
        description: template.desc,
        category: template.cat,
        priority: template.pri,
        status,
        costEstimate: rand(50, 800),
        costActual: isCompleted ? randFloat(40, 600) : undefined,
        completedAt: isCompleted ? daysAgo(rand(1, 60)) : undefined,
        rating: isCompleted && Math.random() > 0.3 ? rand(3, 5) : undefined,
        createdAt: daysAgo(rand(1, 90)),
      })
    }
    await prisma.ticket.createMany({ data: ticketData })

    // --- ALERTS ---
    const alertData = [
      { type: 'payment', severity: 'warning', title: 'Überfällige Zahlungen', message: '12 Mieter mit überfälligen Zahlungen', isRead: false },
      { type: 'maintenance', severity: 'critical', title: 'Kritisches Ticket', message: 'Warmwasserausfall in Residenz am Park — sofortige Maßnahme erforderlich', isRead: false },
      { type: 'anomaly', severity: 'warning', title: 'Verbrauchsanomalie', message: 'Stromverbrauch 180% über Durchschnitt in Wohnanlage Mitte, Whg 7', isRead: false },
      { type: 'maintenance', severity: 'info', title: 'Wartung fällig', message: '8 Heizungswartungen im nächsten Monat fällig', isRead: true },
      { type: 'dunning', severity: 'warning', title: 'Mahnstufe 2 erreicht', message: '3 Mieter haben Mahnstufe 2 erreicht — Prüfung empfohlen', isRead: false },
      { type: 'automation', severity: 'info', title: 'Versicherungen laufen aus', message: '5 Gebäudeversicherungen laufen in den nächsten 90 Tagen aus', isRead: false },
      { type: 'sensor_failure', severity: 'critical', title: 'Rauchmelder offline', message: '3 Rauchmelder in Haus Bergstraße seit 48h ohne Signal', isRead: false },
      { type: 'payment', severity: 'info', title: 'Zahlungseingang', message: '47 Mietzahlungen für März 2026 erfolgreich verbucht', isRead: true },
    ]
    await prisma.alert.createMany({ data: alertData })

    // --- MESSAGE TEMPLATES ---
    await prisma.messageTemplate.createMany({
      data: [
        { mandantId: mandant.id, name: 'Willkommen Neumieter', category: 'welcome', subject: 'Willkommen in Ihrem neuen Zuhause!', body: 'Sehr geehrte/r {{tenant_name}},\n\nwir freuen uns, Sie als Mieter/in in {{property_address}}, {{unit}} begrüßen zu dürfen.\n\nBei Fragen stehen wir Ihnen jederzeit zur Verfügung.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung' },
        { mandantId: mandant.id, name: 'Zahlungserinnerung (freundlich)', category: 'payment_reminder', subject: 'Erinnerung: Mietzahlung', body: 'Sehr geehrte/r {{tenant_name}},\n\nwir möchten Sie freundlich daran erinnern, dass die Mietzahlung für {{month}} in Höhe von {{amount}} € noch aussteht.\n\nBitte überweisen Sie den Betrag zeitnah.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung' },
        { mandantId: mandant.id, name: '1. Mahnung', category: 'dunning', subject: '1. Mahnung — Mietrückstand', body: 'Sehr geehrte/r {{tenant_name}},\n\ntrotz unserer Erinnerung vom {{reminder_date}} konnten wir leider keinen Zahlungseingang für die Miete der {{unit}}, {{property_address}} feststellen.\n\nDer offene Betrag beläuft sich auf {{amount}} €.\n\nBitte begleichen Sie diesen innerhalb von 14 Tagen.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung' },
        { mandantId: mandant.id, name: '2. Mahnung', category: 'dunning', subject: '2. Mahnung — Mietrückstand', body: 'Sehr geehrte/r {{tenant_name}},\n\nleider ist Ihre Miete für {{unit}} weiterhin offen ({{amount}} €). Dies ist unsere zweite Mahnung.\n\nSollte innerhalb von 7 Tagen kein Zahlungseingang erfolgen, behalten wir uns weitere rechtliche Schritte vor.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung' },
        { mandantId: mandant.id, name: 'Letzte Mahnung', category: 'dunning', subject: 'Letzte Mahnung vor Inkasso', body: 'Sehr geehrte/r {{tenant_name}},\n\ndies ist unsere letzte Mahnung bezüglich des offenen Betrags von {{amount}} €.\n\nSollte innerhalb von 5 Werktagen kein Zahlungseingang erfolgen, werden wir den Vorgang an ein Inkassounternehmen übergeben.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung' },
        { mandantId: mandant.id, name: 'Reparatur bestätigt', category: 'maintenance', subject: 'Ihre Reparaturanfrage — Bestätigung', body: 'Sehr geehrte/r {{tenant_name}},\n\nvielen Dank für Ihre Meldung bezüglich "{{ticket_title}}".\n\nWir haben einen Techniker beauftragt. Voraussichtlicher Termin: {{scheduled_date}}.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung' },
        { mandantId: mandant.id, name: 'BK-Abrechnung verfügbar', category: 'bk', subject: 'Ihre Betriebskostenabrechnung {{year}}', body: 'Sehr geehrte/r {{tenant_name}},\n\nIhre Betriebskostenabrechnung für {{year}} ist erstellt.\n\nErgebnis: {{balance_type}} in Höhe von {{amount}} €.\n\nDie Abrechnung steht in Ihrem Mieterportal zum Download bereit.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung' },
      ],
    })

    // --- SEED COMMUNICATIONS for first 20 tenants ---
    const tenantsWithContracts = await prisma.tenant.findMany({
      take: 20,
      include: {
        contracts: {
          where: { status: 'active' },
          include: { unit: { include: { property: true } } },
          take: 1,
        },
        tickets: { where: { status: { in: ['open', 'in_progress'] } }, take: 1 },
      },
    })

    const commMessages = [
      { msg: 'Guten Tag, seit gestern Abend funktioniert meine Heizung nicht mehr. Können Sie bitte einen Techniker schicken?', role: 'tenant', dir: 'inbound' },
      { msg: 'Vielen Dank für Ihre Meldung. Wir haben einen Techniker beauftragt. Er wird sich morgen zwischen 9-12 Uhr bei Ihnen melden.', role: 'admin', dir: 'outbound' },
      { msg: 'Können Sie mir die Betriebskostenabrechnung für 2025 nochmal zusenden? Ich finde sie nicht im Portal.', role: 'tenant', dir: 'inbound' },
      { msg: 'Mein Wasserhahn in der Küche tropft seit einer Woche. Bitte um Reparatur.', role: 'tenant', dir: 'inbound' },
      { msg: 'Die Treppenhausbeleuchtung im 2. OG ist ausgefallen.', role: 'tenant', dir: 'inbound' },
      { msg: 'Wann wird die Nebenkostenabrechnung für 2025 erstellt?', role: 'tenant', dir: 'inbound' },
      { msg: 'Meine Miete wird ab nächsten Monat von einem neuen Konto überwiesen. Die neue IBAN ist DE89 3704 0044 0532 0130 00.', role: 'tenant', dir: 'inbound' },
      { msg: 'Vielen Dank für die Information. Wir haben die neue Bankverbindung notiert.', role: 'admin', dir: 'outbound' },
      { msg: 'Reparatur ist abgeschlossen. Rechnung folgt per Post.', role: 'technician', dir: 'inbound' },
      { msg: 'Sehr geehrte Frau Müller, Ihre Betriebskostenabrechnung steht jetzt im Portal zum Download bereit.', role: 'admin', dir: 'outbound' },
    ]

    const commData = []
    for (let i = 0; i < tenantsWithContracts.length; i++) {
      const t = tenantsWithContracts[i]
      const numMessages = rand(1, 4)
      for (let m = 0; m < numMessages; m++) {
        const template = commMessages[(i * 3 + m) % commMessages.length]
        commData.push({
          tenantId: t.id,
          ticketId: t.tickets[0]?.id || null,
          channel: 'tenant',
          type: 'chat',
          message: template.msg,
          direction: template.dir,
          senderRole: template.role,
          senderName: template.role === 'tenant' ? `${t.firstName} ${t.lastName}` :
                      template.role === 'technician' ? 'Marco Rossi' : 'Hendrik Verwaltung',
          isRead: template.dir === 'outbound' || Math.random() > 0.3,
          createdAt: daysAgo(rand(0, 14)),
        })
      }
    }
    await prisma.communication.createMany({ data: commData })

    // Count stats
    const stats = {
      properties: await prisma.property.count(),
      units: await prisma.unit.count(),
      tenants: await prisma.tenant.count(),
      contracts: await prisma.contract.count(),
      technicians: await prisma.technician.count(),
      owners: await prisma.owner.count(),
      payments: await prisma.payment.count(),
      tickets: await prisma.ticket.count(),
      meters: await prisma.meter.count(),
      meterReadings: await prisma.meterReading.count(),
      expenses: await prisma.expense.count(),
      templates: await prisma.messageTemplate.count(),
      alerts: await prisma.alert.count(),
    }

    return NextResponse.json({
      success: true,
      message: `Demo-Daten erfolgreich erstellt! ${stats.properties} Properties, ${stats.units} Einheiten, ${stats.tenants} Mieter.`,
      stats,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
