import { Link } from 'react-router-dom'
import { PenLine, Timer, MessagesSquare, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: PenLine,
    title: 'Fullscreen writing room',
    desc: 'One click goes true fullscreen — like F11 — so the browser chrome gets out of the way.',
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
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">AI Free writing gets the full stage</h2>
          <p className="text-muted-foreground mb-8">
            AI Generated work stays private. AI Contributed can be shared with author-only view counts
            and no section comments. AI Free can be shared with public views and highlight comments.
          </p>
          <Link to="/write">
            <Button size="lg">Open the writing room</Button>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
