import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'

const steps = [
  { num: '1', title: 'Choose your agreement type', desc: 'Select from Revenue Sharing, Profit Sharing, Commission-Based, NDA, Privacy Policy, or EULA templates.' },
  { num: '2', title: 'Define the parties', desc: 'Enter names, roles, and addresses for Party A, Party B, and up to 4 additional partners.' },
  { num: '3', title: 'Set financial terms', desc: 'Configure percentages, payment frequency, thresholds, or commission rates.' },
  { num: '4', title: 'Add duration & dispute clauses', desc: 'Set start/end dates, auto-renewal, termination notice, and governing law.' },
  { num: '5', title: 'Customize with extra clauses', desc: 'Add free-text provisions for non-compete, IP ownership, or any special terms.' },
  { num: '6', title: 'Preview carefully', desc: 'Review the live document preview. Read every clause — these are templates, not lawyer-drafted agreements.' },
  { num: '7', title: 'Pay when you need more', desc: 'Pay $5 to download your PDF, share a link, or unlock editing on a saved draft. Present to your partners only after you have read it through.' },
]

export default function Guide() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-4">How to Use AQuickDraft</h1>
          <p className="text-muted-foreground mb-6">
            Follow these steps to create a partnership or revenue-sharing template in under 10 minutes.
            Built for game developers, technical collaborators, and students who need something fast and affordable.
          </p>
          <LegalDisclaimer variant="banner" className="mb-10" />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 rounded-lg border bg-accent/50 p-6">
            <p className="font-medium mb-4 text-center">Ready to draft your first agreement?</p>
            <LegalDisclaimer variant="compact" className="mb-4" />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/builder">
                <Button size="lg">Open the Builder</Button>
              </Link>
              <Link to="/templates/revenue-sharing">
                <Button variant="outline" size="lg">Revenue sharing template</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
