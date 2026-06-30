import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'
import BoilerplatePrice from '@/components/BoilerplatePrice'
import {
  formatBoilerplatePrice,
  getBoilerplateSaleEndLabel,
  isBoilerplateOnSale,
  BOILERPLATE_LIST_PRICE_CENTS,
} from '@/data/boilerplateProducts'

const builderFeatures = [
  'Free drafting and summary previews',
  '$5 = PDF download for one custom agreement',
  '$5 = shareable read-only link',
  'Sign in with Google to save drafts across devices',
  'No subscriptions or credit packs',
]

export default function Pricing() {
  const onSale = isBoilerplateOnSale()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">Simple, student-friendly pricing</h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          Built for game developers, technical folks, and college students who need
          agreement templates without a lawyer bill. Pay only when you download or share.
        </p>
        <LegalDisclaimer variant="banner" className="mb-10 max-w-2xl mx-auto text-left" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
          <div className="rounded-xl border bg-card p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-1">Agreement Builder</h2>
            <p className="text-sm text-muted-foreground mb-4">Customize online, export PDF</p>
            <p className="text-5xl font-bold text-primary text-center">$5</p>
            <p className="text-muted-foreground mt-1 text-center text-sm">per download or share</p>
            <ul className="mt-6 space-y-2 text-sm">
              {builderFeatures.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <Link to="/builder" className="block mt-6">
              <Button className="w-full" size="lg">Start Drafting — Free</Button>
            </Link>
          </div>

          <div className="rounded-xl border-2 border-primary/20 bg-card p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-1">Word Boilerplates</h2>
            <p className="text-sm text-muted-foreground mb-4">Ready-made .docx templates</p>
            <div className="flex justify-center">
              <BoilerplatePrice size="lg" className="items-center" />
            </div>
            {onSale && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Regular price {formatBoilerplatePrice(BOILERPLATE_LIST_PRICE_CENTS)}.
                Launch sale ends {getBoilerplateSaleEndLabel()}.
              </p>
            )}
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ Editable Word document (.docx)</li>
              <li>✓ No builder required</li>
              <li>✓ Re-download free on same device</li>
              <li>✓ Revenue sharing, NDA, EULA &amp; more</li>
            </ul>
            <Link to="/boilerplates" className="block mt-6">
              <Button variant="outline" className="w-full" size="lg">Browse Word Boilerplates</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 max-w-md mx-auto">
          <LegalDisclaimer variant="compact" />
        </div>

        <p className="text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
          Re-downloading or re-copying the same link on your device is free after payment.
          Templates are not created by lawyers — read carefully before sharing.
        </p>

        <div className="mt-8">
          <Link to="/faq">
            <Button variant="outline">Read the FAQ</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
