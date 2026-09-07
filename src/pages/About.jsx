import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">About AQuickDraft</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>
            AQuickDraft is a writing space for amateurs — people who write for practice, for stories,
            for the joy of putting words on a page.
          </p>
          <p>
            Start a timed session, chase a word goal, save drafts to your account, and share eligible
            work for peer feedback. Every draft carries an honest AI label so readers know what they’re looking at.
          </p>
          <h2 className="text-2xl font-semibold text-foreground pt-4">AI labels</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-foreground">AI Free</strong> — human-written; can be shared with public views and section comments.</li>
            <li><strong className="text-foreground">AI Contributed</strong> — human writing with AI help; shareable with author-only views; no section comments.</li>
            <li><strong className="text-foreground">AI Generated</strong> — substantially AI-written; not shareable; views not tracked.</li>
          </ul>
          <h2 className="text-2xl font-semibold text-foreground pt-4">Feedback</h2>
          <p>
            Comments require an account. Authors choose who can see feedback: only themselves,
            signed-in users, or everyone. Highlight a passage to leave a section comment (AI Free works only),
            or comment on the whole piece at the bottom.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
