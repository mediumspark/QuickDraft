import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/spinner'

export default function ProtectedAction({ children, redirectTo = '/login' }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      const current = window.location.pathname + window.location.search
      navigate(`${redirectTo}?redirect=${encodeURIComponent(current)}`)
    }
  }, [user, loading, navigate, redirectTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!user) return null

  return children
}
