import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

const otherTemplates = [
  { href: '/templates/revenue-sharing', label: 'Revenue Sharing' },
  { href: '/templates/profit-sharing', label: 'Profit Sharing' },
  { href: '/templates/commission', label: 'Commission' },
  { href: '/templates/nda', label: 'NDA' },
]

export default function TemplatePageLayout({
  title,
  subtitle,
  audiences,
  included,
  examples,
  currentPath,
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-6">{subtitle}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Who this is for</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {audiences.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {examples?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Example use cases</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              {examples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">What&apos;s included</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            {included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border bg-accent/50 p-6 mb-8">
          <p className="font-medium mb-2">Drafting and reading are free.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Pay $0.99 to edit a saved draft, download a PDF, or share a read-only link for this agreement.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/builder">
              <Button size="lg">Start this template — Free</Button>
            </Link>
            <Link to="/guide">
              <Button variant="outline" size="lg">Read the guide</Button>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Other templates</h2>
          <div className="flex flex-wrap gap-2">
            {otherTemplates
              .filter((t) => t.href !== currentPath)
              .map((t) => (
                <Link key={t.href} to={t.href}>
                  <Button variant="outline" size="sm">{t.label}</Button>
                </Link>
              ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
