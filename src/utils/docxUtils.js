import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx'
import { buildAgreementText } from '@/utils/agreementUtils'

function isSectionHeading(line) {
  const trimmed = line.trim()
  return (
    trimmed.length > 3 &&
    trimmed === trimmed.toUpperCase() &&
    /^[A-Z0-9\s&'()\-–—.,]+$/.test(trimmed) &&
    !trimmed.startsWith('GENERATED')
  )
}

function lineToParagraph(line) {
  const trimmed = line.trim()

  if (!trimmed) {
    return new Paragraph({ spacing: { after: 80 } })
  }

  if (trimmed === '---') {
    return new Paragraph({
      spacing: { before: 160, after: 160 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
      },
    })
  }

  if (trimmed.startsWith('Generated:')) {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: trimmed, italics: true, size: 20, color: '666666' })],
    })
  }

  if (isSectionHeading(trimmed)) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: trimmed, bold: true, size: 24 })],
    })
  }

  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: line, size: 22 })],
  })
}

export async function downloadAgreementDocx(agreement, filename = 'agreement.docx') {
  const text = buildAgreementText(agreement)
  const lines = text.split('\n')

  const titleLine = lines.find((l) => l.trim()) || 'Agreement'
  const bodyLines = lines.filter((l, i) => !(i === 0 && l.trim() === titleLine))

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: titleLine, bold: true, size: 32 })],
    }),
    ...bodyLines.map((line) => lineToParagraph(line)),
  ]

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
