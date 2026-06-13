import jsPDF from 'jspdf'
import { buildAgreementText } from './agreementUtils'

const PAGE_WIDTH = 215.9
const PAGE_HEIGHT = 279.4
const MARGIN = 25.4
const LINE_HEIGHT = 6
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2

function isHeading(line) {
  return line === line.toUpperCase() && line.length > 3 && /^[A-Z\s&]+$/.test(line) && !line.startsWith('---')
}

export function generatePdf(agreement, signatures = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const text = buildAgreementText(agreement)
  const lines = text.split('\n')

  let y = MARGIN
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)

  lines.forEach((line) => {
    if (line === '---') {
      y += LINE_HEIGHT
      if (y > PAGE_HEIGHT - MARGIN) {
        doc.addPage()
        y = MARGIN
      }
      doc.setDrawColor(200)
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
      y += LINE_HEIGHT * 1.5
      return
    }

    if (isHeading(line)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
    }

    const wrapped = doc.splitTextToSize(line || ' ', MAX_WIDTH)
    wrapped.forEach((wl) => {
      if (y > PAGE_HEIGHT - MARGIN) {
        doc.addPage()
        y = MARGIN
      }
      doc.text(wl, MARGIN, y)
      y += LINE_HEIGHT
    })

    if (isHeading(line)) y += LINE_HEIGHT * 0.5
  })

  const sigEntries = Object.entries(signatures).filter(([, dataUrl]) => dataUrl)
  if (sigEntries.length) {
    doc.addPage()
    y = MARGIN
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('SIGNATURES', MARGIN, y)
    y += LINE_HEIGHT * 3

    sigEntries.forEach(([partyKey, dataUrl]) => {
      const label = partyKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
      if (y > PAGE_HEIGHT - MARGIN - 40) {
        doc.addPage()
        y = MARGIN
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(label, MARGIN, y)
      y += LINE_HEIGHT * 2

      try {
        doc.addImage(dataUrl, 'PNG', MARGIN, y, 60, 25)
        y += 30
      } catch {
        doc.setFont('helvetica', 'normal')
        doc.text('[Signature on file]', MARGIN, y)
        y += LINE_HEIGHT * 2
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, y)
      y += LINE_HEIGHT * 4
    })
  }

  return doc
}

export function downloadPdf(agreement, signatures = {}, filename = 'agreement-dealdraft-signed.pdf') {
  const doc = generatePdf(agreement, signatures)
  doc.save(filename)
}
