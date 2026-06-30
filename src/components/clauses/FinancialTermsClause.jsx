import { CollapsibleSection } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function FinancialTermsClause({ type, financial, parties, onChange }) {
  const update = (field, val) => onChange({ ...financial, [field]: val })

  const additional = parties?.additional || []
  const isSharing = type === 'revenue_sharing' || type === 'profit_sharing'
  const isCommission = type === 'commission_based'
  const isNonFinancial = type === 'nda' || type === 'privacy_policy' || type === 'eula'

  const handlePercentChange = (field, val) => {
    const num = Math.min(100, Math.max(0, Number(val) || 0))
    const next = { ...financial, [field]: num }

    if (field === 'partyAPercent') {
      next.partyBPercent = Math.max(0, 100 - num - getAdditionalTotal())
    } else if (field === 'partyBPercent') {
      next.partyAPercent = Math.max(0, 100 - num - getAdditionalTotal())
    }

    onChange(next)
  }

  const getAdditionalTotal = () =>
    additional.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0)

  if (isNonFinancial) {
    const descriptions = {
      nda: 'Non-disclosure agreements typically do not include financial terms. Add custom clauses if compensation is required.',
      privacy_policy: 'Privacy policies do not include financial terms. Add custom clauses for payment or billing disclosures if needed.',
      eula: 'EULAs do not include financial terms. Add custom clauses for pricing or subscription terms if needed.',
    }
    const titles = {
      nda: 'Not applicable for NDAs',
      privacy_policy: 'Not applicable for Privacy Policies',
      eula: 'Not applicable for EULAs',
    }
    return (
      <CollapsibleSection title="Financial Terms" description={titles[type] || 'Not applicable'}>
        <p className="text-sm text-muted-foreground">
          {descriptions[type] || 'This document type does not include financial terms.'}
        </p>
      </CollapsibleSection>
    )
  }

  if (isCommission) {
    return (
      <CollapsibleSection title="Financial Terms" description="Commission structure">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="commission-rate">Commission Rate (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              min="0"
              max="100"
              value={financial.commissionRate ?? ''}
              onChange={(e) => update('commissionRate', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="commission-basis">Commission Basis</Label>
            <Textarea
              id="commission-basis"
              value={financial.commissionBasis || ''}
              onChange={(e) => update('commissionBasis', e.target.value)}
              placeholder="Describe qualifying transactions, e.g. all net sales of Product X"
            />
          </div>
        </div>
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection
      title="Financial Terms"
      description={type === 'profit_sharing' ? 'Profit distribution' : 'Revenue distribution'}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="gross-net">Calculation Basis</Label>
          <Select
            id="gross-net"
            value={financial.grossOrNet || 'gross'}
            onChange={(e) => update('grossOrNet', e.target.value)}
          >
            <option value="gross">Gross {type === 'profit_sharing' ? 'Profit' : 'Revenue'}</option>
            <option value="net">Net {type === 'profit_sharing' ? 'Profit' : 'Revenue'}</option>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="party-a-pct">Party A (%)</Label>
            <Input
              id="party-a-pct"
              type="number"
              min="0"
              max="100"
              value={financial.partyAPercent ?? ''}
              onChange={(e) => handlePercentChange('partyAPercent', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="party-b-pct">Party B (%)</Label>
            <Input
              id="party-b-pct"
              type="number"
              min="0"
              max="100"
              value={financial.partyBPercent ?? ''}
              onChange={(e) => handlePercentChange('partyBPercent', e.target.value)}
            />
          </div>
        </div>

        {additional.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Additional partners: {getAdditionalTotal()}% — Party A + B should total {100 - getAdditionalTotal()}%
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="payment-freq">Payment Frequency</Label>
            <Select
              id="payment-freq"
              value={financial.paymentFrequency || 'monthly'}
              onChange={(e) => update('paymentFrequency', e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="min-threshold">Minimum Threshold ($)</Label>
            <Input
              id="min-threshold"
              type="number"
              min="0"
              value={financial.minimumThreshold ?? ''}
              onChange={(e) => update('minimumThreshold', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}
