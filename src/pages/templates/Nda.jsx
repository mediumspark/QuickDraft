import TemplatePageLayout from './TemplatePageLayout'

export default function Nda() {
  return (
    <TemplatePageLayout
      title="NDA Template for Collaborators"
      subtitle="Protect confidential information shared between game dev teammates, technical partners, and student project members."
      currentPath="/templates/nda"
      audiences={[
        'Game developers sharing unreleased builds, assets, or design docs with contractors',
        'Technical collaborators exchanging proprietary code or business plans',
        'College students protecting ideas before a pitch or class demo',
      ]}
      examples={[
        'Indie team sharing a pre-release game build with a playtester contractor',
        'Two students exchanging startup ideas before forming a project team',
        'Freelancer accessing confidential technical documentation for a side gig',
      ]}
      included={[
        'Party definitions',
        'Definition of confidential information',
        'Permitted use and exclusions',
        'Term and survival of obligations',
        'Return or destruction of materials',
        'Dispute resolution and governing law',
      ]}
    />
  )
}
