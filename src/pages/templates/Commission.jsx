import TemplatePageLayout from './TemplatePageLayout'

export default function Commission() {
  return (
    <TemplatePageLayout
      title="Commission Agreement Template"
      subtitle="Pay percentage commissions on qualifying sales, referrals, or contract work — affordable for freelancers and student sales projects."
      currentPath="/templates/commission"
      audiences={[
        'Technical freelancers earning commissions on deals they source or close',
        'Student ambassadors or campus reps paid on referred sales',
        'Indie studios paying commission on publishing or distribution deals',
      ]}
      examples={[
        'Developer receiving 10% commission on enterprise contracts they bring in',
        'Campus rep earning commission on software subscriptions they refer',
        'Sales partner paid a percentage on qualifying transactions',
      ]}
      included={[
        'Party identification',
        'Commission rate and qualifying transaction definition',
        'Payment timing and reporting',
        'Agreement duration and termination',
        'Dispute resolution',
        'Custom clauses for exclusivity or territories',
      ]}
    />
  )
}
