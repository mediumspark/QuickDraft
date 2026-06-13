import TemplatePageLayout from './TemplatePageLayout'

export default function ProfitSharing() {
  return (
    <TemplatePageLayout
      title="Profit Sharing Agreement Template"
      subtitle="Distribute profits after expenses among partners — ideal for side projects, joint ventures, and student startups."
      currentPath="/templates/profit-sharing"
      audiences={[
        'Technical co-founders splitting profits after operating costs',
        'Student teams sharing profits from a campus venture or hackathon project',
        'Small partnerships where net profit matters more than gross revenue',
      ]}
      examples={[
        'Side-project founders splitting quarterly profits after server and tool costs',
        'Student startup team dividing net profits from a campus business competition',
        'Joint venture partners with unequal capital and operations contributions',
      ]}
      included={[
        'Party definitions and roles',
        'Profit distribution percentages',
        'Expense handling and net profit basis',
        'Payment frequency and thresholds',
        'Term dates and termination notice',
        'Dispute resolution clauses',
        'Optional custom provisions',
      ]}
    />
  )
}
