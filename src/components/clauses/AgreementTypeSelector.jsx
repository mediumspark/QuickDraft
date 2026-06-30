import { TrendingUp, PieChart, HandCoins, Shield, FileText, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPES = [
  {
    id: 'revenue_sharing',
    label: 'Revenue Sharing',
    description: 'Split gross or net revenue between partners on a defined schedule.',
    icon: TrendingUp,
  },
  {
    id: 'profit_sharing',
    label: 'Profit Sharing',
    description: 'Distribute profits according to agreed percentages after expenses.',
    icon: PieChart,
  },
  {
    id: 'commission_based',
    label: 'Commission-Based',
    description: 'Pay a percentage commission on qualifying sales or transactions.',
    icon: HandCoins,
  },
  {
    id: 'nda',
    label: 'NDA',
    description: 'Protect confidential information shared between parties.',
    icon: Shield,
  },
  {
    id: 'privacy_policy',
    label: 'Privacy Policy',
    description: 'Website or app policy describing how you collect and use data.',
    icon: FileText,
  },
  {
    id: 'eula',
    label: 'EULA',
    description: 'End User License Agreement for software or digital products.',
    icon: ScrollText,
  },
]

export default function AgreementTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TYPES.map(({ id, label, description, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary/50',
            value === id
              ? 'border-primary bg-accent ring-2 ring-primary/20'
              : 'border-border bg-card'
          )}
        >
          <div className={cn('rounded-md p-2', value === id ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-semibold">{label}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </button>
      ))}
    </div>
  )
}
