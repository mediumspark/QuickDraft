import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'

const features = [
  'Free drafting and summary previews',
  '$5 = PDF download for one custom agreement',
  '$5 = shareable read-only link',
  '$5 = boilerplate Word document (.docx)',
  'Sign in with Google to save drafts across devices',
  'No subscriptions or credit packs',
]

export default function Pricing() {
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

        <div className="inline-block rounded-xl border bg-card p-8 shadow-sm max-w-md text-left mx-auto">
          <p className="text-5xl font-bold text-primary text-center">$5</p>
          <p className="text-muted-foreground mt-1 text-center">per document</p>
          <ul className="mt-6 space-y-2 text-sm">
            {features.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
          <div className="mt-4">
            <LegalDisclaimer variant="compact" />
          </div>
          <Link to="/builder" className="block mt-6">
            <Button className="w-full" size="lg">Start Drafting — Free</Button>
          </Link>
          <Link to="/boilerplates" className="block mt-3">
            <Button variant="outline" className="w-full" size="lg">Browse Word Boilerplates</Button>
          </Link>
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
