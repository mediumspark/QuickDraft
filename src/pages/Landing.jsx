import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar transparent />
      <main className="flex-1">
        {/* Hero: brand + one line + CTA + full-bleed writing atmosphere */}
        <section className="relative min-h-[100svh] flex flex-col overflow-hidden paper-grain">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-drift"
          >
            <div className="absolute -left-1/4 top-[-10%] h-[70vmin] w-[70vmin] rounded-full bg-[#1a5f52]/12 blur-3xl" />
            <div className="absolute right-[-15%] bottom-[-5%] h-[55vmin] w-[55vmin] rounded-full bg-[#4a5d78]/15 blur-3xl" />
          </div>

          {/* Manuscript visual plane — edge to edge */}
          <div
            aria-hidden
            className="absolute inset-0 flex items-end justify-center md:items-center md:justify-end pointer-events-none"
          >
            <div className="w-full h-[48%] md:h-full md:w-[52%] relative opacity-70 md:opacity-90">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 640 900"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
              >
                <rect x="48" y="60" width="520" height="780" rx="4" fill="#f7f8fa" fillOpacity="0.55" stroke="#9aa5b2" strokeOpacity="0.35" />
                <path d="M88 140 H528" stroke="#1a5f52" strokeOpacity="0.25" strokeWidth="1.5" className="animate-line" />
                <path d="M88 190 H460" stroke="#15202b" strokeOpacity="0.18" strokeWidth="1.2" />
                <path d="M88 230 H500" stroke="#15202b" strokeOpacity="0.16" strokeWidth="1.2" />
                <path d="M88 270 H420" stroke="#15202b" strokeOpacity="0.14" strokeWidth="1.2" />
                <path d="M88 310 H510" stroke="#15202b" strokeOpacity="0.14" strokeWidth="1.2" />
                <path d="M88 350 H390" stroke="#15202b" strokeOpacity="0.12" strokeWidth="1.2" />
                <path d="M88 420 H480" stroke="#15202b" strokeOpacity="0.12" strokeWidth="1.2" />
                <path d="M88 460 H440" stroke="#15202b" strokeOpacity="0.11" strokeWidth="1.2" />
                <path d="M88 500 H505" stroke="#15202b" strokeOpacity="0.11" strokeWidth="1.2" />
                <path d="M88 540 H360" stroke="#15202b" strokeOpacity="0.1" strokeWidth="1.2" />
                <rect x="88" y="620" width="180" height="8" rx="2" fill="#1a5f52" fillOpacity="0.2" />
                <rect x="88" y="648" width="120" height="6" rx="2" fill="#15202b" fillOpacity="0.12" />
              </svg>
              <span className="absolute left-[18%] top-[16%] h-7 w-[3px] bg-primary animate-caret md:left-[20%] md:top-[17%]" />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center px-6 sm:px-10 lg:px-16 pt-24 pb-16 max-w-3xl">
            <p className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-foreground animate-rise">
              AQuickDraft
            </p>
            <h1 className="mt-5 font-display text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 max-w-xl animate-rise-delay-1">
              A quiet room for unfinished pages.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed animate-rise-delay-2">
              Timed sessions, honest AI labels, and peer feedback for amateur writers.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-rise-delay-3">
              <Link to="/write">
                <Button size="lg" className="w-full sm:w-auto min-w-[10rem]">
                  Start writing
                </Button>
              </Link>
              <Link to="/forum">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-card/50 backdrop-blur-sm">
                  Browse the forum
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border/70 py-24 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              Fullscreen like F11 — then just write
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Open the writing room, hit fullscreen, set a timer and a word goal.
              The browser chrome disappears. The page stays yours.
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-border/70 bg-[#dfe8e4]/55 py-24 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_80%_40%,rgba(26,95,82,0.14),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              Label the draft. Keep the trust.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              AI Free gets the full stage — public views and highlight comments.
              AI Contributed shares quieter. AI Generated stays off the forum.
            </p>
          </div>
        </section>

        <section className="py-24 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              Feedback that feels like a margin note
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Share when you’re ready. Readers leave general comments — or, on AI Free work,
              highlight a passage the way you’d mark a draft in Docs.
            </p>
            <div className="mt-10">
              <Link to="/write">
                <Button size="lg">Open the writing room</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
