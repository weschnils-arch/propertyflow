import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Du bist der "Property Agent" — der digitale Assistent für Automiq PropertyFlow, eine Immobilienverwaltungssoftware.

DEINE AUFGABE:
Du hilfst Nutzern (Verwalter, Mieter, Eigentümer) bei Fragen zur Plattform. Du antwortest auf Deutsch, freundlich und präzise.

FUNKTIONEN VON PROPERTYFLOW:
- Dashboard: Überblick über alle KPIs, Finanzen, offene Tickets, Sensorwarnungen
- Immobilien: Objekte verwalten (Adresse, Baujahr, Energieklasse, WEG-Daten)
- Einheiten: Wohnungen pro Objekt mit Miet- und NK-Kosten
- Mieter: Mieterdaten, Verträge, Zahlungshistorie, Bonität
- Techniker: Handwerker-Register mit Fachgebiet, Stundensatz, Bewertung
- Kommunikation: Threaded Messaging mit Mietern/Eigentümern/Dienstleistern
- Wartung: Ticket-System für Reparaturen (offen → zugewiesen → erledigt → Rechnung)
- Finanzen: Einnahmen/Ausgaben, BK-Abrechnung, Mahnwesen (4 Stufen)
- Dokumente: Revisionssicheres Archiv (Verträge, Rechnungen, Protokolle)
- Messtechnik: Zähler, Ablesungen, Verbrauchsanalyse
- Reporting: Portfolio-Analyse, Rückstände, CSV/PDF Export
- Automatisierung: Regeln für Auto-Zuweisung, Eskalation, Erinnerungen
- Smart Home: IoT-Sensoren (Rauchmelder, Türschlösser, Temperatur)
- Governance: Rollen & Rechte, Audit-Trail, DSGVO, Eigentümerversammlung
- Mieter-Portal: Tickets melden, Verbrauch einsehen, Dokumente, Kommunikation
- Techniker-Portal: Zugewiesene Aufträge, Foto-Upload, Auftragsabschluss

NAVIGATION:
- Sidebar links: Dashboard, Immobilien, Mieter, Techniker, Kommunikation, Wartung, Finanzen, Dokumente, Messtechnik, Reporting, Automatisierung, Smart Home, Governance, Einstellungen
- Mieter-Portal: /tenant-portal (separater Login-Bereich)
- Techniker-Portal: /technician-portal

HÄUFIGE FRAGEN:
- "Wie melde ich einen Schaden?" → Im Mieter-Portal unter "Neue Meldung" oder über Kommunikation → Nachricht an Verwaltung
- "Wo finde ich meine Abrechnung?" → Mieter-Portal → Dokumente oder Finanzen
- "Wie erstelle ich ein Ticket?" → Wartung → "Neues Ticket" Button oben rechts
- "Wie sende ich eine Massennachricht?" → Kommunikation → Megaphone-Icon oben rechts
- "Wie funktioniert das Mahnwesen?" → Automatisch: Erinnerung (7T) → 1. Mahnung (21T) → 2. Mahnung (35T) → Inkasso

REGELN:
- Antworte NUR zu PropertyFlow-Themen
- Bei Fragen außerhalb deines Bereichs: "Dazu kann ich leider keine Auskunft geben. Bitte kontaktieren Sie Ihre Hausverwaltung oder erstellen Sie ein Support-Ticket."
- Keine rechtliche Beratung geben
- Keine personenbezogenen Daten preisgeben
- Kurze, hilfreiche Antworten (max 3-4 Sätze wenn möglich)
- Verwende gelegentlich passende Emojis`

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  // If no API key, return a helpful fallback
  if (!apiKey) {
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''

    // Simple keyword-based responses as fallback
    if (lastUserMsg.includes('schaden') || lastUserMsg.includes('reparatur') || lastUserMsg.includes('kaputt')) {
      return NextResponse.json({ reply: 'Um einen Schaden zu melden, gehen Sie zu **Wartung** → **Neues Ticket** oben rechts. Beschreiben Sie das Problem, wählen Sie die Kategorie und Priorität. Ein Techniker wird automatisch zugewiesen. 🔧' })
    }
    if (lastUserMsg.includes('abrechnung') || lastUserMsg.includes('nebenkosten') || lastUserMsg.includes('betriebskosten')) {
      return NextResponse.json({ reply: 'Die Betriebskostenabrechnung finden Sie unter **Finanzen** → **BK-Abrechnung**. Im Mieter-Portal unter **Dokumente**. Die BK wird jährlich pro Einheit erstellt mit Verteilerschlüsseln (Fläche, Verbrauch, Personenzahl). 📊' })
    }
    if (lastUserMsg.includes('mahnung') || lastUserMsg.includes('zahlung') || lastUserMsg.includes('miete')) {
      return NextResponse.json({ reply: 'Das Mahnwesen läuft automatisch in 4 Stufen:\n1. Freundliche Erinnerung (7 Tage)\n2. 1. Mahnung (21 Tage)\n3. 2. Mahnung (35 Tage)\n4. Inkasso-Vorschlag\n\nDetails unter **Finanzen** → **Mahnwesen**. 💰' })
    }
    if (lastUserMsg.includes('ticket') || lastUserMsg.includes('meldung')) {
      return NextResponse.json({ reply: 'Tickets erstellen Sie unter **Wartung** → **Neues Ticket**. Wählen Sie Kategorie (Heizung, Sanitär, Elektrik etc.), Priorität und Beschreibung. Der Status wird automatisch verfolgt: Offen → Zugewiesen → In Arbeit → Erledigt. 🎫' })
    }
    if (lastUserMsg.includes('nachricht') || lastUserMsg.includes('kommunikation') || lastUserMsg.includes('kontakt')) {
      return NextResponse.json({ reply: 'Unter **Kommunikation** können Sie mit Mietern, Eigentümern und Dienstleistern chatten. Nutzen Sie Vorlagen für häufige Nachrichten und das Megaphone-Icon für Massenkommunikation. 💬' })
    }
    if (lastUserMsg.includes('dokument') || lastUserMsg.includes('vertrag') || lastUserMsg.includes('upload')) {
      return NextResponse.json({ reply: 'Dokumente verwalten Sie unter **Dokumente**. Upload per Drag & Drop. Kategorien: Vertrag, Rechnung, Protokoll, Versicherung, BK. Alle Dokumente sind revisionssicher archiviert (SHA-256 Hash). 📁' })
    }
    if (lastUserMsg.includes('hallo') || lastUserMsg.includes('hi') || lastUserMsg.includes('hey') || lastUserMsg.includes('guten')) {
      return NextResponse.json({ reply: 'Hallo! 👋 Wie kann ich Ihnen helfen? Ich kenne mich mit allen PropertyFlow-Funktionen aus — fragen Sie einfach!' })
    }

    return NextResponse.json({ reply: 'Ich bin der Property Agent und helfe Ihnen gerne bei Fragen zu PropertyFlow! 🏠\n\nBeispiele:\n• "Wie melde ich einen Schaden?"\n• "Wo finde ich meine Abrechnung?"\n• "Wie funktioniert das Mahnwesen?"\n\nWas möchten Sie wissen?' })
  }

  // With API key — use Claude
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    const data = await res.json()

    if (data.content?.[0]?.text) {
      return NextResponse.json({ reply: data.content[0].text })
    }

    return NextResponse.json({ reply: 'Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.' })
  } catch (err) {
    console.error('[Agent Chat] Error:', err)
    return NextResponse.json({ reply: 'Verbindungsfehler zum AI-Service. Bitte versuchen Sie es erneut.' })
  }
}
