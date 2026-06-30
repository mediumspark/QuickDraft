import { Link } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BoilerplatePriceInline } from '@/components/BoilerplatePrice'
import {
  boilerplateProducts,
  formatBoilerplatePrice,
  getBoilerplatePriceCents,
  isBoilerplateOnSale,
  BOILERPLATE_LIST_PRICE_CENTS,
  getBoilerplateSaleEndLabel,
} from '@/data/boilerplateProducts'

export default function Boilerplates() {
  const onSale = isBoilerplateOnSale()
  const salePrice = formatBoilerplatePrice(getBoilerplatePriceCents())

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Boilerplate Word Agreements</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Skip the builder. Purchase a ready-made agreement template and download it as an editable
            Word document (.docx).
            {onSale ? (
              <>
                {' '}Launch sale: <BoilerplatePriceInline /> each (reg.{' '}
                {formatBoilerplatePrice(BOILERPLATE_LIST_PRICE_CENTS)}) — ends{' '}
                {getBoilerplateSaleEndLabel()}.
              </>
            ) : (
              <> {salePrice} each, no subscription.</>
            )}
          </p>
        </div>

        <LegalDisclaimer variant="banner" className="mb-10 max-w-3xl mx-auto" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {boilerplateProducts.map((product) => (
            <Link
              key={product.id}
              to={`/boilerplates/${product.id}`}
              className="rounded-xl border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Word .docx</Badge>
                  {product.featured && <Badge>Most popular</Badge>}
                  {onSale && <Badge variant="outline">Sale</Badge>}
                </div>
                <span className="font-bold text-primary">
                  <BoilerplatePriceInline />
                </span>
              </div>
              <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                {product.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {product.highlights.slice(0, 2).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                <FileDown className="h-4 w-4" />
                View &amp; purchase
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-lg border bg-accent/40 p-6 text-center max-w-2xl mx-auto">
          <p className="font-medium mb-2">Want to customize first?</p>
          <p className="text-sm text-muted-foreground mb-4">
            Use the free builder to edit parties, terms, and clauses — then download as PDF.
          </p>
          <Link to="/builder">
            <Button variant="outline">Open Agreement Builder</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
