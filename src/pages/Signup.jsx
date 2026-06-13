import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'

export default function Signup() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const { signUp, isConfigured } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/builder'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }
    if (!isConfigured) {
      addToast('Supabase is not configured', 'error')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
      addToast('Account created! Check your email to confirm, then sign in.')
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
    } catch (err) {
      addToast(err.message || 'Sign up failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm"
        >
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Free to draft. Pay $5 per credit to download or share.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account?{' '}
            <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
