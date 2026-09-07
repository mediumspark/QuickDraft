import { Link } from 'react-router-dom'
import { PenLine, Timer, MessagesSquare, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
<<<<<<< HEAD
=======
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getFeaturedBoilerplate, formatBoilerplatePrice, getBoilerplatePriceCents, BOILERPLATE_LIST_PRICE_CENTS } from '@/data/boilerplateProducts'
import { formatCurrentPrice } from '@/data/pricing'
import BoilerplatePrice, { BoilerplatePriceInline } from '@/components/BoilerplatePrice'
import AdUnit from '@/components/AdUnit'
import { getLandingAdSlot } from '@/utils/ads'

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
>>>>>>> refs/remotes/origin/main

const features = [
  {
    icon: PenLine,
    title: 'Fullscreen writing room',
    desc: 'A quiet, distraction-free page for getting words down.',
  },
  {
    icon: Timer,
    title: 'Session timer & word goals',
    desc: 'Set a timer, pick a prompt, and chase a word-count target.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest AI labels',
    desc: 'Mark work as AI Free, AI Contributed, or AI Generated — sharing rules follow the label.',
  },
  {
    icon: MessagesSquare,
    title: 'Peer feedback forum',
    desc: 'Share eligible writing, track views, and collect Google Docs–style comments.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 md:py-28 text-center">
<<<<<<< HEAD
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            A quiet place to write — and get feedback that respects your work
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            AQuickDraft is for amateur writers. Timed sessions, cloud drafts, clear AI labels,
            and a forum where views and comments follow rules you control.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/write">
              <Button size="lg" className="w-full sm:w-auto">Start writing</Button>
            </Link>
            <Link to="/forum">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Browse the forum</Button>
            </Link>
          </div>
=======
          <motion.div {...fadeIn}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
              Quick agreement templates for your startup
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Draft revenue splits, co-founder deals, and NDAs in minutes — read the full
              agreement free, pay {formatCurrentPrice()} to download or share.
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Word templates on sale now —{' '}
              <BoilerplatePriceInline /> each (reg. {formatBoilerplatePrice(BOILERPLATE_LIST_PRICE_CENTS)}).
              {' '}Sign in with Google to save drafts across devices.
            </p>
            <div className="mt-4 max-w-2xl mx-auto">
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
          <AdUnit slot={getLandingAdSlot()} className="mt-12" />
>>>>>>> refs/remotes/origin/main
        </section>

        <section className="border-y bg-muted/20 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Built for the draft, not the pitch deck</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl border bg-card p-6">
                  <div className="rounded-md bg-accent p-2 w-fit mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
                </div>
<<<<<<< HEAD
=======
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
                a student venture — get a clear template agreement without spending hundreds.
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
>>>>>>> refs/remotes/origin/main
              ))}
            </div>
          </div>
        </section>

<<<<<<< HEAD
        <section className="py-20 container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">AI Free writing gets the full stage</h2>
          <p className="text-muted-foreground mb-8">
            AI Generated work stays private. AI Contributed can be shared with author-only view counts
            and no section comments. AI Free can be shared with public views and highlight comments.
          </p>
          <Link to="/write">
            <Button size="lg">Open the writing room</Button>
          </Link>
=======
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
              <p className="text-muted-foreground mt-2">Plus NDAs, Privacy Policies, EULAs, and fully custom clauses</p>
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
>>>>>>> refs/remotes/origin/main
        </section>
      </main>
      <Footer />
    </div>
  )
}
