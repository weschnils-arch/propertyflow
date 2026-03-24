'use client'

import { FileText, Download, Eye, Lock, FolderArchive } from 'lucide-react'

const DOCS = [
  { name: 'Mietvertrag_Mueller_Anna.pdf', category: 'Vertrag', date: '01.03.2022', size: '245 KB', archived: true },
  { name: 'BK_Abrechnung_2025.pdf', category: 'Abrechnung', date: '01.03.2026', size: '1.2 MB', archived: true },
  { name: 'Uebergabeprotokoll.pdf', category: 'Protokoll', date: '01.03.2022', size: '340 KB', archived: true },
  { name: 'Hausordnung.pdf', category: 'Allgemein', date: '15.01.2024', size: '89 KB', archived: false },
  { name: 'Nebenkostenaufstellung_2024.pdf', category: 'Abrechnung', date: '15.06.2025', size: '567 KB', archived: true },
]

export default function TenantDokumentePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dokumente</h1>
        <p className="text-muted-foreground text-sm mt-1">Ihre Verträge, Abrechnungen und Dokumente</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Dokument</th>
              <th className="text-left px-4 py-3">Kategorie</th>
              <th className="text-left px-4 py-3">Datum</th>
              <th className="text-left px-4 py-3">Größe</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {DOCS.map((doc, i) => (
              <tr key={i} className="table-row border-t border-border/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{doc.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="badge text-primary bg-primary/10 text-xs">{doc.category}</span></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{doc.date}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{doc.size}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-muted"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
