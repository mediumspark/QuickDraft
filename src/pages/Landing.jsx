import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Blocks, Eye, FileDown, Share2, TrendingUp, PieChart, HandCoins,
  Gamepad2, Code2, GraduationCap,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import LandingAuthActions from '@/components/LandingAuthActions'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const audiences = [
  {
    icon: Gamepad2,
    title: 'Game developers',
    desc: 'Split revenue with artists, musicians, contractors, or co-devs on your indie game or jam project.',
  },
  {
    icon: Code2,
    title: 'Technical folks',
    desc: 'Document side-project splits, freelance collaborations, and contractor deals without a legal bill.',
  },
  {
    icon: GraduationCap,
    title: 'College students',
    desc: 'Turn a class project, club startup, or dorm-room idea into a clear agreement on a student budget.',
  },
]

const features = [
  { icon: Blocks, title: 'Modular Clause Builder', desc: 'Stack parties, financial terms, duration, and custom clauses like building blocks.' },
  { icon: Eye, title: 'Live Document Preview', desc: 'See your agreement update in real time with professional serif formatting.' },
  { icon: FileDown, title: 'Download as PDF', desc: 'Export a signed, paginated PDF ready for signatures and records.' },
  { icon: Share2, title: 'Share a Read-Only Link', desc: 'Send a secure link so partners can review and sign remotely.' },
]

const agreementTypes = [
  { icon: TrendingUp, title: 'Revenue Sharing', desc: 'Split gross or net revenue on a defined schedule — great for game sales, DLC, or merch.', href: '/templates/revenue-sharing' },
  { icon: PieChart, title: 'Profit Sharing', desc: 'Distribute profits after expenses among partners on a side project or startup.', href: '/templates/profit-sharing' },
  { icon: HandCoins, title: 'Commission-Based', desc: 'Pay percentage commissions on qualifying sales, referrals, or contract work.', href: '/templates/commission' },
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
              Quick agreement templates for devs, builders &amp; students
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              AQuickDraft helps game developers, technical folks, and college students
              draft revenue-sharing and partnership agreements fast — for $5 per document,
              not hundreds in legal fees.
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Drafting and summary previews are free. Pay $5 to download or share.
              Sign in with Google to save drafts across devices.
            </p>
            <div className="mt-4 max-w-2xl mx-auto">
              <LegalDisclaimer variant="banner" />
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/builder">
                <Button size="lg" className="w-full sm:w-auto">Start Drafting — Free</Button>
              </Link>
              <Link to="/guide">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">How It Works</Button>
              </Link>
            </div>
            <LandingAuthActions className="mt-4" />
          </motion.div>
        </section>

        {/* Who it's for */}
        <section id="audience" className="py-20 border-y bg-muted/20">
          <div className="container mx-auto px-4">
            <motion.div {...fadeIn} className="text-center mb-12">
              <h2 className="text-3xl font-bold">Built for people who move fast</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Whether you are shipping a game, collaborating on a side project, or formalizing
                a student venture — get a clear template agreement without the lawyer price tag.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {audiences.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg border bg-card p-6 text-center"
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
              <h2 className="text-3xl font-bold">Agreement templates we support</h2>
              <p className="text-muted-foreground mt-2">Plus NDAs, Privacy Policies, EULAs, and fully custom clauses — all templates, not lawyer-drafted documents</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {agreementTypes.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={a.href}
                    className="block rounded-lg border p-6 text-center hover:border-primary/50 transition-colors h-full"
                  >
                    <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-4">
                      <a.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{a.desc}</p>
                    <p className="text-sm text-primary mt-3 font-medium">View template →</p>
                  </Link>
                </motion.div>
              ))}
            </div>
            <p className="text-center mt-6 space-y-2">
              <span className="block">
                <Link to="/templates/nda" className="text-sm text-primary hover:underline font-medium">
                  Also available: NDA template for collaborators →
                </Link>
              </span>
              <span className="block">
                <Link to="/boilerplates" className="text-sm text-primary hover:underline font-medium">
                  Or buy ready-made Word documents (.docx) — $5 each →
                </Link>
              </span>
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-muted/30 py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-bold">Cheap enough for student budgets</h2>
              <p className="text-muted-foreground mt-2 mb-10">No subscriptions. $5 per document — pay only when you download or share.</p>
              <div className="inline-block rounded-xl border bg-card p-8 shadow-sm max-w-sm text-left">
                <p className="text-5xl font-bold text-primary text-center">$5</p>
                <p className="text-muted-foreground mt-1 text-center">per document</p>
                <ul className="mt-6 space-y-2 text-sm">
                  <li>✓ $5 = PDF download for one agreement</li>
                  <li>✓ $5 = boilerplate Word document (.docx)</li>
                  <li>✓ $5 = shareable read-only link</li>
                  <li>✓ Free drafting &amp; summary previews</li>
                  <li>✓ Sign in with Google to save drafts</li>
                </ul>
                <div className="mt-4">
                  <LegalDisclaimer variant="compact" />
                </div>
                <Link to="/pricing" className="block mt-6">
                  <Button className="w-full">Get Started</Button>
                </Link>
                <Link to="/pricing" className="block mt-2 text-center text-sm text-primary hover:underline">
                  View full pricing details
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
