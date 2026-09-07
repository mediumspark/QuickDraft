import { Link } from 'react-router-dom'
<<<<<<< HEAD
=======

const templateLinks = [
  { to: '/templates/revenue-sharing', label: 'Revenue Sharing' },
  { to: '/templates/profit-sharing', label: 'Profit Sharing' },
  { to: '/templates/commission', label: 'Commission' },
  { to: '/templates/nda', label: 'NDA' },
]
>>>>>>> refs/remotes/origin/main

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-primary-foreground font-bold text-xs">AQD</span>
              </div>
              <span className="font-semibold text-lg">AQuickDraft</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
<<<<<<< HEAD
              A quiet place for amateur writers — timed sessions, honest AI labels, and peer feedback.
            </p>
          </div>
          <div className="flex gap-12 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Write</h4>
              <ul className="space-y-2">
                <li><Link to="/write" className="hover:text-foreground">Writing room</Link></li>
                <li><Link to="/drafts" className="hover:text-foreground">My drafts</Link></li>
                <li><Link to="/forum" className="hover:text-foreground">Forum</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">About</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                <li><Link to="/account" className="hover:text-foreground">Account</Link></li>
              </ul>
=======
              Agreement templates for your startup, side project, or student venture.
              Draft fast, read free, pay $0.99 to edit, download, or share.
            </p>
            <div className="mt-4 max-w-md">
>>>>>>> refs/remotes/origin/main
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
<<<<<<< HEAD
          © {new Date().getFullYear()} AQuickDraft. Write freely. Label honestly.
=======
          © {new Date().getFullYear()} AQuickDraft.
>>>>>>> refs/remotes/origin/main
        </div>
      </div>
    </footer>
  )
}
