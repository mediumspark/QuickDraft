import { Badge } from '@/components/ui/badge'
import { AI_STATUS } from '@/data/writing'
import { cn } from '@/lib/utils'

const variants = {
  ai_free: 'default',
  ai_contributed: 'secondary',
  ai_generated: 'outline',
}

export default function AiBadge({ status, className }) {
  const meta = AI_STATUS[status] || AI_STATUS.ai_free
  return (
    <Badge variant={variants[status] || 'secondary'} className={cn(className)} title={meta.description}>
      {meta.label}
    </Badge>
  )
}
