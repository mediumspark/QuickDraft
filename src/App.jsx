import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/contexts/AuthContext'
import Landing from '@/pages/Landing'
import Builder from '@/pages/Builder'
import ViewAgreement from '@/pages/ViewAgreement'
import Account from '@/pages/Account'
import About from '@/pages/About'
import Guide from '@/pages/Guide'
import Contact from '@/pages/Contact'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/view/:id" element={<ViewAgreement />} />
            <Route path="/account" element={<Account />} />
            <Route path="/about" element={<About />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
