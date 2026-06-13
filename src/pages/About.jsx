import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-6">About QuickDraft</h1>
          <div className="prose prose-neutral space-y-4 text-muted-foreground">
            <p>
              QuickDraft was born from a simple frustration: drafting partnership agreements
              shouldn't require expensive legal consultations for every early-stage deal.
            </p>
            <p>
              Our mission is to democratize access to professional agreement drafting tools.
              Whether you're splitting revenue with a co-founder, setting up a commission
              structure with a sales partner, or protecting confidential information with an NDA,
              QuickDraft gives you the building blocks to create clear, comprehensive documents.
            </p>
            <h2 className="text-2xl font-semibold text-foreground mt-8">Our Story</h2>
            <p>
              Founded in 2024, QuickDraft started as an internal tool for a startup accelerator.
              Founders were spending thousands on basic revenue-sharing agreements before they
              even had product-market fit. We built QuickDraft to solve that problem — and
              opened it to everyone.
            </p>
            <h2 className="text-2xl font-semibold text-foreground mt-8">What We Believe</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Legal clarity shouldn't be a luxury</li>
              <li>Agreements should be living documents, not static PDFs</li>
              <li>Transparency builds better partnerships</li>
              <li>Always consult a lawyer for high-stakes deals</li>
            </ul>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
