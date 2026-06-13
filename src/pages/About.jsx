import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-6">About AQuickDraft</h1>
          <div className="prose prose-neutral space-y-4 text-muted-foreground">
            <p>
              AQuickDraft was built for game developers, technical folks, and college students
              who need to formalize a partnership quickly — without paying hundreds of dollars
              for a basic revenue-sharing or commission agreement.
            </p>
            <p>
              Whether you are splitting game revenue with an artist, documenting a side-project
              equity split with a co-founder, or putting a class startup agreement on paper,
              AQuickDraft gives you editable templates to get started.
            </p>
            <LegalDisclaimer variant="banner" />

            <h2 className="text-2xl font-semibold text-foreground mt-8">Who we serve</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Game developers</strong> — revenue splits with contractors, composers, or co-devs</li>
              <li><strong>Technical folks</strong> — freelance collaborations, open-source side projects, contractor deals</li>
              <li><strong>College students</strong> — class projects, club ventures, and dorm-room startups on a budget</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8">Templates, not legal services</h2>
            <p>
              AQuickDraft provides agreement <strong>templates</strong> only. Our documents are not crafted,
              reviewed, or created by lawyers. They are starting points you fill in and customize.
              You should always read through your agreement carefully before presenting it to partners,
              investors, or anyone else.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8">What we believe</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Clear agreements help creative and technical collaborations succeed</li>
              <li>Students and indie devs deserve affordable tools</li>
              <li>Transparency builds better partnerships</li>
              <li>Templates are a starting point — not a replacement for a lawyer on important deals</li>
            </ul>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
