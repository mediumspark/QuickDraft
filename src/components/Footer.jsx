import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-primary-foreground font-bold text-sm">QD</span>
              </div>
              <span className="font-semibold text-lg">QuickDraft</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Draft professional revenue and profit-sharing agreements in minutes. No legal expertise required.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/builder" className="hover:text-foreground">Builder</Link></li>
              <li><Link to="/guide" className="hover:text-foreground">Guide</Link></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} QuickDraft. Not a substitute for legal advice.
        </div>
      </div>
    </footer>
  )
}
