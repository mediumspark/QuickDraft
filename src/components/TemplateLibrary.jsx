import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { templates } from '@/data/templates'
import { getAgreementTypeLabel } from '@/utils/agreementUtils'
import { cn } from '@/lib/utils'

export default function TemplateLibrary({ open, onOpenChange, onSelect }) {
  const [filter, setFilter] = React.useState('')
  const [category, setCategory] = React.useState('all')

  const categories = ['all', 'revenue_sharing', 'profit_sharing', 'commission_based', 'nda', 'privacy_policy', 'eula']

  const filtered = templates.filter((t) => {
    const matchCat = category === 'all' || t.type === category
    const matchSearch =
      !filter ||
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.description.toLowerCase().includes(filter.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search templates..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat === 'all' ? 'All' : getAgreementTypeLabel(cat).replace(' Agreement', '').replace(' (NDA)', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <AnimatePresence>
            {filtered.map((template, i) => (
              <motion.button
                key={template.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  onSelect(template.data)
                  onOpenChange(false)
                }}
                className="rounded-lg border p-4 text-left hover:border-primary hover:bg-accent/50 transition-all"
              >
                <Badge variant="secondary" className="mb-2">
                  {getAgreementTypeLabel(template.type).replace(' Agreement', '')}
                </Badge>
                <h4 className="font-semibold">{template.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No templates match your search.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
