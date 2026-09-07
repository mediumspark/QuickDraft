import * as React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { getPromptOfTheDay } from '@/services/supabase'

export default function Landing() {
  const [prompt, setPrompt] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await getPromptOfTheDay()
      if (!cancelled && data?.body?.trim()) {
        setPrompt(data.body.trim())
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar transparent />
      <main className="flex-1">
        <section className="relative min-h-[100svh] flex flex-col overflow-hidden paper-grain">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-drift"
          >
            <div className="absolute -left-1/4 top-[-10%] h-[70vmin] w-[70vmin] rounded-full bg-[#1a5f52]/12 blur-3xl dark:bg-[#3d9a86]/15" />
            <div className="absolute right-[-15%] bottom-[-5%] h-[55vmin] w-[55vmin] rounded-full bg-[#4a5d78]/15 blur-3xl dark:bg-[#6a7d98]/12" />
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
            {prompt && (
              <div className="mt-6 max-w-md animate-rise-delay-2 border-l-2 border-primary/40 pl-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Prompt of the day
                </p>
                <p className="mt-1.5 font-display text-lg text-foreground/90 leading-snug italic">
                  {prompt}
                </p>
              </div>
            )}
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
      </main>
      <Footer />
    </div>
  )
}
