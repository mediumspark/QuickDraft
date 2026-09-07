import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { faqItems } from '@/seo/structuredData'

export default function Faq() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-6">
          Answers about AQuickDraft templates, pricing, and who we built this for.
        </p>

        <div className="space-y-8">
          {faqItems.map((item) => (
            <section key={item.question}>
              <h2 className="text-lg font-semibold mb-2">{item.question}</h2>
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-lg border bg-accent/50 p-6 text-center">
          <p className="font-medium mb-4">Ready to draft your first agreement?</p>
          <Link to="/builder">
            <Button size="lg">Open the Builder — Free</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
