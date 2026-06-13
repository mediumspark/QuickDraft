import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

const steps = [
  { num: '1', title: 'Choose your agreement type', desc: 'Select from Revenue Sharing, Profit Sharing, Commission-Based, or NDA templates.' },
  { num: '2', title: 'Define the parties', desc: 'Enter names, roles, and addresses for Party A, Party B, and up to 4 additional partners.' },
  { num: '3', title: 'Set financial terms', desc: 'Configure percentages, payment frequency, thresholds, or commission rates.' },
  { num: '4', title: 'Add duration & dispute clauses', desc: 'Set start/end dates, auto-renewal, termination notice, and governing law.' },
  { num: '5', title: 'Customize with extra clauses', desc: 'Add free-text provisions for non-compete, IP ownership, or any special terms.' },
  { num: '6', title: 'Preview & sign', desc: 'Review the live document preview, draw signatures on the canvas, and download your PDF.' },
  { num: '7', title: 'Share or save', desc: 'Save to the cloud, create a read-only share link, or email summaries to partners.' },
]

export default function Guide() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-4">How to Use QuickDraft</h1>
          <p className="text-muted-foreground mb-10">
            Follow these steps to create a professional agreement in under 10 minutes.
          </p>

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

          <div className="mt-12 rounded-lg border bg-accent/50 p-6 text-center">
            <p className="font-medium mb-4">Ready to draft your first agreement?</p>
            <Link to="/builder">
              <Button size="lg">Open the Builder</Button>
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
