import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BOILERPLATE_LIST_PRICE_CENTS,
  getBoilerplatePriceCents,
  isBoilerplateOnSale,
  formatBoilerplatePrice,
  getBoilerplateSaleEndLabel,
} from '@/data/boilerplateProducts'

export default function BoilerplatePrice({
  size = 'md',
  showSaleBadge = true,
  showSaleNote = true,
  className,
}) {
  const onSale = isBoilerplateOnSale()
  const currentCents = getBoilerplatePriceCents()
  const currentPrice = formatBoilerplatePrice(currentCents)

  const priceSize = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  }[size]

  const listSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  }[size]

  return (
    <div className={cn('flex flex-col', className)}>
      {onSale && showSaleBadge && (
        <Badge className="w-fit mb-2">Launch sale</Badge>
      )}
      {onSale && (
        <p className={cn('text-muted-foreground line-through', listSize)}>
          {formatBoilerplatePrice(BOILERPLATE_LIST_PRICE_CENTS)}
        </p>
      )}
      <p className={cn('font-bold text-primary', priceSize)}>{currentPrice}</p>
      {onSale && showSaleNote && (
        <p className="text-xs text-muted-foreground mt-1">
          Sale price · ends {getBoilerplateSaleEndLabel()}
        </p>
      )}
      {!onSale && (
        <p className="text-sm text-muted-foreground mt-1">one-time download</p>
      )}
    </div>
  )
}

export function BoilerplatePriceInline({ className }) {
  const onSale = isBoilerplateOnSale()
  const current = formatBoilerplatePrice(getBoilerplatePriceCents())

  if (!onSale) return <span className={className}>{current}</span>

  return (
    <span className={className}>
      <span className="text-muted-foreground line-through mr-1.5">
        {formatBoilerplatePrice(BOILERPLATE_LIST_PRICE_CENTS)}
      </span>
      {current}
    </span>
  )
}
