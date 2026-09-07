import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
<<<<<<< HEAD
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
=======
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-6">About AQuickDraft</h1>
          <div className="prose prose-neutral space-y-4 text-muted-foreground">
            <p>
              AQuickDraft was built for game developers, technical folks, and college students
              who need to formalize a partnership quickly — without paying hundreds of dollars
              for a basic revenue-sharing or commission agreement.
            </p>
            <p>
              Whether you are splitting game revenue with an artist, documenting a side-project
              equity split with a co-founder, or putting a class startup agreement on paper,
              AQuickDraft gives you editable templates to get started.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8">Who we serve</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Game developers</strong> — revenue splits with contractors, composers, or co-devs</li>
              <li><strong>Technical folks</strong> — freelance collaborations, open-source side projects, contractor deals</li>
              <li><strong>College students</strong> — class projects, club ventures, and dorm-room startups on a budget</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8">How it works</h2>
            <p>
              Pick a template, fill in your parties and terms, preview the full agreement, then
              download a PDF or Word file when you are ready. Everything starts free — you only
              pay when you unlock editing, download, or share.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8">What we believe</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Clear agreements help creative and technical collaborations succeed</li>
              <li>Students and indie devs deserve affordable tools</li>
              <li>Transparency builds better partnerships</li>
              <li>Getting terms on paper early prevents headaches later</li>
            </ul>
          </div>
        </motion.div>
>>>>>>> refs/remotes/origin/main
      </main>
      <Footer />
    </div>
  )
}
