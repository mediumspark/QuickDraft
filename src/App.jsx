import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Landing from '@/pages/Landing'
import Write from '@/pages/Write'
import Drafts from '@/pages/Drafts'
import Forum from '@/pages/Forum'
import ForumBoard from '@/pages/ForumBoard'
import ForumPost from '@/pages/ForumPost'
import Account from '@/pages/Account'
import About from '@/pages/About'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/write" element={<Write />} />
              <Route path="/write/:id" element={<Write />} />
              <Route path="/drafts" element={<Drafts />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/post/:id" element={<ForumPost />} />
              <Route path="/forum/:slug" element={<ForumBoard />} />
              <Route path="/account" element={<Account />} />
              <Route path="/about" element={<About />} />
            </Routes>
            <Analytics />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
