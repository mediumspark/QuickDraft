/** Base / regular price shown as strikethrough or “reg.” */
export const BASE_PRICE_CENTS = 500 // $5.00

/** Live checkout price for every paid action and boilerplate */
export const CURRENT_PRICE_CENTS = 99 // $0.99

export function formatPrice(cents) {
  const dollars = cents / 100
  if (Number.isInteger(dollars)) return `$${dollars}`
  return `$${dollars.toFixed(2)}`
}

export function formatCurrentPrice() {
  return formatPrice(CURRENT_PRICE_CENTS)
}

export function formatBasePrice() {
  return formatPrice(BASE_PRICE_CENTS)
}
