import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Blocks, Eye, FileDown, Share2, TrendingUp, PieChart, HandCoins,
  Gamepad2, Code2, GraduationCap, FileText,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import LandingAuthActions from '@/components/LandingAuthActions'
import Footer from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getFeaturedBoilerplate, formatBoilerplatePrice, getBoilerplatePriceCents, BOILERPLATE_LIST_PRICE_CENTS } from '@/data/boilerplateProducts'
import BoilerplatePrice, { BoilerplatePriceInline } from '@/components/BoilerplatePrice'

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
  const simpleTemplate = getFeaturedBoilerplate()
  const simpleTemplatePrice = formatBoilerplatePrice(getBoilerplatePriceCents())

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
              draft revenue-sharing and partnership agreements fast — without hundreds in legal fees.
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Drafting and summary previews are free. Word templates on sale now —{' '}
              <BoilerplatePriceInline /> each (reg. {formatBoilerplatePrice(BOILERPLATE_LIST_PRICE_CENTS)}).
            </p>
            <div className="mt-4 max-w-2xl mx-auto">
              <LegalDisclaimer variant="banner" />
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/builder">
                <Button size="lg" className="w-full sm:w-auto">Start Drafting — Free</Button>
              </Link>
              <Link to={`/boilerplates/${simpleTemplate.id}`}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Buy Simple Template — {simpleTemplatePrice}
                </Button>
              </Link>
              <Link to="/guide">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">How It Works</Button>
              </Link>
            </div>
            <LandingAuthActions className="mt-4" />
          </motion.div>
        </section>

        {/* Simple Template — pay & download Word doc */}
        <section id="simple-template" className="py-20 border-y bg-primary/5">
          <div className="container mx-auto px-4">
            <motion.div
              {...fadeIn}
              className="max-w-3xl mx-auto rounded-2xl border-2 border-primary/20 bg-card p-8 md:p-10 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge>Most popular</Badge>
                <Badge variant="secondary">Word .docx</Badge>
              </div>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold">{simpleTemplate.name}</h2>
                  <p className="text-muted-foreground mt-3">{simpleTemplate.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                    {simpleTemplate.highlights.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="md:text-center md:min-w-[180px] shrink-0">
                  <BoilerplatePrice size="md" className="md:items-center" />
                  <Link to={`/boilerplates/${simpleTemplate.id}`} className="block mt-5">
                    <Button size="lg" className="w-full">
                      <FileDown className="h-4 w-4 mr-2" />
                      Buy &amp; Download
                    </Button>
                  </Link>
                  <Link
                    to="/boilerplates"
                    className="block mt-3 text-sm text-primary hover:underline"
                  >
                    Browse all Word templates →
                  </Link>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-6 pt-6 border-t">
                Pay once, download an editable Word file. Open in Microsoft Word, Google Docs, or
                LibreOffice — replace placeholder names and review every clause before use.
              </p>
            </motion.div>
          </div>
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
                  Or buy ready-made Word documents (.docx) — <BoilerplatePriceInline /> each →
                </Link>
              </span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
