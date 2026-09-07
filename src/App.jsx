import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/contexts/AuthContext'
import Landing from '@/pages/Landing'
import Write from '@/pages/Write'
import Drafts from '@/pages/Drafts'
import Forum from '@/pages/Forum'
import ForumPost from '@/pages/ForumPost'
import Account from '@/pages/Account'
import About from '@/pages/About'
<<<<<<< HEAD
=======
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
>>>>>>> refs/remotes/origin/main

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
<<<<<<< HEAD
            <Route path="/write" element={<Write />} />
            <Route path="/write/:id" element={<Write />} />
            <Route path="/drafts" element={<Drafts />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:id" element={<ForumPost />} />
=======
            <Route path="/builder" element={<Builder />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancelled" element={<PaymentCancelled />} />
            <Route path="/view/:id" element={<ViewAgreement />} />
>>>>>>> refs/remotes/origin/main
            <Route path="/account" element={<Account />} />
            <Route path="/about" element={<About />} />
          </Routes>
          <Analytics />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
