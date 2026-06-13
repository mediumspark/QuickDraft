import TemplatePageLayout from './TemplatePageLayout'

export default function RevenueSharing() {
  return (
    <TemplatePageLayout
      title="Revenue Sharing Agreement Template"
      subtitle="Split gross or net revenue on a defined schedule — built for indie game teams, technical collaborators, and student ventures."
      currentPath="/templates/revenue-sharing"
      audiences={[
        'Game developers splitting Steam, console, or mobile revenue with co-devs and contractors',
        'Technical folks formalizing revenue splits on SaaS or side projects',
        'College students documenting revenue shares for class startups or club ventures',
      ]}
      examples={[
        'Indie game team splitting sales revenue with a composer or pixel artist',
        'Two founders sharing app store revenue on a student-built mobile game',
        'Contractor receiving a percentage of gross revenue from a product they helped build',
      ]}
      included={[
        'Party names, roles, and addresses',
        'Gross or net revenue basis',
        'Revenue split percentages',
        'Payment frequency and minimum thresholds',
        'Duration, termination, and auto-renewal',
        'Dispute resolution and governing law',
        'Custom clauses you add yourself',
      ]}
    />
  )
}
