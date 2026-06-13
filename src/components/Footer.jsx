import { Link } from 'react-router-dom'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

const templateLinks = [
  { to: '/templates/revenue-sharing', label: 'Revenue Sharing' },
  { to: '/templates/profit-sharing', label: 'Profit Sharing' },
  { to: '/templates/commission', label: 'Commission' },
  { to: '/templates/nda', label: 'NDA' },
]

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-primary-foreground font-bold text-xs">AQD</span>
              </div>
              <span className="font-semibold text-lg">AQuickDraft</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Agreement templates for game developers, technical folks, and college students.
              Draft fast, preview free, pay $5 to download or share.
            </p>
            <div className="mt-4 max-w-md">
              <LegalDisclaimer variant="footer" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/builder" className="hover:text-foreground">Builder</Link></li>
              <li><Link to="/guide" className="hover:text-foreground">Guide</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Templates</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {templateLinks.map((t) => (
                <li key={t.to}>
                  <Link to={t.to} className="hover:text-foreground">{t.label}</Link>
                </li>
              ))}
            </ul>
            <h4 className="font-semibold mb-3 mt-6">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AQuickDraft. Templates only — not legal advice.
        </div>
      </div>
    </footer>
  )
}
