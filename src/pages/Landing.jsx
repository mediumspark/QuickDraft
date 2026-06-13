import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Blocks, Eye, FileDown, Share2, TrendingUp, PieChart, HandCoins,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const features = [
  { icon: Blocks, title: 'Modular Clause Builder', desc: 'Stack parties, financial terms, duration, and custom clauses like building blocks.' },
  { icon: Eye, title: 'Live Document Preview', desc: 'See your agreement update in real time with professional serif formatting.' },
  { icon: FileDown, title: 'Download as PDF', desc: 'Export a signed, paginated PDF ready for signatures and records.' },
  { icon: Share2, title: 'Share a Read-Only Link', desc: 'Send a secure link so partners can review and sign remotely.' },
]

const agreementTypes = [
  { icon: TrendingUp, title: 'Revenue Sharing', desc: 'Split gross or net revenue on a defined schedule.' },
  { icon: PieChart, title: 'Profit Sharing', desc: 'Distribute profits after expenses among partners.' },
  { icon: HandCoins, title: 'Commission-Based', desc: 'Pay percentage commissions on qualifying transactions.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div {...fadeIn}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
              Draft revenue &amp; profit-sharing agreements in minutes
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              QuickDraft helps founders and partners create professional legal agreements
              without the hourly legal fees. Build, preview, sign, and share — all in one place.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Drafting is free. Pay $5 per document to download or share — no account required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/builder">
                <Button size="lg" className="w-full sm:w-auto">Start Drafting — Free</Button>
              </Link>
              <Link to="/guide">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">How It Works</Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <motion.div {...fadeIn} className="text-center mb-12">
              <h2 className="text-3xl font-bold">Everything you need to draft agreements</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="rounded-md bg-accent p-2 w-fit">
                        <f.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Agreement Types */}
        <section id="agreements" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div {...fadeIn} className="text-center mb-12">
              <h2 className="text-3xl font-bold">Agreement types we support</h2>
              <p className="text-muted-foreground mt-2">Plus NDAs and fully custom clauses</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {agreementTypes.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg border p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                    <a.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{a.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-muted/30 py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-bold">Simple pay-as-you-go pricing</h2>
              <p className="text-muted-foreground mt-2 mb-10">No subscriptions. No accounts. Pay only when you download or share.</p>
              <div className="inline-block rounded-xl border bg-card p-8 shadow-sm max-w-sm">
                <p className="text-5xl font-bold text-primary">$5</p>
                <p className="text-muted-foreground mt-1">per document</p>
                <ul className="mt-6 space-y-2 text-sm text-left">
                  <li>✓ $5 = PDF download for one agreement</li>
                  <li>✓ $5 = shareable read-only link</li>
                  <li>✓ Unlimited drafting &amp; previewing</li>
                  <li>✓ No sign-up required</li>
                </ul>
                <Link to="/builder" className="block mt-6">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
