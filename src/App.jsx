import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/contexts/AuthContext'
import SeoHead from '@/components/SeoHead'
import Landing from '@/pages/Landing'
import Builder from '@/pages/Builder'
import ViewAgreement from '@/pages/ViewAgreement'
import Account from '@/pages/Account'
import About from '@/pages/About'
import Guide from '@/pages/Guide'
import Contact from '@/pages/Contact'
import Faq from '@/pages/Faq'
import Pricing from '@/pages/Pricing'
import PaymentSuccess from '@/pages/PaymentSuccess'
import PaymentCancelled from '@/pages/PaymentCancelled'
import RevenueSharing from '@/pages/templates/RevenueSharing'
import ProfitSharing from '@/pages/templates/ProfitSharing'
import Commission from '@/pages/templates/Commission'
import Nda from '@/pages/templates/Nda'
import Boilerplates from '@/pages/Boilerplates'
import BoilerplateDetail from '@/pages/BoilerplateDetail'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <SeoHead />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancelled" element={<PaymentCancelled />} />
            <Route path="/view/:id" element={<ViewAgreement />} />
            <Route path="/account" element={<Account />} />
            <Route path="/about" element={<About />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/boilerplates" element={<Boilerplates />} />
            <Route path="/boilerplates/:slug" element={<BoilerplateDetail />} />
            <Route path="/templates/revenue-sharing" element={<RevenueSharing />} />
            <Route path="/templates/profit-sharing" element={<ProfitSharing />} />
            <Route path="/templates/commission" element={<Commission />} />
            <Route path="/templates/nda" element={<Nda />} />
          </Routes>
          <Analytics />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
